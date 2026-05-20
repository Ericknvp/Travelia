requireAuth();
renderSidebar("perfil.html");
renderTopbar("Mi Perfil");

let perfilData = null;

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

// ── Edit profile modal ────────────────────────────────────────────────────────

function openEditModal() {
    if (!perfilData) return;
    document.getElementById("editNombre").value   = perfilData.nombre || "";
    document.getElementById("editUsername").value = perfilData.username || "";
    document.getElementById("editBio").value      = perfilData.bio || "";
    document.getElementById("editCiudad").value   = perfilData.ciudad || "";
    document.getElementById("editPais").value     = perfilData.pais || "";
    document.getElementById("editFoto").value     = perfilData.url_foto_perfil || "";
    document.getElementById("editError").hidden   = true;
    document.getElementById("editProfileModal").classList.add("open");
}

function closeEditModal() {
    document.getElementById("editProfileModal").classList.remove("open");
}

document.getElementById("closeEditProfile")?.addEventListener("click", closeEditModal);
document.getElementById("editProfileModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("editProfileModal")) closeEditModal();
});

document.getElementById("editFotoFile")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById("editFotoImg").src = ev.target.result;
        document.getElementById("editFotoName").textContent = file.name;
        document.getElementById("editFotoPlaceholder").style.display = "none";
        document.getElementById("editFotoPreview").style.display = "block";
        document.getElementById("editFoto").value = "";
    };
    reader.readAsDataURL(file);
});

document.getElementById("btnGuardarPerfil")?.addEventListener("click", async () => {
    const nombre   = document.getElementById("editNombre").value.trim();
    const username = document.getElementById("editUsername").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const bio      = document.getElementById("editBio").value.trim();
    const ciudad   = document.getElementById("editCiudad").value.trim();
    const pais     = document.getElementById("editPais").value.trim();
    const errEl    = document.getElementById("editError");

    if (!nombre) { errEl.textContent = "El nombre es requerido."; errEl.hidden = false; return; }
    errEl.hidden = true;

    const btn = document.getElementById("btnGuardarPerfil");
    btn.disabled = true; btn.textContent = "Guardando...";

    let url_foto_perfil = document.getElementById("editFoto").value.trim();
    const fileInput = document.getElementById("editFotoFile");
    if (fileInput?.files[0]) {
        const fd = new FormData();
        fd.append("file", fileInput.files[0]);
        const up = await api.upload("/upload/", fd);
        if (up?.url) url_foto_perfil = up.url;
        else { errEl.textContent = "Error al subir foto."; errEl.hidden = false; btn.disabled = false; btn.textContent = "Guardar cambios"; return; }
    }

    const res = await api.put("/usuarios/me", { nombre, username, bio, ciudad, pais, url_foto_perfil });
    btn.disabled = false; btn.textContent = "Guardar cambios";

    if (res?.mensaje) {
        const user = getUser();
        saveSession(getToken(), { ...user, nombre, ciudad, foto: url_foto_perfil, username });
        closeEditModal();
        showToast("Perfil actualizado correctamente.");
        cargarPerfil();
    } else {
        errEl.textContent = res?.error || "Error al guardar.";
        errEl.hidden = false;
    }
});

// ── Edit publication modal ────────────────────────────────────────────────────

let editPubId = null;

function openEditPub(pub) {
    editPubId = pub.id_publicacion;
    document.getElementById("editPubTitulo").value   = pub.titulo || "";
    document.getElementById("editPubContenido").value = pub.contenido || "";
    document.getElementById("editPubCiudad").value   = pub.ciudad || "";
    document.getElementById("editPubError").hidden   = true;
    document.getElementById("editPubModal").classList.add("open");
}

function closeEditPub() {
    document.getElementById("editPubModal").classList.remove("open");
    editPubId = null;
}

document.getElementById("closeEditPub")?.addEventListener("click", closeEditPub);
document.getElementById("editPubModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("editPubModal")) closeEditPub();
});

document.getElementById("btnGuardarPub")?.addEventListener("click", async () => {
    if (!editPubId) return;
    const titulo    = document.getElementById("editPubTitulo").value.trim();
    const contenido = document.getElementById("editPubContenido").value.trim();
    const ciudad    = document.getElementById("editPubCiudad").value.trim();
    const errEl     = document.getElementById("editPubError");

    if (!contenido) { errEl.textContent = "El contenido es requerido."; errEl.hidden = false; return; }

    const btn = document.getElementById("btnGuardarPub");
    btn.disabled = true; btn.textContent = "Guardando...";
    const res = await api.put(`/publicaciones/${editPubId}`, { titulo, contenido, ciudad });
    btn.disabled = false; btn.textContent = "Guardar cambios";

    if (res?.mensaje) {
        closeEditPub();
        cargarMisPublicaciones();
    } else {
        errEl.textContent = res?.error || "Error al actualizar.";
        errEl.hidden = false;
    }
});

async function eliminarPublicacion(id) {
    if (!confirm("¿Eliminar esta publicación?")) return;
    const res = await api.delete(`/publicaciones/${id}`);
    if (res?.mensaje) { showToast("Publicación eliminada."); cargarMisPublicaciones(); }
    else showToast(res?.error || "Error al eliminar.", "error");
}

