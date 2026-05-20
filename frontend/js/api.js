const API_URL = "http://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
    try {
        const token = localStorage.getItem("travelia_token");
        const headers = { "Content-Type": "application/json", ...options.headers };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("apiFetch error:", endpoint, e);
        return { error: "Error de red. Verifica tu conexión." };
    }
}

async function apiUpload(endpoint, formData) {
    try {
        const token = localStorage.getItem("travelia_token");
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", headers, body: formData });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { error: err.error || `Error ${res.status} al subir archivo` };
        }
        return await res.json();
    } catch (e) {
        console.error("apiUpload error:", endpoint, e);
        return { error: "No se pudo conectar con el servidor para subir el archivo." };
    }
}

const api = {
    get:    (url)           => apiFetch(url),
    post:   (url, body)     => apiFetch(url, { method: "POST",   body: JSON.stringify(body) }),
    put:    (url, body)     => apiFetch(url, { method: "PUT",    body: JSON.stringify(body) }),
    delete: (url)           => apiFetch(url, { method: "DELETE" }),
    upload: (url, formData) => apiUpload(url, formData),
};
