
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request, session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from database.extensions import db
from database.models import Conversation, ChatMessage
from routes.auth import login_required


conversations_bp = Blueprint("conversations", __name__)


def to_datetime(timestamp):
    """Convert a JavaScript timestamp in milliseconds to UTC."""
    if (
        isinstance(timestamp, bool)
        or not isinstance(timestamp, (int, float))
    ):
        raise ValueError("Invalid timestamp.")

    return datetime.fromtimestamp(
        timestamp / 1000,
        tz=timezone.utc,
    )


def to_milliseconds(value):
    """Convert a database datetime to JavaScript milliseconds."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return int(value.timestamp() * 1000)


def serialize_conversation(conversation):
    return {
        "id": conversation.client_id,
        "title": conversation.title,
        "updatedAt": to_milliseconds(conversation.updated_at),
        "messages": [
            {
                "role": message.role,
                "content": message.content,
                "createdAt": to_milliseconds(message.created_at),
            }
            for message in conversation.messages
        ],
    }


@conversations_bp.route("/api/conversations", methods=["GET"])
@login_required
def get_conversations():
    user_id = session["user_id"]

    conversations = db.session.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    ).scalars().all()

    return jsonify(
        success=True,
        conversations=[
            serialize_conversation(item)
            for item in conversations
        ],
    )


@conversations_bp.route("/api/conversations", methods=["PUT"])
@login_required
def save_conversations():
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}
    items = data.get("conversations")

    if not isinstance(items, list):
        return jsonify(
            success=False,
            message="Invalid conversations payload.",
        ), 400

    # Validate the complete request before modifying the database.
    prepared = []
    seen_ids = set()

    try:
        for item in items:
            if not isinstance(item, dict):
                raise ValueError("Invalid conversation.")

            client_id = item.get("id")
            title = item.get("title")
            messages = item.get("messages")

            if (
                not isinstance(client_id, str)
                or not client_id
                or len(client_id) > 36
            ):
                raise ValueError("Invalid conversation ID.")

            if client_id in seen_ids:
                raise ValueError("Duplicate conversation ID.")

            seen_ids.add(client_id)

            if not isinstance(title, str) or not title.strip():
                raise ValueError("Invalid conversation title.")

            if not isinstance(messages, list):
                raise ValueError("Invalid messages list.")

            updated_at = to_datetime(item.get("updatedAt"))

            prepared_messages = []

            for message in messages:
                if not isinstance(message, dict):
                    raise ValueError("Invalid message.")

                role = message.get("role")
                content = message.get("content")

                if role not in ("user", "assistant"):
                    raise ValueError("Invalid message role.")

                if not isinstance(content, str):
                    raise ValueError("Invalid message content.")

                created_at = to_datetime(message.get("createdAt"))

                prepared_messages.append({
                    "role": role,
                    "content": content,
                    "created_at": created_at,
                })

            prepared.append({
                "client_id": client_id,
                "title": title.strip()[:255],
                "updated_at": updated_at,
                "messages": prepared_messages,
            })

    except (ValueError, TypeError, OverflowError, OSError):
        return jsonify(
            success=False,
            message="Invalid conversation or message data.",
        ), 400

    try:
        for item in prepared:
            conversation = db.session.execute(
                select(Conversation).where(
                    Conversation.user_id == user_id,
                    Conversation.client_id == item["client_id"],
                )
            ).scalar_one_or_none()

            if conversation is None:
                conversation = Conversation(
                    user_id=user_id,
                    client_id=item["client_id"],
                    title=item["title"],
                    updated_at=item["updated_at"],
                )
                db.session.add(conversation)
                db.session.flush()

            conversation.title = item["title"]
            conversation.updated_at = item["updated_at"]

            # Update existing messages, append new ones, and remove
            # excess messages only within this specific conversation.
            existing_messages = list(conversation.messages)
            incoming_messages = item["messages"]

            for index, incoming in enumerate(incoming_messages):
                if index < len(existing_messages):
                    message = existing_messages[index]
                    message.role = incoming["role"]
                    message.content = incoming["content"]
                    message.created_at = incoming["created_at"]
                else:
                    conversation.messages.append(
                        ChatMessage(
                            role=incoming["role"],
                            content=incoming["content"],
                            created_at=incoming["created_at"],
                        )
                    )

            for message in existing_messages[len(incoming_messages):]:
                db.session.delete(message)

        # Do not delete conversations omitted from the request.
        db.session.commit()

        return jsonify(success=True, message="Chat history saved.")

    except IntegrityError:
        db.session.rollback()
        current_app.logger.exception(
            "Conversation history constraint failure"
        )
        return jsonify(
            success=False,
            message="Could not save chat history. Please retry.",
        ), 409

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Saving chat history failed")
        return jsonify(
            success=False,
            message="Could not save chat history.",
        ), 500

from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request, session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from database.extensions import db
from database.models import Conversation, ChatMessage
from routes.auth import login_required


conversations_bp = Blueprint("conversations", __name__)


def to_datetime(timestamp):
    """Convert a JavaScript timestamp in milliseconds to UTC."""
    if (
        isinstance(timestamp, bool)
        or not isinstance(timestamp, (int, float))
    ):
        raise ValueError("Invalid timestamp.")

    return datetime.fromtimestamp(
        timestamp / 1000,
        tz=timezone.utc,
    )


def to_milliseconds(value):
    """Convert a database datetime to JavaScript milliseconds."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return int(value.timestamp() * 1000)


