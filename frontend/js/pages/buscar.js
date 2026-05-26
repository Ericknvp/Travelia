renderSidebar("buscar.html");
renderTopbar("Buscar");

let currentFilter = "hoteles";
let searchTimeout = null;

// estructura inicial de la página: buscador y filtros
document.getElementById("pageContent").innerHTML = `
<div class="page-inner">
    <div class="search-hero">
        <h2>Descubre Colombia y el mundo</h2>
        <p>Busca hoteles, restaurantes, destinos turísticos y viajeros</p>
        <div class="search-big">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="searchInput" placeholder="Ej: Bogotá, Cartagena, playa...">
        </div>
    </div>
    <div class="filter-pills">
        <div class="filter-pill active" data-filter="hoteles">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
            Hoteles
        </div>
        <div class="filter-pill" data-filter="restaurantes">
            <svg viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            Restaurantes
        </div>
        <div class="filter-pill" data-filter="publicaciones">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Publicaciones
        </div>
        <div class="filter-pill" data-filter="usuarios">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Usuarios
        </div>
    </div>
    <div id="searchResults"><p class="loading">Cargando...</p></div>
</div>`;

// saca las iniciales de un nombre
function getInitials(nombre) {
    if (!nombre) return "?";
    return nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const colors = ["av-purple","av-teal","av-coral","av-pink","av-green","av-indigo"];

// realiza la búsqueda según el filtro activo (hoteles, restaurantes, publicaciones o usuarios)
async function performSearch(q = "") {
    const container = document.getElementById("searchResults");
    if (!container) return;
    container.innerHTML = `<p class="loading">Buscando...</p>`;

    if (currentFilter === "hoteles" || currentFilter === "restaurantes") {
        const tipo = currentFilter === "hoteles" ? "hotel" : "restaurante";
        let res = await api.get(`/negocios/?tipo=${tipo}`);
        if (!res || res.error) { container.innerHTML = `<p class="loading">Error al buscar.</p>`; return; }
        if (q) res = res.filter(n => n.nombre.toLowerCase().includes(q.toLowerCase()) || (n.ciudad || "").toLowerCase().includes(q.toLowerCase()));
        if (res.length === 0) { container.innerHTML = `<p class="loading">No se encontraron resultados.</p>`; return; }

        const colorClass = currentFilter === "hoteles" ? "card-purple" : "card-coral";
        container.innerHTML = `<div class="three-col">${res.map(n => `
        <div class="hotel-card">
            <div class="hotel-img">
                ${n.url_foto_portada ? `<img src="${resolveImg(n.url_foto_portada)}" alt="${n.nombre}" loading="lazy">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--primary),var(--accent));"></div>`}
                <div class="hotel-img-overlay"></div>
                ${n.precio_promedio ? `<div class="hotel-price-badge">$${n.precio_promedio}</div>` : ""}
            </div>
            <div class="hotel-body">
                <div class="hotel-name">${n.nombre}</div>
                <div class="hotel-loc"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${n.ciudad || "Colombia"}</div>
                <div class="hotel-footer">
                    <div class="stars">${"★".repeat(Math.round(n.calificacion_promedio || 4))}</div>
                    <a href="negocio.html?id=${n.id_negocio}" class="btn-primary" style="text-decoration:none;">Ver</a>
                </div>
            </div>
        </div>`).join("")}</div>`;

    } else if (currentFilter === "publicaciones") {
        const params = q ? `?q=${encodeURIComponent(q)}` : "";
        const res = await api.get(`/publicaciones/buscar${params}`);
        if (!res || res.error) { container.innerHTML = `<p class="loading">Error al buscar.</p>`; return; }
        if (res.length === 0) { container.innerHTML = `<p class="loading">No se encontraron publicaciones${q ? ` para "${q}"` : ""}.</p>`; return; }

        const badgeMap = { tour:"badge-tour", hospedaje:"badge-hospedaje", restaurante:"badge-restaurante", actividad:"badge-actividad", sitio:"badge-sitio" };
        const colorList = ["av-purple","av-teal","av-coral","av-pink","av-green","av-indigo"];
        container.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;">${res.map(p => {
            const badge = badgeMap[p.categoria] || "badge-tour";
            const avatarInner = p.foto_autor
                ? `<img src="${resolveImg(p.foto_autor)}" alt="${p.autor}" style="width:100%;height:100%;object-fit:cover;">`
                : getInitials(p.autor);
            const color = colorList[p.id_usuario % colorList.length];
            return `
            <div class="glass-card" style="cursor:pointer;display:flex;gap:14px;align-items:flex-start;" onclick="window.location.href='usuario.html?id=${p.id_usuario}'">
                ${p.url_imagen ? `<img src="${resolveImg(p.url_imagen)}" style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0;">` : ""}
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <div class="avatar ${color}" style="width:28px;height:28px;font-size:10px;flex-shrink:0;">${avatarInner}</div>
                        <span style="font-size:12px;color:var(--text-muted);">${p.autor}</span>
                        <span class="post-badge ${badge}" style="margin-left:auto;">${p.categoria}</span>
                    </div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${p.titulo || ""}</div>
                    <div style="font-size:13px;color:var(--text-secondary);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${p.contenido || ""}</div>
                    ${p.ciudad ? `<div style="font-size:11px;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${p.ciudad}${p.pais ? ", " + p.pais : ""}</div>` : ""}
                </div>
            </div>`;
        }).join("")}</div>`;

    } else if (currentFilter === "usuarios") {
        const res = await api.get(`/usuarios/buscar${q ? "?q=" + encodeURIComponent(q) : ""}`);
        if (!res || res.error) { container.innerHTML = `<p class="loading">Error al buscar.</p>`; return; }
        if (res.length === 0) { container.innerHTML = `<p class="loading">No se encontraron usuarios.</p>`; return; }

        container.innerHTML = `<div class="three-col">${res.map(u => {
            const initials = getInitials(u.nombre);
            const colorClass = colors[u.id_usuario % colors.length];
            const av = u.url_foto_perfil
                ? `<img src="${resolveImg(u.url_foto_perfil)}" alt="${u.nombre}" style="width:100%;height:100%;object-fit:cover;">`
                : initials;
            return `
            <div class="friend-card">
                <div class="friend-card-banner" style="background:linear-gradient(135deg,var(--primary),var(--accent));"></div>
                <div class="friend-card-body">
                    <div class="friend-card-avatar ${colorClass}">${av}</div>
                    <div class="friend-card-name">${u.nombre}</div>
                    <div class="friend-card-handle">${u.username ? "@" + u.username : ""}</div>
                    <div class="friend-card-common">${u.ciudad || "Viajero"}</div>
                    ${isLoggedIn() ? `<button class="btn-follow" style="width:100%;text-align:center;" onclick="enviarSolicitudBuscar(${u.id_usuario}, this)">
                        <svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5;vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Agregar
                    </button>` : `<a href="login.html" class="btn-follow" style="width:100%;text-align:center;display:block;">Iniciar sesión</a>`}
                </div>
            </div>`;
        }).join("")}</div>`;
    }
}

// envía solicitud de amistad desde la búsqueda
async function enviarSolicitudBuscar(id_receptor, btn) {
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

// cambia el filtro activo y lanza la búsqueda
document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentFilter = pill.dataset.filter;
        performSearch(document.getElementById("searchInput")?.value.trim() || "");
    });
});

// búsqueda con debounce al escribir
document.getElementById("searchInput")?.addEventListener("input", e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value.trim()), 400);
});

performSearch();
