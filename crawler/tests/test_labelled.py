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


SHOWALA_TEXT = """전시기간: 2026-06-26 ~ 2026-06-28
개최장소: 수원메쎄 (SUWON MESSE)
세부장소: 2홀
전시분야: 취미|기호|반려동물
주최: (사)한국펫사료협회 KPFA
입장료안내: ■사전등록시 무료입장 ■현장등록 : 성인 1인 10,000원
관람시간: 10:00~18:00 (입장마감 17:30)
예시 상세정보입니다."""


def test_showala_labelled_values():
    fields = labelled_fields(SHOWALA_TEXT, date(2026, 5, 1))
    assert (fields["start"], fields["end"]) == (date(2026, 6, 26), date(2026, 6, 28))
    assert fields["hours"] == "10:00~18:00 (입장마감 17:30)"
    assert fields["place"] == "수원메쎄 (SUWON MESSE) 2홀"
    assert fields["organizer"] == "(사)한국펫사료협회 KPFA"
    assert fields["fee"] == "■사전등록시 무료입장 ■현장등록 : 성인 1인 10,000원"
    assert fields["region"] == "경기"  # 전시장 이름으로 지역을 정한다


@pytest.mark.parametrize("venue, region", [
    ("킨텍스 (KINTEX)", "경기"), ("일산 킨텍스 제2전시장", "경기"), ("코엑스 (COEX)", "서울"), ("SETEC", "서울"),
    ("벡스코 (BEXCO)", "부산"), ("엑스코 (EXCO)", "대구"), ("대전컨벤션센터 (DCC)", "대전"), ("어느 체육관", None),
    # 2026-10-30 실제 쇼알라에서 빠졌던 곳: 전시장 이름 대신 도시 이름으로도 정한다
    ("군산새만금컨벤션센터 (GSCO) 실내전시장", "전북"), ("청주 오스코 (OSCO) 2 홀", "충북"),
    ("부산 해운대 전시장", "부산"), ("고양 어울림누리", "경기"), ("창원 컨벤션센터", "경남"),
])
def test_venue_region(venue, region):
    fields = labelled_fields(f"개최장소: {venue}", date(2026, 5, 1))
    assert fields.get("region") == region


# 출처가 칸에 잘못 적는 일이 있다(2026-10-30 쇼알라 크리쳐 케어로그 대전의 「관람시간」에 주소)

def test_hours_label_without_time_is_ignored():
    text = "전시기간: 2026-11-28 ~ 2026-11-29\n관람시간: 대전컨벤션센터 1전시장 (대전광역시 유성구 엑스포로 107)"
    fields = labelled_fields(text, date(2026, 10, 30))
    assert "hours" not in fields
    assert fields["start"] == date(2026, 11, 28)


def test_period_label_without_date_is_ignored():
    fields = labelled_fields("전시기간: 추후 공지", date(2026, 10, 30))
    assert "start" not in fields and "end" not in fields


def test_hours_label_with_address_before_time_keeps_time_part():
    # 2026-10-30 실제 쇼알라: 관람시간 칸에 주소·날짜가 앞에 섞여 있었다
    text = "관람시간: 대전컨벤션센터 1전시장 (대전광역시 유성구 엑스포로 107) 26.11.28~29 (토,일) 토 12:00~18:00 일 10:00~18:00"
    assert labelled_fields(text, date(2026, 10, 30))["hours"] == "토 12:00~18:00 일 10:00~18:00"


def test_plain_hours_label_is_kept_as_is():
    text = "관람시간: 금/토 10:00 ~ 18:00 (입장마감 17:30) 일 10:00 ~ 17:30"
    assert labelled_fields(text, date(2026, 10, 30))["hours"] == "금/토 10:00 ~ 18:00 (입장마감 17:30) 일 10:00 ~ 17:30"
