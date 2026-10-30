"""저장해 둔 진짜 페이지로 파서를 확인한다. 원본은 저장소에 안 올리므로(공개 저장소)
probe/event-feed-fixtures/ 가 있는 맥에서만 돈다. Actions 에서는 건너뛴다."""
import json
from pathlib import Path

import pytest

from pet_events.parsers import get_parser

ROOT = Path(__file__).resolve().parents[2]
REAL = ROOT / "probe" / "event-feed-fixtures"
SOURCES = {s["code"]: s for s in json.loads((ROOT / "crawler" / "sources.json").read_text())}

pytestmark = pytest.mark.skipif(not REAL.exists(), reason="원본 페이지가 없다(저장소 밖 probe/)")


def read(rel):
    return (REAL / rel).read_text(encoding="utf-8", errors="replace")


@pytest.mark.parametrize("code, rel, title", [
    ("MCST", "mcst/list.html", "제주 반려동물 문화산업 한마당"),
    ("GANGNAM", "gu/gn_s_B_000031.html", "“목줄 풀고 신나게 뛰어놀개!”…강남구, 반려견 순회놀이터 운영"),
    ("GANGNAM_NOTICE", "gu/gn_s_B_000001.html", "2026년 가을철 반려동물 광견병 예방접종 실시 안내"),
    ("NOWON_PRESS", "gu/nw_s_1027.html", None),
    ("NOWON_NOTICE", "gu/nw_s_1001.html", "2026년 반려동물문화센터「힐링하시개!댕댕하우스」11월 교육신청 안내"),
    ("SEOUL", "gu/seoul_report.html", None),
])
def test_real_list(code, rel, title):
    source = SOURCES[code]
    result = get_parser(source["parser"]).parse_list(read(rel), source)
    assert result.items, "목록에서 글을 하나도 못 찾았다"
    assert result.reported_total and result.reported_total >= len(result.items)
    assert all(item.posted_on for item in result.items) or code == "MCST"
    if title:
        assert title in [item.title for item in result.items]


@pytest.mark.parametrize("code, rel, phrase", [
    ("MCST", "sources-research/d13564.html", "한라체육관"),
    ("SEOUL", "gu/seoul_d.html", "문화비축기지"),
    ("GANGNAM", "gu/gn_d2.html", "개포동근린공원"),
    ("NOWON_PRESS", "gu/nw_d.html", "반려견 올림픽"),
])
def test_real_detail(code, rel, phrase):
    source = SOURCES[code]
    page = get_parser(source["parser"]).parse_detail(read(rel), source)
    assert phrase in page.text
    assert len(page.text) >= 50
    if page.image_url:
        assert page.image_url.startswith("https://")


def test_real_image_only_notice():
    page = get_parser("gangnam").parse_detail(read("gu/gn_d.html"), SOURCES["GANGNAM_NOTICE"])
    assert len(page.text) < 50
