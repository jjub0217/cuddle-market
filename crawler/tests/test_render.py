from datetime import date

from pet_events.models import EventFields
from pet_events.render import END_LINES, render_post

URL = "https://www.seoul.go.kr/news/news_report.do?bbsNo=158&nttNo=468820"


def full_fields(**overrides):
    values = dict(
        is_event=True, title="2026 서울 댕냥데이즈",
        start=date(2026, 10, 31), end=date(2026, 10, 31),
        region="서울", place="문화비축기지", organizer="서울특별시", target="반려견, 반려묘", fee="무료",
        hours="오전 11시~오후 7시", application="사전 신청 필요",
        one_line="반려견과 함께 즐기는 가을 축제",
        activities=["반려견 놀이터와 어질리티 체험", "수의사 건강 상담"],
        checks=["목줄과 배변 봉투를 챙기세요"],
    )
    values.update(overrides)
    return EventFields(**values)


def test_order_and_labels_follow_design():
    title, body = render_post(full_fields(), "서울특별시", URL, image_url="https://www.seoul.go.kr/a.jpg")

    assert title == "2026 서울 댕냥데이즈"
    assert body.split("\n") == [
        "![포스터](https://www.seoul.go.kr/a.jpg)",
        "",
        "한 줄 소개: 반려견과 함께 즐기는 가을 축제",
        "",
        "기간 | 2026.10.31 (토)",
        "운영시간 | 오전 11시~오후 7시",
        "장소 | 서울 문화비축기지",
        "대상 | 반려견, 반려묘",
        "참가비 | 무료",
        "신청 | 사전 신청 필요",
        "주최 | 서울특별시",
        "",
        "이런 걸 할 수 있어요",
        "- 반려견 놀이터와 어질리티 체험",
        "- 수의사 건강 상담",
        "",
        "가기 전에 확인하세요",
        "- 목줄과 배변 봉투를 챙기세요",
        "",
        END_LINES[0],
        END_LINES[1],
        f"[원문 보기]({URL})",
        "출처: 서울특별시",
    ]
    assert END_LINES == (
        "이 글은 주최 기관이 공개한 자료를 바탕으로 정리한 안내입니다.",
        "일정과 참가 조건은 바뀔 수 있으니 공식 안내에서 다시 확인해주세요.",
    )


def test_no_poster_no_poster_line():
    _, body = render_post(full_fields(), "서울특별시", URL)
    assert not body.startswith("![")
    assert body.startswith("한 줄 소개:")


def test_missing_values_say_check_official_notice():
    _, body = render_post(full_fields(fee=None, target=None, organizer=None, place=None, region=None, hours=None, application=None), "서울특별시", URL)
    assert "운영시간 | 공식 안내 확인" in body
    assert "신청 | 공식 안내 확인" in body
    assert "참가비 | 공식 안내 확인" in body
    assert "대상 | 공식 안내 확인" in body
    assert "주최 | 공식 안내 확인" in body
    assert "장소 | 공식 안내 확인" in body


def test_place_without_duplicate_region():
    # 관광공사 주소처럼 장소가 이미 시·도로 시작하면 지역을 또 붙이지 않는다
    _, body = render_post(full_fields(region="제주", place="제주특별자치도 제주시 서광로"), "관광공사", URL)
    assert "장소 | 제주특별자치도 제주시 서광로" in body


def test_without_ai_fields_same_shape_minus_ai_lines():
    _, with_ai = render_post(full_fields(), "서울특별시", URL)
    _, without_ai = render_post(full_fields(one_line=None, activities=[], checks=[]), "서울특별시", URL)

    lines = without_ai.split("\n")
    assert "이런 걸 할 수 있어요" not in lines
    assert "가기 전에 확인하세요" not in lines
    assert not any(line.startswith("한 줄 소개") for line in lines)
    assert lines[0] == "기간 | 2026.10.31 (토)"
    assert lines[-4:] == with_ai.split("\n")[-4:]


def test_period_range():
    _, body = render_post(full_fields(start=date(2026, 11, 6), end=date(2026, 11, 8)), "문체부", URL)
    assert "기간 | 2026.11.06 (금) ~ 2026.11.08 (일)" in body


def test_title_is_at_most_50():
    title, _ = render_post(full_fields(title="가" * 60), "서울특별시", URL)
    assert len(title) <= 50


def test_body_is_at_most_1000_and_ai_fields_shrink_first():
    long_fields = full_fields(
        one_line="한" * 40,
        activities=["활" * 300, "동" * 300, "체" * 300],
        checks=["확" * 300, "인" * 300],
    )
    _, body = render_post(long_fields, "서울특별시", URL, image_url="https://www.seoul.go.kr/a.jpg")

    assert len(body) <= 1000
    assert "기간 | 2026.10.31 (토)" in body          # 수집한 칸은 남는다
    assert body.endswith("출처: 서울특별시")          # 끝 문구도 남는다
    assert "한 줄 소개: " + "한" * 40 in body          # 한 줄 소개는 마지막에 줄인다


def test_body_never_exceeds_1000_even_with_long_collected_fields():
    _, body = render_post(full_fields(place="장" * 900, organizer="주" * 900), "서울특별시", URL)
    assert len(body) <= 1000
    assert body.endswith("출처: 서울특별시")
