"""출처마다 제각각인 날짜를 (시작일, 종료일)로 맞춘다.

다루는 모양
    2026. 11. 6. ~ 11. 8.     2026.10.31     2026-10-30 ~ 2026-11-01
    10월 31일(토)              11월 6일(금) ~ 8일(일)

연도가 없으면 글 등록일(ref)의 연도로 채운다. 그렇게 만든 날이 등록일보다
반년 넘게 앞이면 다음 해로 본다 — 12월에 올라온 글의 「1월 10일」은 다음 해다.
"""
from __future__ import annotations

import re
from datetime import date, timedelta
from typing import Optional, Tuple

_TOKEN = re.compile(
    r"(?P<full>(?P<y>20\d\d)\s*[.\-/년]\s*(?P<m>\d{1,2})\s*[.\-/월]\s*(?P<d>\d{1,2}))"
    r"|(?P<md>(?P<m2>\d{1,2})\s*(?:월\s*(?P<d2>\d{1,2})\s*일|\.\s*(?P<d3>\d{1,2})(?!\d)))"
    r"|(?P<tilde>[~∼〜])"
    r"|(?P<day>(?P<d4>\d{1,2})\s*일)"
)

_HALF_YEAR = timedelta(days=183)


def _make(y: int, m: int, d: int) -> Optional[date]:
    try:
        return date(y, m, d)
    except ValueError:
        return None


def parse_range(text: str, ref: date) -> Tuple[Optional[date], Optional[date]]:
    start: Optional[date] = None
    end: Optional[date] = None
    after_tilde = False

    for match in _TOKEN.finditer(text or ""):
        if match.group("tilde"):
            if start is not None:
                after_tilde = True
            continue

        if start is None:
            start = _start_from(match, ref)
            continue

        if not after_tilde:
            break
        end = _end_from(match, start)
        break

    if start is None:
        return None, None
    return start, end or start


def _start_from(match: re.Match, ref: date) -> Optional[date]:
    if match.group("full"):
        return _make(int(match.group("y")), int(match.group("m")), int(match.group("d")))
    if match.group("md"):
        month = int(match.group("m2"))
        day = int(match.group("d2") or match.group("d3"))
        found = _make(ref.year, month, day)
        if found and found < ref - _HALF_YEAR:
            found = _make(ref.year + 1, month, day)
        return found
    return None  # 날만 있는 글자(「8일」)로는 시작일을 정하지 않는다


def _end_from(match: re.Match, start: date) -> Optional[date]:
    if match.group("full"):
        return _make(int(match.group("y")), int(match.group("m")), int(match.group("d")))
    if match.group("md"):
        month = int(match.group("m2"))
        day = int(match.group("d2") or match.group("d3"))
        found = _make(start.year, month, day)
        if found and found < start:
            found = _make(start.year + 1, month, day)
        return found
    if match.group("day"):
        day = int(match.group("d4"))
        found = _make(start.year, start.month, day)
        if found and found < start:
            month = start.month % 12 + 1
            found = _make(start.year + (1 if month == 1 else 0), month, day)
        return found
    return None
