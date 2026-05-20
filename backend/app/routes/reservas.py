from flask import Blueprint, request, jsonify, g
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required
from ..services.auditoria_service import registrar_evento

reservas_bp = Blueprint("reservas", __name__)

@reservas_bp.route("/", methods=["POST"])
@token_required
def crear():
    data = request.get_json()
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id_mesa FROM reservas
                WHERE id_mesa=%s AND fecha_reserva=%s AND hora_reserva=%s AND estado != 'cancelada'
            """, (data.get("id_mesa"), data.get("fecha_reserva"), data.get("hora_reserva")))
            if cur.fetchone():
                return jsonify({"error": "Mesa no disponible en ese horario"}), 409
            cur.execute(
                "INSERT INTO reservas (id_usuario, id_mesa, fecha_reserva, hora_reserva, num_personas) VALUES (%s,%s,%s,%s,%s)",
                (g.user_id, data.get("id_mesa"), data.get("fecha_reserva"), data.get("hora_reserva"), data.get("num_personas"))
            )
            conn.commit()
            res_id = cur.lastrowid
        registrar_evento(g.user_id, "reserva", {"id_reserva": res_id}, request.remote_addr)
        return jsonify({"mensaje": "Reserva creada", "id_reserva": res_id}), 201
    finally:
        conn.close()

@reservas_bp.route("/mis-reservas", methods=["GET"])
@token_required
def mis_reservas():
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT r.*, m.numero_mesa, m.capacidad, n.nombre AS negocio, n.tipo
                FROM reservas r
                JOIN mesas m ON r.id_mesa = m.id_mesa
                JOIN negocios n ON m.id_negocio = n.id_negocio
                WHERE r.id_usuario=%s ORDER BY r.fecha_reserva DESC
            """, (g.user_id,))
            return jsonify(cur.fetchall())
    finally:
        conn.close()

@reservas_bp.route("/<int:id_reserva>/cancelar", methods=["PUT"])
@token_required
def cancelar(id_reserva):
    conn = get_mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE reservas SET estado='cancelada', fecha_cancelacion=NOW() WHERE id_reserva=%s AND id_usuario=%s",
                (id_reserva, g.user_id)
            )
            conn.commit()
        return jsonify({"mensaje": "Reserva cancelada"})
    finally:
        conn.close()
