import json
from datetime import date

from pet_events.extract import extract_event, guard_against_invented
from pet_events.models import EventFields


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModels:
    def __init__(self, text=None, error=None):
        self.text = text
        self.error = error
        self.calls = []

    def generate_content(self, model, contents, config):
        self.calls.append({"model": model, "contents": contents, "config": config})
        if self.error:
            raise self.error
        return FakeResponse(self.text)


class FakeClient:
    def __init__(self, text=None, error=None):
        self.models = FakeModels(text, error)


TEXT = "서울시는 10월 31일(토) 문화비축기지에서 반려문화 축제를 연다. 참가비는 무료다. 반려견 놀이터와 상담이 준비됐다."

GOOD = {
    "is_event": True, "title": "2026 서울 댕냥데이즈", "start_date": "2026-10-31", "end_date": None,
    "region": "서울", "place": "문화비축기지", "organizer": "서울특별시", "target": "반려견",
    "fee": "무료", "one_line": "반려견과 함께 즐기는 가을 축제",
    "activities": ["반려견 놀이터", "건강 상담"], "checks": ["목줄 챙기기"],
}


def test_valid_json_becomes_fields():
    client = FakeClient(json.dumps(GOOD, ensure_ascii=False))
    fields = extract_event(TEXT, "댕냥데이즈 개최", date(2026, 10, 22), client)

    assert fields.is_event is True
    assert fields.title == "2026 서울 댕냥데이즈"
    assert (fields.start, fields.end) == (date(2026, 10, 31), None)
    assert fields.place == "문화비축기지"
    assert fields.activities == ["반려견 놀이터", "건강 상담"]

    config = client.models.calls[0]["config"]
    assert config["response_mime_type"] == "application/json"
    assert "is_event" in config["response_json_schema"]["properties"]
    assert TEXT in client.models.calls[0]["contents"]


def test_not_event():
    client = FakeClient(json.dumps({**GOOD, "is_event": False}))
    assert extract_event(TEXT, "순찰대 출범", None, client).is_event is False


def test_broken_json_is_none():
    assert extract_event(TEXT, "t", None, FakeClient("{not json")) is None


def test_missing_required_key_is_none():
    assert extract_event(TEXT, "t", None, FakeClient(json.dumps({"title": "x"}))) is None


def test_exception_is_none():
    assert extract_event(TEXT, "t", None, FakeClient(error=RuntimeError("quota"))) is None


def test_ai_without_date_falls_back_to_text_dates():
    client = FakeClient(json.dumps({**GOOD, "start_date": None}))
    fields = extract_event(TEXT, "t", date(2026, 10, 22), client)
    assert fields.start == date(2026, 10, 31)


def fields(**overrides):
    base = dict(is_event=True, title="t", start=date(2026, 11, 6), end=date(2026, 11, 8), fee="5,000원")
    base.update(overrides)
    return EventFields(**base)


def test_guard_drops_date_not_in_text():
    guarded = guard_against_invented(fields(), "행사는 12월 1일에 열린다. 참가비 5,000원")
    assert (guarded.start, guarded.end) == (None, None)


def test_guard_keeps_date_in_text_various_shapes():
    for text in ["11월 6일 ~ 8일", "2026. 11. 6. ~ 11. 8.", "2026-11-06 ~ 2026-11-08", "11월 6일(금)~11월 8일(일)"]:
        guarded = guard_against_invented(fields(fee=None), text)
        assert (guarded.start, guarded.end) == (date(2026, 11, 6), date(2026, 11, 8)), text


def test_guard_drops_only_end_when_end_missing():
    guarded = guard_against_invented(fields(fee=None), "11월 6일 하루 열린다")
    assert (guarded.start, guarded.end) == (date(2026, 11, 6), None)


def test_guard_drops_fee_without_free_or_won():
    guarded = guard_against_invented(fields(), "11월 6일 ~ 8일 공원에서 열린다")
    assert guarded.fee is None


def test_guard_keeps_free():
    guarded = guard_against_invented(fields(fee="무료"), "11월 6일 ~ 8일, 참가비 무료")
    assert guarded.fee == "무료"


def test_guard_won_must_be_an_amount():
    # 「공원」「지원」의 「원」은 금액이 아니다
    guarded = guard_against_invented(fields(fee="3,000원"), "11월 6일 ~ 8일 공원 지원 사업")
    assert guarded.fee is None
