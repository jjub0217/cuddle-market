import json
from datetime import date
from types import SimpleNamespace

from pet_events.http import BlockedByRobots
from pet_events.models import DetailPage, ListItem, ListResult
from pet_events.run import Deps, run_once

TODAY = date(2026, 10, 30)
LONG_TEXT = "노원구는 11월 8일(일) 오전 10시부터 낮 12시까지 노원 공원에서 반려견 산책 행사를 연다. 참가비는 무료이며 현장 접수로 누구나 참여할 수 있다. " * 2


def source(code="NOWON_PRESS", parser="fake", region="서울"):
    return {"code": code, "name": "노원구", "parser": parser, "list_url": f"https://{code.lower()}.kr/list",
            "params": {}, "detail_url": f"https://{code.lower()}.kr/view?id={{id}}", "default_region": region,
            "enabled": True}


class FakeParser:
    def __init__(self, items, details, reported_total=None):
        self.items = items
        self.details = details
        self.reported_total = reported_total

    def parse_list(self, html, src):
        return ListResult(items=self.items, reported_total=self.reported_total)

    def parse_detail(self, html, src):
        return self.details[html]


class FakeHttp:
    def __init__(self, blocked=()):
        self.urls = []
        self.blocked = set(blocked)

    def get(self, url, params=None):
        self.urls.append(url)
        if url in self.blocked:
            raise BlockedByRobots(url)
        return url  # 상세 파서가 이 주소로 본문을 고른다

    def get_json(self, url, params=None):
        raise AssertionError("이 시험에서는 관광공사를 부르지 않는다")


class FakeCuddle:
    def __init__(self, seen=()):
        self.seen = set(seen)
        self.payloads = []

    def unseen(self, code, ids):
        return [i for i in ids if (code, i) not in self.seen]

    def ingest(self, payload):
        self.payloads.append(payload)
        return {"status": "CREATED" if payload["status"] == "POSTED" else "RECORDED_SKIP", "postId": 1}


class FakeAI:
    def __init__(self, answer):
        self.answer = answer
        self.calls = 0
        self.models = self

    def generate_content(self, model, contents, config):
        self.calls += 1
        return SimpleNamespace(text=json.dumps(self.answer, ensure_ascii=False))


EVENT = {"is_event": True, "title": "노원 반려동물 산책 한마당", "start_date": "2026-11-08", "end_date": None,
         "region": "서울", "place": "노원 공원", "organizer": "노원구", "target": "반려견", "fee": "무료",
         "hours": "오전 10시~낮 12시", "application": "현장 접수",
         "one_line": "이웃과 함께 걷는 산책 행사", "activities": ["산책 코스 걷기"], "checks": ["목줄 챙기기"]}


def item(external_id="1", posted=date(2026, 10, 20), title="노원 반려견 산책 행사 개최"):
    return ListItem("NOWON_PRESS", external_id, title, f"https://nowon_press.kr/view?id={external_id}", posted)


def run(items, details, ai_answer=EVENT, seen=(), reported_total=None, blocked=(), sources=None):
    parser = FakeParser(items, details, reported_total)
    http = FakeHttp(blocked)
    cuddle = FakeCuddle(seen)
    ai = FakeAI(ai_answer)
    deps = Deps(http=http, cuddle=cuddle, ai=ai, tour_key=None, parsers={"fake": parser}, ai_pace=lambda: None)
    summary = run_once(TODAY, sources or [source()], deps)
    return summary, http, cuddle, ai


def detail_of(i, text=LONG_TEXT, image=None):
    return {i.url: DetailPage(text=text, image_url=image)}


def test_old_list_items_are_not_read():
    old = item("1", posted=date(2026, 7, 1))  # 90일보다 오래됐다
    summary, http, cuddle, _ = run([old], detail_of(old))
    assert old.url not in http.urls
    assert cuddle.payloads == []


def test_seen_items_are_not_read():
    seen = item("1")
    summary, http, cuddle, _ = run([seen], detail_of(seen), seen={("NOWON_PRESS", "1")})
    assert seen.url not in http.urls
    assert cuddle.payloads == []


def test_short_text_is_skipped_without_ai():
    short = item("1")
    _, _, cuddle, ai = run([short], detail_of(short, text="포스터 참고"))
    assert ai.calls == 0
    assert cuddle.payloads[0]["status"] == "SKIPPED_NO_TEXT"


