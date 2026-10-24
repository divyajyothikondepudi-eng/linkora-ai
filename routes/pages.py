
from flask import Blueprint, render_template

from routes.auth import login_required

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
def home():
    return render_template("home.html")


@pages_bp.route("/chat")
@login_required
def chat():
    return render_template("index.html")
