const { buildDom } = require("./domHelper");

function loadAccount() {
    buildDom();
    jest.resetModules();
    global.fetch = jest.fn();
    global.alert = jest.fn();
    require("../src/app/main.js");
}

function response(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    };
}

function waitForHandlers() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Operações da conta", () => {
    test("altera a senha mestra com sucesso", async () => {
        loadAccount();
        global.fetch.mockResolvedValue(response(null, 204));

        document.getElementById("btn_open_change_password").click();
        document.getElementById("current_password").value = "senha-atual";
        document.getElementById("new_master_password").value = "senha-nova";
        document.getElementById("confirm_new_password").value = "senha-nova";
        document.getElementById("change_password_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/senha-mestra",
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify({
                    senhaAntiga: "senha-atual",
                    novaSenha: "senha-nova",
                }),
            }),
        );
        expect(document.getElementById("vault_screen").hidden).toBe(false);
        expect(global.alert).toHaveBeenCalledWith("Senha mestra alterada com sucesso.");
    });

    test("exibe erro ao falhar a alteração da senha", async () => {
        loadAccount();
        global.fetch.mockResolvedValue(response({ erro: "Senha atual incorreta." }, 403));

        document.getElementById("btn_open_change_password").click();
        document.getElementById("current_password").value = "errada";
        document.getElementById("new_master_password").value = "senha-nova";
        document.getElementById("confirm_new_password").value = "senha-nova";
        document.getElementById("change_password_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(document.getElementById("change_password_error").textContent).toBe(
            "Senha atual incorreta.",
        );
        expect(document.getElementById("change_password_error").hidden).toBe(false);
    });

    test("exclui a conta com sucesso e retorna ao login", async () => {
        loadAccount();
        global.fetch.mockResolvedValue(response(null, 204));

        document.getElementById("btn_open_delete_account").click();
        document.getElementById("delete_password").value = "senha-mestra";
        document.getElementById("delete_account_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/conta",
            expect.objectContaining({
                method: "DELETE",
                body: JSON.stringify({ senhaMestra: "senha-mestra" }),
            }),
        );
        expect(document.getElementById("login_screen").hidden).toBe(false);
        expect(global.alert).toHaveBeenCalledWith("Conta excluída com sucesso.");
    });

    test("exibe erro ao falhar a exclusão da conta", async () => {
        loadAccount();
        global.fetch.mockResolvedValue(response({ erro: "Senha mestra incorreta." }, 403));

        document.getElementById("btn_open_delete_account").click();
        document.getElementById("delete_password").value = "errada";
        document.getElementById("delete_account_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(document.getElementById("delete_account_error").textContent).toBe(
            "Senha mestra incorreta.",
        );
        expect(document.getElementById("delete_account_error").hidden).toBe(false);
    });

    test("retorna ao login quando a sessão expira ao alterar a senha", async () => {
        loadAccount();
        global.fetch.mockResolvedValue(response({ erro: "Sessão inválida." }, 401));

        document.getElementById("btn_open_change_password").click();
        document.getElementById("current_password").value = "atual";
        document.getElementById("new_master_password").value = "nova";
        document.getElementById("confirm_new_password").value = "nova";
        document.getElementById("change_password_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(document.getElementById("login_screen").hidden).toBe(false);
        expect(global.alert).toHaveBeenCalledWith("Sua sessão expirou. Entre novamente.");
    });
});
