const AUTH_KEY = "travelia_token";
const USER_KEY = "travelia_user";

function getToken()    { return localStorage.getItem(AUTH_KEY); }
function getUser()     { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
function isLoggedIn()  { return !!getToken(); }

function saveSession(token, user) {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "login.html";
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}
