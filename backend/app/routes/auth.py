from flask import Blueprint, request, jsonify, g
import bcrypt, jwt, os, datetime, re
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required
from ..services.auditoria_service import registrar_evento

auth_bp = Blueprint("auth", __name__)


def _gen_username(base, cur):
    base = re.sub(r"[^a-z0-9_]", "", base.lower()) or "user"
    username = base
    suffix = 1
    while True:
        cur.execute("SELECT id_usuario FROM usuarios WHERE username=%s", (username,))
        if not cur.fetchone():
            return username
        username = f"{base}{suffix}"
        suffix += 1


@auth_bp.route("/register", methods=["POST"])
def register():
    data      = request.get_json()
    nombre    = data.get("nombre", "").strip()
    correo    = data.get("correo", "").strip().lower()
    password  = data.get("contrasena", "")
    username  = data.get("username", "").strip().lower()
    if not nombre or not correo or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(10)).decode()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM usuarios WHERE correo=%s", (correo,))
            if cur.fetchone():
                return jsonify({"error": "Correo ya registrado"}), 409
            if not username:
                username = _gen_username(correo.split("@")[0], cur)
            else:
                cur.execute("SELECT id_usuario FROM usuarios WHERE username=%s", (username,))
                if cur.fetchone():
                    return jsonify({"error": "Nombre de usuario ya en uso"}), 409
            cur.execute(
                "INSERT INTO usuarios (nombre, correo, contrasena_hash, username) VALUES (%s,%s,%s,%s)",
                (nombre, correo, hashed, username)
            )
            conn.commit()
            user_id = cur.lastrowid
        try:
            registrar_evento(user_id, "registro", {"correo": correo}, request.remote_addr)
        except Exception:
            pass
        return jsonify({"mensaje": "Cuenta creada", "id_usuario": user_id}), 201
    finally:
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data      = request.get_json()
    correo    = data.get("correo", "").strip().lower()
    password  = data.get("contrasena", "")
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id_usuario, nombre, username, contrasena_hash, rol, url_foto_perfil, ciudad FROM usuarios WHERE correo=%s",
                (correo,)
            )
            user = cur.fetchone()
        if not user or not bcrypt.checkpw(password.encode(), user["contrasena_hash"].encode()):
            return jsonify({"error": "Credenciales inválidas"}), 401
        exp = datetime.datetime.utcnow() + datetime.timedelta(hours=int(os.getenv("JWT_EXPIRATION_HOURS", 8)))
        token = jwt.encode(
            {"sub": user["id_usuario"], "rol": user["rol"], "exp": exp},
            os.getenv("JWT_SECRET"), algorithm="HS256"
        )
        try:
            registrar_evento(user["id_usuario"], "login", {}, request.remote_addr)
        except Exception:
            pass
        return jsonify({"token": token, "usuario": {
            "id": user["id_usuario"],
            "nombre": user["nombre"],
            "username": user["username"],
            "rol": user["rol"],
            "foto": user["url_foto_perfil"],
            "ciudad": user["ciudad"]
        }})
    finally:
        conn.close()


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id_usuario, nombre, username, correo, bio, ciudad, pais, url_foto_perfil, rol FROM usuarios WHERE id_usuario=%s",
                (g.user_id,)
            )
            user = cur.fetchone()
        return jsonify(user)
    finally:
        conn.close()
