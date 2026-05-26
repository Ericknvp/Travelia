import datetime
from ..db.mongo_client import get_mongo_db

def registrar_evento(id_usuario, tipo, detalle, ip=None):
    # guardo cada accion importante del sistema en MongoDB para tener un historial
    # se llama desde los routes despues de operaciones como login, registro, reserva, etc.
    # si falla no corta el flujo principal porque siempre se llama dentro de un try/except
    db = get_mongo_db()
    db.auditoria.insert_one({
        "id_usuario": id_usuario,
        "tipo": tipo,       # login, registro, publicación, reserva
        "detalle": detalle, # datos extra de la acción, varia segun el tipo
        "ip": ip,           # ip desde donde se hizo la accion
        "fecha": datetime.datetime.utcnow()
    })
