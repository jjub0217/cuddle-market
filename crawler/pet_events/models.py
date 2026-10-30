from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional


@dataclass(frozen=True)
class ListItem:
    """목록 페이지에서 뽑은 글 하나"""

    source_code: str
    external_id: str
    title: str
    url: str
    posted_on: Optional[date]


@dataclass(frozen=True)
class ListResult:
    """목록 한 페이지. reported_total 은 페이지에 적힌 「총 N건」(없으면 None).
    이 값이 0보다 큰데 items 가 비면 사이트 구조가 바뀐 것으로 본다."""

    items: List[ListItem]
    reported_total: Optional[int]


@dataclass(frozen=True)
class DetailPage:
    """상세 페이지에서 뽑은 본문 글자와 포스터 주소(원래 주소 그대로).
    title 은 상세의 제목 — 노원처럼 목록 제목이 「…」로 잘리는 곳이 있다."""

    text: str
    image_url: Optional[str]
    title: Optional[str] = None


@dataclass
class EventFields:
    """글 틀(설계 4절)에 들어갈 칸. 본문에 없는 값은 None 으로 둔다"""

    is_event: bool
    title: str
    start: Optional[date] = None
    end: Optional[date] = None
    region: Optional[str] = None
    place: Optional[str] = None
    organizer: Optional[str] = None
    target: Optional[str] = None
    fee: Optional[str] = None
    hours: Optional[str] = None  # 운영시간
    application: Optional[str] = None  # 신청 방법 (사전 신청, 현장 접수 등)
    one_line: Optional[str] = None
    activities: List[str] = field(default_factory=list)
    checks: List[str] = field(default_factory=list)
