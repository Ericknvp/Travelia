from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required

negocios_bp = Blueprint("negocios", __name__)

@negocios_bp.route("/", methods=["GET"])
def listar():
    # si llega el parametro tipo, filtro por hotel o restaurante, si no devuelvo todos
    tipo = request.args.get("tipo")
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            if tipo in ("hotel", "restaurante"):
                cur.execute("SELECT * FROM negocios WHERE tipo=%s ORDER BY calificacion_promedio DESC", (tipo,))
            else:
                cur.execute("SELECT * FROM negocios ORDER BY calificacion_promedio DESC")
            return jsonify(cur.fetchall())
    finally:
        conn.close()

@negocios_bp.route("/", methods=["POST"])
@token_required
def crear():
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # el id_usuario viene del token, no del body, para que nadie pueda crear un negocio a nombre de otro
            cur.execute(
                "INSERT INTO negocios (id_usuario, nombre, tipo, descripcion, ciudad, pais, direccion, url_foto_portada) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (g.user_id, data.get("nombre"), data.get("tipo"), data.get("descripcion"),
                 data.get("ciudad"), data.get("pais"), data.get("direccion"), data.get("url_foto_portada"))
            )
            conn.commit()
            return jsonify({"mensaje": "Negocio creado", "id_negocio": cur.lastrowid}), 201
    finally:
        conn.close()

@negocios_bp.route("/mio", methods=["GET"])
@token_required
def mi_negocio():
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # busco el negocio del usuario autenticado, solo puede tener uno
            cur.execute("SELECT * FROM negocios WHERE id_usuario=%s LIMIT 1", (g.user_id,))
            neg = cur.fetchone()
        if not neg:
            return jsonify({"error": "No tienes un negocio registrado"}), 404
        return jsonify(neg)
    finally:
        conn.close()

@negocios_bp.route("/<int:id_negocio>", methods=["GET"])
def obtener(id_negocio):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM negocios WHERE id_negocio=%s", (id_negocio,))
            neg = cur.fetchone()
        if not neg:
            return jsonify({"error": "Negocio no encontrado"}), 404
        return jsonify(neg)
    finally:
        conn.close()

@negocios_bp.route("/<int:id_negocio>", methods=["PUT"])
@token_required
def editar(id_negocio):
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        # verifico que el negocio exista y que pertenezca al usuario que hace la peticion
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM negocios WHERE id_negocio=%s", (id_negocio,))
            neg = cur.fetchone()
        if not neg or neg["id_usuario"] != g.user_id:
            return jsonify({"error": "Sin permiso"}), 403
        # solo actualizo los campos permitidos que llegaron en el body
        campos = {k: v for k, v in data.items() if k in ("nombre", "tipo", "descripcion", "ciudad", "pais", "direccion", "url_foto_portada")}
        if not campos:
            return jsonify({"error": "Sin cambios"}), 400
        set_clause = ", ".join(f"{k}=%s" for k in campos)
        with conn.cursor() as cur:
            cur.execute(f"UPDATE negocios SET {set_clause} WHERE id_negocio=%s", (*campos.values(), id_negocio))
            conn.commit()
        return jsonify({"mensaje": "Negocio actualizado"})
    finally:
        conn.close()


@negocios_bp.route("/<int:id_negocio>", methods=["DELETE"])
@token_required
def eliminar(id_negocio):
    conn = get_mysql_connection()
    try:
        # verifico que sea el dueno antes de eliminar
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario FROM negocios WHERE id_negocio=%s", (id_negocio,))
            neg = cur.fetchone()
        if not neg or neg["id_usuario"] != g.user_id:
            return jsonify({"error": "Sin permiso"}), 403
        with conn.cursor() as cur:
            cur.execute("DELETE FROM negocios WHERE id_negocio=%s", (id_negocio,))
            conn.commit()
        return jsonify({"mensaje": "Negocio eliminado"})
    finally:
        conn.close()


@negocios_bp.route("/<int:id_negocio>/resenia", methods=["GET"])
def listar_resenias(id_negocio):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # hago JOIN con usuarios para traer el nombre y foto del autor de cada resenia
            cur.execute("""
                SELECT r.*, u.nombre AS autor, u.url_foto_perfil AS foto_autor
                FROM resenias r
                JOIN usuarios u ON r.id_usuario = u.id_usuario
                WHERE r.id_negocio = %s
            """, (id_negocio,))
            return jsonify(cur.fetchall())
    finally:
        conn.close()

@negocios_bp.route("/<int:id_negocio>/resenia", methods=["POST"])
@token_required
def crear_resenia(id_negocio):
    data = request.get_json()
    calificacion = data.get("calificacion")
    if not isinstance(calificacion, int) or not (1 <= calificacion <= 5):
        return jsonify({"error": "Calificación debe ser entre 1 y 5"}), 400
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            # ON DUPLICATE KEY UPDATE permite que el usuario actualice su resenia si ya tenia una
            cur.execute(
                "INSERT INTO resenias (id_negocio, id_usuario, calificacion, texto) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE calificacion=%s, texto=%s",
                (id_negocio, g.user_id, calificacion, data.get("texto"), calificacion, data.get("texto"))
            )
            # recalculo el promedio del negocio con todas sus resenias actuales
            cur.execute(
                "UPDATE negocios SET calificacion_promedio = (SELECT AVG(calificacion) FROM resenias WHERE id_negocio=%s) WHERE id_negocio=%s",
                (id_negocio, id_negocio)
            )
            conn.commit()
        return jsonify({"mensaje": "Reseña guardada"}), 201
    finally:
        conn.close()

@negocios_bp.route("/<int:id_negocio>/mesas", methods=["GET"])
@token_required
def listar_mesas(id_negocio):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM mesas WHERE id_negocio=%s", (id_negocio,))
            return jsonify(cur.fetchall())
    finally:
        conn.close()

@negocios_bp.route("/<int:id_negocio>/mesas", methods=["POST"])
@token_required
def crear_mesa(id_negocio):
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO mesas (id_negocio, numero_mesa, capacidad) VALUES (%s,%s,%s)",
                (id_negocio, data.get("numero_mesa"), data.get("capacidad"))
            )
            conn.commit()
        return jsonify({"mensaje": "Mesa creada"}), 201
    finally:
        conn.close()
