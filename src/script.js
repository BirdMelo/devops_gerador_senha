const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercase = "abcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";

// \ é usado para que o JS interprete esses caracteres corretamente
const symbols = "!\"#$%&'()*+,-./:;<=>?@[\\]^_{|}";


// -----------------
// CRIAÇÃO DAS FUNÇÕES DE GERAÇÃO DE SENHA
// -----------------

// Pega um caractere aleatório dentre uma cadeia de caracteres
function getRandomCharacter(characters) {
    // Usei isso porque o 'Math.random' não é criptograficamente seguro.
    // crypto.getRandomValues foi criado pensando especificamente me segurança.
    const array = new Uint32Array(1);
    // Preenche esse array, que só tem 1 posição, com um inteiro aleatório. Tem que ser em um array porque
    // é assim que o crypto.getRandomValues funciona.
    crypto.getRandomValues(array);

    // Usa o número aleatório para pegar uma posição aleatória do array de caracteres.
    return characters[array[0] % characters.length];
}

// Gera senha personalizada
function generatePassword() {
    const passwordLength = Number(
        document.getElementById("password_length").value
    );

    // Vê quais opções estão selecionadas
    const containUppercase =
        document.getElementById("password_uppercase").checked;
    const containLowercase =
        document.getElementById("password_lowercase").checked;
    const containNumber =
        document.getElementById("password_numeric").checked;
    const containSymbols =
        document.getElementById("password_special").checked;

    // String final com todos os caracteres que podem ser incluídos
    let characters = "";

    if (containUppercase) {
        characters += uppercase;
    }
    if (containLowercase) {
        characters += lowercase;
    }
    if (containNumber) {
        characters += numbers;
    }
    if (containSymbols) {
        characters += symbols;
    }
    if (characters.length === 0 || passwordLength <= 0) {
        return "";
    }

    let password = "";

    for (let i = 0; i < passwordLength; i++) {
        password += getRandomCharacter(characters);
    }

    return password;
}
// Gera senha não personalizada, 15 caracteres com todos os tipos de caracteres
function generateQuickPassword() {
    const characters = uppercase + lowercase + numbers + symbols;

    const length = 15;

    let password = "";

    for (let i = 0; i < length; i++) {
        password += getRandomCharacter(characters);
    }

    return password;
}

// ---------------
// ADICIONANDO EVENTOS DOS BOTÕES
// ---------------
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

// ----------
// MODO ESCURO
// ----------   
const themeButton = document.getElementById("btn_theme");
const themeIcon = document.getElementById("theme_icon");
const copyIcon = document.getElementById("copy_icon");

themeButton.addEventListener("click", () => {
    const html = document.documentElement;

    if (html.dataset.theme === "light") {
        html.dataset.theme = "dark";

        themeIcon.src = "./img/light_mode_icon.svg";
        copyIcon.src = "./img/copy_dark_mode.svg";
    } else {
        html.dataset.theme = "light";

        themeIcon.src = "./img/dark_mode_icon.svg";
        copyIcon.src = "./img/copy_light_mode.svg";
    }
    
});
// troca login p/cadastro

const loginScreen = document.getElementById("login_screen");
const registerScreen = document.getElementById("register_screen");

const showRegister = document.getElementById("show_register");
const showLogin = document.getElementById("show_login");

//  tela de cadastro
showRegister.addEventListener("click", (event) => {
    event.preventDefault();

    loginScreen.hidden = true;
    registerScreen.hidden = false;
});

// Volta p/ tela de login
showLogin.addEventListener("click", (event) => {
    event.preventDefault();

    registerScreen.hidden = true;
    loginScreen.hidden = false;
});
// Validar cadasrto

const registerForm = document.getElementById("register_form");

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = document.getElementById("register_password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    if (password !== confirmPassword) {
        alert("As senhas não são iguais!");
        return;
    }

    alert("Cadastro validado com sucesso!");
});

//tela do ngc principal aparecer qnd clicar em "Entrar" e voltar qnd clicar em "Sair"
// Entrar 
const loginForm = document.getElementById("login_form");
const vaultScreen = document.getElementById("vault_screen");

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    loginScreen.hidden = true;
    vaultScreen.hidden = false;
});

// Sair
const logoutButton = document.getElementById("btn_logout");

logoutButton.addEventListener("click", () => {
    vaultScreen.hidden = true;
    loginScreen.hidden = false;
});
// add senha e o botão Cancelar 
const addPasswordButton = document.getElementById("btn_add_password");
const addPasswordScreen = document.getElementById("add_password_screen");

addPasswordButton.addEventListener("click", () => {
    vaultScreen.hidden = true;
    addPasswordScreen.hidden = false;
});

// Cancelar e voltar 
const cancelPasswordButton = document.getElementById("btn_cancel_password");

cancelPasswordButton.addEventListener("click", () => {
    addPasswordScreen.hidden = true;
    vaultScreen.hidden = false;
});
// Lista temporária de senhas
const savedPasswords = [];

