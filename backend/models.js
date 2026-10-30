/**
 * models.js
 * ---------------------------------------------------------------------------
 * Camada de modelos (ORM simples) do Cofre de Senhas.
 *
 * Classes (conforme o diagrama UML):
 *   - Usuario             -> dono do cofre (1) ---- (0..*) Senha  [composição]
 *   - GerenciadorSessao   -> sessão do usuário      (1) ---- (0..1)
 *   - Senha               -> credencial guardada, criptografada
 *   - GeradorSenha        -> gera senhas aleatórias seguras
 *   - AuditorCofre        -> analisa a força/reuso das senhas
 *   - RelatorioAuditoria  -> resultado da auditoria
 *
 * Observações de projeto:
 *   - Os métodos que acessam o banco são assíncronos (retornam Promise). Os
 *     tipos "boolean", "void" e "String" do diagrama viram Promise<boolean>,
 *     Promise<void> e Promise<string> nesses casos.
 *   - A visibilidade privada ("-") do diagrama é respeitada apenas por
 *     convenção (propriedades documentadas como privadas), para facilitar o
 *     mapeamento linha do banco <-> objeto.
 *   - O módulo NÃO depende de um driver específico. Basta chamar
 *     Banco.configurar() com um adaptador (veja exemplo na classe Banco).
 *   - Segurança: a senha mestra nunca é guardada; só um hash bcrypt.
 *     As senhas do cofre usam o mesmo AES-256-GCM de crypto/cripto.js,
 *     centralizado na chave CHAVE_CRIPTOGRAFIA.
 * ---------------------------------------------------------------------------
 */

import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { criptografar, descriptografar } from './crypto/cripto.js';

// ===========================================================================
// 1. Camada de acesso ao banco
// ===========================================================================

/**
 * Cria um adaptador para o driver PostgreSQL.
 *
 * O adaptador converte os placeholders "?" usados pelas queries dos modelos
 * para o formato "$n" exigido pelo pacote pg.
 *
 * @param {import('pg').Pool} pool
 * @returns {{ executar: (sql: string, params?: any[]) => Promise<{ linhas: object[], afetadas: number }> }}
 */
function criarAdaptadorPostgres(pool) {
  return {
    async executar(sql, params = []) {
      let indice = 0;
      const sqlConvertido = sql.replace(/\?/g, () => `$${++indice}`);
      const resultado = await pool.query(sqlConvertido, params);
      return {
        linhas: resultado.rows,
        afetadas: resultado.rowCount,
      };
    },
  };
}

/**
 * Banco
 * Ponte entre os modelos e o driver de banco de dados escolhido.
 *
 * O adaptador precisa ter um método:
 *   executar(sql: string, params: any[]) => Promise<{ linhas: object[], afetadas: number }>
 *
 * As queries usam "?" como placeholder interno; o adaptador PostgreSQL os
 * converte para "$1", "$2", "$3" e assim por diante antes da execução.
 *
 * Exemplo com pg:
 *   import pg from 'pg';
 *   const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
 *   Banco.configurar(criarAdaptadorPostgres(pool));
 */
class Banco {
  /** Adaptador atualmente configurado (null até chamar configurar). */
  static adaptador = null;

  /**
   * Define o adaptador de banco que será usado por todos os modelos.
   * @param {{ executar: Function }} adaptador
   */
  static configurar(adaptador) {
    if (!adaptador || typeof adaptador.executar !== 'function') {
      throw new Error('Adaptador inválido: é necessário ter o método executar(sql, params).');
    }
    Banco.adaptador = adaptador;
  }

  /**
   * Executa uma instrução SQL parametrizada (evita SQL injection).
   * @param {string} sql
   * @param {any[]} [params]
   * @returns {Promise<{ linhas: object[], afetadas: number }>}
   */
  static async executar(sql, params = []) {
    if (!Banco.adaptador) {
      throw new Error('Banco não configurado. Chame Banco.configurar(adaptador) antes de usar os modelos.');
    }
    return Banco.adaptador.executar(sql, params);
  }

}

/**
 * Copia um texto para a área de transferência.
 * No navegador usa navigator.clipboard; no Node usa o utilitário do sistema
 * (clip no Windows, pbcopy no macOS, wl-copy/xclip no Linux).
 * @param {string} texto
 * @returns {Promise<void>}
 */
