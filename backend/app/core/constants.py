from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    ADMIN = "admin"


class SessionStatus(str, Enum):
    CREATED = "created"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MessageType(str, Enum):
    TEXT = "text"
    CODE = "code"
    SYSTEM = "system"
    FILE = "file"


class NotificationType(str, Enum):
    SESSION_CREATED = "session_created"
    SESSION_REMINDER = "session_reminder"
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"
    FEEDBACK_REQUEST = "feedback_request"
    JOIN_REQUEST = "join_request"


SUPPORTED_LANGUAGES = [
    "python", "javascript", "typescript", "java",
    "cpp", "go", "rust", "html", "css", "sql",
]


WS_EVENTS = {
    "CHAT_MESSAGE": "chat_message",
    "JOIN_ROOM": "join_room",
    "LEAVE_ROOM": "leave_room",
    "USER_JOINED": "user_joined",
    "USER_LEFT": "user_left",
    "EDITOR_UPDATE": "editor_update",
    "CURSOR_MOVE": "cursor_move",
    "LANGUAGE_CHANGE": "language_change",
    "SNIPPET_RUN": "snippet_run",
    "SNIPPET_RESULT": "snippet_result",
    "SIGNALING_OFFER": "offer",
    "SIGNALING_ANSWER": "answer",
    "SIGNALING_CANDIDATE": "candidate",
    "ERROR": "error",
}
