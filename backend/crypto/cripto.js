import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function chave() {
  const hex = process.env.CHAVE_CRIPTOGRAFIA;
  if (!hex || hex.length !== 64) {
    throw new Error("CHAVE_CRIPTOGRAFIA ausente ou inválida (64 caracteres hex).");
  }
  return Buffer.from(hex, "hex");
}

export function criptografar(texto) {
  const iv = randomBytes(12); // valor aleatório novo a cada senha
  const cipher = createCipheriv("aes-256-gcm", chave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // detecta se o dado foi adulterado
  return [iv, tag, cifrado].map((b) => b.toString("base64")).join(":");
}

export function descriptografar(payload) {
  const [iv, tag, cifrado] = payload.split(":").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", chave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}