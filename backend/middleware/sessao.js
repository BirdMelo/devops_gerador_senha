import { sessions } from "../store/memoryStore.js";

export function exigirSessao(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = sessions.get(token); 

  // Se o token for inválido, retorna erro.
  if (!userId) {
    return res.status(401).json({ erro: "Sessão inválida." });
  }

  req.userId = userId;
  req.token = token;
  next(); // deixa a requisição seguir para a rota
}