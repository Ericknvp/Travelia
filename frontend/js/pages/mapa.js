renderSidebar("mapa.html");
renderTopbar("Mapa de publicaciones");

const CAT_COLORS = {
    tour:        "#6C63FF",
    hospedaje:   "#00D4AA",
    restaurante: "#FF7B54",
    actividad:   "#FBBF24",
    sitio:       "#4ADE80",
};
const CAT_LABELS = {
    tour: "Tour", hospedaje: "Hospedaje", restaurante: "Restaurante",
    actividad: "Actividad", sitio: "Sitio turístico",
};
const CAT_CHIP_ACTIVE = {
    all:         "background:var(--primary);border-color:var(--primary);",
    tour:        "background:#6C63FF;border-color:#6C63FF;",
    hospedaje:   "background:#00D4AA;border-color:#00D4AA;",
    restaurante: "background:#FF7B54;border-color:#FF7B54;",
    actividad:   "background:#FBBF24;border-color:#FBBF24;color:#000;",
    sitio:       "background:#4ADE80;border-color:#4ADE80;color:#000;",
};

// ── Geocoding ──────────────────────────────────────────────────────────────────

function geoGet(city) {
    try { return JSON.parse(sessionStorage.getItem("tgeo_" + city)); }
    catch { return undefined; }
}
function geoSet(city, val) {
    try { sessionStorage.setItem("tgeo_" + city, JSON.stringify(val)); }
    catch {}
}

async function geocodeCity(city) {
    const cached = geoGet(city);
    if (cached !== undefined) return cached;
    try {
        const r = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
            { headers: { "Accept-Language": "es", "User-Agent": "Travelia-App/1.0" } }
        );
        const data = await r.json();
        if (data?.[0]) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            geoSet(city, coords);
            return coords;
        }
    } catch {}
    geoSet(city, null);
    return null;
}

// ── Marker icon ────────────────────────────────────────────────────────────────

