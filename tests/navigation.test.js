const { buildDom } = require("./domHelper");

function loadNavigation() {
    buildDom();
    jest.resetModules();
    return require("../src/app/navigation.js");
}

describe("Navegação do gerador", () => {
    test("abre o gerador pelo cofre e retorna pelo botão voltar", () => {
        loadNavigation();

        document.getElementById("btn_open_generator").click();
        expect(document.getElementById("generator_screen").hidden).toBe(false);
        expect(document.getElementById("generator_header").hidden).toBe(false);
        expect(document.getElementById("btn_use_password").hidden).toBe(true);

        document.getElementById("btn_back_vault").click();
        expect(document.getElementById("vault_screen").hidden).toBe(false);
    });

    test("abre o gerador pelo formulário", () => {
        const { screens, openGenerator } = loadNavigation();

        openGenerator(screens.entry);
        expect(document.getElementById("btn_use_password").hidden).toBe(false);
        expect(document.getElementById("btn_back_vault").textContent).toBe(
            "Voltar ao formulário",
        );
    });

    test("não usa mensagem de senha inválida", () => {
        const { screens, openGenerator } = loadNavigation();

        openGenerator(screens.entry);
        document.querySelector(".password_return").textContent =
            "Escolha ao menos um tipo de caractere.";
        document.getElementById("btn_use_password").click();

        expect(document.getElementById("entry_password").value).toBe("");
        expect(document.getElementById("generator_screen").hidden).toBe(false);
    });
});
