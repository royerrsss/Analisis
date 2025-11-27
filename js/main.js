// ======================================================
//  SISTEMA DE ADMINISTRACIÓN DE CEMENTERIO
// ======================================================

// URL base de la API
const API_BASE_URL = "http://localhost/Cemetery_API/public";

// Token y usuario guardados
let authToken = localStorage.getItem("cem_token") || null;
let currentUser = JSON.parse(localStorage.getItem("cem_user") || "null");

// Permisos por rol
const ROLE_PERMISSIONS = {
    admin:    ["dashboard", "lotes", "difuntos", "familiares", "pagos", "contratos", "reportes", "sobre"],
    personal: ["dashboard", "lotes", "pagos", "sobre"],
    cliente:  ["dashboard", "lotes", "pagos", "sobre"]
};

function getAppRoleKey(userRole) {
    if (!userRole) return "cliente";
    const r = String(userRole).trim().toLowerCase();

    if (r === "administrador") return "admin";
    if (r === "personal")      return "personal";
    if (r === "cliente")       return "cliente";

    return "cliente";
}

function getAppRoleLabel(appRoleKey) {
    switch (appRoleKey) {
        case "admin":    return "Administrador";
        case "personal": return "Personal";
        case "cliente":  return "Cliente";
        default:         return "Usuario";
    }
}

async function apiRequest(path, options = {}) {
    const headers = options.headers || {};

    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (authToken) {
        headers["Authorization"] = "Bearer " + authToken;
    }

    const response = await fetch(API_BASE_URL + path, {
        ...options,
        headers
    });

    let data = {};
    try {
        data = await response.json();
    } catch (e) {
        data = {};
    }

    if (!response.ok) {
        const msg = data.error || data.message || "Error en la petición.";
        throw new Error(msg);
    }

    return data;
}

// ==============================
// LOGIN / REGISTRO
// ==============================
function mostrarLogin() {
    $("#registerView").addClass("d-none");
    $("#loginView").removeClass("d-none");
    $("#loginError").addClass("d-none").text("");
}

function mostrarRegistro() {
    $("#loginView").addClass("d-none");
    $("#registerView").removeClass("d-none");
    $("#registerError").addClass("d-none").text("");
    $("#registerSuccess").addClass("d-none").text("");
}

// ==============================
// NAVBAR POR ROL
// ==============================
function aplicarPermisosNavbar() {
    if (!currentUser) return;

    const appRoleKey    = getAppRoleKey(currentUser.role);
    const allowedRoutes = ROLE_PERMISSIONS[appRoleKey] || ROLE_PERMISSIONS.cliente;
    const label         = getAppRoleLabel(appRoleKey);

    $(".nav-links a").each(function () {
        const route = $(this).data("route");
        const show  = allowedRoutes.includes(route);
        $(this).closest("li").toggle(show);
    });

    $("#roleBadge")
        .removeClass("d-none")
        .text("Rol: " + label);
}

// ==============================
// INICIAR / CERRAR SESIÓN
// ==============================
function iniciarSesion(user) {
    currentUser = user;
    localStorage.setItem("cem_user", JSON.stringify(user));

    $("#loginView").addClass("d-none");
    $("#registerView").addClass("d-none");
    $("#appShell").removeClass("d-none");
    $("#logoutBtn").removeClass("d-none");

    aplicarPermisosNavbar();
    navegarA("dashboard");
}

function cerrarSesion() {
    authToken   = null;
    currentUser = null;

    localStorage.removeItem("cem_token");
    localStorage.removeItem("cem_user");

    $("#appShell").addClass("d-none");
    $("#logoutBtn").addClass("d-none");
    $("#roleBadge").addClass("d-none").text("");

    mostrarLogin();
}

// ==============================
// TÍTULO POR RUTA Y ROL
// ==============================
function obtenerTitulo(route) {
    const appRoleKey = getAppRoleKey(currentUser?.role || "cliente");

    if (route === "dashboard") {
        return appRoleKey === "cliente"
            ? "Inicio - Panel del cliente"
            : "Inicio - Panel administrativo";
    }
    if (route === "lotes") {
        return appRoleKey === "cliente"
            ? "Mis lotes"
            : "Gestión de lotes";
    }
    if (route === "difuntos")    return "Gestión de difuntos";
    if (route === "familiares")  return "Gestión de familiares";
    if (route === "pagos") {
        return appRoleKey === "cliente"
            ? "Mis pagos"
            : "Gestión de pagos";
    }
    if (route === "contratos")   return "Gestión de contratos";
    if (route === "reportes")    return "Reportes del sistema";
    if (route === "sobre")       return "Sobre nosotros";

    return "Módulo: " + route;
}