// ── Load profile ──────────────────────────────────────────────────────────────

async function cargarPerfil() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/auth/me");
    if (!res || res.error) {
        content.innerHTML = `<p class="loading">Error al cargar perfil.</p>`;
        return;
    }
    perfilData = res;
    const initials    = getInitials(res.nombre);
    const avatarInner = res.url_foto_perfil ? `<img src="${res.url_foto_perfil}" alt="${res.nombre}">` : initials;
    const handle      = res.username ? `@${res.username}` : `@${res.correo.split("@")[0]}`;

    content.innerHTML = `
    <div class="profile-hero" style="margin:0 28px 0;">
        <div class="profile-hero-pattern"></div>
        ${res.ciudad ? `<div class="profile-hero-location"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${res.ciudad}${res.pais ? ", " + res.pais : ""}</div>` : ""}
    </div>
    <div style="padding:0 28px 28px;">
        <div class="glass-card-strong" style="padding:0 24px 20px;border-radius:var(--radius-lg);">
            <div class="profile-header">
                <div class="profile-avatar">${avatarInner}</div>
                <div class="profile-name-block">
                    <div class="profile-name">${res.nombre}</div>
                    <div class="profile-handle">${handle}</div>
                </div>
                <div class="profile-actions">
                    <button class="btn-outline" id="btnEditarPerfil">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editar perfil
                    </button>
                    <button class="btn-outline" onclick="window.location.href='ajustes.html'">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        Ajustes
                    </button>
                </div>
            </div>
        </div>
        <div class="profile-body" style="margin-top:24px;">
            <div>
                <div class="glass-card profile-info-card">
                    ${res.bio ? `<p class="bio-text">${res.bio}</p>` : ""}
                    <div class="info-section">
                        <div class="info-section-title">Información</div>
                        <div class="info-row">
                            <span class="info-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                            <span>Correo</span><span class="info-value" style="margin-left:auto;">${res.correo}</span>
                        </div>
                        ${res.ciudad ? `<div class="info-row"><span class="info-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span><span>Ciudad</span><span class="info-value" style="margin-left:auto;">${res.ciudad}</span></div>` : ""}
                        <div class="info-row">
                            <span class="info-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                            <span>Rol</span>
                            <span style="margin-left:auto;background:rgba(108,99,255,0.2);color:#A78BFA;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500;">${res.rol || "usuario"}</span>
                        </div>
                    </div>
                    <button onclick="logout()" style="width:100%;margin-top:12px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:var(--danger);border-radius:var(--radius-sm);padding:9px;font-size:13px;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;" onmouseover="this.style.background='rgba(248,113,113,0.2)'" onmouseout="this.style.background='rgba(248,113,113,0.1)'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Cerrar sesión
                    </button>
                </div>
            </div>
            <div>
                <div id="misPublicaciones"><p class="loading">Cargando publicaciones...</p></div>
            </div>
        </div>
    </div>`;

    document.getElementById("btnEditarPerfil")?.addEventListener("click", openEditModal);
    cargarMisPublicaciones();
}

async function cargarMisPublicaciones() {
    const container = document.getElementById("misPublicaciones");
    if (!container) return;
    const user = getUser();
    const pubs = await api.get("/publicaciones/");
    if (!pubs || pubs.error) { container.innerHTML = `<p class="loading">Error al cargar.</p>`; return; }
    const mias = pubs.filter(p => p.id_usuario === (user?.id || user?.id_usuario));
    if (mias.length === 0) {
        container.innerHTML = `<p class="loading">No tienes publicaciones aún.</p>`;
        return;
    }
    const badgeMap = { tour: "badge-tour", hospedaje: "badge-hospedaje", restaurante: "badge-restaurante", actividad: "badge-actividad" };
    container.innerHTML = `
    <div class="section-nav"><div class="section-tab active">Mis publicaciones (${mias.length})</div></div>
    <div style="display:flex;flex-direction:column;gap:14px;">
        ${mias.map(p => `
        <div class="glass-card post" style="padding:16px;" data-pub-id="${p.id_publicacion}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                ${p.tipo || p.categoria ? `<span class="post-badge ${badgeMap[(p.tipo || p.categoria)?.toLowerCase()] || "badge-tour"}">${p.tipo || p.categoria}</span>` : ""}
                <span style="font-size:12px;color:var(--text-muted);margin-left:auto;">${timeAgo(p.fecha_creacion)}</span>
                <button onclick="openEditPub(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;border-radius:4px;display:flex;align-items:center;" title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onclick="eliminarPublicacion(${p.id_publicacion})" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:4px;border-radius:4px;display:flex;align-items:center;" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
            </div>
            ${p.titulo ? `<div style="font-size:15px;font-weight:600;margin-bottom:6px;">${p.titulo}</div>` : ""}
            ${p.url_imagen ? `<img src="${p.url_imagen}" style="width:100%;max-height:200px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:8px;">` : ""}
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${p.contenido}</div>
            <div style="display:flex;gap:12px;margin-top:10px;font-size:12px;color:var(--text-muted);">
                <span style="display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>${p.likes || 0}</span>
                <span style="display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${p.comentarios || 0}</span>
            </div>
        </div>`).join("")}
    </div>`;
}

cargarPerfil();
