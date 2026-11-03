import {
    invalidPasswordMessage,
    lowercase,
    numbers,
    symbols,
    uppercase,
} from "./constants.js";

export function getRandomCharacter(characters) {
    if (!characters.length) {
        throw new Error("O conjunto de caracteres não pode ser vazio.");
    }

    const array = new Uint32Array(1);
    const limit = Math.floor(2 ** 32 / characters.length) * characters.length;

    do {
        crypto.getRandomValues(array);
    } while (array[0] >= limit);
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

    if (containUppercase) characters += uppercase;
    if (containLowercase) characters += lowercase;
    if (containNumber) characters += numbers;
    if (containSymbols) characters += symbols;
    if (characters.length === 0 || passwordLength <= 0) {
        return invalidPasswordMessage;
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