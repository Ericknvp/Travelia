if (isLoggedIn()) window.location.href = "index.html";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo    = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;
    const res = await api.post("/auth/login", { correo, contrasena });
    if (res?.token) {
        saveSession(res.token, res.usuario);
        window.location.href = "index.html";
    } else {
        showError("errorMsg", res?.error || "Error al iniciar sesión");
    }
});
