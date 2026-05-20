renderSidebar("restaurantes.html");
renderTopbar("Restaurantes");

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
    const cards = res.map(r => `
    <div class="rest-card">
        <div class="rest-img">
            ${r.url_foto_portada ? `<img src="${r.url_foto_portada}" alt="${r.nombre}" loading="lazy">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--accent-warm),#F97316);"></div>`}
            <div class="rest-img-overlay"></div>
            <div class="rest-price-badge">${r.precio_promedio ? "$" + r.precio_promedio : "Ver precio"}</div>
            <div class="rest-save-btn"><svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>
        </div>
        <div class="rest-body">
            <div class="rest-name">${r.nombre}</div>
            <div class="rest-loc"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${r.ciudad || "Colombia"}</div>
            <div class="rest-footer">
                <div class="stars"><span class="star-fill">★</span><span class="star-fill">★</span><span class="star-fill">★</span><span class="star-fill">★</span><span class="star-empty">★</span></div>
                <button class="btn-primary" onclick="requireAuthOrModal(() => {})">Reservar</button>
            </div>
        </div>
    </div>`).join("");

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
