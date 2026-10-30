"""q_bbsCode / q_bbscttSn 계열 게시판 (노원구. 고양시, 파주시도 같은 프로그램이라 설정만 더하면 된다)"""
from __future__ import annotations

import re

from ..models import DetailPage, ListItem, ListResult
from ._common import absolute, detail_url, reported_total, soup_of, text_of, ymd

_VIEW = re.compile(r"q_bbscttSn=(\d+)")
_SMALL_IMAGE_PX = 200  # 본문 맨 위 띠 그림(높이 113px 등)은 포스터가 아니다


def parse_list(html: str, source: dict) -> ListResult:
    soup = soup_of(html)
    items = []
    for cell in soup.select("td.cell-subject"):
        link = cell.find("a", href=_VIEW)
        if link is None:
            continue
        external_id = _VIEW.search(link["href"]).group(1)
        row = cell.find_parent("tr")
        date_cell = row.select_one("td.cell-date") if row else None
        items.append(ListItem(
            source_code=source["code"],
            external_id=external_id,
            title=link.get_text(" ", strip=True),  # 길면 「…」로 잘린다. 상세 제목을 쓴다
            url=detail_url(source, external_id),
            posted_on=ymd(date_cell.get_text()) if date_cell else None,
        ))
    return ListResult(items=items, reported_total=reported_total(soup))


def parse_detail(html: str, source: dict) -> DetailPage:
    soup = soup_of(html)
    article = soup.select_one("div.article-view")
    if article is None:
        return DetailPage(text="", image_url=None, found=False)
    body = article.select_one("div.article-body")
    poster = None
    for image in (body.find_all("img", src=True) if body else []):
        height = image.get("height")
        if height and height.isdigit() and int(height) < _SMALL_IMAGE_PX:
            continue
        poster = image["src"]
        break
    title = article.select_one("h1.article-subject")
    return DetailPage(
        text=text_of(body),
        image_url=absolute(poster, source["list_url"]),
        title=title.get_text(" ", strip=True) if title else None,
    )
