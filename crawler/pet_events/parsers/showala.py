"""쇼알라(showala.com, 한국전시산업진흥회) — 반려동물 박람회

목록은 첫 화면 메뉴 「취미|기호|반려동물」 아래 상세 링크(앞으로 열릴 행사 약 14건)를 쓴다.
분류 목록 페이지는 처음 5건만 HTML 에 있고 나머지는 사이트가 확인하는 값을 흉내 내야 받을 수 있어 쓰지 않는다.
상세는 「칸 이름 / 값」 모양이라 「칸: 값」 줄로 남겨 칸 값을 먼저 쓰게 한다(labelled.py). 문의처는 읽지 않는다.
"""
from __future__ import annotations

import re

from ..models import DetailPage, ListItem, ListResult
from ._common import absolute, detail_url, soup_of, text_of

PET_MENU = "취미|기호|반려동물"
_VIEW = re.compile(r"ex_detail\.php\?idx=(\d+)")
_BACKGROUND = re.compile(r"background-image:\s*url\(['\"]?([^'\")]+)")
_SKIP_LABELS = {"문의처", "홈페이지"}


def parse_list(html: str, source: dict) -> ListResult:
    soup = soup_of(html)
    heading = soup.find("p", class_="menu_dep2_tit", string=lambda s: s and s.strip() == PET_MENU)
    if heading is None:
        # 첫 화면이 있는데 메뉴 제목이 없으면 구조가 바뀐 것이다(「0건」과 가른다)
        return ListResult(items=[], reported_total=1 if soup.find("body") else None)
    menu = heading.find_next_sibling("ul")
    items = []
    for link in (menu.find_all("a", href=_VIEW) if menu else []):
        external_id = _VIEW.search(link["href"]).group(1)
        items.append(ListItem(
            source_code=source["code"],
            external_id=external_id,
            title=link.get_text(" ", strip=True),
            url=detail_url(source, external_id),
            posted_on=None,  # 첫 화면 메뉴에는 등록일이 없다
        ))
    return ListResult(items=items, reported_total=len(items))


def parse_detail(html: str, source: dict) -> DetailPage:
    soup = soup_of(html)
    lines = []
    for label_node in soup.select("div.ba_info p.tit, div.fee_box p.tit"):
        label = re.sub(r"\s+", "", label_node.get_text())
        value_node = label_node.find_next_sibling(["p", "pre"])
        if not label or label in _SKIP_LABELS or value_node is None:
            continue
        value = re.sub(r"\s+", " ", value_node.get_text(" ")).strip()
        if value:
            lines.append(f"{label}: {value}")

    body = soup.select_one("div.tab_con_edit1")
    lines.append(text_of(body))

    title = soup.select_one("div.ba_info li.kor_tit")
    poster = soup.select_one("div.exb_img_wrap")
    match = _BACKGROUND.search(poster.get("style", "")) if poster else None
    return DetailPage(
        text="\n".join(line for line in lines if line),
        image_url=absolute(match.group(1) if match else None, source["list_url"]),
        title=title.get_text(" ", strip=True) if title else None,
    )
