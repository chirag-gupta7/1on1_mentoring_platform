from fastapi import WebSocket, WebSocketDisconnect

from app.core.websocket_manager import connection_manager
from app.core.security import decode_token


async def yjs_handler(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = str(payload["sub"])
    room_id = f"yjs:{session_id}"

    await connection_manager.connect(room_id, user_id, websocket)

    try:
        while True:
            raw = await websocket.receive_bytes()
            await connection_manager.broadcast_bytes(room_id, raw, exclude=user_id)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        connection_manager.disconnect(room_id, user_id)
