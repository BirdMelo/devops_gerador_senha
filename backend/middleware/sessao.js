import { sessions } from "../store/memoryStore.js";

export function exigirSessao(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const session = token && sessions.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ erro: "Sessão inválida." });
  }

  req.userId = session.userId;
  req.token = token;
  next();
}