// ==============================
// NAVEGACIÓN ENTRE MÓDULOS
// ==============================
function navegarA(route) {
    if (!currentUser) return;

    const appRoleKey    = getAppRoleKey(currentUser.role);
    const allowedRoutes = ROLE_PERMISSIONS[appRoleKey] || ROLE_PERMISSIONS.cliente;

    if (!allowedRoutes.includes(route)) {
        route = "dashboard";
    }

    $("#mainContainer").load(`modulos/${route}.html`, function () {
        if (route === "lotes") {
            const rk = getAppRoleKey(currentUser.role);
            if (rk === "cliente") {
                cargarLotesCliente();
            } else {
                cargarTiposLotes();
                registrarNuevoLote();
                cargarLotesAdmin();
            }
        }
    });

    $(".nav-links a").removeClass("active");
    $(`.nav-links a[data-route="${route}"]`).addClass("active");

    $("#dashboardTitle").text(obtenerTitulo(route));
}

// ==============================
// DASHBOARD
// ==============================
async function cargarDashboard() {
}

// ==============================
// LOTES ADMIN / CLIENTE
// ==============================
async function cargarLotesAdmin() {
    const $tbody = $("#lotesAdmin .lotes-table tbody");
    if (!$tbody.length) return;

    $tbody.html(`
        <tr>
            <td colspan="6">Cargando lotes...</td>
        </tr>
    `);

    try {
        const res   = await apiRequest("/plots");
        const plots = res.data || res || [];

        if (!plots.length) {
            $tbody.html(`<tr><td colspan="6">No hay lotes registrados.</td></tr>`);
            return;
        }

        const rowsHtml = plots.map((plot) => {
            const code     = `L-${plot.section}-${plot.row_num}-${plot.plot_number}`;
            const location = `Sector ${plot.section} · Fila ${plot.row_num} · Lote ${plot.plot_number}`;
            const typeName = plot.type_name || plot.type || "—";
            const status   = (plot.status || "").toLowerCase() || "—";
            const owner    = (plot.owner_first_name || plot.owner_last_name)
                ? `${plot.owner_first_name ?? ""} ${plot.owner_last_name ?? ""}`.trim()
                : (plot.owner_name || "—");
            const endDate  = plot.end_date || plot.contract_end_date || "—";

            let statusClass = "estado-disponible";
            if (status === "ocupado") statusClass = "estado-ocupado";
            else if (status === "reservado") statusClass = "estado-reservado";
            else if (status === "bloqueado" || status === "mantenimiento" || status === "litigio")
                statusClass = "estado-bloqueado";
            else if (status === "expirado") statusClass = "estado-expirado";

            return `
                <tr>
                    <td>${code}</td>
                    <td>${location}</td>
                    <td>${typeName}</td>
                    <td><span class="badge-lote ${statusClass}">${status}</span></td>
                    <td>${owner}</td>
                    <td>${endDate}</td>
                </tr>
            `;
        }).join("");

        $tbody.html(rowsHtml);
    } catch (err) {
        console.error(err);
        $tbody.html(`<tr><td colspan="6">${err.message}</td></tr>`);
    }
}

async function cargarLotesCliente() {
    const $tbody = $("#lotesCliente .lotes-table tbody");
    if (!$tbody.length) return;

    $tbody.html(`
        <tr>
            <td colspan="5">Cargando tus lotes...</td>
        </tr>
    `);

    try {
        const res   = await apiRequest("/plots");
        const plots = res.data || res || [];

        if (!plots.length) {
            $tbody.html(`<tr><td colspan="5">No tiene lotes asociados.</td></tr>`);
            return;
        }

        const rowsHtml = plots.map((plot) => {
            const code     = `L-${plot.section}-${plot.row_num}-${plot.plot_number}`;
            const location = `Sector ${plot.section} · Fila ${plot.row_num} · Lote ${plot.plot_number}`;
            const typeName = plot.type_name || plot.type || "—";
            const status   = (plot.status || "").toLowerCase() || "—";
            const endDate  = plot.end_date || plot.contract_end_date || "—";

            return `
                <tr>
                    <td>${code}</td>
                    <td>${location}</td>
                    <td>${typeName}</td>
                    <td>${status}</td>
                    <td>${endDate}</td>
                </tr>
            `;
        }).join("");

        $tbody.html(rowsHtml);
    } catch (err) {
        console.error(err);
        $tbody.html(`<tr><td colspan="5">${err.message}</td></tr>`);
    }
}

async function cargarTiposLotes() {
    try {
        const res = await apiRequest("/plot-types");
        const tipos = res.data || res || [];

        const $select = $("#nuevoLoteTipoSelect");
        $select.html('<option value="">Seleccione un tipo</option>');

        tipos.forEach(t => {
            $select.append(`<option value="${t.plot_type_id}">${t.name}</option>`);
        });
    } catch (err) {
        console.error("Error al cargar tipos de lotes:", err);
    }
}

