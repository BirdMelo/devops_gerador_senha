const { buildDom } = require("./domHelper");

function loadApplication() {
    buildDom();
    jest.resetModules();
    require("../src/app/main.js");
    require("../src/app/navigation.js");
}

describe("Cadastro e navegação", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        global.alert = jest.fn();
        loadApplication();
    });

    test("abre a tela de cadastro sem erro", () => {
        document.getElementById("show_register").click();

        expect(document.getElementById("register_screen").hidden).toBe(false);
        expect(document.getElementById("login_screen").hidden).toBe(true);
    });

    test("não envia cadastro quando as senhas não coincidem", async () => {
        document.getElementById("show_register").click();
        document.getElementById("register_name").value = "Maria";
        document.getElementById("register_email").value = "maria@example.com";
        document.getElementById("register_password").value = "12345678";
        document.getElementById("confirm_password").value = "87654321";

        document.getElementById("register_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await Promise.resolve();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(document.getElementById("register_error").textContent).toBe(
            "As senhas não coincidem.",
        );
    });

    test("envia o cadastro e retorna para o login", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ mensagem: "Conta criada." }),
        });
        document.getElementById("show_register").click();
        document.getElementById("register_name").value = "Maria";
        document.getElementById("register_email").value = "MARIA@EXAMPLE.COM";
        document.getElementById("register_password").value = "12345678";
        document.getElementById("confirm_password").value = "12345678";

        document.getElementById("register_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/register",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    nome: "Maria",
                    email: "MARIA@EXAMPLE.COM",
                    senhaMestra: "12345678",
                }),
            }),
        );
        expect(document.getElementById("login_screen").hidden).toBe(false);
    });

    test("altera entre as telas de conta restauradas", () => {
        document.getElementById("btn_open_change_password").click();
        expect(document.getElementById("change_password_screen").hidden).toBe(false);

        document.getElementById("btn_cancel_change_password").click();
        document.getElementById("btn_open_delete_account").click();
        expect(document.getElementById("delete_account_screen").hidden).toBe(false);
    });

    test("faz login, carrega o cofre e abre a tela do cofre", async () => {
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ token: "token-login" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => [],
            });
        document.getElementById("email").value = "maria@example.com";
        document.getElementById("master_password").value = "12345678";

        document.getElementById("login_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            "/api/auth/login",
            expect.objectContaining({ method: "POST" }),
        );
        expect(global.fetch).toHaveBeenNthCalledWith(
            2,
            "/api/senhas?busca=",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer token-login",
                }),
            }),
        );
        expect(document.getElementById("vault_screen").hidden).toBe(false);
    });

    test("valida confirmação da nova senha antes de chamar a API", async () => {
        document.getElementById("btn_open_change_password").click();
        document.getElementById("current_password").value = "senha-atual";
        document.getElementById("new_master_password").value = "12345678";
        document.getElementById("confirm_new_password").value = "87654321";

        document.getElementById("change_password_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await Promise.resolve();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(document.getElementById("change_password_error").textContent).toBe(
            "As senhas não coincidem.",
        );
    });
});
