from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..db.mongo_client import get_mongo_db
from ..middlewares.auth import token_required
from ..services.auditoria_service import registrar_evento
import datetime

pub_bp = Blueprint("publicaciones", __name__)


@pub_bp.route("/", methods=["GET"])
def feed():
    auth_header = request.headers.get("Authorization", "")
    user_id = None
    if auth_header.startswith("Bearer "):
        try:
            import jwt, os
            payload = jwt.decode(auth_header.split(" ")[1], os.getenv("JWT_SECRET"), algorithms=["HS256"])
            user_id = payload["sub"]
        except Exception:
            pass

    filter_user    = request.args.get("usuario_id")
    filter_negocio = request.args.get("negocio_id")
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            if filter_negocio:
                cur.execute("""
                    SELECT p.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor,
                           n.nombre AS negocio_nombre
                    FROM publicaciones p
                    JOIN usuarios u ON p.id_usuario = u.id_usuario
                    LEFT JOIN negocios n ON p.id_negocio_etiquetado = n.id_negocio
                    WHERE p.id_negocio_etiquetado=%s
                    ORDER BY p.fecha_creacion DESC LIMIT 50
                """, (filter_negocio,))
            elif filter_user:
                cur.execute("""
                    SELECT p.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor,
                           n.nombre AS negocio_nombre
                    FROM publicaciones p
                    JOIN usuarios u ON p.id_usuario = u.id_usuario
                    LEFT JOIN negocios n ON p.id_negocio_etiquetado = n.id_negocio
                    WHERE p.id_usuario=%s
                    ORDER BY p.fecha_creacion DESC LIMIT 50
                """, (filter_user,))
            else:
                cur.execute("""
                    SELECT p.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor,
                           n.nombre AS negocio_nombre
                    FROM publicaciones p
                    JOIN usuarios u ON p.id_usuario = u.id_usuario
                    LEFT JOIN negocios n ON p.id_negocio_etiquetado = n.id_negocio
                    ORDER BY p.fecha_creacion DESC LIMIT 50
                """)
            pubs = cur.fetchall()
        db = get_mongo_db()
        for pub in pubs:
            pub["likes"] = db.likes.count_documents({"id_publicacion": pub["id_publicacion"]})
            pub["comentarios"] = db.comentarios.count_documents({"id_publicacion": pub["id_publicacion"]})
            pub["liked"] = bool(db.likes.find_one({"id_publicacion": pub["id_publicacion"], "id_usuario": user_id})) if user_id else False
        return jsonify(pubs)
    finally:
        conn.close()


@pub_bp.route("/", methods=["POST"])
@token_required
def crear():
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO publicaciones (id_usuario, titulo, contenido, categoria, ciudad, pais, url_imagen, id_negocio_etiquetado) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (g.user_id, data.get("titulo"), data.get("contenido"), data.get("categoria"),
                 data.get("ciudad"), data.get("pais"), data.get("url_imagen"), data.get("id_negocio_etiquetado"))
            )
            conn.commit()
            pub_id = cur.lastrowid
        try:
            registrar_evento(g.user_id, "publicacion", {"id_publicacion": pub_id}, request.remote_addr)
        except Exception:
            pass
        return jsonify({"mensaje": "Publicación creada", "id_publicacion": pub_id}), 201
    finally:
        conn.close()


@pub_bp.route("/<int:pub_id>", methods=["PUT"])
@token_required
def editar(pub_id):
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            pub = cur.fetchone()
        if not pub or pub["id_usuario"] != g.user_id:
            return jsonify({"error": "Sin permiso"}), 403
        campos = {k: v for k, v in data.items() if k in ("titulo", "contenido", "ciudad", "url_imagen")}
        if not campos:
            return jsonify({"error": "Sin cambios"}), 400
        set_clause = ", ".join(f"{k}=%s" for k in campos)
        with conn.cursor() as cur:
            cur.execute(f"UPDATE publicaciones SET {set_clause} WHERE id_publicacion=%s",
                        (*campos.values(), pub_id))
            conn.commit()
        return jsonify({"mensaje": "Publicación actualizada"})
    finally:
        conn.close()


