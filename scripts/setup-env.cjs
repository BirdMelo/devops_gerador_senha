const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const projectDirectory = path.resolve(__dirname, "..");
const envFile = path.join(projectDirectory, ".env");
const envExampleFile = path.join(projectDirectory, ".env.example");

if (existsSync(envFile)) {
  console.log(".env já existe; mantendo a CHAVE_CRIPTOGRAFIA atual.");
} else {
  const template = existsSync(envExampleFile)
    ? readFileSync(envExampleFile, "utf8")
    : [
        "# Chave AES-256 usada para criptografar as senhas do cofre.",
        "CHAVE_CRIPTOGRAFIA=",
        "",
        "# Connection string PostgreSQL do Supabase.",
        "DATABASE_URL=",
        "",
        "# Porta local usada pelo servidor (opcional; padrão: 3000).",
        "PORT=",
        "",
      ].join("\n");
  writeFileSync(envFile, template, "utf8");
  console.log(
    ".env criado. Preencha CHAVE_CRIPTOGRAFIA manualmente com uma chave permanente de 64 caracteres hex.",
  );
}
