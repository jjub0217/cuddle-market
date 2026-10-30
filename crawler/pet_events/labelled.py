"""출처가 칸으로 따로 적어 둔 값 (설계 7-2절: 출처에 칸으로 적힌 값이 먼저다)

문체부 상세 파서(parsers/mcst.py)는 「개최기간: …」「축제장소: …」 같은 줄을 본문 글자에 남긴다.
이 값은 기관이 직접 칸에 적은 것이라 AI 가 본문에서 다시 뽑은 값보다 믿을 만하다.
문의 전화는 읽지 않는다(개인 담당자 번호가 섞일 수 있어 두지 않기로 했다).
"""
from __future__ import annotations

import re
from datetime import date
from typing import Dict

from .dates import parse_range

_LINE = re.compile(r"^(개최기간|축제장소|요금|주최/주관기관|연령제한):\s*(.+?)\s*$", re.MULTILINE)
_TIME = re.compile(r"\d{1,2}\s*(?:시|:\d{2})")


def labelled_fields(text: str, ref: date) -> Dict[str, object]:
    found: Dict[str, object] = {}
    for label, value in _LINE.findall(text or ""):
        if label == "개최기간":
            period, _, hours = value.partition("|")
            start, end = parse_range(period, ref)
            if start:
                found["start"] = start
                found["end"] = end if end and end != start else None
            if _TIME.search(hours):
                found["hours"] = hours.strip()
        elif label == "축제장소":
            found["place"] = value
        elif label == "요금":
            found["fee"] = value
        elif label == "주최/주관기관":
            found["organizer"] = value
        elif label == "연령제한":
            found["target"] = value
    return found
