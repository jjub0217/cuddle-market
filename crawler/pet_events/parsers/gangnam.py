"""강남구 게시판 (/board/B_000031/…, 공지 B_000001 도 같은 프로그램)"""
from __future__ import annotations

import re

from ..models import DetailPage, ListItem, ListResult
from ._common import absolute, detail_url, soup_of, text_of, ymd

_VIEW = re.compile(r"/board/B_\d+/(\d+)/view\.do")


def parse_list(html: str, source: dict) -> ListResult:
    soup = soup_of(html)
    items = []
    for row in soup.select("tr.grid-item"):
        link = row.find("a", href=_VIEW)
        if link is None:
            continue
        external_id = _VIEW.search(link["href"]).group(1)
        items.append(ListItem(
            source_code=source["code"],
            external_id=external_id,
            title=link.get_text(" ", strip=True),
            url=detail_url(source, external_id),
            posted_on=ymd(row.get_text(" ")),
        ))
    # 「총 N건」 표시가 없다. 검색 결과의 맨 윗 글 번호가 곧 결과 수다(번호가 1까지 내려간다)
    first_number = soup.select_one("tr.grid-item td.num")
    total = int(first_number.get_text(strip=True)) if first_number and first_number.get_text(strip=True).isdigit() else None
    return ListResult(items=items, reported_total=total)


def parse_detail(html: str, source: dict) -> DetailPage:
    soup = soup_of(html)
    content = soup.select_one("div.bbs-view div.post-content")
    if content is None:
        return DetailPage(text="", image_url=None)
    # 본문 글자만 모아 둔 숨은 칸이 있으면 그것을 쓴다(편집기 꾸밈 태그가 없다)
    hidden = content.select_one("input#content_main_text")
    text = (hidden.get("value") or "").strip() if hidden else ""
    if not text:
        if hidden:
            hidden.decompose()
        text = text_of(content)
    image = content.find("img", src=True)
    title = soup.select_one("div.post-title h4")
    return DetailPage(
        text=text,
        image_url=absolute(image["src"] if image else None, source["list_url"]),
        title=title.get_text(" ", strip=True) if title else None,
    )