const addPasswordForm = document.getElementById("add_password_form");
const passwordList = document.getElementById("password_list");
const emptyVault = document.getElementById("empty_vault");

addPasswordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let service = document.getElementById("service_name").value;
let description = document.getElementById("service_description").value;
let password = document.getElementById("saved_password").value;

const savedPassword = {
    service: service,
    description: description,
    password: password
};

savedPasswords.push(savedPassword);

    const passwordItem = document.createElement("div");

    passwordItem.innerHTML = `
    <h3>${service}</h3>
    <p>${description}</p>
    <p>Senha: <span class="password_value">••••••••</span></p>
    <button type="button" class="toggle_password">Mostrar senha</button>
`;

let passwordVisible = false;

const passwordText = passwordItem.querySelector(".password_value");
const toggleButton = passwordItem.querySelector(".toggle_password");
// só mostrar a senha quando clicar no botão 
toggleButton.addEventListener("click", () => {
    passwordVisible = !passwordVisible;

    if (passwordVisible) {
        passwordText.textContent = password;
        toggleButton.textContent = "Ocultar senha";
    } else {
        passwordText.textContent = "••••••••";
        toggleButton.textContent = "Mostrar senha";
    }
});
//botão de copiar (copiar sem precisar mostrar a senha)
const copyButton = document.createElement("button");

copyButton.type = "button";
copyButton.textContent = "Copiar";

copyButton.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(password);
        alert("Senha copiada!");
    } catch (error) {
        alert("Não foi possível copiar a senha.");
    }
});

passwordItem.appendChild(copyButton);

//botao para editar senha

const editButton = document.createElement("button");

editButton.type = "button";
editButton.textContent = "Editar";

editButton.addEventListener("click", () => {
    const newService = prompt("Nome do serviço:", service);

    if (newService === null || newService.trim() === "") {
        return;
    }

    const newDescription = prompt("Descrição:", description);

    if (newDescription === null) {
        return;
    }

    const newPassword = prompt("Nova senha:", password);

    if (newPassword === null || newPassword === "") {
        return;
    }

    service = newService.trim();
    description = newDescription.trim();
    password = newPassword;

    savedPassword.service = service;
    savedPassword.description = description;
    savedPassword.password = password;

    passwordItem.querySelector("h3").textContent = service;
    passwordItem.querySelector("p").textContent = description;

    passwordVisible = false;
    passwordText.textContent = "••••••••";
    toggleButton.textContent = "Mostrar senha";

    searchInput.dispatchEvent(new Event("input"));
});



passwordItem.appendChild(editButton);
// Botão para excluir senha
const deleteButton = document.createElement("button");

deleteButton.type = "button";
deleteButton.textContent = "Excluir";

deleteButton.addEventListener("click", () => {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta senha?");

    if (confirmDelete) {
        passwordItem.remove();

        const index = savedPasswords.findIndex((item) =>
            item.service === service &&
            item.description === description &&
            item.password === password
        );

        if (index !== -1) {
            savedPasswords.splice(index, 1);
        }

        if (passwordList.querySelectorAll(":scope > div").length === 0) {
            emptyVault.hidden = false;
        }
    }
});

passwordItem.appendChild(deleteButton);

    passwordList.appendChild(passwordItem);

    emptyVault.hidden = true;
    addPasswordForm.reset();

    addPasswordScreen.hidden = true;
    vaultScreen.hidden = false;

    alert("Senha adicionada com sucesso!");
});

// pesquisar "nome" da senha

const searchInput = document.getElementById("search_password");

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();

    const passwordItems = passwordList.querySelectorAll(":scope > div");

    passwordItems.forEach((item) => {
        const serviceName = item.querySelector("h3").textContent.toLowerCase();

        if (serviceName.includes(searchTerm)) {
            item.hidden = false;
        } else {
            item.hidden = true;
        }
    });
});
// Abrir o gerador de senhas
const openGeneratorButton = document.getElementById("btn_open_generator");
const generatorHeader = document.getElementById("generator_header");
const generatorScreen = document.getElementById("generator_screen");

openGeneratorButton.addEventListener("click", () => {
    vaultScreen.hidden = true;
    generatorHeader.hidden = false;
    generatorScreen.hidden = false;
});

// Voltar a tela principal
const backVaultButton = document.getElementById("btn_back_vault");

backVaultButton.addEventListener("click", () => {
    generatorHeader.hidden = true;
    generatorScreen.hidden = true;
    vaultScreen.hidden = false;
});
// Usar a senha gerada no cadastro
const usePasswordButton = document.getElementById("btn_use_password");

usePasswordButton.addEventListener("click", () => {
    const generatedPassword = passwordReturn.textContent;

    if (generatedPassword === "") {
        alert("Gere uma senha primeiro!");
        return;
    }

    generatorHeader.hidden = true;
    generatorScreen.hidden = true;

    vaultScreen.hidden = true;
    addPasswordScreen.hidden = false;

    document.getElementById("saved_password").value = generatedPassword;
});