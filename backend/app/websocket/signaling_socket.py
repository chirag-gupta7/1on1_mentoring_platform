import json

from fastapi import WebSocket, WebSocketDisconnect

from app.core.websocket_manager import connection_manager
from app.core.constants import WS_EVENTS
from app.core.security import decode_token


async def signaling_handler(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = str(payload["sub"])
    room_id = f"signaling:{session_id}"

    await connection_manager.connect(room_id, user_id, websocket)

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

            if msg_type == WS_EVENTS["SIGNALING_OFFER"]:
                await connection_manager.broadcast(
                    room_id,
                    {
                        "type": WS_EVENTS["SIGNALING_OFFER"],
                        "user_id": user_id,
                        "sdp": data.get("sdp", {}),
                    },
                    exclude=user_id,
                )

            elif msg_type == WS_EVENTS["SIGNALING_ANSWER"]:
                await connection_manager.broadcast(
                    room_id,
                    {
                        "type": WS_EVENTS["SIGNALING_ANSWER"],
                        "user_id": user_id,
                        "sdp": data.get("sdp", {}),
                    },
                    exclude=user_id,
                )

            elif msg_type == WS_EVENTS["SIGNALING_CANDIDATE"]:
                await connection_manager.broadcast(
                    room_id,
                    {
                        "type": WS_EVENTS["SIGNALING_CANDIDATE"],
                        "user_id": user_id,
                        "candidate": data.get("candidate", {}),
                    },
                    exclude=user_id,
                )

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        connection_manager.disconnect(room_id, user_id)
