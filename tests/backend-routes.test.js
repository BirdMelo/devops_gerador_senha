/**
 * @jest-environment node
 */

const crypto = require("node:crypto");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../backend/app.js").default;
const { configurarBanco } = require("../backend/db.js");

let pool;

async function criarUsuario(email, senhaMestra = "senha-segura-123") {
    const cadastro = await request(app)
        .post("/api/auth/register")
        .send({ nome: email, email, senhaMestra });
    expect(cadastro.status).toBe(201);

    const login = await request(app)
        .post("/api/auth/login")
        .send({ email, senhaMestra });
    expect(login.status).toBe(200);
    return login.body.token;
}

function autenticado(token) {
    return `Bearer ${token}`;
}

beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL é obrigatória para os testes de integração com PostgreSQL.",
        );
    }
    pool = configurarBanco();
});

beforeEach(async () => {
    await pool.query("TRUNCATE TABLE sessoes, senhas, usuarios CASCADE");
});

afterAll(async () => {
    if (pool) await pool.end();
});

describe("Rotas de autenticação e cofre", () => {
    test("cadastra, autentica, salva e lista uma senha", async () => {
        const senhaMestra = "senha-segura-123";
        await criarUsuario("teste@example.com", senhaMestra);
        const login = await request(app)
            .post("/api/auth/login")
            .send({
                email: "TESTE@EXAMPLE.COM",
                senhaMestra,
            });
        const token = login.body.token;

        const criada = await request(app)
            .post("/api/senhas")
            .set("Authorization", autenticado(token))
            .send({
                servico: "Serviço de teste",
                descricao: "Integração",
                senha: "segredo-do-teste",
            });

        expect(criada.status).toBe(201);
        expect(criada.body).toMatchObject({
            servico: "Serviço de teste",
            descricao: "Integração",
            senha: "segredo-do-teste",
        });

        const lista = await request(app)
            .get("/api/senhas?busca=teste")
            .set("Authorization", autenticado(token));

        expect(lista.status).toBe(200);
        expect(lista.body).toHaveLength(1);
        expect(lista.body[0].senha).toBe("segredo-do-teste");
    });

    test("não armazena senha mestra, senha do cofre ou token em texto simples", async () => {
        const senhaMestra = "senha-segura-123";
        const senhaCofre = "segredo-do-teste";
        const token = await criarUsuario("seguro@example.com", senhaMestra);

        const criada = await request(app)
            .post("/api/senhas")
            .set("Authorization", autenticado(token))
            .send({ servico: "Serviço", descricao: "", senha: senhaCofre });
        expect(criada.status).toBe(201);

        const usuario = await pool.query(
            "SELECT id, senha_mestra_hash FROM usuarios WHERE email = $1",
            ["seguro@example.com"],
        );
        const senha = await pool.query(
            "SELECT senha_criptografada FROM senhas WHERE usuario_id = $1",
            [usuario.rows[0].id],
        );
        const sessao = await pool.query(
            "SELECT token_hash FROM sessoes WHERE usuario_id = $1",
            [usuario.rows[0].id],
        );

        expect(usuario.rows[0].senha_mestra_hash).not.toBe(senhaMestra);
        await expect(
            bcrypt.compare(senhaMestra, usuario.rows[0].senha_mestra_hash),
        ).resolves.toBe(true);
        expect(senha.rows[0].senha_criptografada).not.toContain(senhaCofre);
        expect(sessao.rows[0].token_hash).not.toBe(token);
        expect(sessao.rows[0].token_hash).toHaveLength(64);
        expect(criada.body).not.toHaveProperty("senha_mestra_hash");
        expect(criada.body).not.toHaveProperty("senha_criptografada");
    });

    test("isola as senhas entre usuários", async () => {
        const tokenA = await criarUsuario("a@example.com", "senha-a-123");
        const tokenB = await criarUsuario("b@example.com", "senha-b-123");

        const criada = await request(app)
            .post("/api/senhas")
            .set("Authorization", autenticado(tokenA))
            .send({ servico: "Privado A", descricao: "", senha: "segredo-a" });
        const id = criada.body.id;

        const listaB = await request(app)
            .get("/api/senhas")
            .set("Authorization", autenticado(tokenB));
        const editarB = await request(app)
            .put(`/api/senhas/${id}`)
            .set("Authorization", autenticado(tokenB))
            .send({ servico: "Invasão", descricao: "", senha: "segredo-b" });
        const excluirB = await request(app)
            .delete(`/api/senhas/${id}`)
            .set("Authorization", autenticado(tokenB));

        expect(listaB.status).toBe(200);
        expect(listaB.body).toEqual([]);
        expect(editarB.status).toBe(404);
        expect(excluirB.status).toBe(404);
    });

    test("invalida a sessão após logout e após expiração", async () => {
        const email = "sessao@example.com";
        const senhaMestra = "senha-sessao-123";
        const tokenLogout = await criarUsuario(email, senhaMestra);

        const logout = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", autenticado(tokenLogout));
        expect(logout.status).toBe(204);

        const aposLogout = await request(app)
            .get("/api/senhas")
            .set("Authorization", autenticado(tokenLogout));
        expect(aposLogout.status).toBe(401);

        const novoLogin = await request(app)
            .post("/api/auth/login")
            .send({ email, senhaMestra });
        const tokenExpirado = novoLogin.body.token;
        const tokenHash = crypto
            .createHash("sha256")
            .update(tokenExpirado)
            .digest("hex");
        await pool.query(
            `UPDATE sessoes
             SET ultimo_acesso = NOW() - INTERVAL '9 hours'
             WHERE token_hash = $1`,
            [tokenHash],
        );

        const aposExpiracao = await request(app)
            .get("/api/senhas")
            .set("Authorization", autenticado(tokenExpirado));
        expect(aposExpiracao.status).toBe(401);
        const sessao = await pool.query(
            "SELECT 1 FROM sessoes WHERE token_hash = $1",
            [tokenHash],
        );
        expect(sessao.rowCount).toBe(0);
    });

    test("bloqueia acesso ao cofre sem sessão", async () => {
        const resposta = await request(app).get("/api/senhas");

        expect(resposta.status).toBe(401);
        expect(resposta.body).toEqual({ erro: "Sessão inválida." });
    });

    test("rejeita campos vazios e senha mestra curta no cadastro", async () => {
        const casos = [
            { nome: "", email: "vazio@example.com", senhaMestra: "12345678" },
            { nome: "Usuário", email: "", senhaMestra: "12345678" },
            { nome: "Usuário", email: "invalido", senhaMestra: "12345678" },
            { nome: "Usuário", email: "curta@example.com", senhaMestra: "123" },
        ];

        for (const dados of casos) {
            const resposta = await request(app)
                .post("/api/auth/register")
                .send(dados);
            expect(resposta.status).toBe(400);
        }
    });

    test("rejeita senha do cofre com campos obrigatórios vazios", async () => {
        const token = await criarUsuario("validacao@example.com");
        const casos = [
            { servico: "", descricao: "", senha: "segredo" },
            { servico: "Serviço", descricao: "", senha: "" },
            { servico: "Serviço", descricao: "", senha: null },
        ];

        for (const dados of casos) {
            const resposta = await request(app)
                .post("/api/senhas")
                .set("Authorization", autenticado(token))
                .send(dados);
            expect(resposta.status).toBe(400);
        }
    });

    test("rejeita tamanho inválido no gerador da API", async () => {
        const token = await criarUsuario("gerador@example.com");
        const casos = [0, 3, 129, 10.5, "dez"];

        for (const tamanho of casos) {
            const resposta = await request(app)
                .post("/api/senhas/gerar")
                .set("Authorization", autenticado(token))
                .send({ tamanho });
            expect(resposta.status).toBe(400);
            expect(resposta.body.erro).toMatch(/Tamanho inválido/);
        }
    });

    test("rejeita cadastro com e-mail duplicado", async () => {
        const dados = {
            nome: "Usuário",
            email: "duplicado@example.com",
            senhaMestra: "12345678",
        };
        await criarUsuario(dados.email, dados.senhaMestra);
        const duplicado = await request(app)
            .post("/api/auth/register")
            .send(dados);

        expect(duplicado.status).toBe(409);
    });
});
