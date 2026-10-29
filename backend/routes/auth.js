import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { users, sessions } from "../store/memoryStore.js";
import { exigirSessao } from "../middleware/sessao.js";

const router = Router();

// UC01: cadastrar usuário
router.post("/register", async (req, res) => {
  const { nome, senhaMestra } = req.body;
  const email = req.body.email?.toLowerCase();

  if (!nome || !email || !senhaMestra || senhaMestra.length < 8) {
    return res.status(400).json({ erro: "Dados inválidos." });
  }
  if (users.has(email)) {
    return res.status(409).json({ erro: "E-mail já cadastrado." }); // FE01
  }

  const senhaMestraHash = await bcrypt.hash(senhaMestra, 10);
  users.set(email, { id: randomUUID(), nome, email, senhaMestraHash });
  res.status(201).json({ mensagem: "Conta criada." });
});

// UC02: autenticar usuário
router.post("/login", async (req, res) => {
  const { senhaMestra } = req.body;
  const email = req.body.email?.toLowerCase();

  const user = users.get(email);
  const ok = user && (await bcrypt.compare(senhaMestra, user.senhaMestraHash));
  if (!ok) {
    return res.status(401).json({ erro: "Credenciais inválidas." }); // FE02
  }

  const token = randomUUID();
  sessions.set(token, user.id);
  res.json({ token, nome: user.nome });
});

// UC012: encerrar sessão
router.post("/logout", exigirSessao, (req, res) => {
  sessions.delete(req.token); // invalida o token
  res.status(204).end();
});

export default router;