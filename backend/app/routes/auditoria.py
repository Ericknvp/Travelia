from flask import Blueprint, request, jsonify
from ..db.mongo_client import get_mongo_db
from ..middlewares.auth import admin_required

auditoria_bp = Blueprint("auditoria", __name__)

@auditoria_bp.route("/", methods=["GET"])
@admin_required
def listar():
    db = get_mongo_db()
    filtro = {}
    if request.args.get("id_usuario"):
        filtro["id_usuario"] = int(request.args.get("id_usuario"))
    if request.args.get("tipo"):
        filtro["tipo"] = request.args.get("tipo")
    eventos = list(db.auditoria.find(filtro, {"_id": 0}).sort("fecha", -1).limit(200))
    return jsonify(eventos)
