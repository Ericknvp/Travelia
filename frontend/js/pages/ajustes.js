requireAuth();
renderSidebar("ajustes.html");
renderTopbar("Ajustes");

async function cargarAjustes() {
    const content = document.getElementById("pageContent");
    const res = await api.get("/auth/me");
    if (!res || res.error) {
        content.innerHTML = `<div class="page-inner"><p class="loading">Error al cargar ajustes.</p></div>`;
        return;
    }
    const u = res;
    const initials = u.nombre ? u.nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
    const handle   = u.username ? `@${u.username}` : "";

    content.innerHTML = `
    <div class="page-inner">
        <div class="settings-layout">
            <div class="settings-nav" id="settingsNav">
                <div class="settings-nav-item active" data-section="perfil">
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Perfil
                </div>
                <div class="settings-nav-item" data-section="apariencia">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    Apariencia
                </div>
                <div class="settings-divider"></div>
                <div class="settings-nav-item danger" onclick="confirmLogout()">
                    <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar sesión
                </div>
            </div>

            <div id="settingsContent">
                <!-- section: perfil -->
                <div id="section-perfil">
                    <div class="glass-card" style="margin-bottom:16px;">
                        <div class="settings-section"><div class="settings-section-title">Foto de perfil</div></div>
                        <div class="settings-row">
                            <div class="avatar-upload" style="display:flex;align-items:center;gap:16px;">
                                <div class="avatar-lg">${u.url_foto_perfil ? `<img src="${u.url_foto_perfil}" alt="">` : initials}</div>
                                <div>
                                    <div style="font-size:13px;font-weight:500;">${u.nombre}</div>
                                    <div style="font-size:12px;color:var(--text-muted);">${handle}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" id="editCard">
                        <div class="settings-section"><div class="settings-section-title">Información personal</div></div>
                        <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px;">
                            <div>
                                <label class="form-label">Nombre completo</label>
                                <input class="form-input" id="ajNombre" value="${u.nombre || ""}">
                            </div>
                            <div>
                                <label class="form-label">Nombre de usuario (@)</label>
                                <input class="form-input" id="ajUsername" value="${u.username || ""}" placeholder="ej: juan_viajero">
                            </div>
                            <div>
                                <label class="form-label">Correo electrónico</label>
                                <input class="form-input" id="ajCorreo" value="${u.correo || ""}" disabled style="opacity:0.6;cursor:not-allowed;" title="El correo no se puede cambiar">
                            </div>
                            <div>
                                <label class="form-label">Biografía</label>
                                <textarea class="form-input" id="ajBio" rows="3" style="resize:vertical;">${u.bio || ""}</textarea>
                            </div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                                <div><label class="form-label">Ciudad</label><input class="form-input" id="ajCiudad" value="${u.ciudad || ""}"></div>
                                <div><label class="form-label">País</label><input class="form-input" id="ajPais" value="${u.pais || ""}"></div>
                            </div>
                            <div>
                                <label class="form-label">Foto de perfil</label>
                                <input type="file" id="ajFotoFile" accept="image/*" style="display:none;">
                                <div id="ajFotoArea" onclick="document.getElementById('ajFotoFile').click()" style="border:2px dashed var(--glass-border);border-radius:var(--radius-md);padding:14px;text-align:center;cursor:pointer;transition:border-color 0.2s;margin-bottom:8px;">
                                    ${u.url_foto_perfil
                                        ? `<img src="${u.url_foto_perfil}" style="max-height:100px;border-radius:var(--radius-sm);object-fit:cover;" id="ajFotoImg"><div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Haz clic para cambiar</div>`
                                        : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 6px;display:block;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><div style="font-size:12px;color:var(--text-muted);">Haz clic para subir foto</div>`
                                    }
                                </div>
                            </div>
                            <p id="ajError" style="color:var(--accent-warm);font-size:13px;" hidden></p>
                            <button class="btn-primary" id="btnGuardarAjustes" style="width:100%;justify-content:center;">Guardar cambios</button>
                            <p id="ajOk" style="color:var(--success);font-size:13px;text-align:center;" hidden>Perfil actualizado correctamente.</p>
                        </div>
                    </div>
                </div>

                <!-- section: apariencia -->
                <div id="section-apariencia" style="display:none;">
                    <div class="glass-card" style="margin-bottom:16px;">
                        <div class="settings-section"><div class="settings-section-title">Modo</div></div>
                        <div class="settings-row">
                            <div class="settings-row-info">
                                <div class="settings-row-label">Tema</div>
                                <div class="settings-row-sub">Cambia entre modo oscuro y claro</div>
                            </div>
                            <button class="btn-ghost-sm" onclick="toggleTheme()">Cambiar tema</button>
                        </div>
                    </div>
                    <div class="glass-card">
                        <div class="settings-section"><div class="settings-section-title">Color de acento</div></div>
                        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Elige el color principal de la interfaz</div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;" id="colorSchemeGrid">
                            ${[
                                { id:"purple", label:"Morado",  bg:"#0F0E2A", primary:"#6C63FF" },
                                { id:"indigo", label:"Índigo",  bg:"#0C0B25", primary:"#6366F1" },
                                { id:"blue",   label:"Azul",    bg:"#080F1E", primary:"#3B82F6" },
                                { id:"cyan",   label:"Cian",    bg:"#04121A", primary:"#06B6D4" },
                                { id:"green",  label:"Verde",   bg:"#041A10", primary:"#10B981" },
                                { id:"amber",  label:"Ámbar",   bg:"#140C00", primary:"#F59E0B" },
                                { id:"orange", label:"Naranja", bg:"#160900", primary:"#F97316" },
                                { id:"red",    label:"Rojo",    bg:"#160404", primary:"#EF4444" },
                                { id:"pink",   label:"Rosa",    bg:"#18060F", primary:"#EC4899" },
                            ].map(c => `
                            <div class="color-scheme-card" data-color-id="${c.id}" onclick="setColorScheme('${c.id}');document.querySelectorAll('.color-scheme-card').forEach(el=>el.classList.remove('selected'));this.classList.add('selected');"
                                style="cursor:pointer;border-radius:var(--radius-md);overflow:hidden;border:2px solid transparent;transition:border-color 0.2s;">
                                <div style="background:${c.bg};height:64px;display:flex;align-items:center;justify-content:center;gap:6px;">
                                    <div style="width:22px;height:22px;border-radius:50%;background:${c.primary};"></div>
                                    <div style="width:14px;height:14px;border-radius:50%;background:${c.primary};opacity:0.5;"></div>
                                </div>
                                <div style="background:rgba(255,255,255,0.05);padding:8px;text-align:center;font-size:12px;font-weight:500;">${c.label}</div>
                            </div>`).join("")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById("settingsNav").addEventListener("click", e => {
        const item = e.target.closest("[data-section]");
        if (!item) return;
        document.querySelectorAll(".settings-nav-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        document.querySelectorAll("[id^='section-']").forEach(s => s.style.display = "none");
        const sec = document.getElementById(`section-${item.dataset.section}`);
        if (sec) sec.style.display = "block";
        if (item.dataset.section === "apariencia") marcarColorActivo();
    });

    function marcarColorActivo() {
        const current = localStorage.getItem("travelia_color") || "purple";
        document.querySelectorAll(".color-scheme-card").forEach(card => {
            const isActive = card.dataset.colorId === current;
            card.classList.toggle("selected", isActive);
            card.style.borderColor = isActive ? "var(--primary)" : "transparent";
        });
    }

    document.getElementById("colorSchemeGrid")?.addEventListener("click", e => {
        const card = e.target.closest(".color-scheme-card");
        if (!card) return;
        document.querySelectorAll(".color-scheme-card").forEach(c => {
            c.style.borderColor = "transparent";
        });
        card.style.borderColor = "var(--primary)";
    });

    document.getElementById("ajFotoFile")?.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const area = document.getElementById("ajFotoArea");
            area.innerHTML = `<img src="${ev.target.result}" style="max-height:100px;border-radius:var(--radius-sm);object-fit:cover;"><div style="font-size:11px;color:var(--text-muted);margin-top:6px;">${file.name}</div>`;
            document.getElementById("ajFoto").value = "";
        };
        reader.readAsDataURL(file);
    });

    document.getElementById("btnGuardarAjustes").addEventListener("click", async () => {
        const nombre   = document.getElementById("ajNombre").value.trim();
        const username = document.getElementById("ajUsername").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        const bio      = document.getElementById("ajBio").value.trim();
        const ciudad   = document.getElementById("ajCiudad").value.trim();
        const pais     = document.getElementById("ajPais").value.trim();
        const errEl    = document.getElementById("ajError");
        const okEl     = document.getElementById("ajOk");

        if (!nombre) { errEl.textContent = "El nombre es requerido."; errEl.hidden = false; return; }
        errEl.hidden = true; okEl.hidden = true;

        const btn = document.getElementById("btnGuardarAjustes");
        btn.disabled = true; btn.textContent = "Guardando...";

        let url_foto_perfil = getUser()?.url_foto_perfil || getUser()?.foto || "";
        const fileInput = document.getElementById("ajFotoFile");
        if (fileInput?.files[0]) {
            const fd = new FormData();
            fd.append("file", fileInput.files[0]);
            const up = await api.upload("/upload/", fd);
            if (up?.url) url_foto_perfil = up.url;
            else { errEl.textContent = "Error al subir foto."; errEl.hidden = false; btn.disabled = false; btn.textContent = "Guardar cambios"; return; }
        }

        const res = await api.put("/usuarios/me", { nombre, username, bio, ciudad, pais, url_foto_perfil });
        btn.disabled = false; btn.textContent = "Guardar cambios";

        if (res?.mensaje) {
            const user = getUser();
            saveSession(getToken(), { ...user, nombre, ciudad, foto: url_foto_perfil, username });
            showToast("Perfil actualizado correctamente.");
            okEl.hidden = false;
        } else {
            errEl.textContent = res?.error || "Error al guardar.";
            errEl.hidden = false;
        }
    });
}

cargarAjustes();
