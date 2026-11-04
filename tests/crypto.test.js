describe("Criptografia do cofre", () => {
    beforeEach(() => {
        process.env.CHAVE_CRIPTOGRAFIA = "a".repeat(64);
        jest.resetModules();
    });

    test("criptografa e descriptografa o texto original", () => {
        const { criptografar, descriptografar } = require("../backend/crypto/cripto.js");
        const payload = criptografar("minha senha secreta");

        expect(descriptografar(payload)).toBe("minha senha secreta");
        expect(payload.split(":")).toHaveLength(3);
    });

    test("rejeita payload malformado", () => {
        const { descriptografar } = require("../backend/crypto/cripto.js");

        expect(() => descriptografar("invalido")).toThrow("Payload criptografado inválido.");
    });

    test("detecta chave diferente ao descriptografar", () => {
        const crypto = require("../backend/crypto/cripto.js");
        const payload = crypto.criptografar("texto");

        process.env.CHAVE_CRIPTOGRAFIA = "b".repeat(64);
        jest.resetModules();
        const { descriptografar } = require("../backend/crypto/cripto.js");

        expect(() => descriptografar(payload)).toThrow("Unsupported state or unable to authenticate data");
    });
});
