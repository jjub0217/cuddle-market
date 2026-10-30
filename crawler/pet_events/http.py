"""사이트 규칙을 지키는 요청기.

- 모든 요청에 우리 이름(USER_AGENT)을 단다. 노원구는 기본 이름(python-requests)이면 400을 돌려준다.
- robots.txt 가 막은 주소는 요청하지 않는다(BlockedByRobots). 판단은 표준대로(robots.py).
- 요청 사이에 delay_sec 이상 쉰다(robots.txt 요청도 센다).
"""
from __future__ import annotations

import json
import time
from typing import Callable, Dict, Optional
from urllib.parse import urlencode, urlsplit

import requests

from . import robots

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
        self._robots: Dict[str, Optional[robots.Robots]] = {}

    def get(self, url: str, params: Optional[dict] = None) -> str:
        full_url = f"{url}{'&' if '?' in url else '?'}{urlencode(params)}" if params else url
        if not self._allowed(full_url):
            raise BlockedByRobots(full_url)
        response = self._request(url, params)
        response.raise_for_status()
        return response.text

    def get_json(self, url: str, params: Optional[dict] = None) -> dict:
        return json.loads(self.get(url, params))

    def _allowed(self, url: str) -> bool:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in self._robots:
            self._robots[origin] = self._load_robots(origin)
        rules = self._robots[origin]
        path = parts.path or "/"
        return True if rules is None else rules.allowed(path + (f"?{parts.query}" if parts.query else ""))

    def _load_robots(self, origin: str) -> Optional[robots.Robots]:
        # RFC 9309: 4xx(없음)만 「막은 곳 없음」이다. 서버 오류나 접속 실패는 「전부 막음」으로 본다(최종 검토 I2)
        try:
            response = self._request(f"{origin}/robots.txt", None)
        except requests.RequestException:
            return robots.Robots([(False, "/")])
        if response.status_code >= 500:
            return robots.Robots([(False, "/")])
        if response.status_code >= 400:
            return None
        return robots.parse(response.text, USER_AGENT)

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
