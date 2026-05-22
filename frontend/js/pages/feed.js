renderSidebar("index.html");
renderTopbar("Feed de viajes");

let currentCommentPost = null;

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

function badgeClass(tipo) {
    const map = { tour: "badge-tour", hospedaje: "badge-hospedaje", restaurante: "badge-restaurante", actividad: "badge-actividad" };
    return map[tipo?.toLowerCase()] || "badge-tour";
}

function renderPost(p) {
    const isNegocio = !!p.id_negocio_etiquetado && !!p.negocio_nombre;
    const colors = ["av-purple","av-teal","av-coral","av-pink","av-green","av-indigo"];
    const colorClass = colors[p.id_publicacion % colors.length];

    let avatarInner, authorName, authorSub, authorHref;
    if (isNegocio) {
        avatarInner = p.foto_negocio
            ? `<img src="${p.foto_negocio}" alt="${p.negocio_nombre}">`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
        authorName  = `<a href="negocio.html?id=${p.id_negocio_etiquetado}" style="color:inherit;text-decoration:none;font-weight:600;">${p.negocio_nombre}</a>`;
        authorSub   = `<span style="font-size:11px;background:rgba(108,99,255,0.2);color:#A78BFA;padding:1px 7px;border-radius:20px;font-weight:500;margin-right:6px;">Negocio</span>`;
    } else {
        avatarInner = p.foto_autor ? `<img src="${p.foto_autor}" alt="${p.autor}">` : getInitials(p.autor);
        authorName  = p.autor;
        authorSub   = "";
    }

    const tipoBadge = p.tipo || p.categoria;
    const badge = tipoBadge ? `<span class="post-badge ${badgeClass(tipoBadge)}">${tipoBadge}</span>` : "";
    const imagen = p.url_imagen ? `
        <div class="post-image">
            <img src="${p.url_imagen}" alt="imagen" loading="lazy">
            <div class="post-image-overlay"></div>
        </div>` : "";

    return `
    <div class="glass-card post" data-id="${p.id_publicacion}">
        <div class="post-header">
            <div class="avatar ${isNegocio ? "av-indigo" : colorClass}">${avatarInner}</div>
            <div class="post-author">
                <div class="post-author-name">${authorName}</div>
                <div class="post-meta">${authorSub}<span class="time-ago" data-fecha="${p.fecha_creacion}">${timeAgo(p.fecha_creacion)}</span>${p.ciudad ? " · " + p.ciudad : ""}</div>
            </div>
            ${badge}
        </div>
        ${p.titulo ? `<div style="font-size:15px;font-weight:600;margin-bottom:8px;">${p.titulo}</div>` : ""}
        <div class="post-body">${p.contenido}</div>
        ${imagen}
        <div class="post-actions">
            <div class="action-btn ${p.liked ? "liked" : ""}" data-action="like" data-id="${p.id_publicacion}">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="action-count">${p.likes || 0}</span>
            </div>
            <div class="action-btn" data-action="comment" data-id="${p.id_publicacion}">
                <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span class="action-count">${p.comentarios || 0}</span>
            </div>
            <div class="action-spacer"></div>
            <div class="action-btn" data-action="share">
                <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Compartir
            </div>
        </div>
    </div>`;
}

async function cargarFeed() {
    const lista = document.getElementById("postsList");
    lista.innerHTML = `<p class="loading">Cargando publicaciones...</p>`;
    const pubs = await api.get("/publicaciones/");
    if (!pubs || pubs.error) {
        lista.innerHTML = `<p class="loading">Error al cargar publicaciones.</p>`;
        return;
    }
    if (pubs.length === 0) {
        lista.innerHTML = `<p class="loading">No hay publicaciones aún. ¡Sé el primero!</p>`;
        return;
    }
    lista.innerHTML = pubs.map(renderPost).join("");
}

async function toggleLike(id, btn) {
    requireAuthOrModal(async () => {
        const res = await api.post(`/publicaciones/${id}/like`);
        if (res && !res.error) {
            btn.classList.toggle("liked");
            const count = btn.querySelector(".action-count");
            if (count) count.textContent = parseInt(count.textContent) + (btn.classList.contains("liked") ? 1 : -1);
        }
    });
}

// ── Comments ────────────────────────────────────────────────────────────────

function openComments(id) {
    currentCommentPost = id;
    const modal = document.getElementById("commentsModal");
    modal.classList.add("open");
    loadComments(id);

    const inputArea = document.getElementById("commentInputArea");
    const loginMsg  = document.getElementById("commentLoginMsg");
    if (isLoggedIn()) {
        inputArea.style.display = "flex";
        loginMsg.style.display  = "none";
    } else {
        inputArea.style.display = "none";
        loginMsg.style.display  = "block";
    }
}

