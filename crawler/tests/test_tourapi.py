import json
from datetime import date
from pathlib import Path

import pytest

from pet_events.regions import region_of
from pet_events.tourapi import ENDPOINT, PET_WORDS, TourApiError, fetch_festivals

FIXTURE = json.loads((Path(__file__).parent / "fixtures" / "tourapi_festival.json").read_text(encoding="utf-8"))


class FakeClient:
    def __init__(self, pages):
        self.pages = list(pages)
        self.calls = []

    def get_json(self, url, params=None):
        self.calls.append((url, params))
        return self.pages.pop(0)


def test_keeps_only_pet_festivals():
    client = FakeClient([FIXTURE])
    items = fetch_festivals("KEY", date(2026, 10, 30), client)

    assert [item.title for item in items] == ["제주 반려동물 문화산업 한마당", "댕댕이 산책 페스티벌"]
    assert "반려" in PET_WORDS and "댕" in PET_WORDS


def test_request_parameters():
    client = FakeClient([FIXTURE])
    fetch_festivals("KEY", date(2026, 10, 30), client)

    url, params = client.calls[0]
    assert url == ENDPOINT == "https://apis.data.go.kr/B551011/KorService2/searchFestival2"
    assert params["serviceKey"] == "KEY"
    assert params["eventStartDate"] == "20261030"
    assert params["_type"] == "json"
    assert params["MobileOS"] == "ETC" and params["MobileApp"] == "CuddleMarket"
    assert params["numOfRows"] == 100 and params["pageNo"] == 1


def test_fields_are_converted():
    item = fetch_festivals("KEY", date(2026, 10, 30), FakeClient([FIXTURE]))[0]

    assert item.external_id == "2997830"
    assert (item.start, item.end) == (date(2026, 11, 6), date(2026, 11, 8))
    assert item.region == "제주"
    assert item.place == "제주특별자치도 제주시 서광로2길 24"
    assert item.image_url == "https://tong.visitkorea.or.kr/cms/resource/30/0000000_image2_1.jpg"
    assert item.url == "https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=2997830"


def test_missing_image_is_none():
    item = fetch_festivals("KEY", date(2026, 10, 30), FakeClient([FIXTURE]))[1]
    assert item.image_url is None


def test_error_result_code_raises():
    error = {"response": {"header": {"resultCode": "30", "resultMsg": "SERVICE KEY IS NOT REGISTERED ERROR."}}}
    with pytest.raises(TourApiError):
        fetch_festivals("KEY", date(2026, 10, 30), FakeClient([error]))


def test_gateway_error_raises():
    error = {"OpenAPI_ServiceResponse": {"cmmMsgHeader": {"errMsg": "SERVICE_KEY_IS_NULL", "returnReasonCode": "20"}}}
    with pytest.raises(TourApiError):
        fetch_festivals("KEY", date(2026, 10, 30), FakeClient([error]))


def test_no_results_is_empty_list():
    # 결과가 없으면 items 가 빈 글자("")로 온다
    empty = {"response": {"header": {"resultCode": "0000"}, "body": {"items": "", "totalCount": 0}}}
    assert fetch_festivals("KEY", date(2026, 10, 30), FakeClient([empty])) == []


def test_reads_next_page_until_total():
    first = json.loads(json.dumps(FIXTURE))
    first["response"]["body"]["totalCount"] = 4
    second = {"response": {"header": {"resultCode": "0000"}, "body": {"items": {"item": {
        "contentid": "3333333", "title": "반려견 운동회", "eventstartdate": "20261120", "eventenddate": "20261120",
        "addr1": "서울특별시 마포구", "firstimage": ""}}, "totalCount": 4, "pageNo": 2}}}
    client = FakeClient([first, second])

    items = fetch_festivals("KEY", date(2026, 10, 30), client)

    assert [c[1]["pageNo"] for c in client.calls] == [1, 2]
    assert items[-1].title == "반려견 운동회" and items[-1].region == "서울"


@pytest.mark.parametrize("address, region", [
    ("서울특별시 마포구", "서울"), ("부산광역시 해운대구", "부산"), ("경기도 수원시", "경기"),
    ("강원특별자치도 춘천시", "강원"), ("충청남도 천안시", "충남"), ("전북특별자치도 전주시", "전북"),
    ("경상북도 포항시", "경북"), ("제주도 제주시", "제주"), ("세종특별자치시", "세종"),
    ("한라체육관 일원", None), ("", None), (None, None),
])
def test_region_of(address, region):
    assert region_of(address) == region
