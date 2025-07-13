import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.chat import chat_bp
from src.routes.repository import repo_bp
from src.routes.files import files_bp
from src.config import config

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configure CORS for frontend-backend communication
CORS(app, supports_credentials=True)

# Use configuration from config.yaml
app.config['SECRET_KEY'] = config.secret_key

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(repo_bp, url_prefix='/api')
app.register_blueprint(files_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host=config.app_host, port=config.app_port, debug=config.app_debug)