function registrarNuevoLote() {
    $("#formNuevoLote").on("submit", async function (e) {
        e.preventDefault();

        const tipo       = $("#nuevoLoteTipoSelect").val();
        const sector     = $("#nuevoLoteSectorInput").val().trim();
        const fila       = $("#nuevoLoteFilaInput").val().trim();
        const numero     = $("#nuevoLoteNumeroInput").val().trim();
        const estado     = $("#nuevoLoteEstadoSelect").val();
        const notas      = $("#nuevoLoteNotasInput").val().trim();

        if (!tipo || !sector || !fila || !numero || !estado) {
            alert("Por favor complete todos los campos requeridos.");
            return;
        }

        try {
            await apiRequest("/plots", {
                method: "POST",
                body: JSON.stringify({
                    plot_type_id: tipo,
                    section: sector,
                    row_num: fila,
                    plot_number: numero,
                    status: estado,
                    notes: notas
                })
            });

            alert("Lote registrado correctamente.");
            $("#formNuevoLote")[0].reset();
            cargarLotesAdmin(); // refresca la tabla
        } catch (err) {
            console.error("Error al registrar lote:", err);
            alert(err.message || "No se pudo registrar el lote.");
        }
    });
}

$(function () {

    // ---------- LOGIN ----------
    $("#loginForm").on("submit", function (e) {
        e.preventDefault();

        const email    = $("#emailInput").val().trim();
        const password = $("#passwordInput").val().trim();
        const $error   = $("#loginError");

        if (!email || !password) {
            $error.removeClass("d-none").text("Debe ingresar usuario y contraseña.");
            return;
        }

        apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        })
            .then((data) => {
                console.log("Respuesta login:", data);

                authToken   = data.token || null;
                currentUser = data.user  || null;

                if (authToken) {
                    localStorage.setItem("cem_token", authToken);
                } else {
                    localStorage.removeItem("cem_token");
                }

                if (currentUser) {
                    iniciarSesion(currentUser);
                } else {
                    throw new Error("La API no devolvió el usuario.");
                }
            })
            .catch((err) => {
                console.error("Error en login:", err);
                $error.removeClass("d-none").text(err.message || "Error al iniciar sesión.");
            });
    });

    // ---------- REGISTRO ----------
    $("#registerForm").on("submit", function (e) {
        e.preventDefault();

        const first_name     = $("#registerFirstName").val().trim();
        const last_name      = $("#registerLastName").val().trim();
        const identification = $("#registerIdentification").val().trim();
        const role           = ($("#registerRole").val() || "cliente").trim();
        const email          = $("#registerEmail").val().trim();
        const password       = $("#registerPassword").val().trim();
        const confirm        = $("#registerPasswordConfirm").val().trim();

        const $error   = $("#registerError");
        const $success = $("#registerSuccess");

        $error.addClass("d-none").text("");
        $success.addClass("d-none").text("");

        if (!first_name || !last_name || !identification || !email || !password || !confirm) {
            $error.removeClass("d-none").text("Todos los campos son obligatorios.");
            return;
        }

        if (password !== confirm) {
            $error.removeClass("d-none").text("Las contraseñas no coinciden.");
            return;
        }

        apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                first_name,
                last_name,
                identification,
                role,
                email,
                password
            })
        })
            .then((data) => {
                console.log("Respuesta registro:", data);
                $success.removeClass("d-none").text(data.message || "Cuenta creada con éxito.");
                $("#registerForm")[0].reset();
                setTimeout(mostrarLogin, 1500);
            })
            .catch((err) => {
                console.error("Error en registro:", err);
                $error.removeClass("d-none").text(err.message || "No se pudo registrar el usuario.");
            });
    });

    // ---------- CAMBIO LOGIN / REGISTRO ----------
    $("#showRegisterBtn").on("click", function (e) {
        e.preventDefault();
        mostrarRegistro();
    });

    $("#showLoginBtn").on("click", function (e) {
        e.preventDefault();
        mostrarLogin();
    });

    // ---------- LOGOUT ----------
    $("#logoutBtn").on("click", function () {
        cerrarSesion();
    });

    // ---------- NAVBAR ----------
    $(".nav-links a").on("click", function (e) {
        e.preventDefault();
        const route = $(this).data("route");
        navegarA(route);
    });

    // ---------- SESIÓN PERSISTENTE ----------
    if (currentUser) {
        $("#appShell").removeClass("d-none");
        $("#logoutBtn").removeClass("d-none");
        aplicarPermisosNavbar();
        navegarA("dashboard");
    } else {
        mostrarLogin();
    }
});
