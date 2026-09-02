const fs = require("fs");
const path = require("path");

// Lê o index.html real do projeto uma única vez. Assim, qualquer mudança no
// HTML (novos ids, atributos, estrutura) é refletida automaticamente nos
// testes, sem precisar duplicar o markup aqui.
const indexHtmlPath = path.resolve(__dirname, "..", "src", "index.html");
const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");

// Extrai só o conteúdo de <body>...</body> (não precisamos de <head>/<script>
// aqui, já que os módulos JS são carregados via require(), não via <script>).
const bodyMatch = indexHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
const bodyContent = bodyMatch ? bodyMatch[1] : indexHtml;

/**
 * dark-mode.js e main.js acessam elementos do DOM assim que são importados
 * (fora de qualquer função) e registram os listeners nesse momento. Por isso
 * montamos o DOM fake ANTES de importar, e usamos jest.resetModules() para
 * forçar o módulo a rodar (e religar os listeners) do zero em cada teste.
 */
function buildDom() {
    document.body.innerHTML = bodyContent;

    document.documentElement.dataset.theme = "light";

    // jsdom não implementa navigator.clipboard; mockamos para main.js poder chamá-lo
    Object.defineProperty(navigator, "clipboard", {
        value: { writeText: jest.fn() },
        configurable: true,
    });
}

function loadMain() {
    buildDom();
    jest.resetModules();
    require("../src/app/main.js");
}

function loadPasswordGenerator() {
    buildDom();
    jest.resetModules();
    return require("../src/app/password-generator.js");
}

function loadDarkMode() {
    buildDom();
    jest.resetModules();
    require("../src/app/dark-mode.js");
}

module.exports = { buildDom, loadMain, loadPasswordGenerator, loadDarkMode };