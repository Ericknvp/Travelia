const NAV_ITEMS = [
    {
        href: "index.html", label: "Feed", section: "Principal",
        icon: `<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
        href: "perfil.html", label: "Mi Perfil",
        icon: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    },
    {
        href: "notificaciones.html", label: "Notificaciones", badge: true,
        icon: `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
    },
    {
        href: "amigos.html", label: "Amigos", badge: true,
        icon: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    },
    {
        href: "buscar.html", label: "Buscar", section: "Descubrir",
        icon: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
    },
    {
        href: "hoteles.html", label: "Hoteles",
        icon: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`
    },
    {
        href: "restaurantes.html", label: "Restaurantes",
        icon: `<svg viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`
    },
    {
        href: "reservas.html", label: "Reservas",
        icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
    },
    {
        href: "minegocio.html", label: "Mi Negocio", section: "Gestión",
        icon: `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
    },
    {
        href: "ajustes.html", label: "Ajustes",
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    },
];

function renderSidebar(activePage = "") {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const user = getUser();
    const currentFile = activePage || window.location.pathname.split("/").pop() || "index.html";

    let lastSection = "";
    const navHtml = NAV_ITEMS.map(item => {
        let sectionHtml = "";
        if (item.section && item.section !== lastSection) {
            lastSection = item.section;
            sectionHtml = `<span class="nav-label">${item.section}</span>`;
        }
        const isActive = currentFile === item.href;
        const id = item.href === "notificaciones.html" ? ' id="nav-notif-link"' : "";
        return `${sectionHtml}
        <a class="nav-item ${isActive ? "active" : ""}" href="${item.href}"${id}>
            <span class="nav-icon" style="position:relative;">
                ${item.icon}
                ${item.href === "notificaciones.html" ? '<span class="nav-notif-dot" id="navNotifDot" style="display:none;"></span>' : ""}
            </span>
            ${item.label}
        </a>`;
    }).join("");

    const initials = user?.nombre ? user.nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
    const avatarContent = user?.foto
        ? `<img src="${user.foto}" alt="${user.nombre}">`
        : initials;

    const sidebarHtml = `
        <div class="logo">
            <div class="logo-icon">
                <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="16" r="13" stroke="white" stroke-width="1.6" stroke-opacity="0.5"/>
                    <path d="M18 3C13.03 3 9 7.03 9 12C9 18.75 18 29 18 29C18 29 27 18.75 27 12C27 7.03 22.97 3 18 3Z" fill="white" fill-opacity="0.18" stroke="white" stroke-width="1.5"/>
                    <circle cx="18" cy="12" r="3.2" fill="white"/>
                </svg>
            </div>
            <span class="logo-text">Travelia</span>
        </div>
        ${navHtml}
        <div class="sidebar-footer">
            ${user ? `
            <div class="sidebar-user" onclick="window.location.href='perfil.html'">
                <div class="avatar-sm">${avatarContent}</div>
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name">${user.nombre}</div>
                    <div class="sidebar-user-role">${user.ciudad ? user.ciudad : "Viajero"}</div>
                </div>
            </div>
            ` : `
            <a class="nav-item" href="login.html">
                <span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></span>
                Iniciar sesión
            </a>
            `}
        </div>
    `;
    sidebar.innerHTML = sidebarHtml;

    if (isLoggedIn()) {
        _fetchNotifBadge();
    }
}

async function _fetchNotifBadge() {
    try {
        const res = await api.get("/notificaciones/count");
        const dot = document.getElementById("navNotifDot");
        if (dot) dot.style.display = (res?.count > 0) ? "block" : "none";
    } catch (e) {}
}

function renderTopbar(title = "Feed de viajes") {
    const topbar = document.getElementById("topbar");
    if (!topbar) return;
    topbar.innerHTML = `
        <span class="topbar-title">${title}</span>
        <div class="topbar-search">
            <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input type="text" placeholder="Buscar destinos, negocios, usuarios...">
        </div>
        <div class="topbar-actions">
            <div class="icon-btn" onclick="window.location.href='notificaciones.html'">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span class="notif-dot"></span>
            </div>
            <div class="icon-btn" onclick="window.location.href='perfil.html'">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="theme-toggle" onclick="toggleTheme()" title="Cambiar tema">
                <svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </div>
        </div>
    `;
}

function toggleTheme() {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("travelia_theme", html.dataset.theme);
}

function initTheme() {
    const saved = localStorage.getItem("travelia_theme") || "dark";
    document.documentElement.dataset.theme = saved;
}

function showError(elementId, msg) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = msg; el.hidden = false; }
}

function openLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.classList.add("open");
}

function closeLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.classList.remove("open");
}

function requireAuthOrModal(callback) {
    if (isLoggedIn()) {
        callback();
    } else {
        openLoginModal();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("closeLoginModal");
    if (closeBtn) closeBtn.addEventListener("click", closeLoginModal);

    const overlay = document.getElementById("loginModal");
    if (overlay) overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeLoginModal();
    });
});

function showToast(msg, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    const icons = {
        success: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        info:    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-icon">${icons[type] || icons.info}</div><div>${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("toast-out");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, 3500);
}

initTheme();
