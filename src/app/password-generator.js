import { uppercase, lowercase, numbers, symbols } from "./constants.js";

export function getRandomCharacter(characters) {
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
export function generatePassword() {
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

    if (containUppercase) { characters += uppercase; }
    if (containLowercase) { characters += lowercase; }
    if (containNumber) { characters += numbers; }
    if (containSymbols) { characters += symbols; }
    if (characters.length === 0 || passwordLength <= 0) { 
        return "Escolha ao menos um tipo de caractere."; 
    }

    let password = "";

    for (let i = 0; i < passwordLength; i++) {
        password += getRandomCharacter(characters);
    }

    return password;
}
// Gera senha não personalizada
export function generateQuickPassword() {
    const characters = uppercase + lowercase + numbers + symbols;

    const length = 15;

    let password = "";

    for (let i = 0; i < length; i++) {
        password += getRandomCharacter(characters);
    }

    return password;
}