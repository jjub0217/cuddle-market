"""출처가 칸으로 따로 적어 둔 값 (설계 7-2절: 출처에 칸으로 적힌 값이 먼저다)

문체부 상세 파서(parsers/mcst.py)는 「개최기간: …」「축제장소: …」, 쇼알라(parsers/showala.py)는
「전시기간: …」「개최장소: …」「관람시간: …」 같은 줄을 본문 글자에 남긴다.
이 값은 기관이 직접 칸에 적은 것이라 AI 가 본문에서 다시 뽑은 값보다 믿을 만하다.
문의 전화는 읽지 않는다(개인 담당자 번호가 섞일 수 있어 두지 않기로 했다).
"""
from __future__ import annotations

import re
from datetime import date
from typing import Dict

from .dates import parse_range

_LINE = re.compile(
    r"^(개최기간|축제장소|요금|주최/주관기관|연령제한|전시기간|개최장소|세부장소|관람시간|입장료안내|주최):\s*(.+?)\s*$",
    re.MULTILINE,
)
# 박람회 전시장 이름으로 지역을 정한다(쇼알라 개최장소에는 시·도가 없다)
VENUE_REGIONS = [
    ("킨텍스", "경기"), ("KINTEX", "경기"), ("일산", "경기"), ("수원메쎄", "경기"), ("수원컨벤션", "경기"),
    ("코엑스", "서울"), ("COEX", "서울"), ("SETEC", "서울"), ("세텍", "서울"), ("aT센터", "서울"), ("양재", "서울"),
    ("벡스코", "부산"), ("BEXCO", "부산"), ("엑스코", "대구"), ("EXCO", "대구"),
    ("대전컨벤션", "대전"), ("DCC", "대전"), ("김대중컨벤션", "광주"), ("송도컨벤시아", "인천"),
    ("창원컨벤션", "경남"), ("CECO", "경남"), ("제주국제컨벤션", "제주"),
    ("오스코", "충북"), ("OSCO", "충북"), ("새만금", "전북"), ("GSCO", "전북"),
    # 전시장 이름이 표에 없으면 도시 이름으로
    ("서울", "서울"), ("부산", "부산"), ("대구", "대구"), ("인천", "인천"), ("광주", "광주"), ("대전", "대전"),
    ("울산", "울산"), ("세종", "세종"), ("수원", "경기"), ("고양", "경기"), ("성남", "경기"), ("화성", "경기"),
    ("청주", "충북"), ("천안", "충남"), ("전주", "전북"), ("군산", "전북"), ("익산", "전북"), ("여수", "전남"),
    ("순천", "전남"), ("포항", "경북"), ("경주", "경북"), ("창원", "경남"), ("김해", "경남"), ("제주", "제주"),
    ("춘천", "강원"), ("원주", "강원"), ("강릉", "강원"),
]
_TIME = re.compile(r"\d{1,2}\s*(?:시|:\d{2})")


_ADDRESS = re.compile(r"광역시|특별시|특별자치|[가-힣]+구\s|[가-힣]+로\s*\d|센터|전시장")
_TIME_START = re.compile(r"(?:(?:[월화수목금토일]|평일|주말|매일)\s*)?\d{1,2}\s*(?::\d{2}|시)")


def _time_part(value: str) -> str:
    """시간 앞에 **주소**가 섞여 있으면 시간부터 남긴다.
    「대전컨벤션센터 … (… 107) 26.11.28~29 (토,일) 토 12:00~18:00 …」→「토 12:00~18:00 …」
    앞부분이 날짜나 오전·오후(「10/31 (토) 오후 11:00…」「(오전) 10:00…」)면 자르면 뜻이 사라지니 그대로 둔다"""
    match = _TIME_START.search(value)
    if match and _ADDRESS.search(value[: match.start()]):
        return value[match.start():].strip()
    return value


def labelled_fields(text: str, ref: date) -> Dict[str, object]:
    found: Dict[str, object] = {}
    for label, value in _LINE.findall(text or ""):
        if label in ("개최기간", "전시기간"):
            period, _, hours = value.partition("|")
            start, end = parse_range(period, ref)
            if start:  # 날짜를 못 읽으면(「추후 공지」) 칸 값을 쓰지 않는다
                found["start"] = start
                found["end"] = end if end and end != start else None
            if _TIME.search(hours):
                found["hours"] = hours.strip()
        elif label in ("축제장소", "개최장소"):
            found["place"] = value
            region = next((r for venue, r in VENUE_REGIONS if venue.lower() in value.lower()), None)
            if region:
                found["region"] = region
        elif label == "세부장소" and "place" in found:
            found["place"] = f"{found['place']} {value}"
        elif label == "관람시간" and _TIME.search(value):
            # 시각 숫자가 없으면 칸을 잘못 적은 것이다(2026-10-30 쇼알라: 관람시간 칸에 주소)
            found["hours"] = _time_part(value)
        elif label == "입장료안내":
            found["fee"] = value
        elif label == "요금":
            found["fee"] = value
        elif label in ("주최/주관기관", "주최"):
            found["organizer"] = value
        elif label == "연령제한":
            found["target"] = value
    return found
