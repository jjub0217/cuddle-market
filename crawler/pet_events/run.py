"""한 번 수집하기 (설계 5절)

    출처마다  목록 → 최근 90일 → 처음 보는 번호 → 상세 → (50자 미만이면 건너뜀) → AI → 틀 → 서버
    관광공사  축제 목록 → 반려 낱말 → 처음 보는 번호 → 틀 → 서버

한 출처가 막혀도 다른 출처는 계속한다. 문제는 errors 에 모아 두었다가 한 번에 알린다.
AI 가 실패한 글은 기록하지 않는다 — 기록하면 다음 날 다시 묻지 않는다.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field, replace
from datetime import date, timedelta
from typing import Callable, Dict, Optional

from .extract import extract_event, guard_against_invented
from .models import EventFields
from .parsers import PARSERS
from .regions import region_of
from .render import capped, render_post
from .report import RunSummary, SourceStat
from .tourapi import fetch_festivals

RECENT_DAYS = 90
MIN_TEXT = 50
REGION_NAMES = {"서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원",
                "충북", "충남", "전북", "전남", "경북", "경남", "제주"}
TOUR_SOURCE = {"code": "TOURAPI", "name": "한국관광공사", "default_region": None}


@dataclass
class Deps:
    http: object                      # PoliteClient: get(url, params), get_json(url, params)
    cuddle: Optional[object]          # CuddleClient. None 이면 마른 실행(서버에 안 보낸다)
    ai: Optional[object]              # google.genai.Client. None 이면 AI 없이 목록까지만
    tour_key: Optional[str] = None    # 관광공사 서비스 키. 없으면 관광공사는 건너뛴다
    parsers: Dict[str, object] = field(default_factory=lambda: dict(PARSERS))
    log: Callable[[str], None] = lambda message: None


def run_once(today: date, sources: list, deps: Deps) -> RunSummary:
    summary = RunSummary(per_source={}, errors=[])
    for source in sources:
        stat = summary.per_source.setdefault(source["code"], SourceStat())
        try:
            _crawl_source(today, source, deps, stat, summary.errors)
        except Exception as error:  # noqa: BLE001 — 한 출처의 문제로 전체를 멈추지 않는다
            summary.errors.append(f"{source['code']}: {type(error).__name__} {error}")
    if deps.tour_key:
        stat = summary.per_source.setdefault(TOUR_SOURCE["code"], SourceStat())
        try:
            _tour(today, deps, stat, summary.errors)
        except Exception as error:  # noqa: BLE001
            summary.errors.append(f"TOURAPI: {type(error).__name__} {error}")
    return summary


def _crawl_source(today: date, source: dict, deps: Deps, stat: SourceStat, errors: list) -> None:
    parser = deps.parsers[source["parser"]]
    result = parser.parse_list(deps.http.get(source["list_url"], source.get("params")), source)
    stat.listed = len(result.items)
    deps.log(f"{source['code']}: 목록 {len(result.items)}건 (페이지 표시 {result.reported_total})")

    # 「검색 결과 0건」과 「구조가 바뀌어 못 읽음」을 가른다
    if not result.items and result.reported_total:
        errors.append(f"구조 변경 의심: {source['code']}")
        return

    # 첫 실행 때 몇 년 치 옛 글이 한꺼번에 올라가지 않게 최근 글만 본다. 등록일이 없는 목록(문체부)은 다 본다
    recent = [i for i in result.items if i.posted_on is None or today - i.posted_on <= timedelta(days=RECENT_DAYS)]
    by_id = {i.external_id: i for i in recent}
    unseen = _unseen(source["code"], list(by_id), deps)

    for external_id in unseen:
        item = by_id[external_id]
        stat.checked += 1
        try:
            detail = parser.parse_detail(deps.http.get(item.url), source)
            _handle(today, source, deps, stat, errors,
                    external_id=external_id, url=item.url, title=detail.title or item.title,
                    text=detail.text, image_url=detail.image_url, posted_on=item.posted_on)
        except Exception as error:  # noqa: BLE001 — 글 하나의 문제로 출처를 멈추지 않는다
            errors.append(f"{source['code']} {external_id}: {type(error).__name__} {error}")


def _tour(today: date, deps: Deps, stat: SourceStat, errors: list) -> None:
    items = fetch_festivals(deps.tour_key, today, deps.http)
    stat.listed = len(items)
    deps.log(f"TOURAPI: 반려 축제 {len(items)}건")
    by_id = {i.external_id: i for i in items}
    for external_id in _unseen(TOUR_SOURCE["code"], list(by_id), deps):
        item = by_id[external_id]
        stat.checked += 1
        # 관광공사 목록에는 본문이 없어 AI 칸 없이 수집한 칸만으로 틀을 채운다(설계 4절)
        fields = EventFields(is_event=True, title=item.title, start=item.start, end=item.end,
                             region=item.region, place=item.place)
        try:
            _finish(today, TOUR_SOURCE, deps, stat, external_id, item.url, fields, item.image_url)
        except Exception as error:  # noqa: BLE001
            errors.append(f"TOURAPI {external_id}: {type(error).__name__} {error}")


def _handle(today, source, deps, stat, errors, *, external_id, url, title, text, image_url, posted_on) -> None:
    if len(text.strip()) < MIN_TEXT:
        _record(source, deps, stat, external_id, url, title, "SKIPPED_NO_TEXT")
        return
    if deps.ai is None:
        deps.log(f"  {source['code']} {external_id}: AI 키가 없어 여기서 멈춤 — {title}")
        return
    fields = extract_event(text, title, posted_on, deps.ai)
    if fields is None:
        errors.append(f"{source['code']} {external_id}: AI 추출 실패")
        return
    if not fields.is_event:
        _record(source, deps, stat, external_id, url, title, "SKIPPED_NOT_EVENT")
        return
    fields = guard_against_invented(fields, text)
    fields = replace(fields, region=_region(text, fields.region, source.get("default_region")))
    _finish(today, source, deps, stat, external_id, url, fields, image_url)


def _finish(today, source, deps, stat, external_id, url, fields: EventFields, image_url) -> None:
    if fields.start is None:
        _record(source, deps, stat, external_id, url, fields.title, "SKIPPED_NO_DATE")
        return
    if (fields.end or fields.start) < today:
        _record(source, deps, stat, external_id, url, fields.title, "SKIPPED_ENDED", fields.start)
        return
    if not fields.organizer and source["code"] != TOUR_SOURCE["code"]:
        fields = replace(fields, organizer=source["name"])

    title, content = render_post(fields, source["name"], url, image_url=image_url)
    fields = capped(fields)  # 서버 칸 길이 제한(100자, 목록 항목 200자) 안으로
    payload = {
        "sourceCode": source["code"], "externalId": external_id, "sourceUrl": url, "status": "POSTED",
        "title": title, "content": content, "imageUrl": image_url,
        "eventStartDate": fields.start.isoformat(),
        "eventEndDate": fields.end.isoformat() if fields.end and fields.end != fields.start else None,
        "region": fields.region, "place": fields.place, "organizer": fields.organizer,
        "summary": fields.one_line,
        # 상세 화면의 표와 목록(설계 7-2절)
        "target": fields.target, "fee": fields.fee, "hours": fields.hours,
        "activities": fields.activities, "checks": fields.checks,
    }
    if deps.cuddle is None:
        deps.log(f"\n----- [마른 실행] {source['code']} {external_id}\n{title}\n\n{content}\n")
        stat.posted += 1
        return
    result = deps.cuddle.ingest(payload)
    if result.get("status") == "CREATED":
        stat.posted += 1
    else:
        stat.skip(result.get("status", "UNKNOWN"))


def _record(source, deps, stat, external_id, url, title, status, start: Optional[date] = None) -> None:
    stat.skip(status)
    deps.log(f"  {source['code']} {external_id}: {status} — {title}")
    if deps.cuddle is None:
        return
    deps.cuddle.ingest({
        "sourceCode": source["code"], "externalId": external_id, "sourceUrl": url, "status": status,
        "title": (title or "")[:100], "eventStartDate": start.isoformat() if start else None,
    })


def _unseen(code: str, ids: list, deps: Deps) -> list:
    if not ids:
        return []
    if deps.cuddle is None:
        return ids  # 마른 실행은 서버에 묻지 않는다
    return deps.cuddle.unseen(code, ids)


_LABELLED_REGION = re.compile(r"개최지역:\s*(\S+)")


def _region(text: str, ai_region: Optional[str], default_region: Optional[str]) -> Optional[str]:
    """지역을 정하는 순서(설계 7-2절): 문체부 「개최지역」 칸 → AI 값 → 출처 기본 지역"""
    labelled = _LABELLED_REGION.search(text)
    if labelled and region_of(labelled.group(1)):
        return region_of(labelled.group(1))
    if ai_region in REGION_NAMES:
        return ai_region
    return default_region
