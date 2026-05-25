from flask import Blueprint, request, jsonify
from ..db.mongo_client import get_mongo_db
from ..middlewares.auth import admin_required

auditoria_bp = Blueprint("auditoria", __name__)

@auditoria_bp.route("/", methods=["GET"])
@admin_required
def listar():
    db = get_mongo_db()
    filtro = {}
    # si llegan parametros de busqueda los agrego al filtro, si no devuelvo todos los eventos
    if request.args.get("id_usuario"):
        filtro["id_usuario"] = int(request.args.get("id_usuario"))
    if request.args.get("tipo"):
        filtro["tipo"] = request.args.get("tipo")
    # los eventos se guardan en MongoDB, los ordeno del mas reciente al mas antiguo
    # el {"_id": 0} excluye el _id de MongoDB para no tener que convertirlo a string
    eventos = list(db.auditoria.find(filtro, {"_id": 0}).sort("fecha", -1).limit(200))
    return jsonify(eventos)
