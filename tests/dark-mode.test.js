const { loadDarkMode } = require("./domHelper");

const buttons = () => document.querySelectorAll(".btn_theme");
const icons = () => document.querySelectorAll(".theme_icon");

describe("Alternância de tema (dark-mode.js)", () => {
    beforeEach(() => {
        loadDarkMode();
    });

    test("alterna de light para dark ao clicar", () => {
        document.documentElement.dataset.theme = "light";

        buttons()[0].click();

        expect(document.documentElement.dataset.theme).toBe("dark");
        icons().forEach((icon) => expect(icon.src).toContain("light_mode_icon.svg"));
        expect(document.getElementById("copy_icon").src).toContain("copy_dark_mode.svg");
    });

    test("alterna de dark para light ao clicar novamente", () => {
        document.documentElement.dataset.theme = "dark";

        buttons()[0].click();

        expect(document.documentElement.dataset.theme).toBe("light");
        icons().forEach((icon) => expect(icon.src).toContain("dark_mode_icon.svg"));
        expect(document.getElementById("copy_icon").src).toContain("copy_light_mode.svg");
    });

    test("cliques sucessivos alternam o tema corretamente", () => {
        document.documentElement.dataset.theme = "light";
        const btn = buttons()[0];

        btn.click(); // -> dark
        btn.click(); // -> light
        btn.click(); // -> dark

        expect(document.documentElement.dataset.theme).toBe("dark");
    });

    test("todos os botões de tema funcionam e sincronizam os ícones", () => {
        document.documentElement.dataset.theme = "light";
        const todos = buttons();

        expect(todos.length).toBeGreaterThan(1);

        todos[todos.length - 1].click(); // último botão (ex.: cabeçalho do gerador)

        expect(document.documentElement.dataset.theme).toBe("dark");
        icons().forEach((icon) => expect(icon.src).toContain("light_mode_icon.svg"));
    });
});