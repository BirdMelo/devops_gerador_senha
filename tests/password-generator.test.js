const { loadPasswordGenerator } = require("./domHelper");

describe("getRandomCharacter", () => {
    let pg;

    beforeEach(() => {
        pg = loadPasswordGenerator();
    });

    test("retorna um caractere pertencente à string fornecida", () => {
        const chars = "abc";
        expect(chars).toContain(pg.getRandomCharacter(chars));
    });

    test("usa crypto.getRandomValues para escolher o caractere", () => {
        const spy = jest.spyOn(crypto, "getRandomValues");
        pg.getRandomCharacter("abcdef");
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    test("índice fora do range também é tratado (módulo do length)", () => {
        jest.spyOn(crypto, "getRandomValues").mockImplementation((arr) => {
            arr[0] = 9999;
            return arr;
        });

        const chars = "abcde"; // length 5, 9999 % 5 === 4 -> "e"
        expect(pg.getRandomCharacter(chars)).toBe("e");

        crypto.getRandomValues.mockRestore();
    });
});

describe("generatePassword (personalizada)", () => {
    let pg;

    beforeEach(() => {
        pg = loadPasswordGenerator();
    });

    function setOptions({ length, upper, lower, numeric, special }) {
        document.getElementById("password_length").value = length;
        document.getElementById("password_uppercase").checked = !!upper;
        document.getElementById("password_lowercase").checked = !!lower;
        document.getElementById("password_numeric").checked = !!numeric;
        document.getElementById("password_special").checked = !!special;
    }

    test("gera senha com o comprimento solicitado", () => {
        setOptions({ length: 16, upper: true, lower: true });
        expect(pg.generatePassword()).toHaveLength(16);
    });

    test("usa somente letras maiúsculas quando é a única opção marcada", () => {
        setOptions({ length: 20, upper: true });
        expect(pg.generatePassword()).toMatch(/^[A-Z]+$/);
    });

    test("usa somente números quando é a única opção marcada", () => {
        setOptions({ length: 20, numeric: true });
        expect(pg.generatePassword()).toMatch(/^[0-9]+$/);
    });

    test("combina todos os conjuntos quando todas as opções estão marcadas", () => {
        setOptions({ length: 200, upper: true, lower: true, numeric: true, special: true });
        const { uppercase, lowercase, numbers, symbols } = require("../src/app/constants.js");
        const allowed = uppercase + lowercase + numbers + symbols;
        const password = pg.generatePassword();
        [...password].forEach((char) => {
            expect(allowed).toContain(char);
        });
    });

    test("retorna mensagem de aviso quando nenhuma opção de caractere é marcada", () => {
        setOptions({ length: 10 });
        expect(pg.generatePassword()).toBe("Escolha ao menos um tipo de caractere.");
    });

    test("retorna mensagem de aviso quando o comprimento é zero", () => {
        setOptions({ length: 0, upper: true });
        expect(pg.generatePassword()).toBe("Escolha ao menos um tipo de caractere.");
    });

    test("retorna mensagem de aviso quando o comprimento é negativo", () => {
        setOptions({ length: -5, upper: true });
        expect(pg.generatePassword()).toBe("Escolha ao menos um tipo de caractere.");
    });
});

describe("generateQuickPassword (não personalizada)", () => {
    let pg;

    beforeEach(() => {
        pg = loadPasswordGenerator();
    });

    test("sempre gera senha com 15 caracteres", () => {
        expect(pg.generateQuickPassword()).toHaveLength(15);
    });

    test("gera senhas diferentes em chamadas sucessivas (probabilístico)", () => {
        const passwords = new Set();
        for (let i = 0; i < 10; i++) {
            passwords.add(pg.generateQuickPassword());
        }
        expect(passwords.size).toBeGreaterThan(1);
    });
});