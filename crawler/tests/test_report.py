from pet_events.report import SourceStat, RunSummary, format_report, should_notify


def test_notify_only_when_errors_or_new_posts():
    quiet = RunSummary(per_source={"SEOUL": SourceStat(listed=3)}, errors=[])
    assert should_notify(quiet) is False
    assert should_notify(RunSummary(per_source={"SEOUL": SourceStat(posted=1)}, errors=[])) is True
    assert should_notify(RunSummary(per_source={}, errors=["구조 변경 의심: SEOUL"])) is True


def test_report_lists_sources_and_errors():
    summary = RunSummary(
        per_source={"SEOUL": SourceStat(listed=3, posted=1, skipped={"SKIPPED_NOT_EVENT": 2})},
        errors=["구조 변경 의심: GANGNAM"],
    )
    text = format_report(summary)
    assert "SEOUL" in text and "새 글 1" in text
    assert "구조 변경 의심: GANGNAM" in text
