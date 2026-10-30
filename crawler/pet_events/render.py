"""행사 글 틀 (설계 4절). 틀은 코드에 고정하고, 칸 값만 채운다.

본문은 웹에서 마크다운으로 그려진다(줄바꿈은 그대로 살아난다). 그래서
포스터는 ![포스터](주소), 원문 링크는 [원문 보기](주소) 로 쓴다.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import date
from typing import List, Optional, Tuple

from .models import EventFields
from .regions import region_of

MAX_TITLE = 50     # Post.title
MAX_BODY = 1000    # Post.content
MAX_FIELD = 100    # 칸 하나가 글 전체를 먹지 않게
CHECK_OFFICIAL = "공식 안내 확인"
END_LINES = (
    "이 글은 주최 기관이 공개한 자료를 바탕으로 정리한 안내입니다.",
    "일정과 참가 조건은 바뀔 수 있으니 공식 안내에서 다시 확인해주세요.",
)
_WEEKDAYS = "월화수목금토일"


def render_post(
    fields: EventFields, source_name: str, source_url: str, image_url: Optional[str] = None
) -> Tuple[str, str]:
    title = _cut(fields.title.strip(), MAX_TITLE)
    fields = _capped(fields)

    body = _body(fields, source_name, source_url, image_url)
    # 넘치면 AI 칸부터 줄인다: 할 수 있는 것 → 확인할 것 → 한 줄 소개
    while len(body) > MAX_BODY and (fields.activities or fields.checks or fields.one_line):
        if fields.activities:
            fields = replace(fields, activities=fields.activities[:-1])
        elif fields.checks:
            fields = replace(fields, checks=fields.checks[:-1])
        else:
            fields = replace(fields, one_line=None)
        body = _body(fields, source_name, source_url, image_url)
    if len(body) > MAX_BODY and image_url:
        image_url = None
        body = _body(fields, source_name, source_url, image_url)
    if len(body) > MAX_BODY:
        body = _body(_capped(fields, 30), source_name, source_url, image_url)
    return title, body


def _body(fields: EventFields, source_name: str, source_url: str, image_url: Optional[str]) -> str:
    lines: List[str] = []
    if image_url:
        lines += [f"![포스터]({image_url})", ""]
    if fields.one_line:
        lines += [f"한 줄 소개: {fields.one_line}", ""]
    lines += [
        f"기간 | {_period(fields.start, fields.end)}",
        f"운영시간 | {fields.hours or CHECK_OFFICIAL}",
        f"장소 | {_place(fields.region, fields.place)}",
        f"대상 | {fields.target or CHECK_OFFICIAL}",
        f"참가비 | {fields.fee or CHECK_OFFICIAL}",
        f"신청 | {fields.application or CHECK_OFFICIAL}",
        f"주최 | {fields.organizer or CHECK_OFFICIAL}",
        "",
    ]
    if fields.activities:
        lines += ["이런 걸 할 수 있어요"] + [f"- {item}" for item in fields.activities] + [""]
    if fields.checks:
        lines += ["가기 전에 확인하세요"] + [f"- {item}" for item in fields.checks] + [""]
    lines += [*END_LINES, f"[원문 보기]({source_url})", f"출처: {source_name}"]
    return "\n".join(lines)


def _period(start: Optional[date], end: Optional[date]) -> str:
    if start is None:
        return CHECK_OFFICIAL
    if end is None or end == start:
        return _day(start)
    return f"{_day(start)} ~ {_day(end)}"


def _day(value: date) -> str:
    return f"{value:%Y.%m.%d} ({_WEEKDAYS[value.weekday()]})"


def _place(region: Optional[str], place: Optional[str]) -> str:
    """상세에는 지역과 구체적인 장소를 같이 보인다(설계 7-2절). 장소가 이미 시·도로 시작하면 또 붙이지 않는다"""
    if not place:
        return region or CHECK_OFFICIAL
    if not region or region_of(place) == region or place.startswith(region):
        return place
    return f"{region} {place}"


def capped(fields: EventFields) -> EventFields:
    """서버에 보내기 전에 칸 길이를 서버 제한 안으로. 지역은 20자, 목록은 3개·2개까지"""
    fields = _capped(fields)
    return replace(fields, region=_cut(fields.region, 20) if fields.region else None,
                   activities=fields.activities[:3], checks=fields.checks[:2])


def _cut(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _capped(fields: EventFields, limit: int = MAX_FIELD) -> EventFields:
    cap = lambda value: _cut(value, limit) if value else value  # noqa: E731
    return replace(
        fields,
        region=cap(fields.region), place=cap(fields.place), organizer=cap(fields.organizer),
        target=cap(fields.target), fee=cap(fields.fee), hours=cap(fields.hours),
        application=cap(fields.application), one_line=cap(fields.one_line),
        activities=[cap(item) for item in fields.activities],
        checks=[cap(item) for item in fields.checks],
    )
