from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..db.mongo_client import get_mongo_db
from ..middlewares.auth import token_required
from ..services.auditoria_service import registrar_evento
import datetime

pub_bp = Blueprint("publicaciones", __name__)


@pub_bp.route("/", methods=["GET"])
def feed():
    # intento leer el token aunque la ruta sea publica, para saber si el usuario dio like
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
            # dependiendo de los filtros que lleguen, traigo publicaciones de un negocio, de un usuario, o todas
            if filter_negocio:
                cur.execute("""
                    SELECT p.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor,
                           n.nombre AS negocio_nombre, n.url_foto_portada AS foto_negocio
                    FROM publicaciones p
                    JOIN usuarios u ON p.id_usuario = u.id_usuario
                    LEFT JOIN negocios n ON p.id_negocio_etiquetado = n.id_negocio
                    WHERE p.id_negocio_etiquetado=%s
                    ORDER BY p.fecha_creacion DESC LIMIT 50
                """, (filter_negocio,))
            elif filter_user:
                cur.execute("""
                    SELECT p.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor,
                           n.nombre AS negocio_nombre, n.url_foto_portada AS foto_negocio
                    FROM publicaciones p
                    JOIN usuarios u ON p.id_usuario = u.id_usuario
                    LEFT JOIN negocios n ON p.id_negocio_etiquetado = n.id_negocio
                    WHERE p.id_usuario=%s
                    ORDER BY p.fecha_creacion DESC LIMIT 50
                """, (filter_user,))
            else:
                cur.execute("""
                    SELECT p.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor,
                           n.nombre AS negocio_nombre, n.url_foto_portada AS foto_negocio
                    FROM publicaciones p
                    JOIN usuarios u ON p.id_usuario = u.id_usuario
                    LEFT JOIN negocios n ON p.id_negocio_etiquetado = n.id_negocio
                    ORDER BY p.fecha_creacion DESC LIMIT 50
                """)
            pubs = cur.fetchall()
        # los likes y comentarios viven en MongoDB, los agrego a cada publicacion
        db = get_mongo_db()
        for pub in pubs:
            pub["likes"] = db.likes.count_documents({"id_publicacion": pub["id_publicacion"]})
            pub["comentarios"] = db.comentarios.count_documents({"id_publicacion": pub["id_publicacion"]})
            # si hay sesion activa, verifico si este usuario ya dio like
            pub["liked"] = bool(db.likes.find_one({"id_publicacion": pub["id_publicacion"], "id_usuario": user_id})) if user_id else False
        return jsonify(pubs)
    finally:
        conn.close()


@pub_bp.route("/buscar", methods=["GET"])
def buscar():
    q        = request.args.get("q", "").strip()
    categoria = request.args.get("categoria", "").strip()
    like      = f"%{q}%"
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # construyo el WHERE dinamicamente segun los filtros que lleguen
            conditions = []
            params     = []
            if q:
                conditions.append("(p.ciudad LIKE %s OR p.titulo LIKE %s OR p.contenido LIKE %s)")
                params += [like, like, like]
            if categoria:
                conditions.append("p.categoria = %s")
                params.append(categoria)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"""
                SELECT p.id_publicacion, p.titulo, p.contenido, p.categoria,
                       p.ciudad, p.pais, p.url_imagen, p.fecha_creacion,
                       u.nombre AS autor, u.id_usuario, u.url_foto_perfil AS foto_autor
                FROM publicaciones p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                {where}
                ORDER BY p.fecha_creacion DESC LIMIT 40
            """, params)
            return jsonify(cur.fetchall())
    finally:
        conn.close()


