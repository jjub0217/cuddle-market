"""robots.txt 를 표준(RFC 9309)대로 읽는다.

파이썬 기본 urllib.robotparser 는 위에서부터 처음 맞는 규칙을 쓴다. 표준은 **가장 길게 맞는 규칙**이
이기고, 길이가 같으면 Allow 가 이긴다. 서울시처럼 「Disallow: /」 를 먼저 쓰고 그 아래에
「Allow: /news」 를 두는 사이트를 기본 도구는 통째로 막힌 것으로 본다(2026-10-30).
"""
from __future__ import annotations

import re
from typing import List, Optional, Tuple


class Robots:
    def __init__(self, rules: List[Tuple[bool, str]]):
        self._rules = [(allow, path, _to_regex(path)) for allow, path in rules if path]

    def allowed(self, path_and_query: str) -> bool:
        best: Optional[Tuple[int, bool]] = None
        for allow, path, regex in self._rules:
            if regex.match(path_and_query):
                key = (len(path), allow)  # 더 긴 규칙, 같으면 Allow
                if best is None or key > best:
                    best = key
        return True if best is None else best[1]


def parse(text: str, agent: str) -> Robots:
    """우리 이름(agent)의 묶음이 있으면 그것을, 없으면 「*」 묶음을 쓴다"""
    groups: List[Tuple[List[str], List[Tuple[bool, str]]]] = []
    agents: List[str] = []
    rules: List[Tuple[bool, str]] = []
    reading_agents = False
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, value = (part.strip() for part in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if not reading_agents:
                agents, rules = [], []
                groups.append((agents, rules))
            agents.append(value.lower())
            reading_agents = True
        elif key in ("allow", "disallow"):
            reading_agents = False
            if groups:
                rules.append((key == "allow", value))
        else:
            reading_agents = False

    token = agent.split("/", 1)[0].lower()
    mine = [r for a, r in groups if any(name != "*" and name in token for name in a)]
    anyone = [r for a, r in groups if "*" in a]
    chosen = mine or anyone
    return Robots([rule for group in chosen for rule in group])


def _to_regex(path: str) -> re.Pattern:
    anchored = path.endswith("$")
    body = re.escape(path[:-1] if anchored else path).replace(r"\*", ".*")
    return re.compile(body + ("$" if anchored else ""))
