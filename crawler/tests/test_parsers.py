import json
import re
from datetime import date
from pathlib import Path

import pytest

from pet_events.parsers import get_parser

FIXTURES = Path(__file__).parent / "fixtures"
SOURCES = {s["code"]: s for s in json.loads((Path(__file__).parent.parent / "sources.json").read_text())}


def read(name):
    return (FIXTURES / name).read_text(encoding="utf-8")


# (출처, 목록 파일, 들어 있어야 하는 제목, 상세 주소 모양, 첫 글 등록일, 총 건수)
LIST_CASES = [
    ("MCST", "mcst_list.html", "제주 반려동물 문화산업 한마당",
     r"^https://www\.mcst\.go\.kr/site/s_culture/festival/festivalView\.jsp\?pSeq=\d+$", None, 2),
    ("SEOUL", "seoul_list.html", "(석간) 댕냥이의 입양부터 펫로스까지, 문화비축기지에서 만나는 반려의 하루",
     r"^https://www\.seoul\.go\.kr/news/news_report\.do\?bbsNo=158&nttNo=\d+$", date(2026, 10, 22), 2),
    ("GANGNAM", "gangnam_list.html", "“목줄 풀고 신나게 뛰어놀개!”…강남구, 반려견 순회놀이터 운영",
     r"^https://www\.gangnam\.go\.kr/board/B_000031/\d+/view\.do\?mid=ID01_0313$", date(2026, 10, 1), 2),
    ("NOWON_PRESS", "nowon_list.html", "[2026년 노원 반려동물 문화축제] 10월 31일(토) 10시 개최",
     r"^https://www\.nowon\.kr/www/user/bbs/BD_selectBbs\.do\?q_bbsCode=1027&q_bbscttSn=\d+$", date(2026, 10, 12), 2),
]


@pytest.mark.parametrize("code, fixture, title, url_pattern, first_posted, total", LIST_CASES)
def test_list(code, fixture, title, url_pattern, first_posted, total):
    source = SOURCES[code]
    result = get_parser(source["parser"]).parse_list(read(fixture), source)

    assert len(result.items) >= 1
    assert title in [item.title for item in result.items]
    assert all(re.match(url_pattern, item.url) for item in result.items)
    assert all(item.source_code == code for item in result.items)
    assert result.items[0].posted_on == first_posted
    assert result.reported_total == total


def test_seoul_builds_detail_url_from_script_link():
    source = SOURCES["SEOUL"]
    result = get_parser("seoul").parse_list(read("seoul_list.html"), source)

    first = result.items[0]
    assert first.external_id == "468820"
    assert first.url == "https://www.seoul.go.kr/news/news_report.do?bbsNo=158&nttNo=468820"


@pytest.mark.parametrize("code", ["MCST", "SEOUL", "GANGNAM", "NOWON_PRESS"])
def test_empty_page(code):
    source = SOURCES[code]
    result = get_parser(source["parser"]).parse_list("<html></html>", source)
    assert result.items == []
    assert result.reported_total is None


# (출처, 상세 파일, 본문에 있어야 하는 글자, 포스터 주소)
DETAIL_CASES = [
    ("MCST", "mcst_detail.html", "한라체육관",
     "https://www.mcst.go.kr/attachFiles/cultureInfoCourt/localFestival/notifyFestival/1792627856290.jpg"),
    ("SEOUL", "seoul_detail.html", "문화비축기지", "https://www.seoul.go.kr/upload/poster/sample.jpg"),
    ("GANGNAM", "gangnam_detail.html", "개포동근린공원",
     "https://www.gangnam.go.kr/upload/editor/2026/09/23/a991d99b-62f1-44e2-ba1f-c51d6c2c4ddd.png"),
    ("NOWON_PRESS", "nowon_detail.html", "노원 공원",
     "https://www.nowon.kr/component/file/ND_fileDownload.do?q_fileSn=310992&q_fileId=efa3e938"),
]


@pytest.mark.parametrize("code, fixture, phrase, image_url", DETAIL_CASES)
def test_detail(code, fixture, phrase, image_url):
    source = SOURCES[code]
    page = get_parser(source["parser"]).parse_detail(read(fixture), source)

    assert phrase in page.text
    assert page.image_url == image_url


def test_mcst_detail_keeps_labelled_fields():
    # 문체부 상세는 개최지역, 기간, 장소, 주최가 칸으로 따로 있다. 본문 글자에 「칸: 값」으로 남긴다
    page = get_parser("mcst").parse_detail(read("mcst_detail.html"), SOURCES["MCST"])
    assert "개최지역: 제주도 제주시" in page.text
    assert "주최/주관기관: 제주특별자치도" in page.text
    assert "사정에 따라 변경될 수 있습니다" not in page.text  # 사이트 공통 안내문은 뺀다


def test_nowon_detail_title_is_full():
    # 노원 목록 제목은 「…」로 잘린다. 상세 제목을 쓴다
    page = get_parser("qbbs").parse_detail(read("nowon_detail.html"), SOURCES["NOWON_PRESS"])
    assert page.title == "[2026년 노원 반려동물 문화축제] 10월 31일(토) 10시 개최"


def test_image_only_post_has_almost_no_text():
    page = get_parser("gangnam").parse_detail(read("gangnam_detail_image_only.html"), SOURCES["GANGNAM"])
    assert len(page.text) < 50
    assert page.image_url is not None


def test_sources_have_required_keys():
    keys = {"code", "name", "parser", "list_url", "params", "detail_url", "default_region", "enabled"}
    assert {"MCST", "SEOUL", "GANGNAM", "NOWON_PRESS", "NOWON_NOTICE"} <= set(SOURCES)
    for source in SOURCES.values():
        assert keys <= set(source)
        assert "{id}" in source["detail_url"]
