
const loginScreen = document.getElementById("login_screen");
const registerScreen = document.getElementById("register_screen");
const vaultScreen = document.getElementById("vault_screen");
const generatorScreen = document.getElementById("generator_screen");

const appHeader = document.getElementById("app_header");
const generatorHeader = document.getElementById("generator_header");

function showScreen(screen) {
    loginScreen.hidden = true;
    registerScreen.hidden = true;
    vaultScreen.hidden = true;
    generatorScreen.hidden = true;

    appHeader.hidden = true;
    generatorHeader.hidden = true;

    screen.hidden = false;

    if (screen === generatorScreen) {
        generatorHeader.hidden = false;
    } else {
        appHeader.hidden = false;
    }
}

// Ir para cadastro
document.getElementById("show_register").addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(registerScreen);
});

// Voltar para login
document.getElementById("show_login").addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(loginScreen);
});

// Cadastro de usuário
document.getElementById("register_form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("register_name").value;
    const email = document.getElementById("register_email").value;
    const senhaMestra = document.getElementById("register_password").value;
    const confirmarSenha = document.getElementById("confirm_password").value;

    if (senhaMestra !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    try {
        const resposta = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                email,
                senhaMestra
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao cadastrar.");
        }

        alert("Conta criada com sucesso!");
        document.getElementById("register_form").reset();
        showScreen(loginScreen);

    } catch (erro) {
        alert(erro.message);
    }
});

// Login
document.getElementById("login_form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const senhaMestra = document.getElementById("master_password").value;

    try {
        const resposta = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                senhaMestra
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao fazer login.");
        }

        sessionStorage.setItem("token", dados.token);
        sessionStorage.setItem("nomeUsuario", dados.nome);

        showScreen(vaultScreen);

    } catch (erro) {
        alert(erro.message);
    }
});

// Logout
document.getElementById("btn_logout").addEventListener("click", async () => {
    const token = sessionStorage.getItem("token");

    try {
        if (token) {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        }
    } catch (erro) {
        console.error("Erro ao encerrar sessão:", erro);
    }

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("nomeUsuario");
    showScreen(loginScreen);
});

// Abrir gerador
document.getElementById("btn_open_generator").addEventListener("click", () => {
    showScreen(generatorScreen);
});

// Voltar do gerador para o cofre
const backButton = document.createElement("button");
backButton.type = "button";
backButton.id = "btn_back_vault";
backButton.textContent = "Voltar ao cofre";

backButton.addEventListener("click", () => {
    showScreen(vaultScreen);
});

generatorScreen.appendChild(backButton);
