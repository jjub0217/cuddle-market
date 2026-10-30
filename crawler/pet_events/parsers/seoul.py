"""서울시 보도자료 (news_report.do). 목록 링크가 javascript:fnTbbsView('번호') 모양이라 번호를 뽑아 주소를 만든다"""
from __future__ import annotations

import re

from ..models import DetailPage, ListItem, ListResult
from ._common import absolute, detail_url, reported_total, soup_of, text_of, ymd

_VIEW = re.compile(r"fnTbbsView\('(\d+)'\)")


def parse_list(html: str, source: dict) -> ListResult:
    soup = soup_of(html)
    items = []
    for link in soup.find_all("a", href=_VIEW):
        external_id = _VIEW.search(link["href"]).group(1)
        row = link.find_parent("tr")
        items.append(ListItem(
            source_code=source["code"],
            external_id=external_id,
            title=link.get_text(" ", strip=True),
            url=detail_url(source, external_id),
            posted_on=ymd(row.get_text(" ")) if row else None,
        ))
    return ListResult(items=items, reported_total=reported_total(soup))


def parse_detail(html: str, source: dict) -> DetailPage:
    soup = soup_of(html)
    body = soup.select_one("div.sib-viw-type-basic-content")
    if body is None:
        return DetailPage(text="", image_url=None, found=False)
    image = body.find("img", src=True) if body else None
    return DetailPage(
        text=text_of(body),
        image_url=absolute(image["src"] if image else None, source["list_url"]),
    )
