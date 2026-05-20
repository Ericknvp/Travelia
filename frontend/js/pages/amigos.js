renderSidebar("amigos.html");
renderTopbar("Amigos");

function getInitials(nombre) {
    if (!nombre) return "?";
    return nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const colors = ["av-purple","av-teal","av-coral","av-pink","av-green","av-indigo"];

function avatar(u, size = "44px") {
    const initials = getInitials(u.nombre);
    const colorClass = colors[u.id_usuario % colors.length];
    return u.url_foto_perfil
        ? `<div class="avatar ${colorClass}" style="width:${size};height:${size};cursor:pointer;" onclick="window.location.href='usuario.html?id=${u.id_usuario}'"><img src="${u.url_foto_perfil}" alt="${u.nombre}"></div>`
        : `<div class="avatar ${colorClass}" style="width:${size};height:${size};cursor:pointer;" onclick="window.location.href='usuario.html?id=${u.id_usuario}'">${initials}</div>`;
}

let currentTab = "sugerencias";

async function cargarAmigos() {
    const content = document.getElementById("pageContent");

    if (!isLoggedIn()) {
        content.innerHTML = `
        <div class="page-inner" style="text-align:center;padding:80px 24px;">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 style="font-size:18px;font-weight:600;margin-bottom:8px;">Conecta con otros viajeros</h3>
            <p style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;">Inicia sesión para ver y agregar amigos.</p>
            <div style="display:flex;gap:10px;justify-content:center;">
                <a href="login.html" class="btn-primary">Iniciar sesión</a>
                <a href="register.html" class="btn-outline">Crear cuenta</a>
            </div>
        </div>`;
        return;
    }

    content.innerHTML = `
    <div class="page-tabs" id="amigosTabs">
        <div class="page-tab ${currentTab === "mis" ? "active" : ""}" data-tab="mis">Mis amigos</div>
        <div class="page-tab ${currentTab === "solicitudes" ? "active" : ""}" data-tab="solicitudes">Solicitudes</div>
        <div class="page-tab ${currentTab === "sugerencias" ? "active" : ""}" data-tab="sugerencias">Sugerencias</div>
    </div>
    <div class="page-inner" id="amigosContent">
        <p class="loading">Cargando...</p>
    </div>`;

    document.getElementById("amigosTabs")?.addEventListener("click", e => {
        const tab = e.target.closest("[data-tab]");
        if (!tab) return;
        document.querySelectorAll("#amigosTabs .page-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentTab = tab.dataset.tab;
        renderTab(currentTab);
    });

    renderTab(currentTab);
}

async function renderTab(tab) {
    const container = document.getElementById("amigosContent");
    if (!container) return;
    container.innerHTML = `<p class="loading">Cargando...</p>`;

    if (tab === "mis") {
        const res = await api.get("/amigos/");
        if (!res || res.error || res.length === 0) {
            container.innerHTML = `<p class="loading">No tienes amigos aún. ¡Explora las sugerencias!</p>`;
            return;
        }
        container.innerHTML = `<div class="glass-card" style="padding:0 20px;">
            ${res.map(u => `
            <div class="friend-list-row" id="friend-${u.id_amistad}">
                ${avatar(u)}
                <div class="frow-info" style="cursor:pointer;" onclick="window.location.href='usuario.html?id=${u.id_usuario}'">
                    <div class="frow-name">${u.nombre}</div>
                    <div class="frow-sub">${u.username ? "@" + u.username : (u.ciudad || "Viajero")}</div>
                </div>
                <button class="btn-danger-sm" onclick="eliminarAmistad(${u.id_amistad}, this)">Eliminar</button>
            </div>`).join("")}
        </div>`;
    }

    else if (tab === "solicitudes") {
        const res = await api.get("/amigos/solicitudes/pendientes");
        if (!res || res.error || res.length === 0) {
            container.innerHTML = `<p class="loading">No tienes solicitudes pendientes.</p>`;
            return;
        }
        container.innerHTML = `<div class="glass-card" style="padding:0 20px;">
            ${res.map(s => `
            <div class="friend-list-row" id="sol-${s.id_amistad}">
                ${avatar(s)}
                <div class="frow-info" style="cursor:pointer;" onclick="window.location.href='usuario.html?id=${s.id_usuario}'">
                    <div class="frow-name">${s.nombre}</div>
                    <div class="frow-sub">Quiere ser tu amigo</div>
                </div>
                <div class="frow-actions">
                    <button class="btn-success-sm" onclick="responderSolicitud(${s.id_amistad}, 'aceptada', this)">Aceptar</button>
                    <button class="btn-danger-sm" onclick="responderSolicitud(${s.id_amistad}, 'rechazada', this)">Rechazar</button>
                </div>
            </div>`).join("")}
        </div>`;
    }

    else if (tab === "sugerencias") {
        const res = await api.get("/usuarios/sugerencias");
        if (!res || res.error || res.length === 0) {
            container.innerHTML = `<p class="loading">No hay sugerencias disponibles.</p>`;
            return;
        }
        container.innerHTML = `<div class="three-col">
            ${res.map(u => {
                const initials = getInitials(u.nombre);
                const colorClass = colors[u.id_usuario % colors.length];
                const av = u.url_foto_perfil
                    ? `<img src="${u.url_foto_perfil}" alt="${u.nombre}" style="width:100%;height:100%;object-fit:cover;">`
                    : initials;
                return `
                <div class="friend-card" id="card-${u.id_usuario}">
                    <div class="friend-card-banner" style="background:linear-gradient(135deg,var(--primary),var(--accent));cursor:pointer;" onclick="window.location.href='usuario.html?id=${u.id_usuario}'"></div>
                    <div class="friend-card-body">
                        <div class="friend-card-avatar ${colorClass}" style="cursor:pointer;" onclick="window.location.href='usuario.html?id=${u.id_usuario}'">${av}</div>
                        <div class="friend-card-name" style="cursor:pointer;" onclick="window.location.href='usuario.html?id=${u.id_usuario}'">${u.nombre}</div>
                        <div class="friend-card-handle">${u.username ? "@" + u.username : ""}</div>
                        <div class="friend-card-common">${u.ciudad || "Viajero"}</div>
                        <button class="btn-follow" style="width:100%;text-align:center;" onclick="enviarSolicitud(${u.id_usuario}, this)">
                            <svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5;vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Agregar
                        </button>
                    </div>
                </div>`;
            }).join("")}
        </div>`;
    }
}

async function enviarSolicitud(id_receptor, btn) {
    btn.disabled = true;
    btn.textContent = "Enviando...";
    const res = await api.post("/amigos/solicitud", { id_receptor });
    if (res?.mensaje) {
        btn.textContent = "Solicitud enviada";
        btn.style.opacity = "0.6";
        showToast("Solicitud de amistad enviada.");
    } else {
        btn.disabled = false;
        btn.textContent = "Agregar";
        showToast(res?.error || "Error al enviar solicitud.", "error");
    }
}

async function responderSolicitud(id_amistad, estado, btn) {
    btn.disabled = true;
    const res = await api.put(`/amigos/solicitud/${id_amistad}`, { estado });
    if (res?.mensaje) {
        const row = document.getElementById(`sol-${id_amistad}`);
        if (row) row.remove();
        showToast(estado === "aceptada" ? "Solicitud aceptada." : "Solicitud rechazada.", estado === "aceptada" ? "success" : "info");
    } else {
        btn.disabled = false;
        showToast(res?.error || "Error al responder.", "error");
    }
}

async function eliminarAmistad(id_amistad, btn) {
    if (!confirm("¿Eliminar esta amistad?")) return;
    btn.disabled = true;
    const res = await api.delete(`/amigos/${id_amistad}`);
    if (res?.mensaje) {
        const row = document.getElementById(`friend-${id_amistad}`);
        if (row) row.remove();
        showToast("Amistad eliminada.");
    } else {
        btn.disabled = false;
        showToast(res?.error || "Error al eliminar.", "error");
    }
}

cargarAmigos();
