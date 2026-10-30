"""실행 결과 정리와 디스코드 알림. 오류가 있거나 새 글이 하나라도 있을 때만 한 번 보낸다"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

import requests


@dataclass
class SourceStat:
    listed: int = 0       # 목록에서 찾은 글
    checked: int = 0      # 처음 봐서 상세를 읽은 글
    posted: int = 0       # 행사 소식에 올린 글
    skipped: Dict[str, int] = field(default_factory=dict)  # 건너뛴 까닭별 수

    def skip(self, status: str) -> None:
        self.skipped[status] = self.skipped.get(status, 0) + 1


@dataclass
class RunSummary:
    per_source: Dict[str, SourceStat]
    errors: List[str]

    @property
    def posted(self) -> int:
        return sum(stat.posted for stat in self.per_source.values())


def should_notify(summary: RunSummary) -> bool:
    return bool(summary.errors) or summary.posted > 0


def format_report(summary: RunSummary) -> str:
    lines = [f"🐾 행사 소식 수집: 새 글 {summary.posted}건" + (f", 문제 {len(summary.errors)}건" if summary.errors else "")]
    for code, stat in summary.per_source.items():
        skipped = ", ".join(f"{k.replace('SKIPPED_', '').lower()} {v}" for k, v in stat.skipped.items())
        lines.append(f"- {code}: 목록 {stat.listed} · 새로 읽음 {stat.checked} · 새 글 {stat.posted}"
                     + (f" · 건너뜀({skipped})" if skipped else ""))
    if summary.errors:
        lines.append("문제")
        lines += [f"- {error}" for error in summary.errors]
    return "\n".join(lines)


def send_discord(webhook_url: str, text: str, post=requests.post) -> None:
    # 디스코드 한 메시지는 2,000자까지다
    post(webhook_url, json={"content": text[:1990]}, timeout=10).raise_for_status()
