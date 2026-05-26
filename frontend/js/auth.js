// keys del localStorage para la sesión
const AUTH_KEY = "travelia_token";
const USER_KEY = "travelia_user";

// helpers para leer el token y los datos del usuario
function getToken()    { return localStorage.getItem(AUTH_KEY); }
function getUser()     { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
function isLoggedIn()  { return !!getToken(); }

// guarda el token y datos del usuario en localStorage
function saveSession(token, user) {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// elimina la sesión y redirige al login
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "login.html";
}

// redirige al login si no hay sesión activa
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}
