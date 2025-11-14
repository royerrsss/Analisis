// ======================================================
//  SISTEMA DE ADMINISTRACIÓN DE CEMENTERIO
//  main.js (login, navbar, navegación módulos)
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

    // Mostrar módulo 1 por defecto
    $("#viewDashboard").removeClass("d-none");
    $("#viewLotes").addClass("d-none");
    $("#viewDifuntos").addClass("d-none");
    $("#viewFamiliares").addClass("d-none");
    $("#viewPagos").addClass("d-none");
    $("#viewContratos").addClass("d-none");
    $("#viewReportes").addClass("d-none");

    if (user.role === "admin") {
        $("#dashboardAdmin").removeClass("d-none");
        $("#dashboardCliente").addClass("d-none");
        $("#dashboardTitle").text("Resumen general");
    } else {
        $("#dashboardAdmin").addClass("d-none");
        $("#dashboardCliente").removeClass("d-none");
        $("#dashboardTitle").text("Resumen de cliente");
    }

    $(".nav-links a").removeClass("active");
    $('.nav-links a[data-route="dashboard"]').addClass("active");
}

// ==========================
// NAVEGACIÓN ENTRE MÓDULOS
// ==========================
function manejarNavegacion(route) {
    if (!currentUser) return;

    // Reset vistas principales
    $("#viewDashboard").addClass("d-none");
    $("#viewLotes").addClass("d-none");
    $("#viewDifuntos").addClass("d-none");
    $("#viewFamiliares").addClass("d-none");
    $("#viewPagos").addClass("d-none");
    $("#viewContratos").addClass("d-none");
    $("#viewReportes").addClass("d-none");

    // Subvistas por rol
    if (route === "dashboard") {
        $("#viewDashboard").removeClass("d-none");

        if (currentUser.role === "admin") {
            $("#dashboardAdmin").removeClass("d-none");
            $("#dashboardCliente").addClass("d-none");
            $("#dashboardTitle").text("Resumen general");
        } else {
            $("#dashboardAdmin").addClass("d-none");
            $("#dashboardCliente").removeClass("d-none");
            $("#dashboardTitle").text("Resumen de cliente");
        }
        return;
    }

    if (route === "lotes") {
        $("#viewLotes").removeClass("d-none");

        if (currentUser.role === "admin") {
            $("#lotesAdmin").removeClass("d-none");
            $("#lotesCliente").addClass("d-none");
            $("#dashboardTitle").text("Inventario y Administración de Lotes");
        } else {
            $("#lotesAdmin").addClass("d-none");
            $("#lotesCliente").removeClass("d-none");
            $("#dashboardTitle").text("Mis lotes");
        }
        return;
    }

    if (route === "difuntos") {
        $("#viewDifuntos").removeClass("d-none");
        $("#dashboardTitle").text("Gestión de difuntos");
        return;
    }

    if (route === "familiares") {
        $("#viewFamiliares").removeClass("d-none");
        $("#dashboardTitle").text("Familiares y contactos");
        return;
    }

    if (route === "pagos") {
        $("#viewPagos").removeClass("d-none");

        if (currentUser.role === "admin") {
            $("#pagosAdmin").removeClass("d-none");
            $("#pagosCliente").addClass("d-none");
            $("#dashboardTitle").text("Control de pagos");
        } else {
            $("#pagosAdmin").addClass("d-none");
            $("#pagosCliente").removeClass("d-none");
            $("#dashboardTitle").text("Mis pagos");
        }
        return;
    }

    if (route === "contratos") {
        $("#viewContratos").removeClass("d-none");
        $("#dashboardTitle").text("Contratos");
        return;
    }

    if (route === "reportes") {
        $("#viewReportes").removeClass("d-none");
        $("#dashboardTitle").text("Reportes");
        return;
    }

    alert("Este módulo visual aún no está implementado.");
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

    $("#viewDashboard").removeClass("d-none");
    $("#viewLotes").addClass("d-none");
    $("#viewDifuntos").addClass("d-none");
    $("#viewFamiliares").addClass("d-none");
    $("#viewPagos").addClass("d-none");
    $("#viewContratos").addClass("d-none");
    $("#viewReportes").addClass("d-none");

    $("#dashboardAdmin").removeClass("d-none");
    $("#dashboardCliente").addClass("d-none");

    $(".nav-links a").removeClass("active");
    $('.nav-links a[data-route="dashboard"]').addClass("active");

    $("#logoutBtn").addClass("d-none");
    $("#userRoleText").text("Usuario");
    $("#dashboardTitle").text("Módulo 1: Inicio / Resumen general");
}
