from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os, datetime, decimal
load_dotenv()

class _JSONProvider(Flask.json_provider_class):
    def default(self, o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super().default(o)

def create_app():
    app = Flask(__name__)
    app.json_provider_class = _JSONProvider
    app.json = _JSONProvider(app)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")

    CORS(app,
         origins="*",
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    from .routes.auth import auth_bp
    from .routes.usuarios import usuarios_bp
    from .routes.publicaciones import pub_bp
    from .routes.amigos import amigos_bp
    from .routes.negocios import negocios_bp
    from .routes.reservas import reservas_bp
    from .routes.auditoria import auditoria_bp
    from .routes.upload import upload_bp
    from .routes.notificaciones import notif_bp

    app.register_blueprint(auth_bp,         url_prefix="/api/auth")
    app.register_blueprint(usuarios_bp,     url_prefix="/api/usuarios")
    app.register_blueprint(pub_bp,          url_prefix="/api/publicaciones")
    app.register_blueprint(amigos_bp,       url_prefix="/api/amigos")
    app.register_blueprint(negocios_bp,     url_prefix="/api/negocios")
    app.register_blueprint(reservas_bp,     url_prefix="/api/reservas")
    app.register_blueprint(auditoria_bp,    url_prefix="/api/auditoria")
    app.register_blueprint(upload_bp,       url_prefix="/api/upload")
    app.register_blueprint(notif_bp,        url_prefix="/api/notificaciones")

    return app