def test_not_event():
    i = item("1")
    _, _, cuddle, _ = run([i], detail_of(i), ai_answer={**EVENT, "is_event": False})
    assert cuddle.payloads[0]["status"] == "SKIPPED_NOT_EVENT"


def test_ended_event():
    i = item("1")
    ended_text = "노원구는 10월 25일(일) 노원 공원에서 반려견 산책 행사를 열었다. 참가비는 무료였고 많은 주민이 참여했다. 다음에도 열 예정이다."
    _, _, cuddle, _ = run([i], detail_of(i, text=ended_text), ai_answer={**EVENT, "start_date": "2026-10-25"})
    assert cuddle.payloads[0]["status"] == "SKIPPED_ENDED"


def test_no_date():
    i = item("1")
    text = "노원구는 반려견 산책 행사를 연다. 자세한 일정은 추후 안내한다. 참가비는 무료이며 누구나 참여할 수 있다. 많은 참여 바란다."
    _, _, cuddle, _ = run([i], detail_of(i, text=text), ai_answer={**EVENT, "start_date": None})
    assert cuddle.payloads[0]["status"] == "SKIPPED_NO_DATE"


def test_posted_payload():
    i = item("1")
    summary, _, cuddle, _ = run([i], detail_of(i, image="https://www.nowon.kr/poster.png"))
    payload = cuddle.payloads[0]

    assert payload["status"] == "POSTED"
    assert payload["sourceCode"] == "NOWON_PRESS" and payload["externalId"] == "1"
    assert payload["sourceUrl"] == i.url
    assert payload["title"] == "노원 반려동물 산책 한마당"
    assert payload["content"].startswith("![포스터](https://www.nowon.kr/poster.png)")
    assert "장소 | 서울 노원 공원" in payload["content"]
    assert payload["imageUrl"] == "https://www.nowon.kr/poster.png"
    assert payload["eventStartDate"] == "2026-11-08"
    assert payload["eventEndDate"] is None
    assert (payload["region"], payload["place"], payload["organizer"]) == ("서울", "노원 공원", "노원구")
    assert payload["summary"] == "이웃과 함께 걷는 산책 행사"
    assert (payload["target"], payload["fee"]) == ("반려견", "무료")
    assert payload["hours"] == "오전 10시~낮 12시"
    assert payload["application"] == "현장 접수"
    assert payload["activities"] == ["산책 코스 걷기"]
    assert payload["checks"] == ["목줄 챙기기"]
    assert summary.per_source["NOWON_PRESS"].posted == 1


def test_region_falls_back_to_source_default_and_organizer_to_source_name():
    i = item("1")
    _, _, cuddle, _ = run([i], detail_of(i), ai_answer={**EVENT, "region": None, "organizer": None})
    assert cuddle.payloads[0]["region"] == "서울"
    assert cuddle.payloads[0]["organizer"] == "노원구"


def test_ai_failure_is_error_and_not_recorded():
    # 기록하지 않아야 다음 날 다시 묻는다
    i = item("1")
    parser = FakeParser([i], detail_of(i))
    broken = SimpleNamespace(models=SimpleNamespace(generate_content=lambda **k: SimpleNamespace(text="{bad")))
    deps = Deps(http=FakeHttp(), cuddle=FakeCuddle(), ai=broken, tour_key=None, parsers={"fake": parser},
                ai_pace=lambda: None)
    summary = run_once(TODAY, [source()], deps)
    assert deps.cuddle.payloads == []
    # 까닭이 문제 목록에 남는다(예전에는 「AI 추출 실패」뿐이었다)
    assert any("AI" in error and "JSON" in error for error in summary.errors), summary.errors


def test_one_source_failing_does_not_stop_others():
    blocked = source("BLOCKED")
    ok = source("NOWON_PRESS")
    i = item("1")
    summary, _, cuddle, _ = run([i], detail_of(i), sources=[blocked, ok], blocked={blocked["list_url"]})
    assert any("BLOCKED" in error for error in summary.errors)
    assert [p["status"] for p in cuddle.payloads] == ["POSTED"]