async function copiarTexto(texto) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(texto);
    return;
  }
  const comandos =
    process.platform === 'win32' ? [['clip']]
    : process.platform === 'darwin' ? [['pbcopy']]
    : [['wl-copy'], ['xclip', '-selection', 'clipboard']];

  for (const [cmd, ...args] of comandos) {
    try {
      await new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        proc.on('error', reject);
        proc.on('close', (codigo) => (codigo === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${codigo}`))));
        proc.stdin.end(texto);
      });
      return;
    } catch (_) {
      // tenta o próximo utilitário disponível
    }
  }
  throw new Error('Não foi possível acessar a área de transferência neste ambiente.');
}

// ===========================================================================
// 3. GeradorSenha
// ===========================================================================

/**
 * GeradorSenha
 * Gera senhas aleatórias usando o gerador criptograficamente seguro do Node
 * (randomInt), nunca Math.random().
 */
class GeradorSenha {
  /**
   * @param {object} [opcoes]
   * @param {number}  [opcoes.tamanhoPadrao=16]      - tamanho usado quando nenhum é informado
   * @param {boolean} [opcoes.incluirEspeciais=true] - inclui símbolos (!@#$...)
   * @param {boolean} [opcoes.incluirNumeros=true]   - inclui dígitos (0-9)
   * @param {boolean} [opcoes.incluirMaiusculas=true]- inclui letras maiúsculas
   */
  constructor({ tamanhoPadrao = 16, incluirEspeciais = true, incluirNumeros = true, incluirMaiusculas = true } = {}) {
    /** @private {number} */ this.tamanhoPadrao = tamanhoPadrao;
    /** @private {boolean} */ this.incluirEspeciais = incluirEspeciais;
    /** @private {boolean} */ this.incluirNumeros = incluirNumeros;
    /** @private {boolean} */ this.incluirMaiusculas = incluirMaiusculas;
  }

  /**
   * Gera uma senha aleatória. Garante ao menos um caractere de cada grupo
   * habilitado e embaralha o resultado (Fisher-Yates) para não ficar previsível.
   *
   * @param {number}  [tamanho]   - tamanho da senha (padrão: tamanhoPadrao)
   * @param {boolean} [especiais] - inclui símbolos (padrão: incluirEspeciais)
   * @param {boolean} [numeros]   - inclui números (padrão: incluirNumeros)
   * @returns {string} senha gerada
   */
  gerarSenha(tamanho = this.tamanhoPadrao, especiais = this.incluirEspeciais, numeros = this.incluirNumeros) {
    const grupos = [
      'abcdefghijklmnopqrstuvwxyz',
      ...(this.incluirMaiusculas ? ['ABCDEFGHIJKLMNOPQRSTUVWXYZ'] : []),
      ...(numeros ? ['0123456789'] : []),
      ...(especiais ? ['!@#$%&*()-_=+[]{};:,.?'] : []),
    ];

    if (!Number.isInteger(tamanho) || tamanho < Math.max(4, grupos.length) || tamanho > 128) {
      throw new Error(`Tamanho inválido: use um inteiro entre ${Math.max(4, grupos.length)} e 128.`);
    }

    const sortear = (alfabeto) => alfabeto[randomInt(alfabeto.length)];
    const todos = grupos.join('');

    // 1 caractere obrigatório de cada grupo + o restante vindo de qualquer grupo
    const caracteres = grupos.map(sortear);
    while (caracteres.length < tamanho) caracteres.push(sortear(todos));

    // Embaralha para que os obrigatórios não fiquem sempre no início
    for (let i = caracteres.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }
    return caracteres.join('');
  }
}

// ===========================================================================
// 4. RelatorioAuditoria
// ===========================================================================

/**
 * RelatorioAuditoria
 * Resultado de uma auditoria do cofre. É um objeto de valor: não é salvo no
 * banco, apenas retornado por AuditorCofre.auditarCofre().
 */
class RelatorioAuditoria {
  /**
   * @param {object} dados
   * @param {number} dados.totalSenhasAnalisadas - quantas senhas foram analisadas
   * @param {number} dados.qtdSenhasFracas       - quantas foram consideradas fracas
   * @param {number} dados.qtdSenhasReutilizadas - quantas compartilham valor com outra
   * @param {number} dados.pontuacaoGeral        - nota do cofre de 0 a 100
   */
  constructor({ totalSenhasAnalisadas = 0, qtdSenhasFracas = 0, qtdSenhasReutilizadas = 0, pontuacaoGeral = 0 } = {}) {
    /** @private {number} */ this.totalSenhasAnalisadas = totalSenhasAnalisadas;
    /** @private {number} */ this.qtdSenhasFracas = qtdSenhasFracas;
    /** @private {number} */ this.qtdSenhasReutilizadas = qtdSenhasReutilizadas;
    /** @private {number} */ this.pontuacaoGeral = pontuacaoGeral;
  }

  /**
   * Indica se o cofre é considerado seguro: nenhuma senha fraca,
   * nenhuma reutilizada e pontuação geral de pelo menos 70.
   * @returns {boolean}
   */
  isCofreSeguro() {
    return this.qtdSenhasFracas === 0 && this.qtdSenhasReutilizadas === 0 && this.pontuacaoGeral >= 70;
  }

  /**
   * Monta um texto legível com o resumo da auditoria.
   * @returns {string}
   */
  gerarResumo() {
    const situacao = this.isCofreSeguro() ? 'SEGURO' : 'ATENÇÃO NECESSÁRIA';
    return [
      `Auditoria do cofre: ${situacao}`,
      `Senhas analisadas: ${this.totalSenhasAnalisadas}`,
      `Senhas fracas: ${this.qtdSenhasFracas}`,
      `Senhas reutilizadas: ${this.qtdSenhasReutilizadas}`,
      `Pontuação geral: ${this.pontuacaoGeral}/100`,
    ].join('\n');
  }
}

// ===========================================================================
// 5. GerenciadorSessao
// ===========================================================================

/** Tempo máximo de inatividade da sessão: oito horas. */
const TEMPO_LIMITE_SESSAO_MS = 8 * 60 * 60 * 1000;

/**
 * GerenciadorSessao
 * Controla a sessão de um usuário autenticado (relação 1 usuário : 0..1 sessão).
 * O token real só existe em memória/cliente; no banco guardamos apenas o hash
 * SHA-256 dele, assim um vazamento do banco não permite sequestrar sessões.
 */
class GerenciadorSessao {
  constructor() {
    /** @private {string|null} token da sessão (entregue ao cliente) */
    this.tokenSessao = null;
    /** @private {Date|null} data/hora da última atividade */
    this.ultimoAcesso = null;
    /** id do usuário dono da sessão (chave estrangeira) */
    this.usuarioId = null;
  }

  /**
   * Calcula o hash SHA-256 de um token (formato guardado no banco).
   * @param {string} token
   * @returns {string}
   */
  static hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Recupera uma sessão pelo token recebido no cabeçalho HTTP.
   * @param {string} token
   * @returns {Promise<GerenciadorSessao|null>}
   */
  static async porToken(token) {
    const sessao = new GerenciadorSessao();
    sessao.tokenSessao = token;
    return (await sessao.validarSessao()) ? sessao : null;
  }

  /**
   * Inicia uma nova sessão para o usuário. Se ele já tinha uma sessão ativa,
   * ela é substituída (regra 0..1). O token gerado fica em this.tokenSessao.
   * @param {Usuario} usuario
   * @returns {Promise<void>}
   */
  async iniciarSessao(usuario) {
    this.usuarioId = usuario.id;
    this.tokenSessao = randomBytes(32).toString('hex');
    this.ultimoAcesso = new Date();

    await Banco.executar('DELETE FROM sessoes WHERE usuario_id = ?', [usuario.id]);
    await Banco.executar(
      'INSERT INTO sessoes (id, usuario_id, token_hash, ultimo_acesso) VALUES (?, ?, ?, ?)',
      [randomUUID(), usuario.id, GerenciadorSessao.hashToken(this.tokenSessao), this.ultimoAcesso]
    );
    usuario.sessao = this;
  }

  /**
   * Encerra a sessão (logout): remove do banco e limpa os dados em memória.
   * @returns {Promise<void>}
   */
  async encerrarSessao() {
    if (this.usuarioId) {
      await Banco.executar('DELETE FROM sessoes WHERE usuario_id = ?', [this.usuarioId]);
    }
    this.tokenSessao = null;
    this.ultimoAcesso = null;
  }

  /**
   * Verifica se o token ainda é válido e não expirou por inatividade.
   * Se for válido, renova o "ultimoAcesso"; se expirou, apaga a sessão.
   * @returns {Promise<boolean>}
   */
  async validarSessao() {
    if (!this.tokenSessao) return false;

    const { linhas } = await Banco.executar(
      'SELECT usuario_id, ultimo_acesso FROM sessoes WHERE token_hash = ?',
      [GerenciadorSessao.hashToken(this.tokenSessao)]
    );
    if (!linhas.length) return false;

    const { usuario_id: usuarioId, ultimo_acesso: ultimo } = linhas[0];
    if (Date.now() - new Date(ultimo).getTime() > TEMPO_LIMITE_SESSAO_MS) {
      await Banco.executar('DELETE FROM sessoes WHERE usuario_id = ?', [usuarioId]);
      this.tokenSessao = null;
      return false;
    }

    this.usuarioId = usuarioId;
    this.ultimoAcesso = new Date();
    await Banco.executar('UPDATE sessoes SET ultimo_acesso = ? WHERE usuario_id = ?', [this.ultimoAcesso, usuarioId]);
    return true;
  }
}

// ===========================================================================
// 6. Usuario
// ===========================================================================

/**
 * Usuario
 * Dono do cofre. Tem composição com Senha: ao excluir a conta, todas as
 * senhas dele são excluídas junto.
 */
class Usuario {
  /**
   * @param {object} [dados]
   * @param {string} [dados.id]
   * @param {string} [dados.nome]
   * @param {string} [dados.email]
   * @param {string} [dados.senhaMestraHash] - hash "salt:hash" (nunca a senha em texto)
   */
  constructor({ id = null, nome = '', email = '', senhaMestraHash = '' } = {}) {
    this.id = id;
    /** @private {string} */ this.nome = nome;
    /** @private {string} */ this.email = email;
    /** @private {string} */ this.senhaMestraHash = senhaMestraHash;
    /** Data de criação do registro. */
    this.dataCriacao = null;
    /** Sessão ativa (0..1). Preenchida após autenticar(). */
    this.sessao = null;
    /** Marca que o usuário foi autenticado; nunca é salva no banco. */
    this.chaveCofre = null;
  }

  /**
   * Cria o objeto a partir de uma linha da tabela "usuarios".
   * @param {object} linha
   * @returns {Usuario}
   */
  static deLinha(linha) {
    const u = new Usuario({
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      senhaMestraHash: linha.senha_mestra_hash,
    });
    u.dataCriacao = linha.data_criacao;
    return u;
  }

  static async porEmail(email) {
    const { linhas } = await Banco.executar('SELECT * FROM usuarios WHERE email = ?', [
      String(email).trim().toLowerCase(),
    ]);
    return linhas.length ? Usuario.deLinha(linhas[0]) : null;
  }

  static async porId(id) {
    const { linhas } = await Banco.executar('SELECT * FROM usuarios WHERE id = ?', [id]);
    return linhas.length ? Usuario.deLinha(linhas[0]) : null;
  }

  /**
   * Cadastra o usuário no banco.
   *
   * No diagrama o método não recebe parâmetros; como a senha mestra precisa
   * virar hash, ela pode ser passada aqui. Se omitida, usa o senhaMestraHash
   * já definido no objeto.
   *
   * - Lança erro se nome/e-mail/senha forem inválidos.
   * - Retorna false se o e-mail já estiver cadastrado.
   *
   * @param {string} [senhaMestra] - senha mestra em texto (mínimo 8 caracteres)
   * @returns {Promise<boolean>} true se cadastrou
   */
  async cadastrar(senhaMestra) {
    this.email = String(this.email).trim().toLowerCase();
    this.nome = String(this.nome).trim();

    if (!this.nome) throw new Error('Informe o nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) throw new Error('E-mail inválido.');

    if (senhaMestra !== undefined) {
      if (String(senhaMestra).length < 8) throw new Error('A senha mestra deve ter pelo menos 8 caracteres.');
      this.senhaMestraHash = await bcrypt.hash(senhaMestra, 10);
    }
    if (!this.senhaMestraHash) throw new Error('Senha mestra não definida.');

    const existente = await Banco.executar('SELECT id FROM usuarios WHERE email = ?', [this.email]);
    if (existente.linhas.length) return false;

    this.id = randomUUID();
    this.dataCriacao = new Date();
    await Banco.executar(
      'INSERT INTO usuarios (id, nome, email, senha_mestra_hash, data_criacao) VALUES (?, ?, ?, ?, ?)',
      [this.id, this.nome, this.email, this.senhaMestraHash, this.dataCriacao]
    );
    return true;
  }

  /**
   * Faz login: busca o usuário pelo e-mail, confere a senha mestra e inicia a
   * sessão. Em caso de sucesso, este objeto passa
   * a representar o usuário autenticado.
   *
   * @param {string} email
   * @param {string} senhaMestra
   * @returns {Promise<boolean>} true se as credenciais estão corretas
   */
  async autenticar(email, senhaMestra) {
    const usuario = await Usuario.porEmail(email);
    if (!usuario || !(await bcrypt.compare(senhaMestra, usuario.senhaMestraHash))) return false;

    Object.assign(this, usuario);
    this.chaveCofre = true;

    this.sessao = new GerenciadorSessao();
    await this.sessao.iniciarSessao(this);
    return true;
  }

  /**
   * Troca o hash da senha mestra. A chave do cofre é centralizada em
   * crypto/cripto.js, portanto as credenciais não precisam ser recriptografadas.
   *
   * @param {string} senhaAntiga
   * @param {string} novaSenha - mínimo de 8 caracteres
   * @returns {Promise<boolean>} true se alterou
   */
  async alterarSenhaMestra(senhaAntiga, novaSenha) {
    if (!this.id || !(await bcrypt.compare(senhaAntiga, this.senhaMestraHash))) return false;
    if (String(novaSenha).length < 8) throw new Error('A nova senha mestra deve ter pelo menos 8 caracteres.');

    const novoHash = await bcrypt.hash(novaSenha, 10);
    await Banco.executar('UPDATE usuarios SET senha_mestra_hash = ? WHERE id = ?', [novoHash, this.id]);
    this.senhaMestraHash = novoHash;
    return true;
  }

  /**
   * Exclui a conta e tudo que pertence a ela (sessão e senhas).
   * Os DELETEs são explícitos para funcionar mesmo sem ON DELETE CASCADE.
   * @returns {Promise<boolean>} true se a conta foi removida
   */
  async excluirConta() {
    if (!this.id) return false;
    await Banco.executar('DELETE FROM sessoes WHERE usuario_id = ?', [this.id]);
    await Banco.executar('DELETE FROM senhas WHERE usuario_id = ?', [this.id]);
    const { afetadas } = await Banco.executar('DELETE FROM usuarios WHERE id = ?', [this.id]);

    this.sessao = null;
    this.chaveCofre = null;
    return afetadas > 0;
  }

  /**
   * Lista todas as senhas do usuário (relação 1 : 0..*), da mais recente para
   * a mais antiga. As senhas continuam criptografadas até revelarSenha().
   * @returns {Promise<Senha[]>}
   */
  async listarSenhas() {
    const { linhas } = await Banco.executar(
      'SELECT * FROM senhas WHERE usuario_id = ? ORDER BY data_criacao DESC',
      [this.id]
    );
    return linhas.map((l) => Senha.deLinha(l, this));
  }
}

// ===========================================================================
// 7. Senha
// ===========================================================================

/**
 * Senha
 * Uma credencial guardada no cofre (ex.: login do Netflix). O valor fica
 * sempre criptografado em "senhaCriptografada"; só é aberto sob demanda,
 * com a chave do usuário (que existe apenas após o login).
 */
class Senha {
  /**
   * @param {object} dados
   * @param {Usuario} dados.usuario - dono da senha (necessário para criptografar/revelar)
   * @param {string} [dados.id]
   * @param {string} [dados.servico]             - nome do serviço/site
   * @param {string} [dados.senhaCriptografada]  - valor já criptografado
   * @param {string} [dados.descricao]           - observação livre
   * @param {Date}   [dados.dataCriacao]
   * @param {Date}   [dados.dataAtualizacao]
   */
  constructor({ usuario, id = null, servico = '', senhaCriptografada = '', descricao = '', dataCriacao = null, dataAtualizacao = null }) {
    /** Dono da senha (composição com Usuario). */
    this.usuario = usuario;
    this.id = id;
    /** @private {string} */ this.servico = servico;
    /** @private {string} */ this.senhaCriptografada = senhaCriptografada;
    /** @private {string} */ this.descricao = descricao;
    /** @private {Date} */ this.dataCriacao = dataCriacao;
    /** @private {Date} */ this.dataAtualizacao = dataAtualizacao;
    /** Indica se o registro já existe no banco (decide entre INSERT e UPDATE). */
    this._persistida = Boolean(id);
  }

  /**
   * Cria uma Senha nova (ainda não salva) a partir da senha em texto,
   * já criptografando-a com o utilitário central do backend.
   *
   * @param {Usuario} usuario - usuário autenticado
   * @param {string} servico
   * @param {string} senhaEmTexto
   * @param {string} [descricao]
   * @returns {Senha}
   */
  static criar(usuario, servico, senhaEmTexto, descricao = '') {
    if (!usuario.chaveCofre) throw new Error('Usuário não autenticado: faça login antes de criar senhas.');
    return new Senha({
      usuario,
      servico,
      descricao,
      senhaCriptografada: criptografar(senhaEmTexto),
    });
  }

  /**
   * Cria uma Senha nova usando o GeradorSenha (dependência do diagrama).
   * A senha gerada fica criptografada; use revelarSenha() para vê-la.
   *
   * @param {Usuario} usuario
   * @param {string} servico
   * @param {object} [opcoes] - mesmas opções do construtor de GeradorSenha
   * @param {string} [descricao]
   * @returns {Senha}
   */
  static gerar(usuario, servico, opcoes = {}, descricao = '') {
    return Senha.criar(usuario, servico, new GeradorSenha(opcoes).gerarSenha(), descricao);
  }

  /**
   * Cria o objeto a partir de uma linha da tabela "senhas".
   * @param {object} linha
   * @param {Usuario} usuario - dono da senha
   * @returns {Senha}
   */
  static deLinha(linha, usuario) {
    return new Senha({
      usuario,
      id: linha.id,
      servico: linha.servico,
      senhaCriptografada: linha.senha_criptografada,
      descricao: linha.descricao,
      dataCriacao: linha.data_criacao,
      dataAtualizacao: linha.data_atualizacao,
    });
  }

  /**
   * Salva no banco: faz INSERT se for nova ou UPDATE se já existir.
   * @returns {Promise<boolean>} true se gravou
   */
  async salvar() {
    if (!this.servico || !this.servico.trim()) throw new Error('Informe o serviço.');
    if (!this.senhaCriptografada) throw new Error('Senha vazia.');
    const agora = new Date();

    if (!this._persistida) {
      this.id = randomUUID();
      this.dataCriacao = agora;
      this.dataAtualizacao = agora;
      await Banco.executar(
        `INSERT INTO senhas (id, usuario_id, servico, senha_criptografada, descricao, data_criacao, data_atualizacao)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [this.id, this.usuario.id, this.servico, this.senhaCriptografada, this.descricao, agora, agora]
      );
      this._persistida = true;
      return true;
    }

    this.dataAtualizacao = agora;
    const { afetadas } = await Banco.executar(
      `UPDATE senhas SET servico = ?, senha_criptografada = ?, descricao = ?, data_atualizacao = ?
       WHERE id = ? AND usuario_id = ?`,
      [this.servico, this.senhaCriptografada, this.descricao, agora, this.id, this.usuario.id]
    );
    return afetadas > 0;
  }

  /**
   * Edita os dados e já persiste a alteração.
   * Passe null/undefined em um parâmetro para manter o valor atual.
   *
   * @param {string|null} servico
   * @param {string|null} novaSenha - nova senha em texto (será criptografada)
   * @param {string|null} descricao
   * @returns {Promise<void>}
   */
  async editar(servico, novaSenha, descricao) {
    if (servico != null) this.servico = servico;
    if (descricao != null) this.descricao = descricao;
    if (novaSenha != null) {
      if (!this.usuario.chaveCofre) throw new Error('Usuário não autenticado.');
      this.senhaCriptografada = criptografar(novaSenha);
    }
    await this.salvar();
  }

  /**
   * Exclui esta senha do banco.
   * @returns {Promise<boolean>} true se removeu
   */
  async excluir() {
    if (!this._persistida) return false;
    const { afetadas } = await Banco.executar('DELETE FROM senhas WHERE id = ? AND usuario_id = ?', [
      this.id,
      this.usuario.id,
    ]);
    this._persistida = false;
    return afetadas > 0;
  }

  /**
   * Descriptografa e devolve a senha em texto puro.
   * Exige usuário autenticado.
   * Evite guardar o retorno em variáveis de longa duração ou em logs.
   *
   * @returns {string}
   */
  revelarSenha() {
    if (!this.usuario.chaveCofre) throw new Error('Usuário não autenticado: não é possível revelar a senha.');
    return descriptografar(this.senhaCriptografada);
  }

  /**
   * Copia a senha (em texto) para a área de transferência, sem exibi-la.
   * @returns {Promise<void>}
   */
  async copiarParaClipboard() {
    await copiarTexto(this.revelarSenha());
  }
}

