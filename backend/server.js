import app from "./app.js";
import { configurarBanco } from "./db.js";

const PORT = process.env.PORT || 3000;

try {
  configurarBanco();
  app.listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));
} catch (error) {
  console.error("Não foi possível iniciar o banco de dados:", error.message);
  process.exitCode = 1;
}