def serialize_conversation(conversation):
    return {
        "id": conversation.client_id,
        "title": conversation.title,
        "updatedAt": to_milliseconds(conversation.updated_at),
        "messages": [
            {
                "role": message.role,
                "content": message.content,
                "createdAt": to_milliseconds(message.created_at),
            }
            for message in conversation.messages
        ],
    }


@conversations_bp.route("/api/conversations", methods=["GET"])
@login_required
def get_conversations():
    user_id = session["user_id"]

    conversations = db.session.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    ).scalars().all()

    return jsonify(
        success=True,
        conversations=[
            serialize_conversation(item)
            for item in conversations
        ],
    )


@conversations_bp.route("/api/conversations", methods=["PUT"])
@login_required
def save_conversations():
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}
    items = data.get("conversations")

    if not isinstance(items, list):
        return jsonify(
            success=False,
            message="Invalid conversations payload.",
        ), 400

    # Validate the complete request before modifying the database.
    prepared = []
    seen_ids = set()

    try:
        for item in items:
            if not isinstance(item, dict):
                raise ValueError("Invalid conversation.")

            client_id = item.get("id")
            title = item.get("title")
            messages = item.get("messages")

            if (
                not isinstance(client_id, str)
                or not client_id
                or len(client_id) > 36
            ):
                raise ValueError("Invalid conversation ID.")

            if client_id in seen_ids:
                raise ValueError("Duplicate conversation ID.")

            seen_ids.add(client_id)

            if not isinstance(title, str) or not title.strip():
                raise ValueError("Invalid conversation title.")

            if not isinstance(messages, list):
                raise ValueError("Invalid messages list.")

            updated_at = to_datetime(item.get("updatedAt"))

            prepared_messages = []

            for message in messages:
                if not isinstance(message, dict):
                    raise ValueError("Invalid message.")

                role = message.get("role")
                content = message.get("content")

                if role not in ("user", "assistant"):
                    raise ValueError("Invalid message role.")

                if not isinstance(content, str):
                    raise ValueError("Invalid message content.")

                created_at = to_datetime(message.get("createdAt"))

                prepared_messages.append({
                    "role": role,
                    "content": content,
                    "created_at": created_at,
                })

            prepared.append({
                "client_id": client_id,
                "title": title.strip()[:255],
                "updated_at": updated_at,
                "messages": prepared_messages,
            })

    except (ValueError, TypeError, OverflowError, OSError):
        return jsonify(
            success=False,
            message="Invalid conversation or message data.",
        ), 400

    try:
        for item in prepared:
            conversation = db.session.execute(
                select(Conversation).where(
                    Conversation.user_id == user_id,
                    Conversation.client_id == item["client_id"],
                )
            ).scalar_one_or_none()

            if conversation is None:
                conversation = Conversation(
                    user_id=user_id,
                    client_id=item["client_id"],
                    title=item["title"],
                    updated_at=item["updated_at"],
                )
                db.session.add(conversation)
                db.session.flush()

            conversation.title = item["title"]
            conversation.updated_at = item["updated_at"]

            # Update existing messages, append new ones, and remove
            # excess messages only within this specific conversation.
            existing_messages = list(conversation.messages)
            incoming_messages = item["messages"]

            for index, incoming in enumerate(incoming_messages):
                if index < len(existing_messages):
                    message = existing_messages[index]
                    message.role = incoming["role"]
                    message.content = incoming["content"]
                    message.created_at = incoming["created_at"]
                else:
                    conversation.messages.append(
                        ChatMessage(
                            role=incoming["role"],
                            content=incoming["content"],
                            created_at=incoming["created_at"],
                        )
                    )

            for message in existing_messages[len(incoming_messages):]:
                db.session.delete(message)

        # Do not delete conversations omitted from the request.
        db.session.commit()

        return jsonify(success=True, message="Chat history saved.")

    except IntegrityError:
        db.session.rollback()
        current_app.logger.exception(
            "Conversation history constraint failure"
        )
        return jsonify(
            success=False,
            message="Could not save chat history. Please retry.",
        ), 409

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Saving chat history failed")
        return jsonify(
            success=False,
            message="Could not save chat history.",
        ), 500
