import pytest

from pet_events.http import USER_AGENT, BlockedByRobots, PoliteClient


class FakeResponse:
    def __init__(self, text, status=200):
        self.text = text
        self.status_code = status
        self.encoding = "utf-8"
        self.apparent_encoding = "utf-8"

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class FakeSession:
    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def get(self, url, headers=None, params=None, timeout=None):
        self.calls.append({"url": url, "headers": headers, "params": params, "timeout": timeout})
        for prefix, response in self.pages.items():
            if url.startswith(prefix):
                return response
        return FakeResponse("", 404)


class FakeClock:
    def __init__(self):
        self.now = 100.0
        self.slept = []

    def monotonic(self):
        return self.now

    def sleep(self, seconds):
        self.slept.append(seconds)
        self.now += seconds


def make_client(pages):
    session = FakeSession(pages)
    clock = FakeClock()
    client = PoliteClient(delay_sec=1.0, session=session, clock=clock.monotonic, sleep=clock.sleep)
    return client, session, clock


ROBOTS = FakeResponse("User-agent: *\nDisallow: /board\n")


def test_blocked_path_is_not_requested():
    client, session, _ = make_client({"https://example.go.kr/robots.txt": ROBOTS})

    with pytest.raises(BlockedByRobots):
        client.get("https://example.go.kr/board/1")

    assert [c["url"] for c in session.calls] == ["https://example.go.kr/robots.txt"]


def test_user_agent_on_every_request():
    client, session, _ = make_client({
        "https://example.go.kr/robots.txt": ROBOTS,
        "https://example.go.kr/news": FakeResponse("<html>ok</html>"),
    })

    assert client.get("https://example.go.kr/news", params={"q": "반려"}) == "<html>ok</html>"

    assert USER_AGENT == "CuddleEventBot/0.1 (+https://cuddle-market.vercel.app)"
    assert all(c["headers"]["User-Agent"] == USER_AGENT for c in session.calls)
    assert session.calls[-1]["params"] == {"q": "반려"}
    assert session.calls[-1]["timeout"] == 20


def test_waits_at_least_one_second_between_requests():
    client, _, clock = make_client({
        "https://example.go.kr/robots.txt": ROBOTS,
        "https://example.go.kr/news": FakeResponse("ok"),
    })

    client.get("https://example.go.kr/news")
    client.get("https://example.go.kr/news")

    # robots.txt, 첫 요청, 두 번째 요청 사이마다 1초씩 기다린다
    assert clock.slept == [1.0, 1.0]


def test_missing_robots_allows_all():
    client, _, _ = make_client({"https://example.go.kr/news": FakeResponse("ok")})

    assert client.get("https://example.go.kr/news") == "ok"


# 2026-10-30 실제 서울시 robots.txt 모양. 맨 위 「Disallow: /」 뒤에 「Allow: /news」 가 온다.
# 표준(RFC 9309)은 더 길게 맞는 규칙이 이긴다. 파이썬 기본 robotparser 는 위에서부터 처음 맞는 것을 써서
# /news 까지 막힌 것으로 봤다.
SEOUL_ROBOTS = FakeResponse(
    "User-agent: *\nDisallow: /\nDisallow: /seoul/sos\n\nAllow: /$\nAllow: /seoul\nAllow: /news\n"
)


def test_longest_match_wins_like_the_standard():
    client, _, _ = make_client({
        "https://www.seoul.go.kr/robots.txt": SEOUL_ROBOTS,
        "https://www.seoul.go.kr/news": FakeResponse("ok"),
        "https://www.seoul.go.kr/": FakeResponse("home"),
    })

    assert client.get("https://www.seoul.go.kr/news/news_report.do", params={"bbsNo": "158"}) == "ok"
    assert client.get("https://www.seoul.go.kr/") == "home"          # Allow: /$
    with pytest.raises(BlockedByRobots):
        client.get("https://www.seoul.go.kr/other/page")             # Disallow: / 만 맞는다
    with pytest.raises(BlockedByRobots):
        client.get("https://www.seoul.go.kr/seoul/sos/1")            # 더 긴 Disallow 가 Allow: /seoul 을 이긴다


def test_wildcard_and_our_own_group():
    robots = FakeResponse(
        "User-agent: *\nAllow: /\n\nUser-agent: CuddleEventBot\nDisallow: /*.pdf$\nDisallow: /private\n"
    )
    client, _, _ = make_client({"https://example.go.kr/robots.txt": robots, "https://example.go.kr/": FakeResponse("ok")})

    assert client.get("https://example.go.kr/board/a.html") == "ok"
    with pytest.raises(BlockedByRobots):
        client.get("https://example.go.kr/files/a.pdf")
    with pytest.raises(BlockedByRobots):
        client.get("https://example.go.kr/private/1")