@pub_bp.route("/<int:pub_id>", methods=["DELETE"])
@token_required
def eliminar(pub_id):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            pub = cur.fetchone()
        if not pub or pub["id_usuario"] != g.user_id:
            return jsonify({"error": "Sin permiso"}), 403
        with conn.cursor() as cur:
            cur.execute("DELETE FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            conn.commit()
        db = get_mongo_db()
        db.likes.delete_many({"id_publicacion": pub_id})
        db.comentarios.delete_many({"id_publicacion": pub_id})
        db.notificaciones.delete_many({"id_publicacion": pub_id})
        return jsonify({"mensaje": "Publicación eliminada"})
    finally:
        conn.close()


@pub_bp.route("/<int:pub_id>/like", methods=["POST"])
@token_required
def toggle_like(pub_id):
    db = get_mongo_db()
    filtro = {"id_publicacion": pub_id, "id_usuario": g.user_id}
    if db.likes.find_one(filtro):
        db.likes.delete_one(filtro)
        return jsonify({"liked": False})
    db.likes.insert_one(filtro)
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            pub = cur.fetchone()
    finally:
        conn.close()
    if pub and pub["id_usuario"] != g.user_id:
        db.notificaciones.insert_one({
            "tipo": "like",
            "id_usuario_origen": g.user_id,
            "id_usuario_destino": pub["id_usuario"],
            "id_publicacion": pub_id,
            "leida": False,
            "fecha": datetime.datetime.utcnow()
        })
    return jsonify({"liked": True})


@pub_bp.route("/<int:pub_id>/comentarios", methods=["GET"])
def get_comentarios(pub_id):
    db = get_mongo_db()
    comentarios = list(db.comentarios.find({"id_publicacion": pub_id}).sort("fecha", 1))
    for c in comentarios:
        c["_id"] = str(c["_id"])
        if isinstance(c.get("fecha"), datetime.datetime):
            c["fecha"] = c["fecha"].isoformat()
    if comentarios:
        ids = list({c["id_usuario"] for c in comentarios})
        conn = get_mysql_connection()
        try:
            placeholders = ",".join(["%s"] * len(ids))
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id_usuario, nombre, url_foto_perfil FROM usuarios WHERE id_usuario IN ({placeholders})",
                    ids
                )
                users = {u["id_usuario"]: u for u in cur.fetchall()}
        finally:
            conn.close()
        for c in comentarios:
            u = users.get(c["id_usuario"], {})
            c["autor"] = u.get("nombre", "Usuario")
            c["foto_autor"] = u.get("url_foto_perfil")
    return jsonify(comentarios)


@pub_bp.route("/<int:pub_id>/comentarios", methods=["POST"])
@token_required
def comentar(pub_id):
    data = request.get_json()
    texto = data.get("texto", "").strip()
    if not texto:
        return jsonify({"error": "Texto requerido"}), 400
    db = get_mongo_db()
    db.comentarios.insert_one({
        "id_publicacion": pub_id,
        "id_usuario": g.user_id,
        "texto": texto,
        "fecha": datetime.datetime.utcnow()
    })
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            pub = cur.fetchone()
    finally:
        conn.close()
    if pub and pub["id_usuario"] != g.user_id:
        db.notificaciones.insert_one({
            "tipo": "comentario",
            "id_usuario_origen": g.user_id,
            "id_usuario_destino": pub["id_usuario"],
            "id_publicacion": pub_id,
            "texto_preview": texto[:60],
            "leida": False,
            "fecha": datetime.datetime.utcnow()
        })
    try:
        registrar_evento(g.user_id, "comentario", {"id_publicacion": pub_id}, request.remote_addr)
    except Exception:
        pass
    return jsonify({"mensaje": "Comentario añadido"}), 201
