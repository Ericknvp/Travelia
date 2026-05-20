import datetime
from ..db.mongo_client import get_mongo_db

def registrar_evento(id_usuario, tipo, detalle, ip=None):
    db = get_mongo_db()
    db.auditoria.insert_one({
        "id_usuario": id_usuario,
        "tipo": tipo,
        "detalle": detalle,
        "ip": ip,
        "fecha": datetime.datetime.utcnow()
    })
