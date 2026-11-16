from typing import Any, Optional
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections per session (room)."""

    def __init__(self):
        self._rooms: dict[str, dict[str, WebSocket]] = {}
        self._user_rooms: dict[str, set[str]] = {}

    async def connect(self, room_id: str, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if room_id not in self._rooms:
            self._rooms[room_id] = {}
        self._rooms[room_id][user_id] = websocket
        if user_id not in self._user_rooms:
            self._user_rooms[user_id] = set()
        self._user_rooms[user_id].add(room_id)

    def disconnect(self, room_id: str, user_id: str) -> None:
        if room_id in self._rooms:
            self._rooms[room_id].pop(user_id, None)
            if not self._rooms[room_id]:
                del self._rooms[room_id]
        if user_id in self._user_rooms:
            self._user_rooms[user_id].discard(room_id)
            if not self._user_rooms[user_id]:
                del self._user_rooms[user_id]

    async def broadcast(self, room_id: str, message: Any, exclude: Optional[str] = None) -> None:
        if room_id not in self._rooms:
            return
        for uid, ws in list(self._rooms[room_id].items()):
            if exclude and uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def broadcast_bytes(self, room_id: str, data: bytes, exclude: Optional[str] = None) -> None:
        if room_id not in self._rooms:
            return
        for uid, ws in list(self._rooms[room_id].items()):
            if exclude and uid == exclude:
                continue
            try:
                await ws.send_bytes(data)
            except Exception:
                pass

    async def send_personal(self, room_id: str, user_id: str, message: Any) -> None:
        if room_id in self._rooms and user_id in self._rooms[room_id]:
            try:
                await self._rooms[room_id][user_id].send_json(message)
            except Exception:
                pass

    def get_room_users(self, room_id: str) -> list[str]:
        if room_id in self._rooms:
            return list(self._rooms[room_id].keys())
        return []

    def get_user_rooms(self, user_id: str) -> set[str]:
        return self._user_rooms.get(user_id, set())

    def is_user_in_room(self, room_id: str, user_id: str) -> bool:
        return room_id in self._rooms and user_id in self._rooms[room_id]

    @property
    def active_connections(self) -> int:
        return sum(len(users) for users in self._rooms.values())


connection_manager = ConnectionManager()
