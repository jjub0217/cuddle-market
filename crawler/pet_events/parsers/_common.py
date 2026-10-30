from __future__ import annotations

import re
from datetime import date
from typing import Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

_TOTAL = re.compile(r"총\s*([\d,]+)\s*건")
_DATE = re.compile(r"(20\d\d)-(\d{2})-(\d{2})")


def soup_of(html: str) -> BeautifulSoup:
    soup = BeautifulSoup(html or "", "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return soup


def reported_total(soup: BeautifulSoup) -> Optional[int]:
    """페이지에 적힌 「총 N건」"""
    match = _TOTAL.search(soup.get_text(" "))
    return int(match.group(1).replace(",", "")) if match else None


def ymd(text: str) -> Optional[date]:
    match = _DATE.search(text or "")
    if not match:
        return None
    try:
        return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None


def text_of(node: Optional[Tag]) -> str:
    """줄바꿈은 살리고 빈칸은 하나로"""
    if node is None:
        return ""
    lines = (re.sub(r"\s+", " ", line).strip() for line in node.get_text("\n").splitlines())
    return "\n".join(line for line in lines if line)


def absolute(src: Optional[str], base: str) -> Optional[str]:
    if not src or src.startswith("data:"):
        return None
    return urljoin(base, src)


def detail_url(source: dict, external_id: str) -> str:
    return source["detail_url"].format(id=external_id)
