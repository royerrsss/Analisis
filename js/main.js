// ======================================================
//  SISTEMA DE ADMINISTRACIÓN DE CEMENTERIO
//  main.js (login, navbar, navegación módulos por AJAX)
// ======================================================

const appConfig = {
    users: [
        {
            id: 1,
            role: "admin",
            name: "Administrador",
            email: "admin@ucr.com",
            password: "admin123"
        },
        {
            id: 2,
            role: "cliente",
            name: "Cliente",
            email: "cliente@ucr.com",
            password: "cliente123"
        }
    ],
    login: {
        errorMessages: {
            invalidCredentials: "Credenciales inválidas. Verifique su correo y contraseña.",
            emptyFields: "Debe completar ambos campos para iniciar sesión."
        }
    }
};

let currentUser = null;

// === "Sobre nosotros" en localStorage ===
const ABOUT_STORAGE_KEY = "cemetery_about";
let aboutInfo = null;

// ==========================
// DOCUMENT READY
// ==========================
$(document).ready(function () {

    // LOGIN
    $("#loginForm").on("submit", function (e) {
        e.preventDefault();

        const email = $("#emailInput").val().trim();
        const password = $("#passwordInput").val().trim();
        const $error = $("#loginError");

        if (!email || !password) {
            $error.removeClass("d-none").text(appConfig.login.errorMessages.emptyFields);
            return;
        }

        const user = appConfig.users.find(
            u => u.email === email && u.password === password
        );

        if (!user) {
            $error.removeClass("d-none").text(appConfig.login.errorMessages.invalidCredentials);
            return;
        }

        $error.addClass("d-none").text("");

        currentUser = user;
        iniciarSesionConUsuario(user);
    });

    // NAVBAR: navegación
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

    $("#userRoleText").text(user.role === "admin" ? "Administrador" : "Cliente");

    ajustarNavbarPorRol(user.role);

    // Mostrar módulo 1 (dashboard) por defecto
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
        sobre: "modulos/sobre.html" // NUEVO
    };

    const titulos = {
        dashboard_admin: "Resumen general",
        dashboard_cliente: "Resumen de cliente",
        lotes_admin: "Inventario y Administración de Lotes",
        lotes_cliente: "Mis lotes",
        difuntos: "Gestión de difuntos",
        familiares: "Familiares y contactos",
        pagos_admin: "Control de pagos",
        pagos_cliente: "Mis pagos",
        contratos: "Contratos",
        reportes: "Reportes",
        sobre_admin: "Sobre nosotros (administración)",
        sobre_cliente: "Sobre nosotros"
    };

    const archivo = rutasArchivos[route];
    if (!archivo) {
        alert("Este módulo visual aún no está implementado.");
        return;
    }

    $("#mainContainer").load(archivo, function () {
        // Ajustar contenido según rol y ruta
        if (route === "dashboard") {
            if (currentUser.role === "admin") {
                $("#dashboardAdmin").removeClass("d-none");
                $("#dashboardCliente").addClass("d-none");
                $("#dashboardTitle").text(titulos.dashboard_admin);
            } else {
                $("#dashboardAdmin").addClass("d-none");
                $("#dashboardCliente").removeClass("d-none");
                $("#dashboardTitle").text(titulos.dashboard_cliente);
            }
        } else if (route === "lotes") {
            if (currentUser.role === "admin") {
                $("#lotesAdmin").removeClass("d-none");
                $("#lotesCliente").addClass("d-none");
                $("#dashboardTitle").text(titulos.lotes_admin);
            } else {
                $("#lotesAdmin").addClass("d-none");
                $("#lotesCliente").removeClass("d-none");
                $("#dashboardTitle").text(titulos.lotes_cliente);
            }
        } else if (route === "pagos") {
            if (currentUser.role === "admin") {
                $("#pagosAdmin").removeClass("d-none");
                $("#pagosCliente").addClass("d-none");
                $("#dashboardTitle").text(titulos.pagos_admin);
            } else {
                $("#pagosAdmin").addClass("d-none");
                $("#pagosCliente").removeClass("d-none");
                $("#dashboardTitle").text(titulos.pagos_cliente);
            }
        } else if (route === "difuntos") {
            $("#dashboardTitle").text(titulos.difuntos);
        } else if (route === "familiares") {
            $("#dashboardTitle").text(titulos.familiares);
        } else if (route === "contratos") {
            $("#dashboardTitle").text(titulos.contratos);
        } else if (route === "reportes") {
            $("#dashboardTitle").text(titulos.reportes);
        } else if (route === "sobre") {
            const key = currentUser.role === "admin" ? "sobre_admin" : "sobre_cliente";
            $("#dashboardTitle").text(titulos[key] || "Sobre nosotros");
            initSobreModule();
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
//  MÓDULO "SOBRE NOSOTROS": LOCALSTORAGE
// ======================================================

function getDefaultAboutData() {
    return {
        cemeteryName: "Cementerio Municipal",
        address: "Dirección pendiente de registrar.",
        email: "",
        phonePrimary: "",
        phoneSecondary: "",
        whatsapp: "",
        scheduleWeek: "",
        scheduleWeekend: "",
        mission: "Texto de misión pendiente de definir.",
        vision: "Texto de visión pendiente de definir.",
        values: "Respeto\nEmpatía\nServicio a la comunidad",
        notes: "",
        updatedAt: null
    };
}

// Carga desde localStorage o usa valores por defecto
function loadAboutFromStorage() {
    const raw = localStorage.getItem(ABOUT_STORAGE_KEY);
    if (!raw) {
        aboutInfo = getDefaultAboutData();
        return;
    }
    try {
        const parsed = JSON.parse(raw);
        aboutInfo = Object.assign(getDefaultAboutData(), parsed || {});
    } catch (e) {
        aboutInfo = getDefaultAboutData();
    }
}

// Guarda en localStorage
function saveAboutToStorage() {
    if (!aboutInfo) return;
    aboutInfo.updatedAt = new Date().toISOString();
    localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(aboutInfo));
}

// Inicializa el módulo "Sobre nosotros"
function initSobreModule() {
    loadAboutFromStorage();

    // Admin: mostrar/ocultar panel
    if (currentUser.role === "admin") {
        $("#sobreAdmin").show();
        attachSobreAdminEvents();
        renderSobreAdmin();
    } else {
        $("#sobreAdmin").hide();
    }

    // Vista pública para ambos roles
    renderSobrePublic();
}

// Rellena el formulario admin con los datos actuales
function renderSobreAdmin() {
    if (!aboutInfo) return;

    $("#aboutCemeteryNameInput").val(aboutInfo.cemeteryName || "");
    $("#aboutAddressInput").val(aboutInfo.address || "");
    $("#aboutEmailInput").val(aboutInfo.email || "");
    $("#aboutPhonePrimaryInput").val(aboutInfo.phonePrimary || "");
    $("#aboutPhoneSecondaryInput").val(aboutInfo.phoneSecondary || "");
    $("#aboutWhatsappInput").val(aboutInfo.whatsapp || "");
    $("#aboutScheduleWeekInput").val(aboutInfo.scheduleWeek || "");
    $("#aboutScheduleWeekendInput").val(aboutInfo.scheduleWeekend || "");
    $("#aboutMissionInput").val(aboutInfo.mission || "");
    $("#aboutVisionInput").val(aboutInfo.vision || "");
    $("#aboutValuesInput").val(aboutInfo.values || "");
    $("#aboutNotesInput").val(aboutInfo.notes || "");
}

// Rellena la vista pública
function renderSobrePublic() {
    if (!aboutInfo) return;

    $("#aboutCemeteryNameText").text(aboutInfo.cemeteryName || "Cementerio Municipal");
    $("#aboutAddressText").text(aboutInfo.address || "Dirección pendiente de registrar.");
    $("#aboutEmailText").text(aboutInfo.email || "—");
    $("#aboutPhonePrimaryText").text(aboutInfo.phonePrimary || "—");
    $("#aboutPhoneSecondaryText").text(aboutInfo.phoneSecondary || "—");
    $("#aboutWhatsappText").text(aboutInfo.whatsapp || "—");
    $("#aboutScheduleWeekText").text(aboutInfo.scheduleWeek || "—");
    $("#aboutScheduleWeekendText").text(aboutInfo.scheduleWeekend || "—");
    $("#aboutMissionText").text(aboutInfo.mission || "Texto de misión pendiente de definir.");
    $("#aboutVisionText").text(aboutInfo.vision || "Texto de visión pendiente de definir.");

    // Valores como lista
    const $valuesList = $("#aboutValuesList");
    const valuesText = aboutInfo.values || "";
    const lines = valuesText.split(/\r?\n/).map(v => v.trim()).filter(v => v.length > 0);

    if (!lines.length) {
        $valuesList.html("<li>Valores pendientes de definir.</li>");
    } else {
        const html = lines.map(v => `<li>${escapeHtml(v)}</li>`).join("");
        $valuesList.html(html);
    }

    // Notas
    $("#aboutNotesText").text(
        aboutInfo.notes && aboutInfo.notes.trim().length > 0
            ? aboutInfo.notes
            : "No hay notas adicionales registradas por el momento."
    );
}

// Eventos del formulario admin
function attachSobreAdminEvents() {
    const $form = $("#aboutForm");
    if (!$form.length) return;

    // Evitar dobles bindings
    $form.off("submit").on("submit", function (e) {
        e.preventDefault();

        aboutInfo = {
            cemeteryName: $("#aboutCemeteryNameInput").val().trim(),
            address: $("#aboutAddressInput").val().trim(),
            email: $("#aboutEmailInput").val().trim(),
            phonePrimary: $("#aboutPhonePrimaryInput").val().trim(),
            phoneSecondary: $("#aboutPhoneSecondaryInput").val().trim(),
            whatsapp: $("#aboutWhatsappInput").val().trim(),
            scheduleWeek: $("#aboutScheduleWeekInput").val().trim(),
            scheduleWeekend: $("#aboutScheduleWeekendInput").val().trim(),
            mission: $("#aboutMissionInput").val().trim(),
            vision: $("#aboutVisionInput").val().trim(),
            values: $("#aboutValuesInput").val(),
            notes: $("#aboutNotesInput").val(),
            updatedAt: aboutInfo && aboutInfo.updatedAt ? aboutInfo.updatedAt : null
        };

        saveAboutToStorage();
        renderSobrePublic();

        alert("Información institucional guardada correctamente (localStorage).");
    });

    // Botón de restablecer valores por defecto
    $("#aboutResetBtn").off("click").on("click", function () {
        if (!confirm("¿Desea restablecer los valores por defecto? Se perderán los cambios actuales.")) return;
        aboutInfo = getDefaultAboutData();
        saveAboutToStorage();
        renderSobreAdmin();
        renderSobrePublic();
    });
}

// Pequeña ayuda para evitar inyección de HTML
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (m) {
        return ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[m];
    });
}
