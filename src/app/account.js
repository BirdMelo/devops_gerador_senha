import { api, setToken } from "./api.js";
import { showScreen, screens } from "./navigation.js";
import { resetVault, handleError } from "./vault.js";

const changeForm = document.getElementById("change_password_form");
const changeError = document.getElementById("change_password_error");
const deleteForm = document.getElementById("delete_account_form");
const deleteError = document.getElementById("delete_account_error");

function showError(element, message) {
    element.textContent = message;
    element.hidden = false;
}

// ---------- Alterar senha mestra (UC010) ----------
document.getElementById("btn_open_change_password").addEventListener("click", () => {
    changeForm.reset();
    changeError.hidden = true;
    showScreen(screens.changePassword);
});

document.getElementById("btn_cancel_change_password").addEventListener("click", () => {
    showScreen(screens.vault);
});

changeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    changeError.hidden = true;

    const senhaAntiga = document.getElementById("current_password").value;
    const novaSenha = document.getElementById("new_master_password").value;
    const confirmacao = document.getElementById("confirm_new_password").value;

    if (novaSenha !== confirmacao) {
        return showError(changeError, "As senhas não coincidem.");
    }

    try {
        await api("/auth/senha-mestra", {
            method: "PUT",
            body: { senhaAntiga, novaSenha },
        });
        changeForm.reset();
        showScreen(screens.vault);
        alert("Senha mestra alterada com sucesso.");
    } catch (error) {
        if (error.status === 401) return handleError(error);
        showError(changeError, error.message);
    }
});

// ---------- Excluir conta (UC011) ----------
document.getElementById("btn_open_delete_account").addEventListener("click", () => {
    deleteForm.reset();
    deleteError.hidden = true;
    showScreen(screens.deleteAccount);
});

document.getElementById("btn_cancel_delete_account").addEventListener("click", () => {
    showScreen(screens.vault);
});

deleteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    deleteError.hidden = true;

    const senhaMestra = document.getElementById("delete_password").value;

    try {
        await api("/auth/conta", { method: "DELETE", body: { senhaMestra } });
        setToken(null);
        resetVault();
        deleteForm.reset();
        showScreen(screens.login);
        alert("Conta excluída com sucesso.");
    } catch (error) {
        if (error.status === 401) return handleError(error);
        showError(deleteError, error.message);
    }
});