def test_structure_change_is_reported():
    summary, _, _, _ = run([], {}, reported_total=5)
    assert "구조 변경 의심: NOWON_PRESS" in summary.errors


def test_zero_search_results_is_not_an_error():
    summary, _, _, _ = run([], {}, reported_total=0)
    assert summary.errors == []


def test_payload_fits_server_limits():
    # 서버(EventIngestRequest)는 칸마다 길이 제한이 있다. 넘으면 글 전체가 400 으로 거절된다
    i = item("1")
    long_answer = {**EVENT, "place": "장" * 300, "organizer": "주" * 300, "target": "대" * 300, "fee": "무료 " * 100,
                   "one_line": "소" * 300, "hours": "10시 " * 100, "application": "접수 " * 100, "activities": ["활" * 500] * 3, "checks": ["확" * 500] * 2}
    _, _, cuddle, _ = run([i], detail_of(i), ai_answer=long_answer)
    payload = cuddle.payloads[0]

    for key in ("place", "organizer", "target", "fee", "summary", "hours", "application"):
        assert len(payload[key]) <= 100, key
    assert len(payload["region"]) <= 20
    assert all(len(x) <= 200 for x in payload["activities"] + payload["checks"])
    assert len(payload["activities"]) <= 3 and len(payload["checks"]) <= 2
    assert len(payload["title"]) <= 50 and len(payload["content"]) <= 1000


def test_labelled_values_win_over_ai():
    # AI 가 다른 날(11-14)을 골라도 출처에 칸으로 적힌 값을 쓴다(설계 7-2절)
    i = item("1")
    text = ("개최지역: 제주도 제주시\n개최기간: 2026. 11. 6. ~ 11. 8. | 10:00~18:00\n축제장소: 한라체육관 일원\n"
            "요금: 무료\n연령제한: 전 연령\n주최/주관기관: 제주특별자치도\n예시 본문입니다. 반려동물 축제가 열립니다. 11월 14일 사전 행사.")
    ai = {**EVENT, "start_date": "2026-11-14", "end_date": None, "hours": None, "place": "제주시",
          "fee": None, "organizer": "제주도", "target": "반려견"}
    _, _, cuddle, _ = run([i], detail_of(i, text=text), ai_answer=ai)
    p = cuddle.payloads[0]

    assert (p["eventStartDate"], p["eventEndDate"]) == ("2026-11-06", "2026-11-08")
    assert p["hours"] == "10:00~18:00"
    assert (p["place"], p["fee"], p["organizer"], p["target"]) == ("한라체육관 일원", "무료", "제주특별자치도", "전 연령")
    assert p["region"] == "제주"
    assert p["summary"] == EVENT["one_line"]  # 한 줄 소개와 목록은 AI 가 맡는다


def test_plant_titles_are_not_events_without_asking_ai():
    # 「반려」로 검색하면 「반려식물」도 걸린다(설계 7-2절)
    plant = item("1", title="2026 반려식물 클리닉 운영 안내")
    _, _, cuddle, ai = run([plant], detail_of(plant))
    assert ai.calls == 0
    assert cuddle.payloads[0]["status"] == "SKIPPED_NOT_EVENT"


def test_ai_calls_are_paced():
    paced = []
    a, b = item("1"), item("2")
    parser = FakeParser([a, b], {**detail_of(a), **detail_of(b)})
    deps = Deps(http=FakeHttp(), cuddle=FakeCuddle(), ai=FakeAI(EVENT), tour_key=None, parsers={"fake": parser},
                ai_pace=lambda: paced.append(1))
    run_once(TODAY, [source()], deps)
    assert len(paced) == 2  # AI 를 부를 때마다 한 번씩 쉰다


