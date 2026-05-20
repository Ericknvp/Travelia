renderSidebar("minegocio.html");
renderTopbar("Perfil de negocio");

const params   = new URLSearchParams(window.location.search);
const negocioId = params.get("id");

let negocioData = null;

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

const badgeMap = { tour: "badge-tour", hospedaje: "badge-hospedaje", restaurante: "badge-restaurante", actividad: "badge-actividad" };

function stars(val) {
    const v = Math.round(val || 0);
    return Array.from({ length: 5 }, (_, i) =>
        `<span style="color:${i < v ? "#FBBF24" : "var(--text-muted)"};">★</span>`
    ).join("");
}

async function cargarNegocio() {
    const content = document.getElementById("pageContent");
    if (!negocioId) {
        content.innerHTML = `<p class="loading">Negocio no especificado.</p>`;
        return;
    }

    const [neg, pubs] = await Promise.all([
        api.get(`/negocios/${negocioId}`),
        api.get(`/publicaciones/?negocio_id=${negocioId}`)
    ]);

    if (!neg || neg.error) {
        content.innerHTML = `<p class="loading">Negocio no encontrado.</p>`;
        return;
    }

    negocioData = neg;
    const myUser = getUser();
    const isOwner = myUser && myUser.id === neg.id_usuario;

    const tipoLabel = neg.tipo === "hotel" ? "Hotel / Hospedaje" : neg.tipo === "restaurante" ? "Restaurante" : neg.tipo;

    content.innerHTML = `
    <div style="position:relative;height:200px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:0;overflow:hidden;margin:0;">
        ${neg.url_foto_portada ? `<img src="${neg.url_foto_portada}" alt="${neg.nombre}" style="width:100%;height:100%;object-fit:cover;opacity:0.7;">` : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);"></div>
    </div>
    <div style="padding:0 28px 28px;">
        <div class="glass-card-strong" style="padding:24px;border-radius:var(--radius-lg);margin-top:-40px;position:relative;z-index:2;">
            <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${neg.nombre}</div>
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">${tipoLabel}${neg.ciudad ? " · " + neg.ciudad : ""}${neg.pais ? ", " + neg.pais : ""}</div>
                    <div style="display:flex;align-items:center;gap:6px;font-size:13px;margin-bottom:8px;">
                        ${stars(neg.calificacion_promedio)}
                        <span style="color:var(--text-muted);">${neg.calificacion_promedio ? Number(neg.calificacion_promedio).toFixed(1) : "Sin calificaciones"}</span>
                    </div>
                    ${neg.descripcion ? `<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${neg.descripcion}</p>` : ""}
                    ${neg.direccion ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${neg.direccion}</div>` : ""}
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${isOwner ? `<button class="btn-primary" onclick="openNegPost()">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Publicar
                    </button>` : ""}
                    ${neg.tipo === "restaurante" ? `<a href="restaurantes.html" class="btn-outline">Ver en restaurantes</a>` : `<a href="hoteles.html" class="btn-outline">Ver en hoteles</a>`}
                </div>
            </div>
        </div>

        <div style="margin-top:24px;" id="negPubsSection">
            ${!pubs || pubs.error || pubs.length === 0
                ? `<p class="loading">No hay publicaciones de este negocio.</p>`
                : `<div style="margin-bottom:14px;font-size:15px;font-weight:600;">Publicaciones (${pubs.length})</div>
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
    </div>`;
}

// ── Publish as business modal ─────────────────────────────────────────────────

function openNegPost() {
    document.getElementById("negPostModal").classList.add("open");
}
function closeNegPost() {
    document.getElementById("negPostModal").classList.remove("open");
    document.getElementById("negPostTitulo").value = "";
    document.getElementById("negPostContenido").value = "";
    document.getElementById("negPostCiudad").value = "";
    document.getElementById("negPostFile").value = "";
    document.getElementById("negPostFilePlaceholder").style.display = "block";
    document.getElementById("negPostFilePreview").style.display = "none";
}

document.getElementById("closeNegPost")?.addEventListener("click", closeNegPost);
document.getElementById("negPostModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("negPostModal")) closeNegPost();
});

document.getElementById("negPostFile")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById("negPostPreviewImg").src = ev.target.result;
        document.getElementById("negPostFileName").textContent = file.name;
        document.getElementById("negPostFilePlaceholder").style.display = "none";
        document.getElementById("negPostFilePreview").style.display = "block";
    };
    reader.readAsDataURL(file);
});

document.getElementById("btnSubmitNegPost")?.addEventListener("click", async () => {
    const titulo    = document.getElementById("negPostTitulo").value.trim();
    const contenido = document.getElementById("negPostContenido").value.trim();
    const categoria = document.getElementById("negPostCategoria").value;
    const ciudad    = document.getElementById("negPostCiudad").value.trim() || negocioData?.ciudad || "";
    const fileInput = document.getElementById("negPostFile");
    const errEl     = document.getElementById("negPostError");

    if (!contenido) { errEl.textContent = "El contenido es requerido."; errEl.hidden = false; return; }
    errEl.hidden = true;

    const btn = document.getElementById("btnSubmitNegPost");
    btn.disabled = true; btn.textContent = "Publicando...";

    let url_imagen = null;
    if (fileInput.files[0]) {
        const fd = new FormData();
        fd.append("file", fileInput.files[0]);
        const up = await api.upload("/upload/", fd);
        if (up?.url) url_imagen = up.url;
        else {
            errEl.textContent = "Error al subir la imagen.";
            errEl.hidden = false;
            btn.disabled = false;
            btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Publicar`;
            return;
        }
    }

    const res = await api.post("/publicaciones/", {
        titulo, contenido, categoria, ciudad, url_imagen,
        id_negocio_etiquetado: parseInt(negocioId)
    });

    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Publicar`;

    if (res?.id_publicacion) {
        closeNegPost();
        showToast("Publicación del negocio creada.");
        cargarNegocio();
    } else {
        errEl.textContent = res?.error || "Error al publicar.";
        errEl.hidden = false;
    }
});

cargarNegocio();
