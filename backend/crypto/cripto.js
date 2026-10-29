import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function chave() {
  const hex = process.env.CHAVE_CRIPTOGRAFIA;
  if (!hex || !/^[\da-f]{64}$/i.test(hex)) {
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
  const partes = typeof payload === "string" ? payload.split(":") : [];
  if (partes.length !== 3) {
    throw new Error("Payload criptografado inválido.");
  }

  const [iv, tag, cifrado] = partes.map((parte) => Buffer.from(parte, "base64"));
  if (iv.length !== 12 || tag.length !== 16 || cifrado.length === 0) {
    throw new Error("Payload criptografado inválido.");
  }
  const decipher = createDecipheriv("aes-256-gcm", chave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}