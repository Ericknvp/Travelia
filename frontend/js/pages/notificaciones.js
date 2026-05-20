requireAuth();
renderSidebar("notificaciones.html");
renderTopbar("Notificaciones");

function timeAgo(fecha) {
    const diff = Date.now() - new Date(fecha).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Ahora";
    if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h}h`;
    const d = Math.floor(h / 24);
    return `Hace ${d} día${d > 1 ? "s" : ""}`;
}

function getInitials(nombre) {
    if (!nombre) return "?";
    return nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function iconForTipo(tipo) {
    if (tipo === "like") return `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    if (tipo === "comentario") return `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    if (tipo === "amistad") return `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    return `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
}

function colorForTipo(tipo) {
    const map = { like: "ni-pink", comentario: "ni-purple", amistad: "ni-teal" };
    return map[tipo] || "ni-coral";
}

function textoNotif(n) {
    if (n.tipo === "like") return `<strong>${n.nombre_origen}</strong> le dio me gusta a tu publicación`;
    if (n.tipo === "comentario") return `<strong>${n.nombre_origen}</strong> comentó en tu publicación${n.texto_preview ? `: "${n.texto_preview}"` : ""}`;
    if (n.tipo === "amistad") return `<strong>${n.nombre_origen}</strong> te envió una solicitud de amistad`;
    return `Nueva notificación de <strong>${n.nombre_origen}</strong>`;
}

async function cargarNotificaciones() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/notificaciones/");

    if (!res || res.error) {
        content.innerHTML = `<div class="page-inner"><p class="loading">Error al cargar notificaciones.</p></div>`;
        return;
    }

    const sinLeer = res.filter(n => !n.leida).length;

    content.innerHTML = `
    <div class="page-tabs">
        <div class="page-tab active">Todas (${res.length})</div>
        ${sinLeer > 0 ? `<div class="page-tab" id="tabSinLeer">Sin leer (${sinLeer})</div>` : ""}
    </div>
    <div class="page-inner">
        <div class="two-col">
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                    <div style="font-size:15px;font-weight:600;">Notificaciones</div>
                    ${sinLeer > 0 ? `<button class="sec-link" id="btnMarcarLeidas">Marcar todas como leídas</button>` : ""}
                </div>
                <div class="glass-card" style="padding:0 20px;" id="notifList">
                    ${res.length === 0 ? `<p class="loading" style="padding:32px 0;">No tienes notificaciones aún.</p>` : res.map(n => {
                        const initials = getInitials(n.nombre_origen);
                        const avatar = n.foto_origen
                            ? `<img src="${n.foto_origen}" alt="${n.nombre_origen}" style="width:100%;height:100%;object-fit:cover;">`
                            : initials;
                        return `
                        <div class="notif-item ${!n.leida ? "unread" : ""}">
                            <div class="notif-icon-wrap ${colorForTipo(n.tipo)}" style="position:relative;">
                                <div class="avatar" style="width:42px;height:42px;font-size:15px;">${avatar}</div>
                                <div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:var(--bg-mid);display:flex;align-items:center;justify-content:center;">
                                    <div class="${colorForTipo(n.tipo)}" style="width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${iconForTipo(n.tipo)}</svg>
                                    </div>
                                </div>
                            </div>
                            <div class="notif-body">
                                <div class="notif-text">${textoNotif(n)}</div>
                                <div class="notif-time">${timeAgo(n.fecha)}</div>
                            </div>
                            ${!n.leida ? `<div class="unread-dot"></div>` : ""}
                        </div>`;
                    }).join("")}
                </div>
            </div>
            <div class="right-sidebar">
                <div class="glass-card">
                    <div class="widget-title">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        Configurar alertas
                    </div>
                    <div class="toggle-wrap"><div class="toggle-label">Likes</div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
                    <div class="toggle-wrap"><div class="toggle-label">Comentarios</div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
                    <div class="toggle-wrap"><div class="toggle-label">Solicitudes de amistad</div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById("btnMarcarLeidas")?.addEventListener("click", async () => {
        await api.put("/notificaciones/marcar-leidas");
        const dot = document.getElementById("navNotifDot");
        if (dot) dot.style.display = "none";
        cargarNotificaciones();
    });
}

cargarNotificaciones();
