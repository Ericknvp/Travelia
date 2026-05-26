// si ya hay sesión activa, va directo al feed
if (isLoggedIn()) window.location.href = "index.html";

// envía el formulario de registro y redirige al login si fue exitoso
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre    = document.getElementById("nombre").value;
    const correo    = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;
    const res = await api.post("/auth/register", { nombre, correo, contrasena });
    if (res?.id_usuario) {
        window.location.href = "login.html";
    } else {
        showError("errorMsg", res?.error || "Error al registrarse");
    }
});
