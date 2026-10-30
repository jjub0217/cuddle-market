from datetime import date

from pet_events.dates import parse_range

# 출처마다 날짜를 다르게 쓴다. 같은 모양(date)으로 맞춘다.


def test_full_date_and_partial_end():
    assert parse_range("2026. 11. 6. ~ 11. 8.", date(2026, 10, 1)) == (date(2026, 11, 6), date(2026, 11, 8))


def test_single_dotted_date():
    assert parse_range("2026.10.31", date(2026, 10, 1)) == (date(2026, 10, 31), date(2026, 10, 31))


def test_korean_month_day_uses_reference_year():
    assert parse_range("10월 31일(토)", date(2026, 10, 12)) == (date(2026, 10, 31), date(2026, 10, 31))


def test_january_event_in_december_post_is_next_year():
    # 12월에 올라온 글의 1월 행사는 다음 해다 (계획 Review Focus 1)
    assert parse_range("1월 10일", date(2026, 12, 20)) == (date(2027, 1, 10), date(2027, 1, 10))


def test_iso_range():
    assert parse_range("2026-10-30 ~ 2026-11-01", date(2026, 10, 1)) == (date(2026, 10, 30), date(2026, 11, 1))


def test_day_only_end():
    assert parse_range("11월 6일(금) ~ 8일(일)", date(2026, 10, 20)) == (date(2026, 11, 6), date(2026, 11, 8))


def test_range_crossing_year():
    assert parse_range("12월 30일 ~ 1월 2일", date(2026, 12, 1)) == (date(2026, 12, 30), date(2027, 1, 2))


def test_no_date():
    assert parse_range("반려견 순찰대 출범", date(2026, 10, 1)) == (None, None)


def test_impossible_date_is_ignored():
    assert parse_range("2026.13.45", date(2026, 10, 1)) == (None, None)