// ===========================================================================
// 8. AuditorCofre
// ===========================================================================

/** Pontuação mínima (0-100) para uma senha não ser considerada fraca. */
const PONTUACAO_MINIMA_SENHA_FORTE = 50;

/** Trechos muito comuns que derrubam a nota de uma senha. */
const PADROES_FRACOS = ['123456', 'abcdef', 'qwerty', 'password', 'senha', 'admin', 'letmein', '111111', '000000'];

/**
 * AuditorCofre
 * Analisa as senhas do cofre procurando senhas fracas e reutilizadas.
 * Depende de Senha (entrada) e RelatorioAuditoria (saída).
 */
class AuditorCofre {
  constructor() {
    /** @private {number} quantidade de senhas fracas da última auditoria */
    this.totalSenhasFracas = 0;
    /** @private {number} quantidade de senhas reutilizadas da última auditoria */
    this.totalSenhasReutilizadas = 0;
  }

  /**
   * Avalia a força de uma senha e devolve uma nota de 0 a 100.
   *
   * Critérios:
   *  - comprimento (até 40 pontos, máximo em 16 caracteres)
   *  - variedade: minúsculas, maiúsculas, números e símbolos (10 pontos cada)
   *  - bônus para senhas longas (>= 12: +10; >= 20: +10)
   *  - penalidades por padrões comuns (-30) e sequências de caracteres repetidos (-15)
   *
   * @param {string} senha - senha em texto puro
   * @returns {number} nota de 0 a 100
   */
  avaliarForcaSenha(senha) {
    if (!senha) return 0;

    let nota = Math.min(senha.length, 16) * 2.5;
    nota += [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(senha)).length * 10;
    if (senha.length >= 12) nota += 10;
    if (senha.length >= 20) nota += 10;

    const minuscula = senha.toLowerCase();
    if (PADROES_FRACOS.some((p) => minuscula.includes(p))) nota -= 30;
    if (/(.)\1{2,}/.test(senha)) nota -= 15;

    return Math.max(0, Math.min(100, Math.round(nota)));
  }

