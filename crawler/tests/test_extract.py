import json
from datetime import date

import pytest

from pet_events.extract import PROMPT, ExtractError, extract_event, guard_against_invented
from pet_events.models import EventFields


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModels:
    def __init__(self, text=None, error=None, errors=()):
        self.text = text
        self.error = error
        self.errors = list(errors)  # 앞에서부터 한 번씩 던진다
        self.calls = []

    def generate_content(self, model, contents, config):
        self.calls.append({"model": model, "contents": contents, "config": config})
        if self.errors:
            raise self.errors.pop(0)
        if self.error:
            raise self.error
        return FakeResponse(self.text)


class FakeClient:
    def __init__(self, text=None, error=None, errors=()):
        self.models = FakeModels(text, error, errors)


class ApiError(Exception):
    """google.genai.errors.APIError 처럼 code 를 가진 오류"""

    def __init__(self, code):
        super().__init__(f"{code} RESOURCE_EXHAUSTED" if code == 429 else f"{code} error")
        self.code = code


NO_WAIT = {"sleep": lambda seconds: None}


TEXT = "서울시는 10월 31일(토) 오전 10시부터 오후 5시까지 문화비축기지에서 반려문화 축제를 연다. 참가비는 무료이고 현장에서 접수한다. 반려견 놀이터와 상담이 준비됐다."

GOOD = {
    "is_event": True, "title": "2026 서울 댕냥데이즈", "start_date": "2026-10-31", "end_date": None,
    "region": "서울", "place": "문화비축기지", "organizer": "서울특별시", "target": "반려견",
    "fee": "무료", "hours": "오전 10시~오후 5시", "application": "현장 접수", "one_line": "반려견과 함께 즐기는 가을 축제",
    "activities": ["반려견 놀이터", "건강 상담"], "checks": ["목줄 챙기기"],
}


def test_valid_json_becomes_fields():
    client = FakeClient(json.dumps(GOOD, ensure_ascii=False))
    fields = extract_event(TEXT, "댕냥데이즈 개최", date(2026, 10, 22), client)

    assert fields.is_event is True
    assert fields.title == "2026 서울 댕냥데이즈"
    assert (fields.start, fields.end) == (date(2026, 10, 31), None)
    assert fields.place == "문화비축기지"
    assert fields.hours == "오전 10시~오후 5시"
    assert fields.application == "현장 접수"
    assert fields.activities == ["반려견 놀이터", "건강 상담"]

    config = client.models.calls[0]["config"]
    assert config["response_mime_type"] == "application/json"
    assert "is_event" in config["response_json_schema"]["properties"]
    assert TEXT in client.models.calls[0]["contents"]


def test_not_event():
    client = FakeClient(json.dumps({**GOOD, "is_event": False}))
    assert extract_event(TEXT, "순찰대 출범", None, client).is_event is False


# 실패는 까닭을 담아 알린다(설계 7-2절). 예전에는 None 만 돌려줘 「AI 추출 실패」로만 남았다


def test_broken_json_raises_with_reason():
    with pytest.raises(ExtractError, match="JSON"):
        extract_event(TEXT, "t", None, FakeClient("{not json"), **NO_WAIT)


def test_missing_required_key_raises_with_reason():
    with pytest.raises(ExtractError, match="is_event"):
        extract_event(TEXT, "t", None, FakeClient(json.dumps({"title": "x"})), **NO_WAIT)


def test_other_exception_raises_with_type():
    with pytest.raises(ExtractError, match="RuntimeError"):
        extract_event(TEXT, "t", None, FakeClient(error=RuntimeError("network down")), **NO_WAIT)


def test_rate_limit_waits_and_retries():
    waited = []
    client = FakeClient(json.dumps(GOOD, ensure_ascii=False), errors=[ApiError(429), ApiError(503)])
    fields = extract_event(TEXT, "t", None, client, sleep=waited.append)
    assert fields.title == "2026 서울 댕냥데이즈"
    assert len(client.models.calls) == 3
    assert len(waited) == 2 and all(w >= 10 for w in waited)


def test_rate_limit_gives_up_after_two_retries():
    client = FakeClient(error=ApiError(429))
    with pytest.raises(ExtractError, match="429"):
        extract_event(TEXT, "t", None, client, **NO_WAIT)
    assert len(client.models.calls) == 3


def test_client_error_is_not_retried():
    client = FakeClient(error=ApiError(400))
    with pytest.raises(ExtractError, match="400"):
        extract_event(TEXT, "t", None, client, **NO_WAIT)
    assert len(client.models.calls) == 1


def test_prompt_rules():
    # 반려식물·도시농업·정원 행사는 행사가 아니다. 운영시간은 합쳐 만들지 않는다
    assert "반려식물" in PROMPT and "도시농업" in PROMPT and "정원" in PROMPT
    assert "합쳐" in PROMPT


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


def test_guard_drops_hours_without_time_in_text():
    guarded = guard_against_invented(fields(fee=None, hours="오전 10시~오후 5시"), "11월 6일 ~ 8일 공원에서 열린다")
    assert guarded.hours is None


def test_guard_keeps_hours_with_time_in_text():
    guarded = guard_against_invented(fields(fee=None, hours="10:00~17:00"), "11월 6일 ~ 8일 10:00~17:00")
    assert guarded.hours == "10:00~17:00"


def test_guard_drops_hours_written_in_other_format():
    # 본문 「오후 5시」를 「17:00」으로 바꿔 쓰면 적힌 그대로가 아니다(설계 7-2절)
    guarded = guard_against_invented(fields(fee=None, hours="10:00~17:00"), "11월 6일 ~ 8일 오전 10시~오후 5시")
    assert guarded.hours is None


def test_guard_drops_hours_made_by_joining_programs():
    # 2026-10-30 실제: 「오후 12시 토크」「18:00~20:00 영화」를 이어 붙여 「오전 12시~오후 8시」를 만들었다
    text = "11월 6일 ~ 8일. 오후 12시부터 토크콘서트, 저녁 시간(18:00~20:00) 야외 영화관"
    guarded = guard_against_invented(fields(fee=None, hours="오전 12시~오후 8시"), text)
    assert guarded.hours is None


def test_guard_keeps_hours_whose_numbers_are_all_in_text():
    text = "11월 6일 ~ 8일 오전 10시부터 오후 5시까지"
    guarded = guard_against_invented(fields(fee=None, hours="오전 10시~오후 5시"), text)
    assert guarded.hours == "오전 10시~오후 5시"


def test_guard_drops_application_without_signup_words():
    guarded = guard_against_invented(fields(fee=None, application="사전 신청 필요"), "11월 6일 ~ 8일 공원에서 열린다")
    assert guarded.application is None


def test_guard_drops_application_with_deadline_not_in_text():
    text = "11월 6일 ~ 8일. 참가는 홈페이지에서 사전 신청한다."
    guarded = guard_against_invented(fields(fee=None, application="사전 신청(10월 31일 마감)"), text)
    assert guarded.application is None


def test_guard_keeps_grounded_application():
    text = "11월 6일 ~ 8일. 참가는 10월 31일까지 QR 코드로 사전 신청하거나 당일 현장 접수"
    guarded = guard_against_invented(fields(fee=None, application="사전 신청(10월 31일 마감), 현장 접수 가능"), text)
    assert guarded.application == "사전 신청(10월 31일 마감), 현장 접수 가능"