function closeComments() {
    document.getElementById("commentsModal").classList.remove("open");
    document.getElementById("commentInput").value = "";
    currentCommentPost = null;
}

function renderComment(c, myUser) {
    const isOwn = myUser && c.id_usuario === myUser.id;
    const initials = getInitials(c.autor);
    const avatar = c.foto_autor
        ? `<img src="${c.foto_autor}" alt="${c.autor}" style="width:100%;height:100%;object-fit:cover;">`
        : initials;
    const actions = isOwn ? `
        <button data-edit-comment="${c._id}" style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;font-family:Inter,sans-serif;padding:0;">Editar</button>
        <button data-delete-comment="${c._id}" style="background:none;border:none;color:var(--danger);font-size:11px;cursor:pointer;font-family:Inter,sans-serif;padding:0;">Eliminar</button>` : "";
    return `
    <div style="display:flex;gap:10px;margin-bottom:14px;" data-comment-id="${c._id}">
        <div class="avatar av-purple" style="width:34px;height:34px;font-size:12px;flex-shrink:0;">${avatar}</div>
        <div style="flex:1;">
            <div style="font-size:13px;font-weight:500;">${c.autor}</div>
            <div class="comment-text" style="font-size:13px;color:var(--text-secondary);margin-top:2px;line-height:1.5;">${c.texto}</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;">
                <span style="font-size:11px;color:var(--text-muted);"><span class="time-ago" data-fecha="${c.fecha}">${timeAgo(c.fecha)}</span>${c.editado ? " · editado" : ""}</span>
                ${actions}
            </div>
        </div>
    </div>`;
}

async function loadComments(id) {
    const list = document.getElementById("commentsList");
    list.innerHTML = `<p class="loading" style="padding:20px 0;">Cargando comentarios...</p>`;
    const res = await api.get(`/publicaciones/${id}/comentarios`);
    if (!res || res.error) {
        list.innerHTML = `<p class="loading">Error al cargar comentarios.</p>`;
        return;
    }
    if (res.length === 0) {
        list.innerHTML = `<p class="loading" style="padding:20px 0;">Sin comentarios aún. ¡Sé el primero!</p>`;
        return;
    }
    const myUser = getUser();
    list.innerHTML = res.map(c => renderComment(c, myUser)).join("");
}

document.getElementById("closeCommentsModal")?.addEventListener("click", closeComments);
document.getElementById("commentsModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("commentsModal")) closeComments();
});

document.getElementById("commentsList")?.addEventListener("click", async e => {
    const deleteBtn = e.target.closest("[data-delete-comment]");
    const editBtn   = e.target.closest("[data-edit-comment]");
    const saveBtn   = e.target.closest("[data-save-comment]");
    const cancelBtn = e.target.closest("[data-cancel-comment]");

    if (deleteBtn) {
        const commentId = deleteBtn.dataset.deleteComment;
        if (!confirm("¿Eliminar este comentario?")) return;
        const res = await api.delete(`/publicaciones/${currentCommentPost}/comentarios/${commentId}`);
        if (res?.mensaje) {
            deleteBtn.closest("[data-comment-id]").remove();
            const countEl = document.querySelector(`.post[data-id="${currentCommentPost}"] [data-action="comment"] .action-count`);
            if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
        } else {
            showToast(res?.error || "Error al eliminar comentario.", "error");
        }
    }

    if (editBtn) {
        const commentId = editBtn.dataset.editComment;
        const container = editBtn.closest("[data-comment-id]");
        const textEl = container.querySelector(".comment-text");
        const currentText = textEl.textContent.trim();
        container.dataset.originalText = currentText;
        textEl.innerHTML = `<textarea class="form-input" style="resize:none;width:100%;font-size:13px;margin-top:4px;" rows="2">${currentText}</textarea>`;
        const actionsRow = editBtn.parentElement;
        editBtn.style.display = "none";
        actionsRow.insertAdjacentHTML("beforeend", `
            <button data-save-comment="${commentId}" style="background:none;border:none;color:var(--accent);font-size:11px;cursor:pointer;font-family:Inter,sans-serif;padding:0;">Guardar</button>
            <button data-cancel-comment="${commentId}" style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;font-family:Inter,sans-serif;padding:0;">Cancelar</button>
        `);
        container.querySelector("textarea").focus();
    }

    if (saveBtn) {
        const commentId = saveBtn.dataset.saveComment;
        const container = saveBtn.closest("[data-comment-id]");
        const texto = container.querySelector("textarea")?.value.trim();
        if (!texto) return;
        const res = await api.put(`/publicaciones/${currentCommentPost}/comentarios/${commentId}`, { texto });
        if (res?.mensaje) {
            loadComments(currentCommentPost);
        } else {
            showToast(res?.error || "Error al editar comentario.", "error");
        }
    }

    if (cancelBtn) {
        loadComments(currentCommentPost);
    }
});