  /**
   * Audita uma lista de senhas: descriptografa cada uma (em memória, sem
   * guardar o texto depois), calcula a força e detecta reutilização.
   *
   * Pontuação geral = média das notas - até 20 pontos de penalidade
   * proporcional à fração de senhas reutilizadas.
   *
   * @param {Senha[]} senhas - senhas do usuário autenticado
   * @returns {Promise<RelatorioAuditoria>}
   */
  async auditarCofre(senhas) {
    let somaNotas = 0;
    let fracas = 0;
    const ocorrencias = new Map(); // senha em texto -> quantas vezes aparece

    for (const senha of senhas) {
      const aberta = senha.revelarSenha();
      const nota = this.avaliarForcaSenha(aberta);
      somaNotas += nota;
      if (nota < PONTUACAO_MINIMA_SENHA_FORTE) fracas++;
      ocorrencias.set(aberta, (ocorrencias.get(aberta) || 0) + 1);
    }

    // Conta todas as senhas que dividem o mesmo valor com pelo menos outra
    let reutilizadas = 0;
    for (const qtd of ocorrencias.values()) {
      if (qtd > 1) reutilizadas += qtd;
    }

    const total = senhas.length;
    const media = total ? somaNotas / total : 100;
    const penalidade = total ? (reutilizadas / total) * 20 : 0;

    this.totalSenhasFracas = fracas;
    this.totalSenhasReutilizadas = reutilizadas;

    return new RelatorioAuditoria({
      totalSenhasAnalisadas: total,
      qtdSenhasFracas: fracas,
      qtdSenhasReutilizadas: reutilizadas,
      pontuacaoGeral: Math.max(0, Math.min(100, Math.round(media - penalidade))),
    });
  }
}

// ===========================================================================
// Exportações
// ===========================================================================

export {
  Banco,
  criarAdaptadorPostgres,
  Usuario,
  GerenciadorSessao,
  Senha,
  GeradorSenha,
  AuditorCofre,
  RelatorioAuditoria,
};