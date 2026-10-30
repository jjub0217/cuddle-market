"""출처별 파서. sources.json 의 "parser" 이름으로 고른다.

각 모듈은 둘을 내놓는다
    parse_list(html, source)   -> ListResult
    parse_detail(html, source) -> DetailPage
"""
from __future__ import annotations

from types import ModuleType

from . import gangnam, mcst, qbbs, seoul

PARSERS = {"mcst": mcst, "seoul": seoul, "gangnam": gangnam, "qbbs": qbbs}


def get_parser(name: str) -> ModuleType:
    return PARSERS[name]
