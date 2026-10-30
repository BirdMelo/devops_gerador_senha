import { GerenciadorSessao, Usuario } from "../models.js";

export async function exigirSessao(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const sessao = token && (await GerenciadorSessao.porToken(token));

  if (!sessao) {
    return res.status(401).json({ erro: "Sessão inválida." });
  }

  const usuario = await Usuario.porId(sessao.usuarioId);
  if (!usuario) {
    await sessao.encerrarSessao();
    return res.status(401).json({ erro: "Sessão inválida." });
  }

  usuario.chaveCofre = true;
  req.usuario = usuario;
  req.userId = usuario.id;
  req.token = token;
  req.sessao = sessao;
  next();
}