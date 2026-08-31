from datetime import datetime, timedelta, timezone

from agents import verification


class FakeReference:
    def __init__(self, store, doc_id):
        self.store = store
        self.doc_id = doc_id

    def set(self, values, merge=False):
        if merge:
            self.store.setdefault(self.doc_id, {}).update(values)
        else:
            self.store[self.doc_id] = dict(values)


class FakeSnapshot:
    def __init__(self, store, doc_id):
        self._store = store
        self.id = doc_id
        self.reference = FakeReference(store, doc_id)

    def to_dict(self):
        return dict(self._store[self.id])


class FakeCollection:
    def __init__(self, store):
        self.store = store

    def stream(self):
        return [FakeSnapshot(self.store, doc_id) for doc_id in self.store]

    def document(self, doc_id):
        return FakeReference(self.store, doc_id)


class FakeDb:
    def __init__(self, collections):
        self.collections = collections

    def collection(self, name):
        return FakeCollection(self.collections.setdefault(name, {}))


def test_deadline_evaluator_marks_and_recovers_a_dark_zone(monkeypatch):
    now = datetime(2026, 8, 31, 12, 0, tzinfo=timezone.utc)
    collections = {
        "zones": {"zone-kochi": {"name": "Kochi", "is_dark": False}},
        "deliveries": {
            "delivery-1": {
                "advisory_id": "ADV-1",
                "user_id": "ravi",
                "zone_id": "zone-kochi",
                "status": "sent",
                "sent_at": (now - timedelta(minutes=3)).isoformat(),
                "ack_deadline_at": (now - timedelta(minutes=1)).isoformat(),
            }
        },
        "verifications": {},
    }
    monkeypatch.setattr(verification, "db", FakeDb(collections))

    result = verification.evaluate_acknowledgment_deadlines(now)

    assert result["dark_zones"] == ["zone-kochi"]
    assert collections["zones"]["zone-kochi"]["is_dark"] is True
    assert collections["verifications"]["ADV-1"]["expired_unacknowledged"] == 1

    collections["deliveries"]["delivery-1"]["status"] = "acknowledged"
    result = verification.evaluate_acknowledgment_deadlines(now)

    assert result["dark_zones"] == []
    assert collections["zones"]["zone-kochi"]["is_dark"] is False
    assert collections["verifications"]["ADV-1"]["total_acked"] == 1


def test_legacy_delivery_uses_the_configured_two_minute_deadline():
    now = datetime(2026, 8, 31, 12, 0, tzinfo=timezone.utc)
    delivery = {"sent_at": (now - timedelta(minutes=2)).isoformat()}

    assert verification.deadline_for_delivery(delivery) == now
