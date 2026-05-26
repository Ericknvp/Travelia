requireAuth();
renderSidebar("auditoria.html");
renderTopbar("Auditoría del sistema");

const user = getUser();
if (user?.rol !== "admin") {
    document.getElementById("pageContent").innerHTML = `<div class="page-inner"><p class="loading">Acceso denegado. Solo administradores.</p></div>`;
    throw new Error("not admin");
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

const TIPO_CONFIG = {
    login:       { label: "Login",        color: "#6C63FF", bg: "rgba(108,99,255,0.15)", icon: `<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>` },
    registro:    { label: "Registro",     color: "#34D399", bg: "rgba(52,211,153,0.15)", icon: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>` },
    publicacion: { label: "Publicación",  color: "#FBBF24", bg: "rgba(251,191,36,0.15)",  icon: `<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>` },
    comentario:  { label: "Comentario",   color: "#F472B6", bg: "rgba(244,114,182,0.15)", icon: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
    reserva:     { label: "Reserva",      color: "#38BDF8", bg: "rgba(56,189,248,0.15)",  icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
};

function tipoDefault(tipo) {
    return { label: tipo, color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)", icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` };
}

function detalleTexto(tipo, detalle) {
    if (!detalle || typeof detalle !== "object") return "";
    if (tipo === "registro" && detalle.correo) return `Correo: ${detalle.correo}`;
    if (tipo === "publicacion" && detalle.id_publicacion) return `ID publicación: ${detalle.id_publicacion}`;
    if (tipo === "comentario" && detalle.id_publicacion) return `En publicación: ${detalle.id_publicacion}`;
    if (tipo === "reserva" && detalle.id_reserva) return `ID reserva: ${detalle.id_reserva}`;
    return "";
}

let todosEventos = [];
let filtroTipo = "";
let filtroUsuario = "";

function renderTabla(eventos) {
    if (eventos.length === 0) {
        return `<p class="loading" style="padding:32px 0;">No hay eventos que coincidan.</p>`;
    }
    return `
    <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
                <tr style="border-bottom:1px solid var(--glass-border);color:var(--text-muted);text-align:left;">
                    <th style="padding:10px 14px;font-weight:500;">Tipo</th>
                    <th style="padding:10px 14px;font-weight:500;">Usuario</th>
                    <th style="padding:10px 14px;font-weight:500;">Detalle</th>
                    <th style="padding:10px 14px;font-weight:500;">IP</th>
                    <th style="padding:10px 14px;font-weight:500;">Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${eventos.map((e, i) => {
                    const cfg = TIPO_CONFIG[e.tipo] || tipoDefault(e.tipo);
                    return `
                    <tr style="border-bottom:1px solid var(--glass-border);transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                        <td style="padding:10px 14px;">
                            <span style="display:inline-flex;align-items:center;gap:6px;background:${cfg.bg};color:${cfg.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${cfg.icon}</svg>
                                ${cfg.label}
                            </span>
                        </td>
                        <td style="padding:10px 14px;color:var(--text-secondary);">ID ${e.id_usuario}</td>
                        <td style="padding:10px 14px;color:var(--text-muted);">${detalleTexto(e.tipo, e.detalle) || "—"}</td>
                        <td style="padding:10px 14px;color:var(--text-muted);font-family:monospace;font-size:11px;">${e.ip || "—"}</td>
                        <td style="padding:10px 14px;color:var(--text-muted);" title="${new Date(e.fecha).toLocaleString("es")}">${timeAgo(e.fecha)}</td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>
    </div>`;
}

function aplicarFiltros() {
    let eventos = todosEventos;
    if (filtroTipo) eventos = eventos.filter(e => e.tipo === filtroTipo);
    if (filtroUsuario) eventos = eventos.filter(e => String(e.id_usuario) === filtroUsuario);
    document.getElementById("auditoriaTabla").innerHTML = renderTabla(eventos);
    document.getElementById("auditoriaCount").textContent = `${eventos.length} evento${eventos.length !== 1 ? "s" : ""}`;
}

async function cargarAuditoria() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/auditoria/");

    if (!res || res.error) {
        content.innerHTML = `<div class="page-inner"><p class="loading">Error al cargar auditoría.</p></div>`;
        return;
    }

    todosEventos = res;

    const tiposUnicos = [...new Set(res.map(e => e.tipo))];
    const usuariosUnicos = [...new Set(res.map(e => e.id_usuario))].sort((a, b) => a - b);

    const contadores = {};
    tiposUnicos.forEach(t => { contadores[t] = res.filter(e => e.tipo === t).length; });

    content.innerHTML = `
    <div class="page-inner">
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
            ${tiposUnicos.map(t => {
                const cfg = TIPO_CONFIG[t] || tipoDefault(t);
                return `
                <div class="glass-card" style="padding:14px 20px;display:flex;align-items:center;gap:12px;min-width:140px;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onclick="filtroTipo=filtroTipo===('${t}')?'':'${t}';aplicarFiltros();document.querySelectorAll('.stat-card').forEach(c=>c.style.borderColor='transparent');this.style.borderColor=filtroTipo?'${cfg.color}':'transparent'" class="stat-card">
                    <div style="width:36px;height:36px;border-radius:10px;background:${cfg.bg};display:flex;align-items:center;justify-content:center;color:${cfg.color};">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${cfg.icon}</svg>
                    </div>
                    <div>
                        <div style="font-size:20px;font-weight:700;line-height:1;">${contadores[t]}</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${cfg.label}</div>
                    </div>
                </div>`;
            }).join("")}
        </div>

        <div class="glass-card" style="padding:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:15px;font-weight:600;">Registro de eventos</span>
                    <span id="auditoriaCount" style="font-size:12px;color:var(--text-muted);background:rgba(255,255,255,0.06);padding:2px 10px;border-radius:20px;">${res.length} eventos</span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <select id="filtroTipoSel" class="form-input" style="padding:6px 10px;font-size:12px;width:auto;">
                        <option value="">Todos los tipos</option>
                        ${tiposUnicos.map(t => `<option value="${t}">${TIPO_CONFIG[t]?.label || t}</option>`).join("")}
                    </select>
                    <select id="filtroUsuarioSel" class="form-input" style="padding:6px 10px;font-size:12px;width:auto;">
                        <option value="">Todos los usuarios</option>
                        ${usuariosUnicos.map(u => `<option value="${u}">Usuario ${u}</option>`).join("")}
                    </select>
                    <button class="btn-outline" style="padding:6px 14px;font-size:12px;" onclick="filtroTipo='';filtroUsuario='';document.getElementById('filtroTipoSel').value='';document.getElementById('filtroUsuarioSel').value='';document.querySelectorAll('.stat-card').forEach(c=>c.style.borderColor='transparent');aplicarFiltros();">Limpiar</button>
                </div>
            </div>
            <div id="auditoriaTabla">${renderTabla(res)}</div>
        </div>
    </div>`;

    document.getElementById("filtroTipoSel").addEventListener("change", e => {
        filtroTipo = e.target.value;
        aplicarFiltros();
    });
    document.getElementById("filtroUsuarioSel").addEventListener("change", e => {
        filtroUsuario = e.target.value;
        aplicarFiltros();
    });
}

cargarAuditoria();