@pub_bp.route("/", methods=["POST"])
@token_required
def crear():
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # inserto la publicacion con todos los campos que llegan del frontend
            cur.execute(
                "INSERT INTO publicaciones (id_usuario, titulo, contenido, categoria, ciudad, pais, url_imagen, id_negocio_etiquetado) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (g.user_id, data.get("titulo"), data.get("contenido"), data.get("categoria"),
                 data.get("ciudad"), data.get("pais"), data.get("url_imagen"), data.get("id_negocio_etiquetado"))
            )
            conn.commit()
            pub_id = cur.lastrowid
        # registro el evento en auditoria, si falla no corta el flujo principal
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
        # primero verifico que la publicacion exista y que pertenezca al usuario que hace la peticion
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            pub = cur.fetchone()
        if not pub or pub["id_usuario"] != g.user_id:
            return jsonify({"error": "Sin permiso"}), 403
        # solo actualizo los campos permitidos que llegaron en el body
        campos = {k: v for k, v in data.items() if k in ("titulo", "contenido", "ciudad", "pais", "url_imagen")}
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
        # verifico que la publicacion sea del usuario antes de borrar
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            pub = cur.fetchone()
        if not pub or pub["id_usuario"] != g.user_id:
            return jsonify({"error": "Sin permiso"}), 403
        with conn.cursor() as cur:
            cur.execute("DELETE FROM publicaciones WHERE id_publicacion=%s", (pub_id,))
            conn.commit()
        # borro tambien los likes, comentarios y notificaciones relacionados en MongoDB
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
    # si ya existe el like lo quito, si no existe lo agrego (toggle)
    if db.likes.find_one(filtro):
        db.likes.delete_one(filtro)
        return jsonify({"liked": False})
    db.likes.insert_one(filtro)
    # solo notifico al dueno de la publicacion si es otra persona distinta al que da like
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
    # traigo los comentarios de MongoDB ordenados de mas antiguo a mas reciente
    comentarios = list(db.comentarios.find({"id_publicacion": pub_id}).sort("fecha", 1))
    for c in comentarios:
        c["_id"] = str(c["_id"])
        if isinstance(c.get("fecha"), datetime.datetime):
            c["fecha"] = c["fecha"].isoformat()
    # los comentarios solo guardan el id del usuario, busco el nombre y foto en MySQL
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
    # el comentario se guarda en MongoDB con el id del usuario y la fecha actual
    db.comentarios.insert_one({
        "id_publicacion": pub_id,
        "id_usuario": g.user_id,
        "texto": texto,
        "fecha": datetime.datetime.utcnow()
    })
    # notifico al dueno de la publicacion si es distinto al que comenta
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


@pub_bp.route("/<int:pub_id>/comentarios/<string:comment_id>", methods=["DELETE"])
@token_required
def eliminar_comentario(pub_id, comment_id):
    from bson import ObjectId
    db = get_mongo_db()
    # el _id en MongoDB es un ObjectId, hay que convertirlo desde el string que llega
    try:
        oid = ObjectId(comment_id)
    except Exception:
        return jsonify({"error": "ID inválido"}), 400
    comentario = db.comentarios.find_one({"_id": oid, "id_publicacion": pub_id})
    if not comentario:
        return jsonify({"error": "Comentario no encontrado"}), 404
    # solo el autor del comentario puede borrarlo
    if comentario["id_usuario"] != g.user_id:
        return jsonify({"error": "Sin permiso"}), 403
    db.comentarios.delete_one({"_id": oid})
    return jsonify({"mensaje": "Comentario eliminado"})


@pub_bp.route("/<int:pub_id>/comentarios/<string:comment_id>", methods=["PUT"])
@token_required
def editar_comentario(pub_id, comment_id):
    from bson import ObjectId
    data = request.get_json()
    texto = data.get("texto", "").strip()
    if not texto:
        return jsonify({"error": "Texto requerido"}), 400
    db = get_mongo_db()
    try:
        oid = ObjectId(comment_id)
    except Exception:
        return jsonify({"error": "ID inválido"}), 400
    comentario = db.comentarios.find_one({"_id": oid, "id_publicacion": pub_id})
    if not comentario:
        return jsonify({"error": "Comentario no encontrado"}), 404
    if comentario["id_usuario"] != g.user_id:
        return jsonify({"error": "Sin permiso"}), 403
    # uso $set para actualizar solo los campos necesarios y marco el comentario como editado
    db.comentarios.update_one({"_id": oid}, {"$set": {"texto": texto, "editado": True}})
    return jsonify({"mensaje": "Comentario editado"})
