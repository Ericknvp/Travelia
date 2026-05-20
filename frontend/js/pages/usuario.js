renderSidebar("");
renderTopbar("Perfil de usuario");

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

function getInitials(nombre) {
    if (!nombre) return "?";
    return nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

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

const colors = ["av-purple","av-teal","av-coral","av-pink","av-green","av-indigo"];
const badgeMap = { tour: "badge-tour", hospedaje: "badge-hospedaje", restaurante: "badge-restaurante", actividad: "badge-actividad" };

async function cargarUsuario() {
    const content = document.getElementById("pageContent");
    if (!userId) {
        content.innerHTML = `<p class="loading">Usuario no especificado.</p>`;
        return;
    }

    const [u, pubs] = await Promise.all([
        api.get(`/usuarios/${userId}`),
        api.get(`/publicaciones/?usuario_id=${userId}`)
    ]);

    if (!u || u.error) {
        content.innerHTML = `<p class="loading">Usuario no encontrado.</p>`;
        return;
    }

    const initials    = getInitials(u.nombre);
    const colorClass  = colors[u.id_usuario % colors.length];
    const avatarInner = u.url_foto_perfil ? `<img src="${u.url_foto_perfil}" alt="${u.nombre}">` : initials;
    const handle      = u.username ? `@${u.username}` : "";

    const myUser = getUser();
    const isMe   = myUser && myUser.id === u.id_usuario;

    content.innerHTML = `
    <div class="profile-hero" style="margin:0 28px 0;">
        <div class="profile-hero-pattern"></div>
        ${u.ciudad ? `<div class="profile-hero-location"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${u.ciudad}${u.pais ? ", " + u.pais : ""}</div>` : ""}
    </div>
    <div style="padding:0 28px 28px;">
        <div class="glass-card-strong" style="padding:0 24px 20px;border-radius:var(--radius-lg);">
            <div class="profile-header">
                <div class="profile-avatar ${colorClass}">${avatarInner}</div>
                <div class="profile-name-block">
                    <div class="profile-name">${u.nombre}</div>
                    ${handle ? `<div class="profile-handle">${handle}</div>` : ""}
                </div>
                <div class="profile-actions" id="profileActions">
                    ${isMe
                        ? `<a href="perfil.html" class="btn-outline">Mi perfil</a>`
                        : isLoggedIn()
                            ? `<button class="btn-primary" id="btnAgregar" onclick="enviarSolicitud(${u.id_usuario}, this)">
                                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Agregar amigo
                              </button>`
                            : `<a href="login.html" class="btn-primary">Iniciar sesión</a>`
                    }
                </div>
            </div>
        </div>

        <div class="profile-body" style="margin-top:24px;">
            <div>
                <div class="glass-card profile-info-card">
                    ${u.bio ? `<p class="bio-text">${u.bio}</p>` : ""}
                    <div class="info-section">
                        <div class="info-section-title">Información</div>
                        ${u.ciudad ? `<div class="info-row"><span class="info-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span><span>Ciudad</span><span class="info-value" style="margin-left:auto;">${u.ciudad}</span></div>` : ""}
                        <div class="info-row">
                            <span class="info-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                            <span>Rol</span>
                            <span style="margin-left:auto;background:rgba(108,99,255,0.2);color:#A78BFA;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500;">${u.rol || "usuario"}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div id="pubsContainer">
                ${!pubs || pubs.error || pubs.length === 0
                    ? `<p class="loading">Este usuario no tiene publicaciones.</p>`
                    : `<div class="section-nav"><div class="section-tab active">Publicaciones (${pubs.length})</div></div>
                       <div style="display:flex;flex-direction:column;gap:14px;">
                         ${pubs.map(p => `
                         <div class="glass-card post" style="padding:16px;">
                             <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                                 ${p.categoria ? `<span class="post-badge ${badgeMap[p.categoria?.toLowerCase()] || "badge-tour"}">${p.categoria}</span>` : ""}
                                 <span style="font-size:12px;color:var(--text-muted);margin-left:auto;">${timeAgo(p.fecha_creacion)}</span>
                             </div>
                             ${p.titulo ? `<div style="font-size:15px;font-weight:600;margin-bottom:6px;">${p.titulo}</div>` : ""}
                             ${p.url_imagen ? `<img src="${p.url_imagen}" style="width:100%;max-height:220px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:8px;">` : ""}
                             <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${p.contenido}</div>
                             <div style="display:flex;gap:12px;margin-top:10px;font-size:12px;color:var(--text-muted);">
                                 <span style="display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>${p.likes || 0}</span>
                                 <span style="display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${p.comentarios || 0}</span>
                             </div>
                         </div>`).join("")}
                       </div>`
                }
            </div>
        </div>
    </div>`;
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
        btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar amigo`;
        showToast(res?.error || "Error al enviar solicitud.", "error");
    }
}

cargarUsuario();
