const loginScreen = document.getElementById("login_screen");
const registerScreen = document.getElementById("register_screen");
const vaultScreen = document.getElementById("vault_screen");
const entryScreen = document.getElementById("entry_screen");
const generatorScreen = document.getElementById("generator_screen");

const appHeader = document.getElementById("app_header");
const generatorHeader = document.getElementById("generator_header");

export const screens = {
    login: loginScreen,
    register: registerScreen,
    vault: vaultScreen,
    entry: entryScreen,
    generator: generatorScreen,
};

export function showScreen(screen) {
    Object.values(screens).forEach((s) => (s.hidden = true));

    appHeader.hidden = true;
    generatorHeader.hidden = true;

    screen.hidden = false;

    if (screen === generatorScreen) {
        generatorHeader.hidden = false;
    } else {
        appHeader.hidden = false;
    }
}

// Gerador: lembra de onde foi aberto para voltar ao lugar certo
const useButton = document.getElementById("btn_use_password");
const backButton = document.createElement("button");
backButton.type = "button";
backButton.id = "btn_back_vault";

let generatorOrigin = vaultScreen;

export function openGenerator(origin) {
    generatorOrigin = origin;
    useButton.hidden = origin !== entryScreen;
    backButton.textContent =
        origin === entryScreen ? "Voltar ao formulário" : "Voltar ao cofre";
    showScreen(generatorScreen);
}

backButton.addEventListener("click", () => showScreen(generatorOrigin));
generatorScreen.appendChild(backButton);

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

// Abrir gerador a partir do cofre
document.getElementById("btn_open_generator").addEventListener("click", () => {
    openGenerator(vaultScreen);
});