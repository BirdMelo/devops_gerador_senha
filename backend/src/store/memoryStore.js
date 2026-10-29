


export const users = new Map(); // email -> { id, nome, email, senhaMestraHash }
export const sessions = new Map(); // token -> id do usuário
export const senhas = new Map(); // userId -> lista de senhas do usuário