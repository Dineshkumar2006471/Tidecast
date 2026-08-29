"""Unit tests for deterministic parts of the advisory pipeline."""
import asyncio
from datetime import datetime, timedelta, timezone

from agents.delivery import DeliveryOrchestrationAgent
from agents.ingestion import IngestionAgent


def test_ingestion_normalizes_advisory_and_records_agent_metadata():
    agent = IngestionAgent()

    result = asyncio.run(agent.run({
        "advisory_id": "ADV-TEST-001",
        "raw_text": "High waves expected. Do not venture into sea.",
        "source": "IMD",
        "bulletin_type": "HIGH_WAVE_ALERT",
        "zone_ids": ["kanyakumari"],
    }))

    advisory = result["advisory"]
    assert advisory["advisory_id"] == "ADV-TEST-001"
    assert advisory["source"] == "IMD"
    assert advisory["zone_ids"] == ["kanyakumari"]
    assert advisory["status"] == "ingested"
    assert result["_agent"] == "IngestionAgent"
    assert result["_elapsed_seconds"] >= 0


def test_delivery_selects_push_for_recently_online_user_and_sms_otherwise():
    agent = DeliveryOrchestrationAgent()
    recent = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    stale = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()

    assert agent._select_channel({"last_seen_online": recent}) == "push"
    assert agent._select_channel({"last_seen_online": stale}) == "sms"
    assert agent._select_channel({}) == "sms"


def test_delivery_uses_simulated_sms_for_offline_user():
    agent = DeliveryOrchestrationAgent()
    advisory = {
        "advisory_id": "ADV-TEST-002",
        "translations": {"en": {"full": "Full advisory", "sms": "Short advisory"}},
    }

    delivery = asyncio.run(agent._deliver_to_user(
        {"uid": "user-001", "phone": "+910000000000", "preferred_language": "en"},
        advisory,
    ))

    assert delivery["channel"] == "sms"
    assert delivery["status"] == "sent"
    assert delivery["delivery_result"]["simulated"] is True
