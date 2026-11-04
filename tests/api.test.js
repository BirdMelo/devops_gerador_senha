describe("Cliente da API", () => {
    beforeEach(() => {
        jest.resetModules();
        global.fetch = jest.fn();
    });

    test("envia JSON e o token de sessão no header", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ token: "abc" }),
        });
        const { api, setToken } = require("../src/app/api.js");
        setToken("token-de-teste");

        await expect(api("/auth/login", {
            method: "POST",
            body: { email: "a@b.com" },
        })).resolves.toEqual({ token: "abc" });

        expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer token-de-teste",
            },
            body: JSON.stringify({ email: "a@b.com" }),
        });
    });

    test("retorna o erro JSON da API", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ erro: "Credenciais inválidas." }),
        });
        const { api } = require("../src/app/api.js");

        await expect(api("/auth/login", { method: "POST" })).rejects.toMatchObject({
            message: "Credenciais inválidas.",
            status: 401,
        });
    });

    test("não quebra quando o servidor retorna HTML", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => {
                throw new Error("HTML");
            },
        });
        const { api } = require("../src/app/api.js");

        await expect(api("/auth/login")).rejects.toMatchObject({
            message: "O servidor retornou uma resposta inválida (HTTP 500).",
            status: 500,
        });
    });
});
