import { api, setToken } from "./api.js";
import { showScreen, screens } from "./navigation.js";
import { loadVault, resetVault } from "./vault.js";

const loginForm = document.getElementById("login_form");
const registerForm = document.getElementById("register_form");
const loginError = document.getElementById("login_error");
const registerError = document.getElementById("register_error");

function showError(element, message) {
    element.textContent = message;
    element.hidden = false;
}

// Cadastro (UC01)
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerError.hidden = true;

    const nome = document.getElementById("register_name").value.trim();
    const email = document.getElementById("register_email").value.trim();
    const senhaMestra = document.getElementById("register_password").value;
    const confirmacao = document.getElementById("confirm_password").value;

    if (senhaMestra !== confirmacao) {
        return showError(registerError, "As senhas não coincidem.");
    }

    try {
        await api("/auth/register", {
            method: "POST",
            body: { nome, email, senhaMestra },
        });
        registerForm.reset();
        showScreen(screens.login);
    } catch (error) {
        showError(registerError, error.message);
    }
});

// Login (UC02)
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.hidden = true;

    const email = document.getElementById("email").value.trim();
    const senhaMestra = document.getElementById("master_password").value;

    try {
        const { token } = await api("/auth/login", {
            method: "POST",
            body: { email, senhaMestra },
        });
        setToken(token);
        loginForm.reset();
        await loadVault();
        showScreen(screens.vault);
    } catch (error) {
        showError(loginError, error.message);
    }
});

// Logout (UC012)
document.getElementById("btn_logout").addEventListener("click", async () => {
    try {
        await api("/auth/logout", { method: "POST" });
    } catch {
        // se a sessão já expirou, o resultado é o mesmo: sair
    } finally {
        setToken(null);
        resetVault();
        showScreen(screens.login);
    }
});