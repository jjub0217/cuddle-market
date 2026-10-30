from datetime import date
from pathlib import Path

import pytest

from pet_events.labelled import labelled_fields

# 문체부 상세 파서가 남기는 「칸: 값」 줄 (parsers/mcst.py)
MCST_TEXT = """개최지역: 제주도 제주시
개최기간: 2026. 11. 6. ~ 11. 8. | 10:00~18:00
축제성격: 기타
축제장소: 한라체육관 일원
요금: 무료
연령제한: 전 연령
주최/주관기관: 제주특별자치도
문의: 관리자 064-711-1002
예시 본문입니다."""


def test_reads_labelled_values():
    fields = labelled_fields(MCST_TEXT, date(2026, 10, 30))
    assert fields == {
        "start": date(2026, 11, 6),
        "end": date(2026, 11, 8),
        "hours": "10:00~18:00",
        "place": "한라체육관 일원",
        "fee": "무료",
        "organizer": "제주특별자치도",
        "target": "전 연령",
    }


def test_phone_is_not_taken():
    # 문의 전화는 두지 않기로 했다(개인 담당자 번호가 섞일 수 있다)
    assert "064-711-1002" not in str(labelled_fields(MCST_TEXT, date(2026, 10, 30)))


def test_period_without_time():
    fields = labelled_fields("개최기간: 2026. 12. 5.", date(2026, 10, 30))
    assert fields["start"] == date(2026, 12, 5) and fields["end"] is None
    assert "hours" not in fields


def test_text_without_labels_is_empty():
    assert labelled_fields("서울시는 10월 31일 축제를 연다.", date(2026, 10, 30)) == {}


REAL = Path(__file__).resolve().parents[2] / "probe" / "event-feed-fixtures" / "sources-research" / "d13564.html"


@pytest.mark.skipif(not REAL.exists(), reason="원본 페이지가 없다(저장소 밖 probe/)")
def test_real_mcst_detail():
    import json

    from pet_events.parsers import get_parser

    sources = {s["code"]: s for s in json.loads((Path(__file__).parent.parent / "sources.json").read_text())}
    page = get_parser("mcst").parse_detail(REAL.read_text(encoding="utf-8"), sources["MCST"])
    fields = labelled_fields(page.text, date(2026, 10, 30))
    assert (fields["start"], fields["end"], fields["hours"]) == (date(2026, 11, 6), date(2026, 11, 8), "10:00~18:00")
    assert fields["place"] == "한라체육관 일원"
    assert fields["organizer"] == "제주특별자치도"
