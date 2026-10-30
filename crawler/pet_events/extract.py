"""Gemini 로 본문에서 행사 여부와 칸 값을 뽑는다.

- 응답은 JSON 스키마로 강제한다. 형식이 틀리거나 오류면 None (호출하는 쪽이 다음 날 다시 묻는다).
- AI 가 본문에 없는 날짜나 참가비를 만들어 낼 수 있다 → guard_against_invented 로 버린다.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import replace
from datetime import date
from typing import Optional

from .dates import parse_range
from .models import EventFields

MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
MAX_INPUT_CHARS = 6000  # 보도자료 본문 하나는 이 안에 든다. 넘치면 앞부분만

_NULLABLE_STRING = {"type": ["string", "null"]}
SCHEMA = {
    "type": "object",
    "properties": {
        "is_event": {"type": "boolean"},
        "title": {"type": "string", "description": "행사 이름. 50자 이내"},
        "start_date": {**_NULLABLE_STRING, "description": "YYYY-MM-DD"},
        "end_date": {**_NULLABLE_STRING, "description": "YYYY-MM-DD"},
        "region": {**_NULLABLE_STRING, "description": "시·도 짧은 이름: 서울, 부산, 경기, 제주 등"},
        "place": {**_NULLABLE_STRING, "description": "구체적인 장소 이름"},
        "organizer": _NULLABLE_STRING,
        "target": _NULLABLE_STRING,
        "fee": _NULLABLE_STRING,
        "one_line": {**_NULLABLE_STRING, "description": "40자 이내 한 줄 소개"},
        "activities": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
        "checks": {"type": "array", "items": {"type": "string"}, "maxItems": 2},
    },
    "required": ["is_event", "title", "start_date", "end_date", "region", "place", "organizer",
                 "target", "fee", "one_line", "activities", "checks"],
}

PROMPT = """너는 반려동물 행사 안내문을 정리하는 편집자다. 아래 공공기관 글을 읽고 칸을 채워라.

규칙
- 반려인이 직접 가서 참여하는 행사(축제, 행사, 교육, 놀이터 운영, 입양 행사)일 때만 is_event 를 true 로 한다.
  정책 발표, 사업 출범, 예방접종 지원, 단속 안내처럼 참여하는 행사가 아니면 false 다.
- 본문에 있는 사실만 쓴다. 본문에 없는 값은 지어내지 말고 null 로 둔다(날짜, 장소, 참가비는 특히).
- 날짜는 등록일 {posted_on} 기준으로 연도를 채워 YYYY-MM-DD 로 쓴다.
- one_line, activities, checks 는 본문 문장을 그대로 옮기지 말고 짧게 새로 쓴다(존댓말 해요체).
- activities 는 할 수 있는 것 2~3개, checks 는 가기 전에 확인할 것 1~2개.

글 제목: {title}

글 본문:
{text}
"""


def extract_event(text: str, title: str, posted_on: Optional[date], client) -> Optional[EventFields]:
    prompt = PROMPT.format(
        posted_on=posted_on.isoformat() if posted_on else "알 수 없음",
        title=title,
        text=text[:MAX_INPUT_CHARS],
    )
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config={"response_mime_type": "application/json", "response_json_schema": SCHEMA},
        )
        data = json.loads(response.text)
        fields = EventFields(
            is_event=bool(data["is_event"]),
            title=str(data["title"]).strip() or title,
            start=_iso(data["start_date"]),
            end=_iso(data["end_date"]),
            region=_str(data["region"]),
            place=_str(data["place"]),
            organizer=_str(data["organizer"]),
            target=_str(data["target"]),
            fee=_str(data["fee"]),
            one_line=_str(data["one_line"]),
            activities=[s.strip() for s in data["activities"] if isinstance(s, str) and s.strip()],
            checks=[s.strip() for s in data["checks"] if isinstance(s, str) and s.strip()],
        )
    except Exception:  # noqa: BLE001 — 형식 오류, 할당량, 네트워크 모두 「이번엔 못 뽑음」이다
        return None

    if fields.start is None:  # AI 가 날짜를 못 뽑았으면 본문 글자에서 직접 찾는다
        start, end = parse_range(text, posted_on or date.today())
        fields = replace(fields, start=start, end=end if end != start else None)
    return fields


def guard_against_invented(fields: EventFields, text: str) -> EventFields:
    """뽑은 날짜의 월·일이 본문에 없으면 버린다. 금액도 「무료」나 「숫자+원」이 없으면 버린다"""
    start, end = fields.start, fields.end
    if start and not _mentions_day(text, start):
        start, end = None, None
    if end and not (_mentions_day(text, end) or _mentions_day_only(text, end)):
        end = None
    fee = fields.fee
    if fee and not re.search(r"무료|\d[\d,]*\s*원", text):
        fee = None
    return replace(fields, start=start, end=end, fee=fee)


def _mentions_day(text: str, value: date) -> bool:
    m, d = value.month, value.day
    patterns = [
        rf"(?<!\d){m}\s*월\s*{d}\s*일",
        rf"(?<!\d)0?{m}\s*[.\-/]\s*0?{d}(?!\d)",
    ]
    return any(re.search(pattern, text) for pattern in patterns)


def _mentions_day_only(text: str, value: date) -> bool:
    """「11월 6일 ~ 8일」의 끝날처럼 날만 쓴 경우"""
    return re.search(rf"[~∼〜]\s*{value.day}\s*일", text) is not None


def _iso(value) -> Optional[date]:
    try:
        return date.fromisoformat(value) if value else None
    except (TypeError, ValueError):
        return None


def _str(value) -> Optional[str]:
    return value.strip() if isinstance(value, str) and value.strip() else None
