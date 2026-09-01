import { generatePassword, generateQuickPassword } from "./password-generator.js";
import "./dark-mode.js";

const passwordForm = document.getElementById("password_form");
const quickPasswordButton = document.getElementById("btn_quick_password");

const passwordReturn = document.querySelector(".password_return");

// Evento do formulário (pra senhas personalizadas)
passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = generatePassword();

    passwordReturn.textContent = password;
});

// Evento do botão independente (para senhas não personalizadas)
quickPasswordButton.addEventListener("click", () => {
    const password = generateQuickPassword();

    passwordReturn.textContent = password;
});

// Adicionando lógica ao botão de copiar
document.getElementById("btn_copy_password").addEventListener("click", () => {
    navigator.clipboard.writeText(passwordReturn.textContent);
});