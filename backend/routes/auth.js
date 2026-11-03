import { Router } from "express";
import { Usuario } from "../models.js";
import { exigirSessao } from "../middleware/sessao.js";

const router = Router();

// UC01: cadastrar usuário
router.post("/register", async (req, res) => {
  const { nome, senhaMestra, email: rawEmail } = req.body ?? {};
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (
    typeof nome !== "string" ||
    !nome.trim() ||
    !email ||
    typeof senhaMestra !== "string" ||
    senhaMestra.length < 8
  ) {
    return res.status(400).json({ erro: "Dados inválidos." });
  }
  if (await Usuario.porEmail(email)) {
    return res.status(409).json({ erro: "E-mail já cadastrado." }); // FE01
  }

  const usuario = new Usuario({
    nome: nome.trim(),
    email,
  });
  await usuario.cadastrar(senhaMestra);
  res.status(201).json({ mensagem: "Conta criada." });
});

// UC02: autenticar usuário
router.post("/login", async (req, res) => {
  const { senhaMestra, email: rawEmail } = req.body ?? {};
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (typeof senhaMestra !== "string") {
    return res.status(401).json({ erro: "Credenciais inválidas." }); // FE02
  }

  const usuario = new Usuario();
  if (!(await usuario.autenticar(email, senhaMestra))) {
    return res.status(401).json({ erro: "Credenciais inválidas." }); // FE02
  }

  res.json({ token: usuario.sessao.tokenSessao, nome: usuario.nome });
});

// UC012: encerrar sessão
router.post("/logout", exigirSessao, async (req, res) => {
  await req.sessao.encerrarSessao();
  res.status(204).end();
});

export default router;