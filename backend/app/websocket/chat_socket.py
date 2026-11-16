import json
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect

from app.core.websocket_manager import connection_manager
from app.core.constants import WS_EVENTS
from app.core.security import decode_token
from app.database.session import async_session_factory
from app.services.chat_service import save_and_broadcast


async def chat_handler(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = str(payload["sub"])
    room_id = f"chat:{session_id}"

    await connection_manager.connect(room_id, user_id, websocket)

    await connection_manager.broadcast(
        room_id,
        {"type": WS_EVENTS["USER_JOINED"], "user_id": user_id},
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await connection_manager.send_personal(
                    room_id, user_id,
                    {"type": WS_EVENTS["ERROR"], "detail": "Invalid JSON"},
                )
                continue

            msg_type = data.get("type")

            if msg_type == WS_EVENTS["CHAT_MESSAGE"]:
                content = data.get("content", "")
                if not content.strip():
                    continue

                async with async_session_factory() as db:
                    try:
                        message = await save_and_broadcast(
                            db,
                            session_id=UUID(session_id),
                            sender_id=UUID(user_id),
                            content=content,
                        )
                        await db.commit()
                    except Exception:
                        await db.rollback()
                        await connection_manager.send_personal(
                            room_id, user_id,
                            {"type": WS_EVENTS["ERROR"], "detail": "Failed to save message"},
                        )
                        continue

                await connection_manager.broadcast(
                    room_id,
                    {
                        "type": WS_EVENTS["CHAT_MESSAGE"],
                        "message": {
                            "id": str(message.id),
                            "sender_id": user_id,
                            "content": content,
                            "message_type": "text",
                            "created_at": message.created_at.isoformat() if message.created_at else None,
                        },
                    },
                )

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await connection_manager.broadcast(
            room_id,
            {"type": WS_EVENTS["USER_LEFT"], "user_id": user_id},
        )
        connection_manager.disconnect(room_id, user_id)
