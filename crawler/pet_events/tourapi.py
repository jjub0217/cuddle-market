"""한국관광공사 국문 관광정보 서비스 searchFestival2 (공식 데이터 연동. 크롤링이 아니다)

오늘 이후 시작하는 축제를 받아 제목에 반려동물 낱말이 있는 것만 남긴다.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from typing import List, Optional

from .regions import region_of

ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/searchFestival2"
DETAIL_ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/detailCommon2"
INTRO_ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/detailIntro2"
FESTIVAL_TYPE = 15  # 관광공사 콘텐츠 종류: 축제·공연·행사
# 소개 정보 칸 → 우리 칸 (설계 7-2절: 출처에 칸으로 적힌 값이 먼저다)
_INTRO_FIELDS = {
    "playtime": "hours",
    "usetimefestival": "fee",
    "sponsor1": "organizer",
    "agelimit": "target",
    "bookingplace": "application",
    "eventplace": "place",
}
_TIME = re.compile(r"\d{1,2}\s*(?:시|:\d{2})")
PET_WORDS = ("반려", "펫", "댕", "냥", "입양", "강아지", "고양이")
ROWS_PER_PAGE = 100
MAX_PAGES = 10


class TourApiError(Exception):
    """응답이 정상(0000)이 아니다. 서비스 키 문제가 가장 흔하다"""


@dataclass(frozen=True)
class TourItem:
    external_id: str
    title: str
    start: Optional[date]
    end: Optional[date]
    region: Optional[str]
    place: Optional[str]
    image_url: Optional[str]
    url: str


def fetch_festivals(service_key: str, today: date, client) -> List[TourItem]:
    items: List[TourItem] = []
    seen = 0
    for page in range(1, MAX_PAGES + 1):
        body = _body(client.get_json(ENDPOINT, params={
            "serviceKey": service_key,
            "MobileOS": "ETC",
            "MobileApp": "CuddleMarket",
            "_type": "json",
            "eventStartDate": today.strftime("%Y%m%d"),
            "numOfRows": ROWS_PER_PAGE,
            "pageNo": page,
        }))
        rows = _rows(body)
        seen += len(rows)
        items.extend(_to_item(row) for row in rows if _is_pet(row.get("title", "")))
        if not rows or seen >= int(body.get("totalCount") or 0):
            break
    return items


def fetch_overview(service_key: str, content_id: str, client) -> Optional[str]:
    """축제 하나의 소개 글(overview). 목록에는 본문이 없어 AI 에 넣을 글자를 따로 받는다. 없으면 None"""
    body = _body(client.get_json(DETAIL_ENDPOINT, params={
        "serviceKey": service_key,
        "MobileOS": "ETC",
        "MobileApp": "CuddleMarket",
        "_type": "json",
        "contentId": content_id,
    }))
    rows = _rows(body)
    overview = (rows[0].get("overview") or "") if rows else ""
    text = re.sub(r"<br\s*/?>", "\n", overview, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text).strip()
    return text or None


def fetch_intro(service_key: str, content_id: str, client) -> dict:
    """축제 소개 정보 칸(detailIntro2). 빈 칸은 빼고, 시각 숫자가 없는 운영시간도 뺀다"""
    body = _body(client.get_json(INTRO_ENDPOINT, params={
        "serviceKey": service_key,
        "MobileOS": "ETC",
        "MobileApp": "CuddleMarket",
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": FESTIVAL_TYPE,
    }))
    rows = _rows(body)
    row = rows[0] if rows else {}
    found = {}
    for api_key, our_key in _INTRO_FIELDS.items():
        value = _plain(row.get(api_key))
        if not value or (our_key == "hours" and not _TIME.search(value)):
            continue
        found[our_key] = value
    return found


def _plain(value) -> str:
    """HTML 줄바꿈과 태그를 빼고 한 줄로"""
    text = re.sub(r"<br\s*/?>", " ", str(value or ""), flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text)).strip()


def _body(payload: dict) -> dict:
    if "OpenAPI_ServiceResponse" in payload:
        header = payload["OpenAPI_ServiceResponse"].get("cmmMsgHeader", {})
        raise TourApiError(header.get("errMsg") or "OpenAPI 오류")
    response = payload.get("response", {})
    header = response.get("header", {})
    if header.get("resultCode") != "0000":
        raise TourApiError(f"{header.get('resultCode')}: {header.get('resultMsg')}")
    return response.get("body", {})


def _rows(body: dict) -> list:
    items = body.get("items")
    if not items:  # 결과가 없으면 빈 글자("")로 온다
        return []
    rows = items.get("item", [])
    return rows if isinstance(rows, list) else [rows]  # 한 건이면 목록이 아니라 하나로 온다


def _is_pet(title: str) -> bool:
    return any(word in title for word in PET_WORDS)


def _ymd(value: str) -> Optional[date]:
    try:
        return datetime.strptime(value or "", "%Y%m%d").date()
    except ValueError:
        return None


def _to_item(row: dict) -> TourItem:
    image = (row.get("firstimage") or "").strip()
    return TourItem(
        external_id=str(row["contentid"]),
        title=row.get("title", "").strip(),
        start=_ymd(row.get("eventstartdate")),
        end=_ymd(row.get("eventenddate")),
        region=region_of(row.get("addr1")),
        place=(row.get("addr1") or "").strip() or None,
        # http 로 오는데, https 화면에서 http 그림은 막힌다. 같은 서버가 https 도 받는다(2026-10-30 확인)
        image_url=image.replace("http://", "https://", 1) if image else None,
        # 대한민국 구석구석 축제 상세는 API 번호(contentid)로 열린다(2026-10-30 사용자가 포천펫스타로 확인).
        # detail/ms_detail.do?cotid= 는 다른 번호를 받아 「비정상적인 접근」이 된다
        url=f"https://korean.visitkorea.or.kr/kfes/detail/fstvlDetail.do?cmsCntntsId={row['contentid']}",
    )
