from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required

usuarios_bp = Blueprint("usuarios", __name__)


@usuarios_bp.route("/me", methods=["PUT"])
@token_required
def update_me():
    data = request.get_json()
    campos = {k: v for k, v in data.items() if k in ("nombre", "bio", "ciudad", "pais", "url_foto_perfil", "username")}
    if not campos:
        return jsonify({"error": "Sin campos para actualizar"}), 400
    conn = get_mysql_connection()
    try:
        if "username" in campos:
            with conn.cursor() as cur:
                cur.execute("SELECT id_usuario FROM usuarios WHERE username=%s AND id_usuario!=%s", (campos["username"], g.user_id))
                if cur.fetchone():
                    return jsonify({"error": "Ese nombre de usuario ya está en uso"}), 409
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
            cur.execute(
                "SELECT id_usuario, nombre, username, bio, ciudad, pais, url_foto_perfil, rol, fecha_registro FROM usuarios WHERE id_usuario=%s",
                (user_id,)
            )
            user = cur.fetchone()
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
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
                cur.execute(
                    "SELECT id_usuario, nombre, username, ciudad, url_foto_perfil FROM usuarios WHERE nombre LIKE %s OR username LIKE %s ORDER BY nombre LIMIT 20",
                    (f"%{q}%", f"%{q}%")
                )
            else:
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
            cur.execute("""
                SELECT id_receptor AS id_otro FROM amistades WHERE id_solicitante = %s
                UNION
                SELECT id_solicitante AS id_otro FROM amistades WHERE id_receptor = %s
            """, (g.user_id, g.user_id))
            excluidos = {r["id_otro"] for r in cur.fetchall()}
            excluidos.add(g.user_id)
            placeholders = ",".join(["%s"] * len(excluidos))
            cur.execute(
                f"SELECT id_usuario, nombre, username, ciudad, url_foto_perfil FROM usuarios WHERE id_usuario NOT IN ({placeholders}) ORDER BY fecha_registro DESC LIMIT 30",
                list(excluidos)
            )
            return jsonify(cur.fetchall())
    finally:
        conn.close()