document.getElementById("btnSendComment")?.addEventListener("click", async () => {
    const texto = document.getElementById("commentInput").value.trim();
    if (!texto || !currentCommentPost) return;
    const btn = document.getElementById("btnSendComment");
    btn.disabled = true; btn.textContent = "Enviando...";
    const res = await api.post(`/publicaciones/${currentCommentPost}/comentarios`, { texto });
    btn.disabled = false; btn.textContent = "Enviar";
    if (res?.mensaje) {
        document.getElementById("commentInput").value = "";
        loadComments(currentCommentPost);
        // update comment count in feed
        const countEl = document.querySelector(`.post[data-id="${currentCommentPost}"] [data-action="comment"] .action-count`);
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
    }
});

// ── Event delegation ─────────────────────────────────────────────────────────

document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;
    if (action === "like")    toggleLike(id, btn);
    if (action === "comment") openComments(id);
    if (action === "share") {
        if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
    }
});

// ── Create post ───────────────────────────────────────────────────────────────

function openCreatePost()  { document.getElementById("createPostModal")?.classList.add("open"); }
function closeCreatePost() { document.getElementById("createPostModal")?.classList.remove("open"); }

document.getElementById("btnPublicar")?.addEventListener("click", () => requireAuthOrModal(openCreatePost));
document.getElementById("openCreatePost")?.addEventListener("click", () => requireAuthOrModal(openCreatePost));
document.getElementById("btnFoto")?.addEventListener("click", () => requireAuthOrModal(openCreatePost));
document.getElementById("btnUbicacion")?.addEventListener("click", () => requireAuthOrModal(openCreatePost));
document.getElementById("closeCreatePost")?.addEventListener("click", closeCreatePost);
document.getElementById("createPostModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("createPostModal")) closeCreatePost();
});

// File preview
document.getElementById("postFile")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById("previewImg").src = ev.target.result;
        document.getElementById("fileName").textContent = file.name;
        document.getElementById("filePlaceholder").style.display = "none";
        document.getElementById("filePreview").style.display = "block";
        document.getElementById("removeFile").style.display = "inline-flex";
    };
    reader.readAsDataURL(file);
});

function clearFile(e) {
    e?.stopPropagation();
    document.getElementById("postFile").value = "";
    document.getElementById("filePlaceholder").style.display = "block";
    document.getElementById("filePreview").style.display = "none";
    document.getElementById("removeFile").style.display = "none";
}

document.getElementById("btnSubmitPost")?.addEventListener("click", async () => {
    const titulo     = document.getElementById("postTitulo").value.trim();
    const contenido  = document.getElementById("postContenido").value.trim();
    const categoria  = document.getElementById("postCategoria").value;
    const ciudad     = document.getElementById("postCiudad").value.trim();
    const fileInput  = document.getElementById("postFile");
    const errEl      = document.getElementById("postError");

    if (!contenido) { errEl.textContent = "El contenido es requerido."; errEl.hidden = false; return; }
    errEl.hidden = true;

    const btn = document.getElementById("btnSubmitPost");
    btn.disabled = true;
    btn.textContent = "Publicando...";

    let url_imagen = null;

    if (fileInput.files[0]) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        const uploadRes = await api.upload("/upload/", formData);
        if (uploadRes?.url) {
            url_imagen = uploadRes.url;
        } else {
            errEl.textContent = uploadRes?.error || "Error al subir la imagen.";
            errEl.hidden = false;
            btn.disabled = false;
            btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Publicar`;
            return;
        }
    }

    const res = await api.post("/publicaciones/", { titulo, contenido, categoria, ciudad, url_imagen });
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Publicar`;

    if (res?.id_publicacion) {
        closeCreatePost();
        document.getElementById("postTitulo").value = "";
        document.getElementById("postContenido").value = "";
        document.getElementById("postCiudad").value = "";
        clearFile();
        showToast("Publicación creada exitosamente.");
        cargarFeed();
    } else {
        errEl.textContent = res?.error || "Error al publicar.";
        errEl.hidden = false;
    }
});

// ── Avatar & sidebar user ────────────────────────────────────────────────────

const user = getUser();
if (user) {
    const avatar = document.getElementById("createAvatar");
    if (avatar) avatar.textContent = getInitials(user.nombre);
}

cargarFeed();

setInterval(() => {
    document.querySelectorAll(".time-ago[data-fecha]").forEach(el => {
        el.textContent = timeAgo(el.dataset.fecha);
    });
}, 60000);
