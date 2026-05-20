requireAuth();
renderSidebar("minegocio.html");
renderTopbar("Mi Negocio");

async function cargarMiNegocio() {
    const content = document.getElementById("pageContent");
    content.innerHTML = `<div class="page-inner"><p class="loading">Cargando...</p></div>`;

    const existing = await api.get("/negocios/mio");

    content.innerHTML = `
    <div class="page-inner">
        <div id="negocioView"></div>
    </div>`;

    if (existing && !existing.error) {
        mostrarNegocioExistente(existing);
    } else {
        mostrarFormulario();
    }
}

function mostrarNegocioExistente(neg) {
    const container = document.getElementById("negocioView");
    const tipoLabel = neg.tipo === "hotel" ? "Hotel / Hospedaje" : "Restaurante";
    container.innerHTML = `
    <div class="glass-card" style="text-align:center;padding:40px;">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--primary));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:6px;">${neg.nombre}</h3>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">${tipoLabel}${neg.ciudad ? " · " + neg.ciudad : ""}</div>
        <div style="display:flex;gap:12px;justify-content:center;">
            <a href="negocio.html?id=${neg.id_negocio}" class="btn-primary">Ver perfil del negocio</a>
            <button class="btn-outline" onclick="mostrarFormulario()">Registrar otro</button>
        </div>
    </div>`;
}

function mostrarFormulario() {
    const container = document.getElementById("negocioView");
    container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start;">
        <div class="glass-card">
            <div style="font-size:16px;font-weight:600;margin-bottom:20px;">Registrar mi negocio</div>
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div>
                    <label class="form-label">Nombre del negocio</label>
                    <input class="form-input" id="negNombre" placeholder="Ej: Hotel Las Palmas">
                </div>
                <div>
                    <label class="form-label">Tipo</label>
                    <select class="form-input" id="negTipo">
                        <option value="hotel">Hotel / Hospedaje</option>
                        <option value="restaurante">Restaurante</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Descripción</label>
                    <textarea class="form-input" id="negDesc" rows="3" placeholder="Describe tu negocio..." style="resize:vertical;"></textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <label class="form-label">Ciudad</label>
                        <input class="form-input" id="negCiudad" placeholder="Ej: Cartagena">
                    </div>
                    <div>
                        <label class="form-label">País</label>
                        <input class="form-input" id="negPais" value="Colombia">
                    </div>
                </div>
                <div>
                    <label class="form-label">Dirección</label>
                    <input class="form-input" id="negDireccion" placeholder="Calle 10 # 5-23">
                </div>
                <div>
                    <label class="form-label">Foto de portada</label>
                    <input type="file" id="negFotoFile" accept="image/*" style="display:none;">
                    <div id="negFotoArea" onclick="document.getElementById('negFotoFile').click()" style="border:2px dashed var(--glass-border);border-radius:var(--radius-md);padding:16px;text-align:center;cursor:pointer;transition:border-color 0.2s;margin-bottom:8px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 6px;display:block;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <div style="font-size:12px;color:var(--text-muted);">Haz clic para subir foto de portada</div>
                    </div>
                    <input class="form-input" id="negFoto" placeholder="O pega una URL...">
                </div>
                <p id="negError" style="color:var(--accent-warm);font-size:13px;" hidden></p>
                <button class="btn-primary" id="btnRegistrarNeg" style="width:100%;justify-content:center;">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Registrar negocio
                </button>
            </div>
        </div>
        <div>
            <div class="glass-card" style="margin-bottom:16px;">
                <div class="widget-title">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ¿Para qué sirve?
                </div>
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Al registrar tu negocio en Travelia podrás recibir reservas de viajeros, aparecer en el buscador y publicar contenido como establecimiento.</p>
            </div>
            <div class="glass-card">
                <div class="widget-title">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Beneficios
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--text-secondary);">
                    <div style="display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Recibe reservas online</div>
                    <div style="display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Aparece en búsquedas</div>
                    <div style="display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Crea publicaciones como negocio</div>
                    <div style="display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Estadísticas de visitas</div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById("negFotoFile")?.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const area = document.getElementById("negFotoArea");
            area.innerHTML = `<img src="${ev.target.result}" style="max-height:120px;border-radius:var(--radius-sm);object-fit:cover;"><div style="font-size:11px;color:var(--text-muted);margin-top:6px;">${file.name}</div>`;
            document.getElementById("negFoto").value = "";
        };
        reader.readAsDataURL(file);
    });

    document.getElementById("btnRegistrarNeg").addEventListener("click", async () => {
        const nombre      = document.getElementById("negNombre").value.trim();
        const tipo        = document.getElementById("negTipo").value;
        const descripcion = document.getElementById("negDesc").value.trim();
        const ciudad      = document.getElementById("negCiudad").value.trim();
        const pais        = document.getElementById("negPais").value.trim();
        const direccion   = document.getElementById("negDireccion").value.trim();
        const errEl       = document.getElementById("negError");

        if (!nombre) { errEl.textContent = "El nombre es requerido."; errEl.hidden = false; return; }
        if (!ciudad)  { errEl.textContent = "La ciudad es requerida."; errEl.hidden = false; return; }
        errEl.hidden = true;

        const btn = document.getElementById("btnRegistrarNeg");
        btn.disabled = true; btn.textContent = "Registrando...";

        let url_foto_portada = document.getElementById("negFoto").value.trim();
        const fileInput = document.getElementById("negFotoFile");
        if (fileInput?.files[0]) {
            const fd = new FormData();
            fd.append("file", fileInput.files[0]);
            const up = await api.upload("/upload/", fd);
            if (up?.url) url_foto_portada = up.url;
            else { errEl.textContent = "Error al subir foto."; errEl.hidden = false; btn.disabled = false; btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Registrar negocio`; return; }
        }

        const res = await api.post("/negocios/", { nombre, tipo, descripcion, ciudad, pais, direccion, url_foto_portada });
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Registrar negocio`;

        if (res?.id_negocio) {
            showToast(`Negocio "${nombre}" registrado exitosamente.`);
            mostrarExito(res.id_negocio, nombre, tipo);
        } else {
            errEl.textContent = res?.error || "Error al registrar el negocio.";
            errEl.hidden = false;
        }
    });
}

function mostrarExito(id, nombre, tipo) {
    const container = document.getElementById("negocioView");
    container.innerHTML = `
    <div class="glass-card" style="text-align:center;padding:40px;">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--primary));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">¡Negocio registrado!</h3>
        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;max-width:380px;margin-left:auto;margin-right:auto;">
            <strong>${nombre}</strong> ya está en Travelia como ${tipo}. Ahora puedes agregar mesas, recibir reservas y publicar contenido.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;">
            <a href="${tipo === "hotel" ? "hoteles" : "restaurantes"}.html" class="btn-primary">Ver en ${tipo === "hotel" ? "hoteles" : "restaurantes"}</a>
            <button class="btn-outline" onclick="mostrarFormulario()">Registrar otro</button>
        </div>
    </div>`;
}

cargarMiNegocio();
