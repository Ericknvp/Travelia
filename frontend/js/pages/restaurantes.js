renderSidebar("restaurantes.html");
renderTopbar("Restaurantes");

// carga los restaurantes desde la API y los renderiza en tarjetas
async function cargarRestaurantes() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/negocios/?tipo=restaurante");
    if (!res || res.error || res.length === 0) {
        content.innerHTML = `
        <div class="page-tabs">
            <div class="page-tab active">Para ti</div>
            <div class="page-tab">Más valorados</div>
            <div class="page-tab">Por cocina</div>
        </div>
        <div class="page-inner"><p class="loading">No hay restaurantes registrados aún.</p></div>`;
        return;
    }
    const cards = res.map(r => {
        const rating = r.calificacion_promedio ? Number(r.calificacion_promedio).toFixed(1) : null;
        const starsHtml = Array.from({length: 5}, (_, i) =>
            `<span style="color:${i < Math.round(r.calificacion_promedio || 0) ? "#FBBF24" : "var(--text-muted)"};">★</span>`
        ).join("");
        return `
    <div class="rest-card" style="cursor:pointer;" onclick="window.location.href='negocio.html?id=${r.id_negocio}'">
        <div class="rest-img">
            ${r.url_foto_portada ? `<img src="${resolveImg(r.url_foto_portada)}" alt="${r.nombre}" loading="lazy">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--accent-warm),#F97316);"></div>`}
            <div class="rest-img-overlay"></div>
            ${rating ? `<div class="rest-price-badge">★ ${rating}</div>` : ""}
        </div>
        <div class="rest-body">
            <div class="rest-name">${r.nombre}</div>
            <div class="rest-loc"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${r.ciudad || "Colombia"}</div>
            <div class="rest-footer">
                <div class="stars">${starsHtml}</div>
                <button class="btn-primary" onclick="event.stopPropagation();window.location.href='negocio.html?id=${r.id_negocio}'">Ver perfil</button>
            </div>
        </div>
    </div>`;
    }).join("");

    content.innerHTML = `
    <div class="page-tabs">
        <div class="page-tab active">Para ti</div>
        <div class="page-tab">Más valorados</div>
        <div class="page-tab">Por cocina</div>
    </div>
    <div class="page-inner">
        <div class="three-col">${cards}</div>
    </div>`;
}

cargarRestaurantes();