function pinIcon(color, count) {
    const label = count > 1
        ? `<text x="16" y="17" text-anchor="middle" font-size="8.5" font-weight="700" fill="white" font-family="Inter,sans-serif">${count > 9 ? "9+" : count}</text>`
        : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">
        <defs>
            <filter id="ps" x="-50%" y="-20%" width="200%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.55)"/>
            </filter>
        </defs>
        <path d="M16 2C9.37 2 4 7.37 4 14C4 24 16 42 16 42C16 42 28 24 28 14C28 7.37 22.63 2 16 2Z" fill="${color}" filter="url(#ps)"/>
        <circle cx="16" cy="14" r="6.5" fill="white" fill-opacity="0.18"/>
        <circle cx="16" cy="14" r="4.5" fill="white" fill-opacity="0.9"/>
        ${label}
    </svg>`;
    return L.divIcon({ html: svg, className: "", iconSize: [32, 46], iconAnchor: [16, 46], popupAnchor: [0, -48] });
}

// ── Popup ──────────────────────────────────────────────────────────────────────

function postRow(p) {
    const color = CAT_COLORS[p.categoria] || "#8B85FF";
    const label = CAT_LABELS[p.categoria] || p.categoria;
    const title = p.titulo || (p.contenido || "").slice(0, 45);
    const thumb = p.url_imagen
        ? `<img src="${p.url_imagen}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;">`
        : "";
    return `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${p.autor || ""}</div>
            <span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:${color}22;color:${color};border:1px solid ${color}44;">${label}</span>
        </div>
        ${thumb}
    </div>`;
}

function buildPopup(city, posts) {
    const shown = posts.slice(0, 4).map(postRow).join("");
    const extra = posts.length > 4
        ? `<div style="font-size:11px;color:var(--text-muted);padding-top:6px;text-align:center;">+${posts.length - 4} publicaciones más</div>`
        : "";
    return `
    <div style="min-width:230px;max-width:290px;">
        <div style="font-size:15px;font-weight:700;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;">${city}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">${posts.length} publicación${posts.length !== 1 ? "es" : ""}</div>
        ${shown}${extra}
    </div>`;
}

// ── State ──────────────────────────────────────────────────────────────────────

let map, leafletMarkers = [], allPubs = [], coordsMap = {}, activeFilter = "all";

// ── Render markers ─────────────────────────────────────────────────────────────

function renderMarkers() {
    leafletMarkers.forEach(m => m.remove());
    leafletMarkers = [];

    const filtered = activeFilter === "all"
        ? allPubs
        : allPubs.filter(p => p.categoria === activeFilter);

    const byCity = {};
    for (const p of filtered) {
        const city = p.ciudad.trim();
        if (!coordsMap[city]) continue;
        (byCity[city] = byCity[city] || []).push(p);
    }

    let total = 0;
    for (const [city, posts] of Object.entries(byCity)) {
        const catCount = {};
        posts.forEach(p => { catCount[p.categoria] = (catCount[p.categoria] || 0) + 1; });
        const top = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
        const color = CAT_COLORS[top] || "#8B85FF";

        const marker = L.marker(coordsMap[city], { icon: pinIcon(color, posts.length) })
            .bindPopup(buildPopup(city, posts), { maxWidth: 310 })
            .addTo(map);
        leafletMarkers.push(marker);
        total += posts.length;
    }

    const counter = document.getElementById("mapaCounter");
    if (leafletMarkers.length === 0) {
        counter.textContent = "Sin publicaciones para este filtro";
    } else {
        counter.textContent = `${leafletMarkers.length} ciudad${leafletMarkers.length !== 1 ? "es" : ""} · ${total} publicacion${total !== 1 ? "es" : ""}`;
        if (activeFilter !== "all") {
            const group = L.featureGroup(leafletMarkers);
            map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 8 });
        }
    }
}

// ── Init ───────────────────────────────────────────────────────────────────────

async function initMapa() {
    const dark = document.documentElement.dataset.theme !== "light";
    map = L.map("mapa", { zoomControl: true }).setView([10, 0], 2);
    L.tileLayer(
        dark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
            attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>",
            subdomains: "abcd",
            maxZoom: 19,
        }
    ).addTo(map);

    // Fetch
    const setMsg = t => { const el = document.getElementById("loadingMsg"); if (el) el.textContent = t; };
    setMsg("Cargando publicaciones...");
    const pubs = await api.get("/publicaciones/");
    if (!pubs || pubs.error) {
        document.getElementById("mapaLoading").innerHTML =
            `<div style="font-size:14px;color:var(--danger);font-family:Inter,sans-serif;">Error al cargar publicaciones.</div>`;
        return;
    }
    allPubs = pubs.filter(p => p.ciudad && p.ciudad.trim());

    if (allPubs.length === 0) {
        document.getElementById("mapaLoading").innerHTML =
            `<div style="font-size:14px;color:var(--text-muted);font-family:Inter,sans-serif;">No hay publicaciones con ubicación.</div>`;
        return;
    }

    const cities = [...new Set(allPubs.map(p => p.ciudad.trim()))];
    setMsg(`Geocodificando ciudades (0/${cities.length})...`);

    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        setMsg(`Geocodificando ciudades (${i + 1}/${cities.length})...`);
        const alreadyCached = geoGet(city) !== undefined;
        const coords = await geocodeCity(city);
        if (coords) coordsMap[city] = coords;
        if (!alreadyCached) await new Promise(r => setTimeout(r, 420));
    }

    document.getElementById("mapaLoading").style.display = "none";
    renderMarkers();

    // Fit to all markers on first load
    if (leafletMarkers.length > 0) {
        const group = L.featureGroup(leafletMarkers);
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 7 });
    }
}

// ── Filter chips ───────────────────────────────────────────────────────────────

document.querySelectorAll(".mapa-chip").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".mapa-chip").forEach(b => {
            b.classList.remove("active");
            b.style.cssText = "";
        });
        btn.classList.add("active");
        btn.style.cssText = CAT_CHIP_ACTIVE[btn.dataset.cat] || "";
        activeFilter = btn.dataset.cat;
        renderMarkers();
    });
});

initMapa();
