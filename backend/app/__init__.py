from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")

    CORS(app,
         origins=[
             os.getenv("FRONTEND_URL", "http://localhost:5500"),
             "http://127.0.0.1:5500",
             "http://localhost:5500",
         ],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
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
