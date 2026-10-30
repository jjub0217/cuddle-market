"""사이트 규칙을 지키는 요청기.

- 모든 요청에 우리 이름(USER_AGENT)을 단다. 노원구는 기본 이름(python-requests)이면 400을 돌려준다.
- robots.txt 가 막은 주소는 요청하지 않는다(BlockedByRobots).
- 요청 사이에 delay_sec 이상 쉰다(robots.txt 요청도 센다).
"""
from __future__ import annotations

import time
from typing import Callable, Dict, Optional
from urllib.parse import urlencode, urlsplit
from urllib.robotparser import RobotFileParser

import requests

USER_AGENT = "CuddleEventBot/0.1 (+https://cuddle-market.vercel.app)"
TIMEOUT_SEC = 20


class BlockedByRobots(Exception):
    """robots.txt 가 막은 주소"""


class PoliteClient:
    def __init__(
        self,
        delay_sec: float = 1.0,
        session=None,
        clock: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
    ):
        self.delay_sec = delay_sec
        self.session = session or requests.Session()
        self._clock = clock
        self._sleep = sleep
        self._last_request_at: Optional[float] = None
        self._robots: Dict[str, Optional[RobotFileParser]] = {}

    def get(self, url: str, params: Optional[dict] = None) -> str:
        full_url = f"{url}{'&' if '?' in url else '?'}{urlencode(params)}" if params else url
        if not self._allowed(full_url):
            raise BlockedByRobots(full_url)
        response = self._request(url, params)
        response.raise_for_status()
        return response.text

    def _allowed(self, url: str) -> bool:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in self._robots:
            self._robots[origin] = self._load_robots(origin)
        parser = self._robots[origin]
        return True if parser is None else parser.can_fetch(USER_AGENT, url)

    def _load_robots(self, origin: str) -> Optional[RobotFileParser]:
        try:
            response = self._request(f"{origin}/robots.txt", None)
        except requests.RequestException:
            return None
        if response.status_code >= 400:
            return None  # robots.txt 가 없으면 막은 곳도 없다
        parser = RobotFileParser()
        parser.parse(response.text.splitlines())
        return parser

    def _request(self, url: str, params: Optional[dict]):
        if self._last_request_at is not None:
            waited = self._clock() - self._last_request_at
            if waited < self.delay_sec:
                self._sleep(self.delay_sec - waited)
        try:
            response = self.session.get(
                url, headers={"User-Agent": USER_AGENT}, params=params, timeout=TIMEOUT_SEC
            )
        finally:
            self._last_request_at = self._clock()
        # 머리글에 글자 규칙이 없으면 requests 가 ISO-8859-1 로 읽어 한글이 깨진다
        if not response.encoding or response.encoding.lower() == "iso-8859-1":
            response.encoding = response.apparent_encoding
        return response
