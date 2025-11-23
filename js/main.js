
const API_BASE_URL = "/api"; 

let currentUser = null;
let authToken = null;

// =======================================
//  MODO TEST (desactivar login temporal)
// =======================================
const ENABLE_TEST_MODE = true;   // <--- pon en false cuando este con la API

// ==========================
//  CAPA DE API 
// ==========================
const api = {
    // ---- Autenticación ----
    async login(email, password) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            throw new Error("Credenciales inválidas");
        }

        return res.json();
    },

   
    async get(path) {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            headers: authToken
                ? { "Authorization": `Bearer ${authToken}` }
                : {}
        });
        if (!res.ok) throw new Error(`Error al consultar ${path}`);
        return res.json();
    },

    async post(path, data) {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Error al guardar en ${path}`);
        return res.json();
    },

    async put(path, data) {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Error al actualizar en ${path}`);
        return res.json();
    },

    // ---- Datos para módulos ----

    getDashboardSummary() {
        return this.get("/dashboard");
    },

    // Lotes (admin)

    getLotes(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/lotes${query ? "?" + query : ""}`);
    },

    // Lotes del cliente logueado
    getLotesCliente() {
        return this.get("/clientes/mis-lotes");
    },

    // Difuntos 
    getDifuntos(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/difuntos${query ? "?" + query : ""}`);
    },

    // Clientes / familiares 
    getClientes(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/clientes${query ? "?" + query : ""}`);
    },

    // Facturas / pagos / cuotas
    getFacturas(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/facturas${query ? "?" + query : ""}`);
    },

    getMisFacturas() {
        return this.get("/clientes/mis-facturas");
    },

    // Contratos = lote_cliente + clientes + lotes.
    getContratos(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/contratos${query ? "?" + query : ""}`);
    },

    // Sobre nosotros
    getSobreNosotros() {
        return this.get("/cms/sobre-nosotros");
    },

    updateSobreNosotros(payload) {
        return this.put("/cms/sobre-nosotros", payload);
    }
};

// ==========================
// DOCUMENT READY
// ==========================
$(document).ready(function () {

        // Inicializar panel de desarrollo (si está activo el modo test)
    initDevPanel();

    // LOGIN
    $("#loginForm").on("submit", async function (e) {
        e.preventDefault();

        const email = $("#emailInput").val().trim();
        const password = $("#passwordInput").val().trim();
        const $error = $("#loginError");

        if (!email || !password) {
            $error.removeClass("d-none").text("Debe completar ambos campos para iniciar sesión.");
            return;
        }

        try {
            const { user, token } = await api.login(email, password);
            currentUser = user;
            authToken = token;

            $error.addClass("d-none").text("");
            iniciarSesionConUsuario(user);
        } catch (err) {
            console.error(err);
            $error.removeClass("d-none").text("Credenciales inválidas o error en el servidor.");
        }
    });

    // NAVBAR
    $(".nav-links a").on("click", function (e) {
        e.preventDefault();
        if (!currentUser) return;

        const route = $(this).data("route");
        manejarNavegacion(route);

        $(".nav-links a").removeClass("active");
        $(this).addClass("active");
    });

    // CERRAR SESIÓN
    $("#logoutBtn").on("click", function () {
        cerrarSesion();
    });
});

// ==========================
// INICIAR SESIÓN
// ==========================
function iniciarSesionConUsuario(user) {
    $("#loginView").addClass("d-none");
    $("#appShell").removeClass("d-none");
    $("#logoutBtn").removeClass("d-none");

    const prettyRole =
        user.role === "administrador"
            ? "Administrador"
            : user.role === "personal"
                ? "Personal"
                : "Cliente";

    $("#userRoleText").text(prettyRole);

    ajustarNavbarPorRol(user.role);

    // Ir a dashboard por defecto
    manejarNavegacion("dashboard");

    $(".nav-links a").removeClass("active");
    $('.nav-links a[data-route="dashboard"]').addClass("active");
}

// ==========================
// NAVEGACIÓN ENTRE MÓDULOS
// ==========================
function manejarNavegacion(route) {
    if (!currentUser) return;

    const rutasArchivos = {
        dashboard: "modulos/dashboard.html",
        lotes: "modulos/lotes.html",
        difuntos: "modulos/difuntos.html",
        familiares: "modulos/familiares.html",
        pagos: "modulos/pagos.html",
        contratos: "modulos/contratos.html",
        reportes: "modulos/reportes.html",
        sobre: "modulos/sobre.html"
    };

    const titulos = {
        dashboard: "Resumen general",
        lotes: "Lotes",
        difuntos: "Gestión de difuntos",
        familiares: "Familiares y clientes",
        pagos: "Pagos y facturación",
        contratos: "Contratos de lotes",
        reportes: "Reportes",
        sobre: "Sobre nosotros"
    };

    const archivo = rutasArchivos[route];
    if (!archivo) {
        alert("Este módulo visual aún no está implementado.");
        return;
    }

    $("#mainContainer").load(archivo, async function () {
        $("#dashboardTitle").text(titulos[route] || "");

        try {
            if (route === "dashboard") {
                await initDashboardModule();
            } else if (route === "lotes") {
                await initLotesModule();
            } else if (route === "difuntos") {
                await initDifuntosModule();
            } else if (route === "familiares") {
                await initFamiliaresModule();
            } else if (route === "pagos") {
                await initPagosModule();
            } else if (route === "contratos") {
                await initContratosModule();
            } else if (route === "reportes") {
                await initReportesModule();
            } else if (route === "sobre") {
                await initSobreModule();
            }
        } catch (err) {
            console.error("Error cargando datos del módulo", route, err);
            // Opcional: mostrar un toast / mensaje en pantalla
        }
    });
}

// ==========================
// AJUSTAR NAVBAR POR ROL
// ==========================
function ajustarNavbarPorRol(role) {
    $(".nav-links li").each(function () {
        const rolesAttr = $(this).data("roles");
        if (!rolesAttr) return;

        const roles = rolesAttr.split(",").map(r => r.trim());
        if (roles.includes(role)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

// ==========================
// CERRAR SESIÓN
// ==========================
function cerrarSesion() {
    currentUser = null;
    authToken = null;

    $("#appShell").addClass("d-none");
    $("#loginView").removeClass("d-none");

    $("#loginForm")[0].reset();
    $("#loginError").addClass("d-none").text("");

    $("#logoutBtn").addClass("d-none");
    $("#userRoleText").text("Usuario");
    $("#dashboardTitle").text("Resumen general");
    $("#mainContainer").empty();

    $(".nav-links a").removeClass("active");
    $('.nav-links a[data-route="dashboard"]').addClass("active");
}

// ======================================================
//  MÓDULO: DASHBOARD
// ======================================================
async function initDashboardModule() {
    const data = await api.getDashboardSummary();

    // ---- Lotes resumen ----
    if (data.lots) {
        $("#dashLotsDisponibles").text(data.lots.disponibles ?? "0");
        $("#dashLotsOcupados").text(data.lots.ocupados ?? "0");
        $("#dashLotsReservados").text(data.lots.reservados ?? "0");
    }

    // ---- Pagos pendientes / morosos ----
    if (Array.isArray(data.pendingInvoices)) {
        const $container = $("#dashPendingInvoices");
        if (!$container.length) return;

        if (!data.pendingInvoices.length) {
            $container.html('<p class="empty-text mb-0">No hay facturas pendientes.</p>');
        } else {
            const html = data.pendingInvoices.slice(0, 5).map(inv => `
                <div class="payment-item">
                    <div class="payment-header">
                        <span class="payment-client">${escapeHtml(inv.client_name || "")}</span>
                        <span class="payment-status ${inv.status}">${escapeHtml(inv.status_label || inv.status || "")}</span>
                    </div>
                    <p class="payment-lote">${escapeHtml(inv.lote_label || "")}</p>
                    <div class="payment-meta">
                        <span>Monto: <strong>${formatCurrency(inv.total_amount)}</strong></span>
                        <span>Vence: ${escapeHtml(inv.due_date || "")}</span>
                    </div>
                </div>
            `).join("");
            $container.html(html);
        }
    }

    // ---- Próximos servicios ----
    if (Array.isArray(data.upcomingServices)) {
        const $container = $("#dashUpcomingServices");
        if ($container.length) {
            const html = data.upcomingServices.slice(0, 5).map(s => `
                <div class="service-item">
                    <div class="service-header">
                        <span class="service-badge ${escapeHtml(s.service_type || "")}">
                            ${escapeHtml(s.service_name || "")}
                        </span>
                        <span class="service-date">${escapeHtml(s.scheduled_datetime || "")}</span>
                    </div>
                    <p class="service-main">
                        ${escapeHtml(s.deceased_name || s.client_name || "")}
                    </p>
                    <p class="service-sub">${escapeHtml(s.plot_label || "")}</p>
                </div>
            `).join("");
            $container.html(html);
        }
    }

    // ---- Eventos ----
    if (Array.isArray(data.events)) {
        const $container = $("#dashEvents");
        if ($container.length) {
            const html = data.events.slice(0, 3).map(ev => `
                <div class="event-item">
                    <p class="event-title">${escapeHtml(ev.title || "")}</p>
                    <p class="event-date">${escapeHtml(ev.start_datetime || "")}</p>
                    <p class="event-desc">${escapeHtml(ev.description || "")}</p>
                </div>
            `).join("");
            $container.html(html);
        }
    }
}

// ======================================================
//  MÓDULO: LOTES
// ======================================================
async function initLotesModule() {
    if (!currentUser) return;

    if (currentUser.role === "cliente") {
        $("#lotesAdmin").addClass("d-none");
        $("#lotesCliente").removeClass("d-none");

        const data = await api.getLotesCliente();
        renderLotesCliente(data);
    } else {
        $("#lotesAdmin").removeClass("d-none");
        $("#lotesCliente").addClass("d-none");

        const data = await api.getLotes();
        renderLotesAdmin(data);
        attachLotesFilters();
    }
}

function renderLotesAdmin(data) {
    const $tbody = $("#lotesAdminTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="6" class="text-center text-muted">No hay lotes registrados.</td></tr>'
        );
        return;
    }

    const html = data.map(l => {
        const estadoLabel = mapEstadoLote(l.status);
        return `
            <tr>
                <td>${escapeHtml(l.code || `L-${l.plot_id}`)}</td>
                <td>${escapeHtml(l.location_label || formatPlotLocation(l))}</td>
                <td>${escapeHtml(l.type_name || "")}</td>
                <td><span class="badge-lote estado-${escapeHtml(l.status)}">${estadoLabel}</span></td>
                <td>${escapeHtml(l.owner_name || "—")}</td>
                <td>${escapeHtml(l.contract_end || "—")}</td>
            </tr>
        `;
    }).join("");

    $tbody.html(html);
}

function renderLotesCliente(data) {
    const $tbody = $("#lotesClienteTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="5" class="text-center text-muted">No tiene lotes asociados.</td></tr>'
        );
        return;
    }

    const html = data.map(l => `
        <tr>
            <td>${escapeHtml(l.code || `L-${l.plot_id}`)}</td>
            <td>${escapeHtml(l.location_label || formatPlotLocation(l))}</td>
            <td>${escapeHtml(l.type_name || "")}</td>
            <td><span class="badge-lote estado-${escapeHtml(l.status)}">${mapEstadoLote(l.status)}</span></td>
            <td>${escapeHtml(l.contract_end || "—")}</td>
        </tr>
    `).join("");

    $tbody.html(html);
}

function attachLotesFilters() {
    // Aquí puedes enganchar selects y búsqueda para llamar otra vez api.getLotes con filtros
    // Ejemplo:
    $(".lotes-filter-select, .lotes-search input").off("change keyup").on("change keyup", async function () {
        const status = $("#filtroEstadoLote").val(); // si agregas un id
        const type = $("#filtroTipoLote").val();
        const search = $("#lotesSearchInput").val();

        const data = await api.getLotes({ status, type, search });
        renderLotesAdmin(data);
    });
}

// ======================================================
//  MÓDULO: DIFUNTOS
// ======================================================
async function initDifuntosModule() {
    const data = await api.getDifuntos();
    const $tbody = $("#difuntosTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="7" class="text-center text-muted">No hay registros de entierros.</td></tr>'
        );
        return;
    }

    const html = data.map(d => `
        <tr>
            <td>${escapeHtml(d.code || `D-${d.burial_id}`)}</td>
            <td>${escapeHtml(d.deceased_name || "")}</td>
            <td>${escapeHtml(d.date_death || "")}</td>
            <td>${escapeHtml(d.date_interred || "")}</td>
            <td>${escapeHtml(d.plot_label || "")}</td>
            <td>${escapeHtml(d.status_label || "")}</td>
            <td>${escapeHtml(d.notes || "")}</td>
        </tr>
    `).join("");

    $tbody.html(html);
}

// ======================================================
//  MÓDULO: FAMILIARES / CLIENTES
// ======================================================
async function initFamiliaresModule() {
    const data = await api.getClientes();
    const $tbody = $("#familiaresTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="6" class="text-center text-muted">No hay clientes registrados.</td></tr>'
        );
        return;
    }

    const html = data.map(c => `
        <tr>
            <td>${escapeHtml(c.full_name || "")}</td>
            <td>${escapeHtml(c.relationship || "Titular")}</td>
            <td>${escapeHtml(c.contact_type || "Titular de contrato")}</td>
            <td>${escapeHtml(c.phone || "")}</td>
            <td>${escapeHtml(c.email || "")}</td>
            <td>${escapeHtml(c.lotes_label || "")}</td>
        </tr>
    `).join("");

    $tbody.html(html);
}

// ======================================================
//  MÓDULO: PAGOS / FACTURAS
// ======================================================
async function initPagosModule() {
    if (!currentUser) return;

    if (currentUser.role === "cliente") {
        $("#pagosAdmin").addClass("d-none");
        $("#pagosCliente").removeClass("d-none");

        const data = await api.getMisFacturas();
        renderPagosCliente(data);
    } else {
        $("#pagosAdmin").removeClass("d-none");
        $("#pagosCliente").addClass("d-none");

        const data = await api.getFacturas();
        renderPagosAdmin(data);
    }
}

function renderPagosAdmin(data) {
    const $tbody = $("#pagosAdminTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="6" class="text-center text-muted">No hay facturas registradas.</td></tr>'
        );
        return;
    }

    const html = data.map(f => `
        <tr>
            <td>${escapeHtml(f.client_name || "")}</td>
            <td>${escapeHtml(f.concept || "")}</td>
            <td>${escapeHtml(f.lote_label || "")}</td>
            <td>${formatCurrency(f.total_amount)}</td>
            <td>${escapeHtml(f.due_date || "")}</td>
            <td><span class="badge-pago estado-${escapeHtml(f.status)}">${mapEstadoFactura(f.status)}</span></td>
        </tr>
    `).join("");

    $tbody.html(html);
}

function renderPagosCliente(data) {
    const $tbody = $("#pagosClienteTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="5" class="text-center text-muted">No tiene facturas asociadas.</td></tr>'
        );
        return;
    }

    const html = data.map(f => `
        <tr>
            <td>${escapeHtml(f.concept || "")}</td>
            <td>${escapeHtml(f.lote_label || "")}</td>
            <td>${formatCurrency(f.total_amount)}</td>
            <td>${escapeHtml(f.due_date || "")}</td>
            <td><span class="badge-pago estado-${escapeHtml(f.status)}">${mapEstadoFactura(f.status)}</span></td>
        </tr>
    `).join("");

    $tbody.html(html);
}

// ======================================================
//  MÓDULO: CONTRATOS
// ======================================================
async function initContratosModule() {
    const data = await api.getContratos();
    const $tbody = $("#contratosTableBody");
    if (!$tbody.length) return;

    if (!Array.isArray(data) || !data.length) {
        $tbody.html(
            '<tr><td colspan="7" class="text-center text-muted">No hay contratos registrados.</td></tr>'
        );
        return;
    }

    const html = data.map(c => `
        <tr>
            <td>${escapeHtml(c.contract_number || "")}</td>
            <td>${escapeHtml(c.client_name || "")}</td>
            <td>${escapeHtml(c.plot_type || "")}</td>
            <td>${escapeHtml(c.plot_label || "")}</td>
            <td>${escapeHtml(c.start_date || "")}</td>
            <td>${escapeHtml(c.end_date || "")}</td>
            <td><span class="badge-contrato estado-${escapeHtml(c.status)}">${mapEstadoContrato(c.status)}</span></td>
        </tr>
    `).join("");

    $tbody.html(html);
}

// ======================================================
//  MÓDULO: REPORTES (placeholder, solo front)
// ======================================================
async function initReportesModule() {
}

// ======================================================
//  MÓDULO "SOBRE NOSOTROS" (LOCALSTORAGE, SIN API)
// ======================================================

const ABOUT_STORAGE_KEY = "cemetery_about_v1";
let aboutInfo = null;

function getDefaultAboutData() {
    return {
        cemeteryName: "Cementerio Municipal",
        address: "Dirección pendiente de registrar.",
        email: "",
        phones: {
            primary: "",
            secondary: "",
            whatsapp: ""
        },
        schedule: {
            week: "",
            weekend: ""
        },
        mission: "Texto de misión pendiente de definir.",
        vision: "Texto de visión pendiente de definir.",
        values: ["Respeto", "Empatía", "Servicio a la comunidad"],
        notes: ""
    };
}

function loadAboutFromStorage() {
    try {
        const raw = localStorage.getItem(ABOUT_STORAGE_KEY);
        if (!raw) {
            aboutInfo = getDefaultAboutData();
            return;
        }
        const parsed = JSON.parse(raw);
        aboutInfo = Object.assign(getDefaultAboutData(), parsed || {});
        // Normalizamos arrays
        if (!Array.isArray(aboutInfo.values)) {
            const v = aboutInfo.values || "";
            aboutInfo.values = v
                .toString()
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean);
        }
    } catch (e) {
        console.error("Error cargando Sobre nosotros desde localStorage:", e);
        aboutInfo = getDefaultAboutData();
    }
}

function saveAboutToStorage() {
    try {
        localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(aboutInfo));
    } catch (e) {
        console.error("Error guardando Sobre nosotros en localStorage:", e);
    }
}

function renderSobrePublic() {
    if (!aboutInfo) return;

    $("#aboutCemeteryNameText").text(aboutInfo.cemeteryName || "Cementerio Municipal");
    $("#aboutAddressText").text(aboutInfo.address || "Dirección pendiente de registrar.");
    $("#aboutEmailText").text(aboutInfo.email || "—");

    $("#aboutPhonePrimaryText").text(aboutInfo.phones.primary || "—");
    $("#aboutPhoneSecondaryText").text(aboutInfo.phones.secondary || "—");
    $("#aboutWhatsappText").text(aboutInfo.phones.whatsapp || "—");

    $("#aboutScheduleWeekText").text(aboutInfo.schedule.week || "—");
    $("#aboutScheduleWeekendText").text(aboutInfo.schedule.weekend || "—");

    $("#aboutMissionText").text(aboutInfo.mission || "Texto de misión pendiente de definir.");
    $("#aboutVisionText").text(aboutInfo.vision || "Texto de visión pendiente de definir.");

    const values = Array.isArray(aboutInfo.values) ? aboutInfo.values : [];
    if (!values.length) {
        $("#aboutValuesList").html(
            '<li class="about-value-chip">Valores pendientes de definir.</li>'
        );
    } else {
        $("#aboutValuesList").html(
            values.map(v => `<li class="about-value-chip">${escapeHtml(v)}</li>`).join("")
        );
    }

    $("#aboutNotesText").text(
        aboutInfo.notes && aboutInfo.notes.trim().length
            ? aboutInfo.notes
            : "No hay notas adicionales registradas por el momento."
    );
}

function renderSobreAdmin() {
    if (!aboutInfo) return;

    $("#aboutCemeteryNameInput").val(aboutInfo.cemeteryName || "");
    $("#aboutAddressInput").val(aboutInfo.address || "");
    $("#aboutEmailInput").val(aboutInfo.email || "");

    $("#aboutPhonePrimaryInput").val(aboutInfo.phones.primary || "");
    $("#aboutPhoneSecondaryInput").val(aboutInfo.phones.secondary || "");
    $("#aboutWhatsappInput").val(aboutInfo.phones.whatsapp || "");

    $("#aboutScheduleWeekInput").val(aboutInfo.schedule.week || "");
    $("#aboutScheduleWeekendInput").val(aboutInfo.schedule.weekend || "");

    $("#aboutMissionInput").val(aboutInfo.mission || "");
    $("#aboutVisionInput").val(aboutInfo.vision || "");
    $("#aboutValuesInput").val(aboutInfo.values.join("\n"));
    $("#aboutNotesInput").val(aboutInfo.notes || "");
}

function attachSobreAdminEvents() {
    const $form = $("#aboutForm");
    if (!$form.length) return;

    $form.off("submit").on("submit", function (e) {
        e.preventDefault();

        aboutInfo = {
            cemeteryName: $("#aboutCemeteryNameInput").val().trim(),
            address: $("#aboutAddressInput").val().trim(),
            email: $("#aboutEmailInput").val().trim(),
            phones: {
                primary: $("#aboutPhonePrimaryInput").val().trim(),
                secondary: $("#aboutPhoneSecondaryInput").val().trim(),
                whatsapp: $("#aboutWhatsappInput").val().trim()
            },
            schedule: {
                week: $("#aboutScheduleWeekInput").val().trim(),
                weekend: $("#aboutScheduleWeekendInput").val().trim()
            },
            mission: $("#aboutMissionInput").val().trim(),
            vision: $("#aboutVisionInput").val().trim(),
            values: $("#aboutValuesInput")
                .val()
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean),
            notes: $("#aboutNotesInput").val()
        };

        saveAboutToStorage();
        renderSobrePublic();
        alert("Información institucional guardada (solo en este navegador).");
    });

    $("#aboutResetBtn").off("click").on("click", function () {
        if (!confirm("¿Desea restablecer los valores por defecto?")) return;
        aboutInfo = getDefaultAboutData();
        saveAboutToStorage();
        renderSobreAdmin();
        renderSobrePublic();
    });
}

// Esta es la función que se llama desde manejarNavegacion("sobre")
function initSobreModule() {
    if (!aboutInfo) {
        loadAboutFromStorage();
    }

    renderSobrePublic();

    const role = (currentUser?.role || "").toString().toLowerCase();
    const isClient = role === "cliente" || role === "client";

    if (isClient) {
        // Cliente: solo vista pública
        $("#sobreAdmin").addClass("d-none");
        $("#aboutForm").off("submit");
        $("#aboutResetBtn").off("click");
    } else {
        // Admin / personal / lo que no sea cliente: puede editar
        $("#sobreAdmin").removeClass("d-none");
        renderSobreAdmin();
        attachSobreAdminEvents();
    }
}

// ======================================================
//  HELPERS
// ======================================================
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[m]);
}

function formatCurrency(value) {
    const num = Number(value || 0);
    return num.toLocaleString("es-CR", {
        style: "currency",
        currency: "CRC",
        minimumFractionDigits: 0
    });
}

function mapEstadoLote(status) {
    switch (status) {
        case "disponible": return "Disponible";
        case "reservado": return "Reservado";
        case "ocupado": return "Ocupado";
        case "expirado": return "Expirado";
        case "mantenimiento": return "En mantenimiento";
        case "litigio": return "En litigio";
        default: return status || "—";
    }
}

function mapEstadoFactura(status) {
    switch (status) {
        case "pendiente": return "Pendiente";
        case "pagado": return "Pagado";
        case "moroso": return "Moroso";
        case "cancelado": return "Cancelado";
        default: return status || "—";
    }
}

function mapEstadoContrato(status) {
    switch (status) {
        case "activo": return "Activo";
        case "expirado": return "Expirado";
        case "terminado": return "Terminado";
        default: return status || "—";
    }
}

function formatPlotLocation(l) {
    const parts = [];
    if (l.section) parts.push(`Sector ${l.section}`);
    if (l.row_num) parts.push(`Fila ${l.row_num}`);
    if (l.plot_number) parts.push(`Lote ${l.plot_number}`);
    return parts.join(" · ") || `Lote ${l.plot_id}`;
}

// ======================================================
//  DEV PANEL (solo si ENABLE_TEST_MODE = true)
// ======================================================
function initDevPanel() {
    if (!ENABLE_TEST_MODE) {
        const panel = document.getElementById("devPanel");
        if (panel) panel.classList.add("d-none");
        return;
    }

    const panel = document.getElementById("devPanel");
    if (!panel) return;

    panel.classList.remove("d-none");

    const closeBtn = document.getElementById("devPanelClose");
    const adminBtn = document.getElementById("devAdminBtn");
    const personalBtn = document.getElementById("devPersonalBtn");
    const clienteBtn = document.getElementById("devClienteBtn");

    if (closeBtn) {
        closeBtn.onclick = () => panel.classList.add("d-none");
    }

    const loginAs = (role) => {
        currentUser = {
            user_id: 1,
            first_name: "Usuario",
            last_name: role.charAt(0).toUpperCase() + role.slice(1),
            role,          // "administrador", "personal", "cliente"
            status: "activo"
        };
        authToken = "TOKEN-DE-PRUEBA";

        iniciarSesionConUsuario(currentUser);
    };

    if (adminBtn) adminBtn.onclick = () => loginAs("administrador");
    if (personalBtn) personalBtn.onclick = () => loginAs("personal");
    if (clienteBtn) clienteBtn.onclick = () => loginAs("cliente");
}
