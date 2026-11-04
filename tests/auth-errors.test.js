const { buildDom } = require("./domHelper");

function loadAuth() {
    buildDom();
    jest.resetModules();
    global.fetch = jest.fn();
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

describe("Erros e encerramento da autenticação", () => {
    test("exibe erro quando o cadastro é rejeitado pela API", async () => {
        loadAuth();
        global.fetch.mockResolvedValue(response({ erro: "E-mail já cadastrado." }, 409));

        document.getElementById("show_register").click();
        document.getElementById("register_name").value = "Maria";
        document.getElementById("register_email").value = "maria@example.com";
        document.getElementById("register_password").value = "12345678";
        document.getElementById("confirm_password").value = "12345678";
        document.getElementById("register_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(document.getElementById("register_error").textContent).toBe(
            "E-mail já cadastrado.",
        );
    });

    test("exibe erro quando o login é rejeitado pela API", async () => {
        loadAuth();
        global.fetch.mockResolvedValue(response({ erro: "Credenciais inválidas." }, 401));

        document.getElementById("email").value = "maria@example.com";
        document.getElementById("master_password").value = "errada";
        document.getElementById("login_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(document.getElementById("login_error").textContent).toBe(
            "Credenciais inválidas.",
        );
    });

    test("encerra a sessão mesmo se o logout falhar", async () => {
        loadAuth();
        global.fetch.mockRejectedValue(new Error("servidor indisponível"));
        document.getElementById("btn_logout").click();
        await waitForHandlers();

        expect(document.getElementById("login_screen").hidden).toBe(false);
        expect(document.getElementById("password_list").querySelectorAll(".password_item")).toHaveLength(0);
    });
});
