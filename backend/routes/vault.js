import { Router } from "express";
import { randomUUID } from "node:crypto";
import { senhas } from "../store/memoryStore.js";
import { exigirSessao } from "../middleware/sessao.js";
import { criptografar, descriptografar } from "../crypto/cripto.js";

const router = Router();
router.use(exigirSessao);

function listaDoUsuario(userId) {
  if (!senhas.has(userId)) senhas.set(userId, []);
  return senhas.get(userId);
}

// O que o front recebe: a senha volta descriptografada
function paraResposta(item) {
  return {
    id: item.id,
    servico: item.servico,
    descricao: item.descricao,
    senha: descriptografar(item.senhaCriptografada),
  };
}

// Listar, com busca opcional
router.get("/", (req, res) => {
  const busca = (req.query.busca || "").toLowerCase();
  const lista = listaDoUsuario(req.userId)
    .filter(
      (s) =>
        s.servico.toLowerCase().includes(busca) ||
        s.descricao.toLowerCase().includes(busca)
    )
    .map(paraResposta);
  res.json(lista);
});

// Cadastrar
router.post("/", (req, res) => {
  const { servico, descricao = "", senha } = req.body;
  if (!servico || !senha) {
    return res.status(400).json({ erro: "Serviço e senha são obrigatórios." });
  }
  const nova = {
    id: randomUUID(),
    servico,
    descricao,
    senhaCriptografada: criptografar(senha),
  };
  listaDoUsuario(req.userId).push(nova);
  res.status(201).json(paraResposta(nova));
});

// Editar
router.put("/:id", (req, res) => {
  const item = listaDoUsuario(req.userId).find((s) => s.id === req.params.id);
  if (!item) return res.status(404).json({ erro: "Senha não encontrada." });

  const { servico, descricao = "", senha } = req.body;
  if (!servico || !senha) {
    return res.status(400).json({ erro: "Serviço e senha são obrigatórios." });
  }
  Object.assign(item, { servico, descricao, senhaCriptografada: criptografar(senha) });
  res.json(paraResposta(item));
});

// Excluir
router.delete("/:id", (req, res) => {
  const lista = listaDoUsuario(req.userId);
  const i = lista.findIndex((s) => s.id === req.params.id);
  if (i === -1) return res.status(404).json({ erro: "Senha não encontrada." });
  lista.splice(i, 1);
  res.status(204).end();
});

export default router;