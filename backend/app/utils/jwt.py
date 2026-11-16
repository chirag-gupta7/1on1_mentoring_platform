from typing import Any, Optional

from app.core.security import create_access_token, create_refresh_token, decode_token


def decode_token_optional(token: str) -> Optional[dict[str, Any]]:
    return decode_token(token)


__all__ = ["create_access_token", "create_refresh_token", "decode_token", "decode_token_optional"]
