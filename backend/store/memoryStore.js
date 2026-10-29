import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.data",
);
const dataFile = path.join(dataDirectory, "store.json");

export const users = new Map(); // email -> { id, nome, email, senhaMestraHash }
export const sessions = new Map(); // token -> { userId, expiresAt }
export const senhas = new Map(); // userId -> lista de senhas do usuário
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function carregarDados() {
  try {
    const data = JSON.parse(readFileSync(dataFile, "utf8"));
    (data.users ?? []).forEach(([email, user]) => users.set(email, user));
    (data.senhas ?? []).forEach(([userId, entries]) =>
      senhas.set(userId, entries),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function persistirDados() {
  mkdirSync(dataDirectory, { recursive: true });
  writeFileSync(
    dataFile,
    JSON.stringify({
      users: [...users.entries()],
      senhas: [...senhas.entries()],
    }),
    "utf8",
  );
}

carregarDados();