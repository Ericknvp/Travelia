from flask import Blueprint, request, jsonify, send_from_directory, current_app
from ..middlewares.auth import token_required
import os, uuid

upload_bp = Blueprint("upload", __name__)
ALLOWED = {"png", "jpg", "jpeg", "gif", "webp"}

@upload_bp.route("/", methods=["POST"])
@token_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "Sin archivo"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Nombre vacío"}), 400
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ALLOWED:
        return jsonify({"error": "Solo se permiten imágenes (png, jpg, jpeg, gif, webp)"}), 400
    name = f"{uuid.uuid4().hex}.{ext}"
    folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(folder, exist_ok=True)
    f.save(os.path.join(folder, name))
    url = f"{request.host_url.rstrip('/')}/api/upload/files/{name}"
    return jsonify({"url": url}), 201

@upload_bp.route("/files/<filename>", methods=["GET"])
def serve_file(filename):
    resp = send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp
