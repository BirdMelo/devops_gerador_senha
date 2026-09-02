const { uppercase, lowercase, numbers, symbols } = require("../src/app/constants.js");

describe("constants", () => {
    test("uppercase contém exatamente as 26 letras maiúsculas", () => {
        expect(uppercase).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    });

    test("lowercase contém exatamente as 26 letras minúsculas", () => {
        expect(lowercase).toBe("abcdefghijklmnopqrstuvwxyz");
    });

    test("numbers contém os dígitos de 0 a 9", () => {
        expect(numbers).toBe("0123456789");
    });

    test("symbols não está vazio e não tem caracteres repetidos", () => {
        expect(symbols.length).toBeGreaterThan(0);
        const uniqueChars = new Set(symbols.split(""));
        expect(uniqueChars.size).toBe(symbols.length);
    });
});