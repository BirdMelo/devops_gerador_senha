/**
 * @jest-environment node
 */

const request = require("supertest");
const app = require("../backend/app.js").default;
const { configurarBanco } = require("../backend/db.js");

let pool;
let token;

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
    token = undefined;
});

afterAll(async () => {
    if (pool) await pool.end();
});

describe("Rotas de autenticação e cofre", () => {
    test("cadastra, autentica, salva e lista uma senha", async () => {
        const cadastro = await request(app)
            .post("/api/auth/register")
            .send({
                nome: "Usuário de teste",
                email: "teste@example.com",
                senhaMestra: "senha-segura-123",
            });

        expect(cadastro.status).toBe(201);

        const login = await request(app)
            .post("/api/auth/login")
            .send({
                email: "TESTE@EXAMPLE.COM",
                senhaMestra: "senha-segura-123",
            });

        expect(login.status).toBe(200);
        expect(login.body.token).toEqual(expect.any(String));
        token = login.body.token;

        const criada = await request(app)
            .post("/api/senhas")
            .set("Authorization", `Bearer ${token}`)
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
            .set("Authorization", `Bearer ${token}`);

        expect(lista.status).toBe(200);
        expect(lista.body).toHaveLength(1);
        expect(lista.body[0].senha).toBe("segredo-do-teste");
    });

    test("bloqueia acesso ao cofre sem sessão", async () => {
        const resposta = await request(app).get("/api/senhas");

        expect(resposta.status).toBe(401);
        expect(resposta.body).toEqual({ erro: "Sessão inválida." });
    });

    test("rejeita cadastro com senha curta e e-mail duplicado", async () => {
        const dados = {
            nome: "Usuário",
            email: "duplicado@example.com",
            senhaMestra: "123",
        };
        const senhaCurta = await request(app).post("/api/auth/register").send(dados);

        expect(senhaCurta.status).toBe(400);

        const valido = await request(app)
            .post("/api/auth/register")
            .send({ ...dados, senhaMestra: "12345678" });
        const duplicado = await request(app)
            .post("/api/auth/register")
            .send({ ...dados, senhaMestra: "12345678" });

        expect(valido.status).toBe(201);
        expect(duplicado.status).toBe(409);
    });
});
