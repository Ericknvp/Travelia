from flask import Blueprint, jsonify, g
from ..db.mongo_client import get_mongo_db
from ..db.mysql_client import get_mysql_connection
from ..middlewares.auth import token_required
import datetime

notif_bp = Blueprint("notificaciones", __name__)

@notif_bp.route("/", methods=["GET"])
@token_required
def get_notificaciones():
    db = get_mongo_db()
    notifs = list(db.notificaciones.find(
        {"id_usuario_destino": g.user_id},
        sort=[("fecha", -1)],
        limit=50
    ))
    for n in notifs:
        n["_id"] = str(n["_id"])
        if isinstance(n.get("fecha"), datetime.datetime):
            n["fecha"] = n["fecha"].isoformat()

    if notifs:
        ids = list({n["id_usuario_origen"] for n in notifs})
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
        for n in notifs:
            u = users.get(n["id_usuario_origen"], {})
            n["nombre_origen"] = u.get("nombre", "Alguien")
            n["foto_origen"] = u.get("url_foto_perfil")

    return jsonify(notifs)

@notif_bp.route("/count", methods=["GET"])
@token_required
def count_unread():
    db = get_mongo_db()
    count = db.notificaciones.count_documents({"id_usuario_destino": g.user_id, "leida": False})
    return jsonify({"count": count})

@notif_bp.route("/marcar-leidas", methods=["PUT"])
@token_required
def marcar_leidas():
    db = get_mongo_db()
    db.notificaciones.update_many(
        {"id_usuario_destino": g.user_id, "leida": False},
        {"$set": {"leida": True}}
    )
    return jsonify({"mensaje": "OK"})
