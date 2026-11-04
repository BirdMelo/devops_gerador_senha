const { buildDom } = require("./domHelper");

function loadVaultModule() {
    buildDom();
    jest.resetModules();
    global.fetch = jest.fn();
    global.alert = jest.fn();
    global.confirm = jest.fn();
    return require("../src/app/vault.js");
}

function response(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    };
}

function waitForHandlers() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Cofre de senhas", () => {
    test("carrega e renderiza as senhas retornadas pela API", async () => {
        const { loadVault } = loadVaultModule();
        global.fetch.mockResolvedValue(response([
            { id: "1", servico: "GitHub", descricao: "Trabalho", senha: "segredo" },
        ]));

        await loadVault();

        expect(document.querySelector(".password_item h3").textContent).toBe("GitHub");
        expect(document.querySelector(".password_item p").textContent).toBe("Trabalho");
        expect(document.getElementById("empty_vault").hidden).toBe(true);
    });

    test("pesquisa enquanto digita e envia o termo codificado", async () => {
        loadVaultModule();
        global.fetch
            .mockResolvedValueOnce(response([]))
            .mockResolvedValueOnce(response([]));
        const search = document.getElementById("search_password");

        search.value = "redes sociais";
        search.dispatchEvent(new Event("input"));
        await waitForHandlers();

        expect(global.fetch).toHaveBeenLastCalledWith(
            "/api/senhas?busca=redes%20sociais",
            expect.any(Object),
        );
        expect(document.getElementById("empty_vault").textContent).toBe(
            "Nenhuma senha encontrada.",
        );
    });

    test("adiciona uma senha e recarrega o cofre", async () => {
        loadVaultModule();
        global.fetch
            .mockResolvedValueOnce(response({}))
            .mockResolvedValueOnce(response([
                { id: "1", servico: "GitHub", descricao: "", senha: "nova-senha" },
            ]));

        document.getElementById("btn_add_password").click();
        document.getElementById("entry_service").value = "GitHub";
        document.getElementById("entry_password").value = "nova-senha";
        document.getElementById("entry_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();
        await waitForHandlers();

        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            "/api/senhas",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    servico: "GitHub",
                    descricao: "",
                    senha: "nova-senha",
                }),
            }),
        );
        expect(document.querySelector(".password_item h3").textContent).toBe("GitHub");
        expect(document.getElementById("vault_screen").hidden).toBe(false);
    });

    test("edita uma senha existente", async () => {
        const { loadVault } = loadVaultModule();
        global.fetch
            .mockResolvedValueOnce(response([
                { id: "42", servico: "GitHub", descricao: "Antiga", senha: "senha-antiga" },
            ]))
            .mockResolvedValueOnce(response({}))
            .mockResolvedValueOnce(response([]));

        await loadVault();
        document.querySelector(".password_item button:nth-of-type(3)").click();
        expect(document.getElementById("entry_title").textContent).toBe("Editar senha");
        expect(document.getElementById("entry_service").value).toBe("GitHub");

        document.getElementById("entry_service").value = "GitLab";
        document.getElementById("entry_password").value = "senha-nova";
        document.getElementById("entry_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();
        await waitForHandlers();

        expect(global.fetch).toHaveBeenNthCalledWith(
            2,
            "/api/senhas/42",
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify({
                    servico: "GitLab",
                    descricao: "Antiga",
                    senha: "senha-nova",
                }),
            }),
        );
    });

    test("exclui uma senha confirmada e recarrega a lista", async () => {
        const { loadVault } = loadVaultModule();
        global.confirm.mockReturnValue(true);
        global.fetch
            .mockResolvedValueOnce(response([
                { id: "7", servico: "E-mail", descricao: "", senha: "senha" },
            ]))
            .mockResolvedValueOnce(response(null, 204))
            .mockResolvedValueOnce(response([]));

        await loadVault();
        document.querySelector(".password_item button:nth-of-type(4)").click();
        await waitForHandlers();
        await waitForHandlers();

        expect(global.confirm).toHaveBeenCalledWith('Excluir a senha de "E-mail"?');
        expect(global.fetch).toHaveBeenNthCalledWith(
            2,
            "/api/senhas/7",
            expect.objectContaining({ method: "DELETE" }),
        );
        expect(document.querySelector(".password_item")).toBeNull();
    });

    test("não exclui quando a confirmação é cancelada", async () => {
        const { loadVault } = loadVaultModule();
        global.confirm.mockReturnValue(false);
        global.fetch.mockResolvedValue(response([
            { id: "7", servico: "E-mail", descricao: "", senha: "senha" },
        ]));

        await loadVault();
        document.querySelector(".password_item button:nth-of-type(4)").click();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(document.querySelector(".password_item")).not.toBeNull();
    });

    test("mostra erro da API ao salvar uma senha", async () => {
        loadVaultModule();
        global.fetch.mockResolvedValue(response({ erro: "Serviço inválido." }, 400));

        document.getElementById("btn_add_password").click();
        document.getElementById("entry_service").value = "GitHub";
        document.getElementById("entry_password").value = "senha";
        document.getElementById("entry_form").dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
        );
        await waitForHandlers();

        expect(document.getElementById("entry_error").textContent).toBe("Serviço inválido.");
        expect(document.getElementById("entry_error").hidden).toBe(false);
    });

    test("usa a senha gerada no formulário de entrada", () => {
        loadVaultModule();

        document.getElementById("btn_entry_generate").click();
        document.querySelector(".password_return").textContent = "senha-gerada";
        document.getElementById("btn_use_password").click();

        expect(document.getElementById("entry_password").value).toBe("senha-gerada");
        expect(document.getElementById("entry_screen").hidden).toBe(false);
    });

    test("retorna ao login quando a sessão expira", async () => {
        const { loadVault } = loadVaultModule();
        global.fetch.mockResolvedValue(response({ erro: "Sessão inválida." }, 401));

        await expect(loadVault()).rejects.toMatchObject({ status: 401 });
        const { handleError } = require("../src/app/vault.js");
        handleError(Object.assign(new Error("Sessão inválida."), { status: 401 }));

        expect(document.getElementById("login_screen").hidden).toBe(false);
        expect(document.getElementById("password_list").querySelector(".password_item")).toBeNull();
        expect(global.alert).toHaveBeenCalledWith("Sua sessão expirou. Entre novamente.");
    });
});
