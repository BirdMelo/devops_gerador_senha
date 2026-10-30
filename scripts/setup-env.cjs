const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { randomBytes } = require("node:crypto");
const path = require("node:path");

const projectDirectory = path.resolve(__dirname, "..");
const envFile = path.join(projectDirectory, ".env");
const envExampleFile = path.join(projectDirectory, ".env.example");

if (existsSync(envFile)) {
  const conteudoAtual = readFileSync(envFile, "utf8");
  const chaveVazia = /^CHAVE_CRIPTOGRAFIA=\s*$/m.test(conteudoAtual);

  if (chaveVazia) {
    const chave = randomBytes(32).toString("hex");
    const conteudoAtualizado = conteudoAtual.replace(
      /^CHAVE_CRIPTOGRAFIA=.*$/m,
      `CHAVE_CRIPTOGRAFIA=${chave}`,
    );
    writeFileSync(envFile, conteudoAtualizado, "utf8");
    console.log(".env já existia; CHAVE_CRIPTOGRAFIA foi preenchida.");
  } else {
    console.log(".env já existe; mantendo o arquivo atual.");
  }
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
  const chave = randomBytes(32).toString("hex");
  const conteudo = template.replace(
    /^CHAVE_CRIPTOGRAFIA=.*$/m,
    `CHAVE_CRIPTOGRAFIA=${chave}`,
  );
  writeFileSync(envFile, conteudo, "utf8");
  console.log(".env criado com uma CHAVE_CRIPTOGRAFIA aleatória.");
}
