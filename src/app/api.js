let token = null;

export function setToken(newToken) {
    token = newToken;
}

export async function api(path, { method = "GET", body } = {}) {
    const response = await fetch(`/api${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body && JSON.stringify(body),
    });

    const data = response.status === 204 ? null : await response.json();

    if (!response.ok) {
        const error = new Error(data?.erro || "Erro inesperado.");
        error.status = response.status;
        throw error;
    }

    return data;
}