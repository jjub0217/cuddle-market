"""문체부 지역축제 게시판 (festivalList.jsp / festivalView.jsp)"""
from __future__ import annotations

import re

from ..models import DetailPage, ListItem, ListResult
from ._common import absolute, detail_url, reported_total, soup_of, text_of

_SEQ = re.compile(r"pSeq=(\d+)")


def parse_list(html: str, source: dict) -> ListResult:
    soup = soup_of(html)
    items = []
    for link in soup.select('a[href*="festivalView.jsp"]'):
        match = _SEQ.search(link["href"])
        title_node = link.select_one("p.sub-tit")
        if not match or title_node is None:
            continue
        external_id = match.group(1)
        items.append(ListItem(
            source_code=source["code"],
            external_id=external_id,
            title=title_node.get_text(strip=True),
            url=detail_url(source, external_id),
            posted_on=None,  # 축제 목록에는 등록일이 없다
        ))
    return ListResult(items=items, reported_total=reported_total(soup))


def parse_detail(html: str, source: dict) -> DetailPage:
    soup = soup_of(html)
    view = soup.select_one("div.view-detail")
    if view is None:
        return DetailPage(text="", image_url=None)

    lines = []
    # 개최지역, 개최기간, 축제장소, 요금, 주최 칸을 「칸: 값」으로 남긴다
    for dt in view.select("dl.board dt"):
        dd = dt.find_next_sibling("dd")
        if dd is not None:
            lines.append(f"{dt.get_text(strip=True)}: {text_of(dd).replace(chr(10), ' ')}")

    body = view.select_one("div.view_con")
    if body is not None:
        for guide in body.select("div.culture-guide"):
            guide.decompose()  # 「주최기관의 사정에 따라 변경될 수 있습니다」 같은 사이트 공통 안내
        lines.append(text_of(body))

    image = view.select_one("div.culture_view img")
    title = view.select_one("h3.view_title")
    return DetailPage(
        text="\n".join(line for line in lines if line),
        image_url=absolute(image.get("src") if image else None, source["list_url"]),
        title=title.get_text(strip=True) if title else None,
    )
