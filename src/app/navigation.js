
const loginScreen = document.getElementById("login_screen");
const registerScreen = document.getElementById("register_screen");
const vaultScreen = document.getElementById("vault_screen");
const generatorScreen = document.getElementById("generator_screen");

const appHeader = document.getElementById("app_header");
const generatorHeader = document.getElementById("generator_header");

function showScreen(screen) {
    loginScreen.hidden = true;
    registerScreen.hidden = true;
    vaultScreen.hidden = true;
    generatorScreen.hidden = true;

    appHeader.hidden = true;
    generatorHeader.hidden = true;

    screen.hidden = false;

    if (screen === generatorScreen) {
        generatorHeader.hidden = false;
    } else {
        appHeader.hidden = false;
    }
}

// Ir para cadastro
document.getElementById("show_register").addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(registerScreen);
});

// Voltar para login
document.getElementById("show_login").addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(loginScreen);
});

// Entrar no cofre
document.getElementById("login_form").addEventListener("submit", (event) => {
    event.preventDefault();
    showScreen(vaultScreen);
});

// Voltar para login ao sair
document.getElementById("btn_logout").addEventListener("click", () => {
    showScreen(loginScreen);
});

// Abrir gerador
document.getElementById("btn_open_generator").addEventListener("click", () => {
    showScreen(generatorScreen);
});

// Voltar do gerador para o cofre
const backButton = document.createElement("button");
backButton.type = "button";
backButton.id = "btn_back_vault";
backButton.textContent = "Voltar ao cofre";
backButton.addEventListener("click", () => {
    showScreen(vaultScreen);
});

generatorScreen.appendChild(backButton);

// Cadastro: por enquanto apenas retorna ao login.
// Nãoto implementando autenticação ou armazenamento.
document.getElementById("register_form").addEventListener("submit", (event) => {
    event.preventDefault();
    showScreen(loginScreen);
});
