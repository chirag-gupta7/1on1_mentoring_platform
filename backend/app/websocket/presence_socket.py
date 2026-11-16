import json

from fastapi import WebSocket, WebSocketDisconnect

from app.core.websocket_manager import connection_manager
from app.core.constants import WS_EVENTS
from app.core.security import decode_token


async def presence_handler(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = str(payload["sub"])
    room_id = f"presence:{session_id}"

    await connection_manager.connect(room_id, user_id, websocket)

    online_users = connection_manager.get_room_users(room_id)
    await connection_manager.send_personal(
        room_id, user_id,
        {
            "type": "online_users",
            "users": online_users,
        },
    )

    await connection_manager.broadcast(
        room_id,
        {"type": WS_EVENTS["USER_JOINED"], "user_id": user_id},
        exclude=user_id,
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

            if msg_type == "heartbeat":
                await connection_manager.send_personal(
                    room_id, user_id,
                    {"type": "pong"},
                )

            elif msg_type == "cursor_update":
                await connection_manager.broadcast(
                    room_id,
                    {
                        "type": "cursor_update",
                        "user_id": user_id,
                        "position": data.get("position", {}),
                    },
                    exclude=user_id,
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
