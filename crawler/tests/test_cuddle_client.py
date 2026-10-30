import pytest

from pet_events.cuddle_client import CuddleClient, CuddleError


class FakeResponse:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body

    def json(self):
        return self._body


class FakeSession:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def post(self, url, json=None, headers=None, timeout=None):
        self.calls.append({"url": url, "json": json, "headers": headers, "timeout": timeout})
        return self.response


def test_unseen_sends_key_and_returns_ids():
    session = FakeSession(FakeResponse(200, {"code": "SUCCESS", "data": {"unseen": ["2"]}}))
    client = CuddleClient("https://api.example/api", "KEY", session=session)

    assert client.unseen("SEOUL", ["1", "2"]) == ["2"]
    call = session.calls[0]
    assert call["url"] == "https://api.example/api/ingest/events/unseen"
    assert call["headers"]["X-Ingest-Key"] == "KEY"
    assert call["json"] == {"sourceCode": "SEOUL", "externalIds": ["1", "2"]}


def test_ingest_returns_data():
    session = FakeSession(FakeResponse(200, {"code": "SUCCESS", "data": {"status": "CREATED", "postId": 7}}))
    client = CuddleClient("https://api.example/api/", "KEY", session=session)
    assert client.ingest({"sourceCode": "SEOUL"}) == {"status": "CREATED", "postId": 7}
    assert session.calls[0]["url"] == "https://api.example/api/ingest/events"


@pytest.mark.parametrize("status", [401, 503, 500])
def test_error_status_raises(status):
    client = CuddleClient("https://api.example/api", "KEY", session=FakeSession(FakeResponse(status, {})))
    with pytest.raises(CuddleError):
        client.unseen("SEOUL", ["1"])
