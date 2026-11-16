import uuid
import re
import math
from typing import Any


def generate_room_id() -> str:
    return uuid.uuid4().hex[:12]


def paginate(items: list[Any], page: int, page_size: int) -> dict[str, Any]:
    total = len(items)
    pages = max(1, math.ceil(total / page_size))
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "pages": pages,
    }


def sanitize_html(text: str) -> str:
    text = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]*>", "", text)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return text
