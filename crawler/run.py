"""행사 소식 수집 실행 (crawler 폴더에서 `python -m run`, 마른 실행은 `python -m run --dry-run`)

환경 변수
    CUDDLE_API_BASE          예: https://cmarket-api.duckdns.org/api
    INGEST_API_KEY           서버의 수집 전용 키
    GEMINI_API_KEY           없으면 AI 단계 앞에서 멈춘다(마른 실행에서 목록만 볼 때)
    PUBLIC_DATA_SERVICE_KEY  없으면 관광공사는 건너뛴다
    DISCORD_WEBHOOK_URL      없으면 알리지 않는다
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from pet_events.cuddle_client import CuddleClient
from pet_events.http import PoliteClient
from pet_events.report import format_report, send_discord, should_notify
from pet_events.run import Deps, run_once

KST = timezone(timedelta(hours=9))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="서버에 보내지 않고 만든 글을 출력만 한다")
    args = parser.parse_args()

    sources = [s for s in json.loads((Path(__file__).parent / "sources.json").read_text(encoding="utf-8")) if s["enabled"]]
    today = datetime.now(KST).date()  # Actions 는 UTC 로 돈다. 행사 날짜는 한국 날짜로 센다

    cuddle = None
    if not args.dry_run:
        base, key = os.environ.get("CUDDLE_API_BASE"), os.environ.get("INGEST_API_KEY")
        if not base or not key:
            print("CUDDLE_API_BASE 와 INGEST_API_KEY 가 필요하다(마른 실행은 --dry-run)", file=sys.stderr)
            return 2
        cuddle = CuddleClient(base, key)

    ai = None
    if os.environ.get("GEMINI_API_KEY"):
        from google import genai  # 키가 없으면 불러오지도 않는다
        ai = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    deps = Deps(http=PoliteClient(), cuddle=cuddle, ai=ai,
                tour_key=os.environ.get("PUBLIC_DATA_SERVICE_KEY") or None, log=print)
    summary = run_once(today, sources, deps)

    report = format_report(summary)
    print("\n" + report)
    webhook = os.environ.get("DISCORD_WEBHOOK_URL")
    if webhook and not args.dry_run and should_notify(summary):
        send_discord(webhook, report)
    return 1 if summary.errors else 0


if __name__ == "__main__":
    sys.exit(main())
