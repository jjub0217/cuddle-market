"""주소의 첫 낱말을 짧은 시·도 이름으로 (설계 7-2절: 목록에는 넓은 지역만 보인다)"""
from __future__ import annotations

from typing import Optional

_PREFIXES = [
    ("서울", "서울"), ("부산", "부산"), ("대구", "대구"), ("인천", "인천"), ("광주", "광주"),
    ("대전", "대전"), ("울산", "울산"), ("세종", "세종"), ("경기", "경기"), ("강원", "강원"),
    ("충청북", "충북"), ("충북", "충북"), ("충청남", "충남"), ("충남", "충남"),
    ("전라북", "전북"), ("전북", "전북"), ("전라남", "전남"), ("전남", "전남"),
    ("경상북", "경북"), ("경북", "경북"), ("경상남", "경남"), ("경남", "경남"), ("제주", "제주"),
]


def region_of(address: Optional[str]) -> Optional[str]:
    if not address:
        return None
    first = address.strip().split()[0] if address.strip() else ""
    for prefix, region in _PREFIXES:
        if first.startswith(prefix):
            return region
    return None
