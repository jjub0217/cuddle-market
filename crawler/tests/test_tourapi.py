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
    # 대한민국 구석구석 축제 상세. ms_detail.do?cotid= 는 다른 번호(긴 고유 문자열)라 「비정상적인 접근」이 됐다(2026-10-30)
    assert item.url == "https://korean.visitkorea.or.kr/kfes/detail/fstvlDetail.do?cmsCntntsId=2997830"


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


# 관광공사 축제 목록에는 본문이 없다. 축제마다 소개 글(detailCommon2 의 overview)을 받아 AI 에 넣는다

from pet_events.tourapi import DETAIL_ENDPOINT, fetch_overview  # noqa: E402

OVERVIEW = {"response": {"header": {"resultCode": "0000"}, "body": {"items": {"item": [
    {"contentid": "3545306", "overview": "포천펫스타는 반려동물과 함께하는 축제입니다.<br>어질리티 체험과<br />펫 패션쇼가 열립니다."}
]}, "totalCount": 1}}}


def test_overview_is_plain_text():
    client = FakeClient([OVERVIEW])
    text = fetch_overview("KEY", "3545306", client)

    assert text == "포천펫스타는 반려동물과 함께하는 축제입니다.\n어질리티 체험과\n펫 패션쇼가 열립니다."
    url, params = client.calls[0]
    assert url == DETAIL_ENDPOINT == "https://apis.data.go.kr/B551011/KorService2/detailCommon2"
    assert params["contentId"] == "3545306" and params["serviceKey"] == "KEY" and params["_type"] == "json"


def test_overview_missing_is_none():
    empty = {"response": {"header": {"resultCode": "0000"}, "body": {"items": "", "totalCount": 0}}}
    assert fetch_overview("KEY", "1", FakeClient([empty])) is None


def test_overview_error_raises():
    error = {"response": {"header": {"resultCode": "10", "resultMsg": "INVALID_REQUEST_PARAMETER_ERROR"}}}
    with pytest.raises(TourApiError):
        fetch_overview("KEY", "1", FakeClient([error]))
