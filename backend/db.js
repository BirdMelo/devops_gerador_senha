import pg from "pg";
import { Banco, criarAdaptadorPostgres } from "./models.js";

const { Pool } = pg;

function obterUrlBanco() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL ou SUPABASE_DB_URL não configurada para o PostgreSQL do Supabase.",
    );
  }

  let urlValida;
  try {
    urlValida = new URL(url);
  } catch {
    throw new Error(
      "DATABASE_URL inválida. Use a connection string PostgreSQL completa do Supabase.",
    );
  }

  if (!["postgres:", "postgresql:"].includes(urlValida.protocol)) {
    throw new Error(
      "DATABASE_URL inválida. A URL deve começar com postgres:// ou postgresql://.",
    );
  }

  return url;
}

export function configurarBanco() {
  const pool = new Pool({
    connectionString: obterUrlBanco(),
    ssl: { rejectUnauthorized: false },
  });

  Banco.configurar(criarAdaptadorPostgres(pool));

  return pool;
}
