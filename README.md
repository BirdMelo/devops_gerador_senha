# Gerador de Senhas

Aplicação web acadêmica desenvolvida na disciplina de DevOps do CEUB. O
projeto gera senhas seguras, permite gerenciá-las em um cofre autenticado e
mantém o código coberto por testes automatizados e integração contínua.

**Próxima versão: `v2.1.6`**

## Funcionalidades entregues

### Frontend

- Geração rápida de senhas com 15 caracteres.
- Geração personalizada por tamanho e grupos de caracteres:
  maiúsculas, minúsculas, números e símbolos.
- Uso de APIs criptograficamente seguras para sortear caracteres.
- Interface com modo claro e escuro.
- Cadastro e login de usuários.
- Cofre de senhas com:
  - cadastro, edição e exclusão de credenciais;
  - pesquisa por serviço ou descrição;
  - exibição protegida e cópia da senha;
  - geração de uma senha diretamente no formulário do cofre.
- Alteração da senha mestra e exclusão da conta.
- Tratamento de sessão expirada e retorno automático para o login.

### Backend

- API Express servida junto com o frontend.
- Persistência PostgreSQL por meio de um adaptador de banco.
- Cadastro e autenticação com hash bcrypt da senha mestra.
- Sessões com token aleatório no cliente e somente o hash SHA-256 persistido.
- Uma sessão ativa por usuário, renovada a cada requisição e expirada após
  oito horas de inatividade.
- Cofre individual por usuário, com isolamento por `usuario_id`.
- Criptografia AES-256-GCM das senhas armazenadas, usando IV e tag de
  autenticação aleatórios para cada credencial.
- Auditoria do cofre, com identificação de senhas fracas, reutilizadas e
  cálculo de pontuação geral.
- Geração de senhas no backend com `crypto.randomInt`, incluindo ao menos um
  caractere de cada grupo habilitado e embaralhamento do resultado.
- Validação de entrada nas rotas de autenticação e do cofre, com respostas
  HTTP apropriadas.

## Arquitetura e estrutura

```text
.
├── .github/workflows/ci.yml     # pipeline de integração contínua
├── .github/workflows/release.yml # testes e publicação de imagem versionada
├── .github/workflows/deploy-staging.yml # homologação simulada e rollback
├── backend/
│   ├── app.js                   # configuração do Express e arquivos estáticos
│   ├── server.js                # inicialização do servidor e do banco
│   ├── db.js                    # validação da URL e conexão PostgreSQL
│   ├── models.js                # modelos, persistência e regras de negócio
│   ├── crypto/cripto.js         # AES-256-GCM
│   ├── middleware/sessao.js     # autenticação por Bearer token
│   └── routes/                  # rotas de autenticação e cofre
├── docker/
│   └── schema.test.sql          # esquema PostgreSQL usado nos testes
├── scripts/
│   ├── setup-env.cjs            # configuração inicial local
│   └── test-docker.cjs          # execução da suíte com Docker Compose
├── src/
│   ├── index.html               # interface
│   ├── style.css                # estilos e temas
│   └── app/                     # módulos do frontend
├── tests/                       # testes unitários e de integração
├── Dockerfile.test
├── Dockerfile
├── docker-compose.yml
├── docker-compose.staging.yml
├── docker-compose.test.yml
├── docker-compose.coverage.yml
├── package.json
└── README.md
```

O frontend usa módulos JavaScript separados por responsabilidade. O backend
usa classes de domínio (`Usuario`, `Senha`, `GerenciadorSessao`,
`GeradorSenha` e `AuditorCofre`) e um adaptador que converte os placeholders
internos das consultas para o formato do PostgreSQL.

## Requisitos

- Git.
- Node.js 22 ou superior.
- npm.
- PostgreSQL para execução local do backend.
- Docker Desktop para os testes de integração descartáveis e cobertura
  completa.

## Execução local

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/BirdMelo/devops_gerador_senha.git
   cd devops_gerador_senha
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

   O projeto também disponibiliza `npm run setup` para instalar dependências e
   criar o arquivo local de variáveis de ambiente a partir do template.

3. Configure, no arquivo local de variáveis de ambiente, uma
   `CHAVE_CRIPTOGRAFIA` hexadecimal de 64 caracteres e uma `DATABASE_URL`
   completa com protocolo `postgres://` ou `postgresql://`. Nunca compartilhe
   essas credenciais nem as versione.

4. Execute o esquema de banco em `docker/schema.test.sql` no banco de
   desenvolvimento ou no PostgreSQL configurado.

5. Inicie a aplicação:

   ```bash
   npm start
   ```

6. Acesse <http://localhost:3000>. O frontend deve ser acessado pelo servidor,
   e não abrindo `src/index.html` diretamente.

Para desenvolvimento com recarga automática, use:

```bash
npm run dev
```

## Testes e cobertura

Os testes usam Jest, Babel, JSDOM e Supertest. Os testes locais não exigem
PostgreSQL:

```bash
npm run test:unit
npm run test:integration
npm run test:all
npm run test:coverage:all:local
```

Os testes que exercitam as rotas reais usam PostgreSQL descartável via Docker:

```bash
npm run test:integration:db
npm run test:docker
npm run test:coverage:docker
```

