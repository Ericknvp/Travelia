from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..db.mongo_client import get_mongo_db
from ..middlewares.auth import token_required
import datetime

amigos_bp = Blueprint("amigos", __name__)

@amigos_bp.route("/solicitud", methods=["POST"])
@token_required
def enviar_solicitud():
    id_receptor = request.get_json().get("id_receptor")
    if id_receptor == g.user_id:
        return jsonify({"error": "No puedes enviarte solicitud a ti mismo"}), 400
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT IGNORE INTO amistades (id_solicitante, id_receptor) VALUES (%s,%s)",
                (g.user_id, id_receptor)
            )
            conn.commit()
            affected = cur.rowcount
        if affected:
            try:
                db = get_mongo_db()
                db.notificaciones.insert_one({
                    "tipo": "amistad",
                    "id_usuario_origen": g.user_id,
                    "id_usuario_destino": id_receptor,
                    "leida": False,
                    "fecha": datetime.datetime.utcnow()
                })
            except Exception:
                pass
        return jsonify({"mensaje": "Solicitud enviada"}), 201
    finally:
        conn.close()

@amigos_bp.route("/solicitud/<int:id_amistad>", methods=["PUT"])
@token_required
def responder_solicitud(id_amistad):
    estado = request.get_json().get("estado")
    if estado not in ("aceptada", "rechazada"):
        return jsonify({"error": "Estado inválido"}), 400
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE amistades SET estado=%s, fecha_respuesta=NOW() WHERE id_amistad=%s AND id_receptor=%s",
                (estado, id_amistad, g.user_id)
            )
            conn.commit()
        return jsonify({"mensaje": f"Solicitud {estado}"})
    finally:
        conn.close()

@amigos_bp.route("/<int:id_amistad>", methods=["DELETE"])
@token_required
def eliminar_amistad(id_amistad):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM amistades WHERE id_amistad=%s AND (id_solicitante=%s OR id_receptor=%s)",
                (id_amistad, g.user_id, g.user_id)
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"error": "Amistad no encontrada"}), 404
        return jsonify({"mensaje": "Amistad eliminada"})
    finally:
        conn.close()

@amigos_bp.route("/", methods=["GET"])
@token_required
def listar_amigos():
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.id_amistad, u.id_usuario, u.nombre, u.username, u.url_foto_perfil, u.ciudad
                FROM amistades a
                JOIN usuarios u ON (
                    CASE WHEN a.id_solicitante = %s THEN a.id_receptor ELSE a.id_solicitante END = u.id_usuario
                )
                WHERE (a.id_solicitante = %s OR a.id_receptor = %s) AND a.estado = 'aceptada'
            """, (g.user_id, g.user_id, g.user_id))
            return jsonify(cur.fetchall())
    finally:
        conn.close()

@amigos_bp.route("/solicitudes/pendientes", methods=["GET"])
@token_required
def solicitudes_pendientes():
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.id_amistad, u.id_usuario, u.nombre, u.username, u.url_foto_perfil, a.fecha_solicitud
                FROM amistades a
                JOIN usuarios u ON a.id_solicitante = u.id_usuario
                WHERE a.id_receptor = %s AND a.estado = 'pendiente'
            """, (g.user_id,))
            return jsonify(cur.fetchall())
    finally:
        conn.close()
