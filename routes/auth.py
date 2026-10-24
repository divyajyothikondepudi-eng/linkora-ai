
import re
from functools import wraps

from flask import Blueprint, current_app, jsonify, request, session, redirect, url_for
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash

from database.extensions import db
from database.models import User

auth_bp = Blueprint("auth", __name__)


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        user_id = session.get("user_id")

        if not user_id or db.session.get(User, user_id) is None:
            session.clear()

            # APIs should return JSON; browser pages should redirect.
            if request.path.startswith("/api/"):
                return jsonify(
                    success=False,
                    message="Please log in to continue."
                ), 401

            return redirect(url_for("pages.home", auth="login"))

        return view(*args, **kwargs)

    return wrapped_view


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    full_name = data.get("fullName", "")
    email = data.get("email", "")
    password = data.get("password", "")
    confirm_password = data.get("confirmPassword", "")

    if not all(isinstance(value, str) for value in
               [full_name, email, password, confirm_password]):
        return jsonify(success=False, message="Invalid input."), 400

    full_name = full_name.strip()
    email = email.strip().lower()

    if not full_name or len(full_name) > 120:
        return jsonify(success=False, message="Please enter a valid name."), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify(success=False, message="Please enter a valid email address."), 400

    if len(password) < 8:
        return jsonify(success=False, message="Password must contain at least 8 characters."), 400

    if password != confirm_password:
        return jsonify(success=False, message="Passwords do not match."), 400

    user = User(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
    )

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(
            success=False,
            message="An account with this email already exists. Please log in."
        ), 409
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Registration failed")
        return jsonify(
            success=False,
            message="Registration failed. Please try again."
        ), 500

    session.clear()
    session["user_id"] = user.id
    session.permanent = True

    return jsonify(
        success=True,
        message="Account created successfully!",
        redirect=url_for("pages.chat"),
    ), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "")
    password = data.get("password", "")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify(success=False, message="Invalid input."), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify(success=False, message="Enter your email and password."), 400

    user = db.session.execute(
        db.select(User).filter_by(email=email)
    ).scalar_one_or_none()

    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify(success=False, message="Incorrect email or password."), 401

    session.clear()
    session["user_id"] = user.id
    session.permanent = True

    return jsonify(
        success=True,
        message="Login successful!",
        redirect=url_for("pages.chat"),
    )


@auth_bp.route("/api/me", methods=["GET"])
@login_required
def current_user():
    user = db.session.get(User, session["user_id"])

    if user is None:
        session.clear()
        return jsonify(success=False, message="User not found."), 404

    return jsonify(
        success=True,
        user={
            "full_name": user.full_name,
            "email": user.email,
        },
    )


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    return jsonify(success=True, redirect=url_for("pages.home"))
