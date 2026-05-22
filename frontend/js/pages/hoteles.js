renderSidebar("hoteles.html");
renderTopbar("Hoteles");

async function cargarHoteles() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/negocios/?tipo=hotel");
    if (!res || res.error || res.length === 0) {
        content.innerHTML = `
        <div class="page-tabs">
            <div class="page-tab active">Para ti</div>
            <div class="page-tab">Más valorados</div>
            <div class="page-tab">Colombia</div>
        </div>
        <div class="page-inner"><p class="loading">No hay hoteles registrados aún.</p></div>`;
        return;
    }
    const cards = res.map(h => {
        const rating = h.calificacion_promedio ? Number(h.calificacion_promedio).toFixed(1) : null;
        const starsHtml = Array.from({length: 5}, (_, i) =>
            `<span style="color:${i < Math.round(h.calificacion_promedio || 0) ? "#FBBF24" : "var(--text-muted)"};">★</span>`
        ).join("");
        return `
    <div class="hotel-card" style="cursor:pointer;" onclick="window.location.href='negocio.html?id=${h.id_negocio}'">
        <div class="hotel-img">
            ${h.url_foto_portada ? `<img src="${h.url_foto_portada}" alt="${h.nombre}" loading="lazy">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--primary),var(--accent));"></div>`}
            <div class="hotel-img-overlay"></div>
            ${rating ? `<div class="hotel-price-badge">★ ${rating}</div>` : ""}
        </div>
        <div class="hotel-body">
            <div class="hotel-name">${h.nombre}</div>
            <div class="hotel-loc"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${h.ciudad || "Colombia"}</div>
            <div class="hotel-footer">
                <div class="stars">${starsHtml}</div>
                <button class="btn-primary" onclick="event.stopPropagation();window.location.href='negocio.html?id=${h.id_negocio}'">Ver perfil</button>
            </div>
        </div>
    </div>`;
    }).join("");

    content.innerHTML = `
    <div class="page-tabs">
        <div class="page-tab active">Para ti</div>
        <div class="page-tab">Más valorados</div>
        <div class="page-tab">Colombia</div>
    </div>
    <div class="page-inner">
        <div class="two-col-r">
            <div class="filter-panel">
                <div class="filter-group">
                    <div class="filter-group-title">Precio por noche</div>
                    <input type="range" class="range-input" min="0" max="1000" value="500">
                    <div class="range-labels"><span>$0</span><span>$1000+</span></div>
                </div>
                <div class="filter-group">
                    <div class="filter-group-title">Calificación</div>
                    <div class="star-filter-row">
                        <button class="star-filter-btn active">5★</button>
                        <button class="star-filter-btn">4★</button>
                        <button class="star-filter-btn">3★</button>
                    </div>
                </div>
            </div>
            <div>
                <div class="three-col">${cards}</div>
            </div>
        </div>
    </div>`;
}

cargarHoteles();
