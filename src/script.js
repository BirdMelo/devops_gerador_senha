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
// Gera senha não personalizada
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