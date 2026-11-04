CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_mestra_hash TEXT NOT NULL,
  data_criacao TIMESTAMPTZ NOT NULL
);

CREATE TABLE sessoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ultimo_acesso TIMESTAMPTZ NOT NULL
);

CREATE TABLE senhas (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servico TEXT NOT NULL,
  senha_criptografada TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  data_criacao TIMESTAMPTZ NOT NULL,
  data_atualizacao TIMESTAMPTZ NOT NULL
);