class TourHttp(FakeHttp):
    """관광공사 축제 목록과 소개 글을 돌려준다"""

    def __init__(self, overview_text):
        super().__init__()
        self.overview_text = overview_text

    def get_json(self, url, params=None):
        if url.endswith("searchFestival2"):
            return {"response": {"header": {"resultCode": "0000"}, "body": {"items": {"item": [{
                "contentid": "3545306", "title": "포천펫스타", "eventstartdate": "20261114", "eventenddate": "20261115",
                "addr1": "경기도 포천시 신북면 아트밸리로 234", "firstimage": ""}]}, "totalCount": 1}}}
        if url.endswith("detailIntro2"):
            item = {"contentid": "3545306", "playtime": "10:00~17:00", "usetimefestival": "무료",
                    "sponsor1": "포천시", "eventplace": "포천아트밸리 힐링숲"}
            return {"response": {"header": {"resultCode": "0000"}, "body": {"items": {"item": [item]}, "totalCount": 1}}}
        items = {"item": [{"contentid": "3545306", "overview": self.overview_text}]} if self.overview_text else ""
        return {"response": {"header": {"resultCode": "0000"}, "body": {"items": items, "totalCount": 1}}}


TOUR_OVERVIEW = "포천펫스타는 11월 14일부터 15일까지 포천 아트밸리에서 열리는 반려동물 축제입니다. 어질리티와 펫 패션쇼가 있습니다."


def run_tour(overview_text, ai_answer):
    ai = FakeAI(ai_answer)
    deps = Deps(http=TourHttp(overview_text), cuddle=FakeCuddle(), ai=ai, tour_key="KEY", parsers={},
                ai_pace=lambda: None)
    summary = run_once(TODAY, [], deps)
    return summary, deps.cuddle.payloads, ai


def test_tour_overview_goes_to_ai_and_api_values_win():
    ai_answer = {**EVENT, "title": "포천펫스타", "start_date": "2026-11-20", "end_date": None, "place": "포천",
                 "region": "서울", "one_line": "반려동물과 함께 즐기는 포천 축제", "activities": ["어질리티 체험"]}
    _, payloads, ai = run_tour(TOUR_OVERVIEW, ai_answer)
    p = payloads[0]

    assert ai.calls == 1
    assert p["summary"] == "반려동물과 함께 즐기는 포천 축제" and p["activities"] == ["어질리티 체험"]
    # 기간·장소·지역은 API 칸 값이 먼저다
    assert (p["eventStartDate"], p["eventEndDate"]) == ("2026-11-14", "2026-11-15")
    # 장소는 소개 정보의 행사 장소(eventplace)가 주소보다 먼저다. 지역은 API 주소로
    assert (p["place"], p["region"]) == ("포천아트밸리 힐링숲", "경기")


def test_tour_without_overview_posts_without_ai_fields():
    _, payloads, ai = run_tour(None, EVENT)
    assert ai.calls == 0
    assert payloads[0]["status"] == "POSTED" and payloads[0]["summary"] is None


def test_tour_overview_saying_not_pet_event_is_skipped():
    _, payloads, _ = run_tour(TOUR_OVERVIEW, {**EVENT, "is_event": False})
    assert payloads[0]["status"] == "SKIPPED_NOT_EVENT"


def test_tour_intro_values_win_over_ai():
    ai_answer = {**EVENT, "title": "포천펫스타", "start_date": "2026-11-14", "hours": None, "fee": None,
                 "organizer": "포천 어딘가", "place": "포천"}
    _, payloads, _ = run_tour(TOUR_OVERVIEW, ai_answer)
    p = payloads[0]
    assert (p["hours"], p["fee"], p["organizer"], p["place"]) == ("10:00~17:00", "무료", "포천시", "포천아트밸리 힐링숲")
    assert p["region"] == "경기"  # 지역은 API 주소로 정한 값 그대로


def test_aggregator_source_name_is_not_used_as_organizer():
    # 쇼알라처럼 여러 주최의 행사를 모은 출처는 주최가 없어도 출처 이름으로 채우지 않는다
    src = {**source(), "aggregator": True, "name": "쇼알라(한국전시산업진흥회)"}
    i = item("1")
    _, _, cuddle, _ = run([i], detail_of(i), ai_answer={**EVENT, "organizer": None}, sources=[src])
    assert cuddle.payloads[0]["organizer"] is None



def test_missing_detail_area_is_error_not_record():
    # I1: 상세 본문 영역을 못 찾으면(구조가 바뀜) 「글자 없음」으로 기록하지 않고 알린다 — 기록하면 다시 안 묻는다
    i = item("1")
    summary, _, cuddle, ai = run([i], {i.url: DetailPage(text="", image_url=None, found=False)})
    assert cuddle.payloads == []
    assert any("상세 구조 변경 의심" in e for e in summary.errors)
