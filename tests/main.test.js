const { loadMain } = require("./domHelper");

describe("Evento do formulário (main.js)", () => {
    beforeEach(() => {
        loadMain();
    });

    test("ao submeter o formulário, exibe a senha gerada", () => {
        document.getElementById("password_length").value = 10;
        document.getElementById("password_uppercase").checked = true;
        document.getElementById("password_lowercase").checked = true;

        const form = document.getElementById("password_form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(document.querySelector(".password_return").textContent).toHaveLength(10);
    });

    test("não recarrega a página ao submeter (preventDefault é chamado)", () => {
        const form = document.getElementById("password_form");
        const event = new Event("submit", { bubbles: true, cancelable: true });
        const preventDefaultSpy = jest.spyOn(event, "preventDefault");

        form.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test("exibe a mensagem de aviso quando nenhuma opção de caractere está marcada", () => {
        document.getElementById("password_length").value = 10;

        const form = document.getElementById("password_form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(document.querySelector(".password_return").textContent).toBe(
            "Escolha ao menos um tipo de caractere."
        );
    });
});

describe("Evento do botão de senha rápida (main.js)", () => {
    beforeEach(() => {
        loadMain();
    });

    test("ao clicar, exibe uma senha de 15 caracteres", () => {
        document.getElementById("btn_quick_password").click();

        expect(document.querySelector(".password_return").textContent).toHaveLength(15);
    });
});

describe("Botão de copiar senha (main.js)", () => {
    beforeEach(() => {
        loadMain();
    });

    test("copia o conteúdo atual do campo de retorno para a área de transferência", () => {
        document.querySelector(".password_return").textContent = "minhaSenha123";

        document.getElementById("btn_copy_password").click();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("minhaSenha123");
    });

    test("copia string vazia se nenhuma senha foi gerada ainda", () => {
        document.getElementById("btn_copy_password").click();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
    });
});