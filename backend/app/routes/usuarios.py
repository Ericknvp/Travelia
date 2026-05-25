from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required

usuarios_bp = Blueprint("usuarios", __name__)


@usuarios_bp.route("/me", methods=["PUT"])
@token_required
def update_me():
    data = request.get_json()
    # solo permito actualizar los campos que tienen sentido, ignoro cualquier otro que llegue
    campos = {k: v for k, v in data.items() if k in ("nombre", "bio", "ciudad", "pais", "url_foto_perfil", "username", "fecha_nacimiento")}
    if not campos:
        return jsonify({"error": "Sin campos para actualizar"}), 400
    conn = get_mysql_connection()
    try:
        # si el usuario quiere cambiar su username, verifico que no lo tenga otro
        if "username" in campos:
            with conn.cursor() as cur:
                cur.execute("SELECT id_usuario FROM usuarios WHERE username=%s AND id_usuario!=%s", (campos["username"], g.user_id))
                if cur.fetchone():
                    return jsonify({"error": "Ese nombre de usuario ya está en uso"}), 409
        # construyo el SET dinamicamente con los campos que llegaron
        set_clause = ", ".join(f"{k}=%s" for k in campos)
        with conn.cursor() as cur:
            cur.execute(f"UPDATE usuarios SET {set_clause} WHERE id_usuario=%s",
                        (*campos.values(), g.user_id))
            conn.commit()
        return jsonify({"mensaje": "Perfil actualizado"})
    finally:
        conn.close()


@usuarios_bp.route("/<int:user_id>", methods=["GET"])
def get_usuario(user_id):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # traigo el perfil publico del usuario, sin datos sensibles como correo o contrasena
            cur.execute(
                "SELECT id_usuario, nombre, username, bio, ciudad, pais, url_foto_perfil, rol, fecha_registro FROM usuarios WHERE id_usuario=%s",
                (user_id,)
            )
            user = cur.fetchone()
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
        # agrego el conteo de amigos aceptados al perfil
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS total FROM amistades WHERE (id_solicitante=%s OR id_receptor=%s) AND estado='aceptada'",
                (user_id, user_id)
            )
            user["total_amigos"] = cur.fetchone()["total"]
        return jsonify(user)
    finally:
        conn.close()


@usuarios_bp.route("/buscar", methods=["GET"])
def buscar():
    q = request.args.get("q", "").strip()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            if q:
                # busco por nombre o username con LIKE para resultados parciales
                cur.execute(
                    "SELECT id_usuario, nombre, username, ciudad, url_foto_perfil FROM usuarios WHERE nombre LIKE %s OR username LIKE %s ORDER BY nombre LIMIT 20",
                    (f"%{q}%", f"%{q}%")
                )
            else:
                # si no hay busqueda, muestro los usuarios mas recientes
                cur.execute(
                    "SELECT id_usuario, nombre, username, ciudad, url_foto_perfil FROM usuarios ORDER BY fecha_registro DESC LIMIT 30"
                )
            return jsonify(cur.fetchall())
    finally:
        conn.close()


@usuarios_bp.route("/sugerencias", methods=["GET"])
@token_required
def sugerencias():
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # busco todos los usuarios con los que ya tengo alguna relacion (enviada o recibida)
            cur.execute("""
                SELECT id_receptor AS id_otro FROM amistades WHERE id_solicitante = %s
                UNION
                SELECT id_solicitante AS id_otro FROM amistades WHERE id_receptor = %s
            """, (g.user_id, g.user_id))
            excluidos = {r["id_otro"] for r in cur.fetchall()}
            # me excluyo a mi mismo de las sugerencias
            excluidos.add(g.user_id)
            placeholders = ",".join(["%s"] * len(excluidos))
            # devuelvo usuarios que no esten en mi lista de excluidos
            cur.execute(
                f"SELECT id_usuario, nombre, username, ciudad, url_foto_perfil FROM usuarios WHERE id_usuario NOT IN ({placeholders}) ORDER BY fecha_registro DESC LIMIT 30",
                list(excluidos)
            )
            return jsonify(cur.fetchall())
    finally:
        conn.close()
