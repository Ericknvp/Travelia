from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required

negocios_bp = Blueprint("negocios", __name__)

@negocios_bp.route("/", methods=["GET"])
def listar():
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
            cur.execute(
                "INSERT INTO resenias (id_negocio, id_usuario, calificacion, texto) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE calificacion=%s, texto=%s",
                (id_negocio, g.user_id, calificacion, data.get("texto"), calificacion, data.get("texto"))
            )
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
