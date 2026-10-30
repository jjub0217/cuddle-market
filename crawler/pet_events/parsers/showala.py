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


def _own_text(node) -> str:
    return re.sub(r"\s+", "", "".join(node.find_all(string=True, recursive=False)))


def _add_line(lines: list, label: str, value_node) -> None:
    if not label or label in _SKIP_LABELS or value_node is None:
        return
    value = re.sub(r"\s+", " ", value_node.get_text(" ")).strip()
    if value:
        lines.append(f"{label}: {value}")


def parse_detail(html: str, source: dict) -> DetailPage:
    soup = soup_of(html)
    if soup.select_one("div.ba_info") is None:
        return DetailPage(text="", image_url=None, found=False)
    lines = []
    # ⚠️ 실제 HTML 은 <p class="tit">주&nbsp;최</dt> 처럼 닫는 태그가 어긋나 있어 값 칸이 이름 칸 안으로
    #    들어가 버린다(2026-10-30 주최를 못 읽었다). 그래서 형제가 아니라 같은 줄(li) 안에서 찾고,
    #    이름은 이름 칸에 바로 붙은 글자만 읽는다
    for row in soup.select("div.ba_info li"):
        label_node, value_node = row.select_one(".tit"), row.select_one(".des")
        if label_node is None or value_node is None:
            continue
        _add_line(lines, _own_text(label_node), value_node)
    for label_node in soup.select("div.fee_box .tit"):
        _add_line(lines, _own_text(label_node), label_node.find_next_sibling(["p", "pre"]))

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
