requireAuth();
renderSidebar("reservas.html");
renderTopbar("Mis Reservas");

async function cargarReservas() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/reservas/mis-reservas");
    if (!res || res.error) {
        content.innerHTML = `<div class="page-inner"><p class="loading">Error al cargar reservas.</p></div>`;
        return;
    }
    if (res.length === 0) {
        content.innerHTML = `
        <div class="page-inner">
            <div class="cta-strip">
                <div class="cta-strip-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div class="cta-strip-info">
                    <h3>No tienes reservas aún</h3>
                    <p>Explora hoteles y restaurantes para hacer tu primera reserva.</p>
                </div>
                <a href="hoteles.html" class="btn-primary">Explorar hoteles</a>
            </div>
        </div>`;
        return;
    }
    const items = res.map(r => `
    <div class="reserva-item">
        <div class="reserva-icon ${r.tipo === "hotel" ? "ri-hotel" : "ri-rest"}">
            <svg viewBox="0 0 24 24">${r.tipo === "hotel" ? '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>' : '<path d="M3 11l19-9-9 19-2-8-8-2z"/>'}</svg>
        </div>
        <div class="reserva-info">
            <div class="reserva-name">${r.negocio || "Reserva"}</div>
            <div class="reserva-meta">
                <span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${new Date(r.fecha_reserva).toLocaleDateString("es-CO")}</span>
                <span>${r.num_personas} persona${r.num_personas > 1 ? "s" : ""}</span>
            </div>
        </div>
        <div class="reserva-actions">
            <span class="chip ${r.estado === "confirmada" ? "chip-green" : r.estado === "pendiente" ? "chip-orange" : "chip-red"}">${r.estado}</span>
        </div>
    </div>`).join("");

    content.innerHTML = `<div class="page-inner"><div class="glass-card" style="padding:0 20px;">${items}</div></div>`;
}

cargarReservas();
