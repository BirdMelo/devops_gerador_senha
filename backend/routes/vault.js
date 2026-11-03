import { Router } from "express";
import { AuditorCofre, GeradorSenha, Senha } from "../models.js";
import { exigirSessao } from "../middleware/sessao.js";

const router = Router();
router.use(exigirSessao);

router.post("/gerar", (req, res) => {
  const { tamanho, especiais, numeros } = req.body ?? {};
  const gerador = new GeradorSenha();
  const senha = gerador.gerarSenha(
    tamanho,
    especiais ?? true,
    numeros ?? true,
  );
  res.json({ senha });
});

router.get("/auditoria", async (req, res) => {
  const senhas = await req.usuario.listarSenhas();
  const relatorio = await new AuditorCofre().auditarCofre(senhas);
  res.json({
    totalSenhasAnalisadas: relatorio.totalSenhasAnalisadas,
    qtdSenhasFracas: relatorio.qtdSenhasFracas,
    qtdSenhasReutilizadas: relatorio.qtdSenhasReutilizadas,
    pontuacaoGeral: relatorio.pontuacaoGeral,
    resumo: relatorio.gerarResumo(),
  });
});

// O que o front recebe: a senha volta descriptografada
function paraResposta(item) {
  return {
    id: item.id,
    servico: item.servico,
    descricao: item.descricao,
    senha: item.revelarSenha(),
  };
}

function dadosValidos({ servico, descricao, senha }) {
  return (
    typeof servico === "string" &&
    servico.trim().length > 0 &&
    typeof descricao === "string" &&
    typeof senha === "string" &&
    senha.length > 0
  );
}

// Listar, com busca opcional
router.get("/", async (req, res) => {
  const busca =
    typeof req.query.busca === "string" ? req.query.busca.toLowerCase() : "";
  const lista = (await req.usuario.listarSenhas())
    .filter(
      (s) =>
        s.servico.toLowerCase().includes(busca) ||
        s.descricao.toLowerCase().includes(busca)
    )
    .map(paraResposta);
  res.json(lista);
});

// Cadastrar
router.post("/", async (req, res) => {
  const { servico, descricao = "", senha } = req.body ?? {};
  if (!dadosValidos({ servico, descricao, senha })) {
    return res.status(400).json({ erro: "Serviço e senha são obrigatórios." });
  }
  const nova = Senha.criar(req.usuario, servico.trim(), senha, descricao.trim());
  await nova.salvar();
  res.status(201).json(paraResposta(nova));
});

// Editar
router.put("/:id", async (req, res) => {
  const item = (await req.usuario.listarSenhas()).find((s) => s.id === req.params.id);
  if (!item) return res.status(404).json({ erro: "Senha não encontrada." });

  const { servico, descricao = "", senha } = req.body ?? {};
  if (!dadosValidos({ servico, descricao, senha })) {
    return res.status(400).json({ erro: "Serviço e senha são obrigatórios." });
  }
  await item.editar(servico.trim(), senha, descricao.trim());
  res.json(paraResposta(item));
});

// Excluir
router.delete("/:id", async (req, res) => {
  const item = (await req.usuario.listarSenhas()).find((s) => s.id === req.params.id);
  if (!item) return res.status(404).json({ erro: "Senha não encontrada." });
  await item.excluir();
  res.status(204).end();
});

export default router;