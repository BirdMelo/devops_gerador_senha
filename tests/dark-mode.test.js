const { loadDarkMode } = require("./domHelper");

describe("Alternância de tema (dark-mode.js)", () => {
    beforeEach(() => {
        loadDarkMode();
    });

    test("alterna de light para dark ao clicar", () => {
        document.documentElement.dataset.theme = "light";

        document.getElementById("btn_theme").click();

        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(document.getElementById("theme_icon").src).toContain("light_mode_icon.svg");
        expect(document.getElementById("copy_icon").src).toContain("copy_dark_mode.svg");
    });

    test("alterna de dark para light ao clicar novamente", () => {
        document.documentElement.dataset.theme = "dark";

        document.getElementById("btn_theme").click();

        expect(document.documentElement.dataset.theme).toBe("light");
        expect(document.getElementById("theme_icon").src).toContain("dark_mode_icon.svg");
        expect(document.getElementById("copy_icon").src).toContain("copy_light_mode.svg");
    });

    test("cliques sucessivos alternam o tema corretamente", () => {
        document.documentElement.dataset.theme = "light";
        const btn = document.getElementById("btn_theme");

        btn.click(); // -> dark
        btn.click(); // -> light
        btn.click(); // -> dark

        expect(document.documentElement.dataset.theme).toBe("dark");
    });
});