`npm run test:integration:db:local` exige um PostgreSQL de testes configurado
em `DATABASE_URL` e nunca deve apontar para um banco de produção. Os comandos
de Docker removem o container, volumes e órfãos ao terminar. A cobertura
completa é salva em `coverage/`.

Na validação desta versão, a suíte local foi executada com sucesso:
**11 suítes e 59 testes aprovados**.

## Integração contínua

O workflow `.github/workflows/ci.yml` é executado em pushes e pull requests.
Ele usa Node.js 22, instala dependências com `npm ci`, executa os testes locais,
executa a integração com PostgreSQL e publica o relatório de cobertura como
artefato do GitHub Actions.

## Publicação, homologação e rollback

O workflow `.github/workflows/release.yml` é acionado por tags `vX.Y.Z`. Ele
executa os testes e, se aprovados, publica a imagem no GitHub Container Registry
com tags semânticas e o SHA do commit. O workflow usa o `GITHUB_TOKEN` fornecido
pelo GitHub Actions, com permissão de escrita no registry; não lê o `.env` e
não usa as credenciais do Supabase.

Após a publicação, `.github/workflows/deploy-staging.yml` inicia a imagem em um
ambiente temporário com PostgreSQL de teste, verifica se a página inicial
responde e confirma acesso ao banco antes de remover containers e dados. Esse deploy é uma
simulação em runner descartável, não um ambiente persistente. O banco e a chave
usados nele são exclusivos de teste; nenhum dado real é utilizado.

Antes de publicar uma versão, cadastre em **GitHub > Settings > Secrets and
variables > Actions** dois *repository secrets* para a homologação:

- `STAGING_DB_PASSWORD`: 32 caracteres hexadecimais aleatórios.
- `STAGING_CRYPTO_KEY`: 64 caracteres hexadecimais aleatórios.

Para gerar valores localmente sem reutilizar as credenciais do Supabase, rode
no PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(16).toString('hex'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Cadastre a primeira saída como `STAGING_DB_PASSWORD` e a segunda como
`STAGING_CRYPTO_KEY`. Não as coloque no repositório nem as envie em mensagens.
O workflow valida o formato e injeta os valores somente nos containers
temporários de homologação; não use aqui os valores reais do `.env`.

Para simular rollback, no GitHub abra **Actions > Deploy staging > Run
workflow** e informe a versão semântica anterior já publicada, sem o prefixo
`v` (por exemplo, `2.1.5`). O workflow sobe essa imagem anterior no mesmo
ambiente temporário e executa a verificação. Em um deploy persistente, o
rollback consiste em reapontar o serviço para a tag da última versão estável;
esse projeto ainda não configura um servidor persistente de produção.

Para executar localmente a aplicação conectada ao Supabase, use
`docker-compose.yml` e as variáveis locais de `.env`. Não reutilize essas
credenciais na simulação de homologação.

## Segurança e dados

- Senhas mestras nunca são persistidas em texto puro; somente hashes bcrypt
  são armazenados.
- Senhas do cofre são cifradas com AES-256-GCM antes de serem persistidas.
- Tokens de sessão não são persistidos em texto puro.
- Consultas ao banco usam parâmetros, reduzindo o risco de injeção SQL.
- Dados do cofre são retornados somente após autenticação válida.
- O arquivo de variáveis de ambiente é ignorado pelo Git; mantenha-o apenas
  no ambiente local ou no gerenciador de segredos da infraestrutura.

## Histórico de evolução

- **v1 — base do frontend:** criação da interface HTML/CSS, geração rápida e
  personalizada e modo escuro.
- **v1.x — organização e qualidade:** separação do JavaScript em módulos,
  configuração de Babel/Jest, criação dos testes automatizados e do pipeline
  de CI.
- **v2.0 — backend:** inclusão do Express, autenticação, sessões, PostgreSQL,
  ORM/adaptador de persistência e cofre criptografado.
- **v2.1 — conta e cofre:** cadastro/login integrado ao frontend, cadastro,
  edição, exclusão e pesquisa de senhas, alteração da senha mestra, exclusão
  de conta e auditoria do cofre.
- **v2.1.3 — validação:** correções de funcionalidades, ampliação da suíte,
  testes de segurança e execução dos testes com PostgreSQL em Docker.
- **v2.1.4 — documentação e versão:** documentação consolidada do estado atual
  do projeto e sincronização do versionamento nos manifestos npm.
- **v2.1.5 — primeira publicação:** imagem versionada publicada no GitHub
  Container Registry.
- **v2.1.6 — entrega DevOps:** homologação simulada e fluxo de rollback
  documentado.

## Fluxo de desenvolvimento

O projeto segue Trunk-Based Development, usando `main` como branch principal e
branches curtas integradas por pull requests.

| Prefixo | Uso | Exemplo |
|---|---|---|
| `feature/` | Nova funcionalidade | `feature/html-css` |
| `fix/` | Correção de bug | `fix/erro-senha` |
| `chore/` | Manutenção, configuração ou dependência | `chore/config-ci` |

Os commits seguem prefixos convencionais:

- `feat:` — nova funcionalidade;
- `fix:` — correção;
- `chore:` — manutenção ou configuração;
- `test:` — testes;
- `docs:` — documentação.
