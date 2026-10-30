"""Cuddle 서버의 수집 주소 두 개 (cmarket_api EventIngestController). 로그인 대신 X-Ingest-Key"""
from __future__ import annotations

from typing import List

import requests


class CuddleError(Exception):
    """수집 주소가 정상 응답을 주지 않았다(401: 키 틀림, 503: 서버에 키 없음)"""


class CuddleClient:
    def __init__(self, base_url: str, ingest_key: str, session=None):
        self.base_url = base_url.rstrip("/")
        self.ingest_key = ingest_key
        self.session = session or requests.Session()

    def unseen(self, source_code: str, ids: List[str]) -> List[str]:
        data = self._post("/ingest/events/unseen", {"sourceCode": source_code, "externalIds": ids})
        return list(data["unseen"])

    def ingest(self, payload: dict) -> dict:
        return self._post("/ingest/events", payload)

    def _post(self, path: str, body: dict) -> dict:
        response = self.session.post(
            self.base_url + path, json=body, headers={"X-Ingest-Key": self.ingest_key}, timeout=20
        )
        if response.status_code >= 400:
            raise CuddleError(f"{path} → HTTP {response.status_code}")
        return response.json()["data"]
