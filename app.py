
from flask import Flask

from config import Config
from database.extensions import db
from database.models import User, Conversation, ChatMessage
from routes.auth import auth_bp
from routes.pages import pages_bp
from routes.conversations import conversations_bp
from routes.ai import ai_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Limit the total size of a single upload request.
    app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY is missing from your .env file.")

    if not all([
        app.config.get("DB_NAME"),
        app.config.get("DB_USER"),
        app.config.get("DB_PASSWORD"),
    ]):
        raise RuntimeError(
            "Please configure DB_NAME, DB_USER and DB_PASSWORD in .env."
        )

    db.init_app(app)

    app.register_blueprint(pages_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(ai_bp)

    return app


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    print("Linkora AI application initialized.")
    print("Home page: http://127.0.0.1:5000/")
    print("Chat page: http://127.0.0.1:5000/chat")

    app.run(debug=True)
