import { api, setToken } from "./api.js";
import { invalidPasswordMessage } from "./constants.js";
import { showScreen, screens, openGenerator } from "./navigation.js";

const list = document.getElementById("password_list");
const emptyMessage = document.getElementById("empty_vault");
const searchInput = document.getElementById("search_password");

const entryTitle = document.getElementById("entry_title");
const entryForm = document.getElementById("entry_form");
const entryService = document.getElementById("entry_service");
const entryDescription = document.getElementById("entry_description");
const entryPassword = document.getElementById("entry_password");
const entryError = document.getElementById("entry_error");
const toggleEntryButton = document.getElementById("btn_toggle_entry_password");

let editingId = null; // null = adicionando; id = editando

function createButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}

function createItem(item) {
    const article = document.createElement("article");
    article.className = "password_item";

    const service = document.createElement("h3");
    service.textContent = item.servico;

    const description = document.createElement("p");
    description.textContent = item.descricao;

    const password = document.createElement("span");
    password.className = "password_value";
    password.textContent = "••••••••";

    let visible = false;
    const toggle = createButton("Mostrar", () => {
        visible = !visible;
        password.textContent = visible ? item.senha : "••••••••";
        toggle.textContent = visible ? "Ocultar" : "Mostrar";
    });
    const copy = createButton("Copiar", () => {
        navigator.clipboard.writeText(item.senha);
    });
    const edit = createButton("Editar", () => openEntryForm(item));
    const remove = createButton("Excluir", () => deleteItem(item));

    article.append(service, description, password, toggle, copy, edit, remove);
    return article;
}

function renderItems(items) {
    list.querySelectorAll(".password_item").forEach((el) => el.remove());

    const searching = searchInput.value.trim() !== "";
    emptyMessage.textContent = searching
        ? "Nenhuma senha encontrada."
        : "Você ainda não possui senhas cadastradas.";
    emptyMessage.hidden = items.length > 0;

    items.forEach((item) => list.appendChild(createItem(item)));
}

export async function loadVault() {
    const busca = encodeURIComponent(searchInput.value.trim());
    const items = await api(`/senhas?busca=${busca}`);
    renderItems(items);
}

// Limpa tudo que o usuário anterior via (usado no logout)
export function resetVault() {
    searchInput.value = "";
    renderItems([]);
}

// Sessão inválida (ex.: servidor reiniciou): volta para o login
function handleError(error) {
    if (error.status === 401) {
        setToken(null);
        resetVault();
        showScreen(screens.login);
        alert("Sua sessão expirou. Entre novamente.");
        return;
    }
    alert(error.message);
}

function openEntryForm(item = null) {
    editingId = item ? item.id : null;
    entryTitle.textContent = item ? "Editar senha" : "Nova senha";

    entryForm.reset();
    entryPassword.type = "password";
    toggleEntryButton.textContent = "Mostrar";
    entryError.hidden = true;

    if (item) {
        entryService.value = item.servico;
        entryDescription.value = item.descricao;
        entryPassword.value = item.senha;
    }

    showScreen(screens.entry);
}

async function deleteItem(item) {
    if (!confirm(`Excluir a senha de "${item.servico}"?`)) return;

    try {
        await api(`/senhas/${item.id}`, { method: "DELETE" });
        await loadVault();
    } catch (error) {
        handleError(error);
    }
}

// Pesquisar enquanto digita
searchInput.addEventListener("input", async () => {
    try {
        await loadVault();
    } catch (error) {
        handleError(error);
    }
});

// Abrir formulário para nova senha
document.getElementById("btn_add_password").addEventListener("click", () => {
    openEntryForm();
});

// Salvar (cria ou edita)
entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    entryError.hidden = true;

    const body = {
        servico: entryService.value.trim(),
        descricao: entryDescription.value.trim(),
        senha: entryPassword.value,
    };

    try {
        if (editingId) {
            await api(`/senhas/${editingId}`, { method: "PUT", body });
        } else {
            await api("/senhas", { method: "POST", body });
        }
        searchInput.value = "";
        await loadVault();
        showScreen(screens.vault);
    } catch (error) {
        if (error.status === 401) return handleError(error);
        entryError.textContent = error.message;
        entryError.hidden = false;
    }
});

document.getElementById("btn_entry_cancel").addEventListener("click", () => {
    showScreen(screens.vault);
});

toggleEntryButton.addEventListener("click", () => {
    const hidden = entryPassword.type === "password";
    entryPassword.type = hidden ? "text" : "password";
    toggleEntryButton.textContent = hidden ? "Ocultar" : "Mostrar";
});

// UC08: abrir o gerador a partir do formulário e trazer a senha de volta
document.getElementById("btn_entry_generate").addEventListener("click", () => {
    openGenerator(screens.entry);
});

document.getElementById("btn_use_password").addEventListener("click", () => {
    const generated = document.querySelector(".password_return").textContent;
    if (!generated || generated === invalidPasswordMessage) return;
    entryPassword.value = generated;
    showScreen(screens.entry);
});