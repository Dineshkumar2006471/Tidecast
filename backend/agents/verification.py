"""Feedback & Verification Agent — acknowledgement deadlines and dark zones."""
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from agents.base import BaseAgent
from core.config import settings
from core.firebase_admin import db


def _as_utc(value: str | datetime | None) -> datetime | None:
    """Normalize Firestore ISO timestamps without making deadline checks brittle."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def deadline_for_delivery(delivery: dict) -> datetime | None:
    """Return a delivery's explicit deadline, with a safe legacy-data fallback."""
    explicit_deadline = _as_utc(delivery.get("ack_deadline_at"))
    if explicit_deadline:
        return explicit_deadline
    sent_at = _as_utc(delivery.get("sent_at"))
    if sent_at:
        return sent_at + timedelta(minutes=settings.DARK_ZONE_THRESHOLD_MINUTES)
    return None


def evaluate_acknowledgment_deadlines(now: datetime | None = None) -> dict:
    """Refresh zone state from persisted delivery records.

    Cloud Run is request driven, so this function is called by the live admin
    dashboard polling endpoint and immediately after a fisherman acknowledges.
    A zone becomes dark only after its two-minute deadline has passed with an
    unacknowledged delivery; it recovers automatically once no expired delivery
    remains in that zone.
    """
    now = now or datetime.now(timezone.utc)
    delivery_docs = list(db.collection("deliveries").stream())
    zone_docs = {zone.id: zone for zone in db.collection("zones").stream()}
    advisory_stats: dict[str, dict] = defaultdict(lambda: {
        "total_deliveries": 0,
        "total_acked": 0,
        "expired_unacknowledged": 0,
        "dark_zones": set(),
    })
    expired_by_zone: dict[str, list[dict]] = defaultdict(list)
    delivery_zones: set[str] = set()

    for delivery_doc in delivery_docs:
        delivery = delivery_doc.to_dict()
        advisory_id = delivery.get("advisory_id")
        zone_id = delivery.get("zone_id")
        if not advisory_id or not zone_id or zone_id == "unknown":
            continue

        delivery_zones.add(zone_id)
        stats = advisory_stats[advisory_id]
        stats["total_deliveries"] += 1
        if delivery.get("status") == "acknowledged":
            stats["total_acked"] += 1
            continue

        deadline = deadline_for_delivery(delivery)
        if deadline and deadline <= now and delivery.get("status") in {"pending", "sent", "delivered"}:
            expired_by_zone[zone_id].append({"advisory_id": advisory_id, "deadline": deadline})
            stats["expired_unacknowledged"] += 1
            stats["dark_zones"].add(zone_id)

    for zone_id in delivery_zones:
        zone_doc = zone_docs.get(zone_id)
        if not zone_doc:
            continue
        expired = expired_by_zone.get(zone_id, [])
        if expired:
            oldest = min(expired, key=lambda item: item["deadline"])
            zone_doc.reference.set({
                "is_dark": True,
                "dark_since": oldest["deadline"].isoformat(),
                "dark_advisory_id": oldest["advisory_id"],
                "dark_reason": f"No acknowledgement within {settings.DARK_ZONE_THRESHOLD_MINUTES} minutes",
                "pending_ack_count": len(expired),
                "last_updated": now.isoformat(),
            }, merge=True)
        else:
            # Do not leave a stale dark-zone alert after the fisherman responds.
            zone_doc.reference.set({
                "is_dark": False,
                "dark_since": None,
                "dark_advisory_id": None,
                "dark_reason": None,
                "pending_ack_count": 0,
                "last_updated": now.isoformat(),
            }, merge=True)

    for advisory_id, stats in advisory_stats.items():
        db.collection("verifications").document(advisory_id).set({
            "advisory_id": advisory_id,
            "total_deliveries": stats["total_deliveries"],
            "total_acked": stats["total_acked"],
            "expired_unacknowledged": stats["expired_unacknowledged"],
            "dark_zones": sorted(stats["dark_zones"]),
            "verified_at": now.isoformat(),
        }, merge=True)

    dark_zones = sorted(expired_by_zone)
    return {
        "dark_zones": dark_zones,
        "dark_zone_count": len(dark_zones),
        "expired_delivery_count": sum(len(deliveries) for deliveries in expired_by_zone.values()),
        "evaluated_at": now.isoformat(),
    }


class VerificationAgent(BaseAgent):
    """Initializes a deadline-aware verification record for a new advisory."""

    def __init__(self):
        super().__init__("VerificationAgent")

    async def process(self, input_data: dict) -> dict:
        advisory = input_data["advisory"]
        deliveries = input_data.get("deliveries", [])
        zone_deliveries: dict[str, dict] = {}
        for delivery in deliveries:
            zone_id = delivery.get("zone_id", "unknown")
            stats = zone_deliveries.setdefault(zone_id, {"total": 0, "sent": 0, "acked": 0, "failed": 0})
            stats["total"] += 1
            if delivery.get("status") == "acknowledged":
                stats["acked"] += 1
            elif delivery.get("status") == "failed":
                stats["failed"] += 1
            else:
                stats["sent"] += 1

        # A delivery is not dark merely because it has just been sent. The
        # persisted deadline evaluator handles escalation after two minutes.
        verification_data = {
            "advisory_id": advisory["advisory_id"],
            "zone_stats": zone_deliveries,
            "dark_zones": [],
            "total_deliveries": len(deliveries),
            "total_sent": sum(zone["sent"] for zone in zone_deliveries.values()),
            "total_acked": sum(zone["acked"] for zone in zone_deliveries.values()),
            "total_failed": sum(zone["failed"] for zone in zone_deliveries.values()),
            "ack_deadline_minutes": settings.DARK_ZONE_THRESHOLD_MINUTES,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            db.collection("verifications").document(advisory["advisory_id"]).set(verification_data)
        except Exception as error:
            self.logger.error("Failed to store verification results: %s", error)

        advisory["status"] = "verified"
        summary = {
            "total_deliveries": len(deliveries),
            "zones_reached": len(zone_deliveries),
            "dark_zones": [],
            "dark_zone_count": 0,
            "ack_deadline_minutes": settings.DARK_ZONE_THRESHOLD_MINUTES,
        }
        self.logger.info(
            "Verification initialized for %s: %s deliveries, %s-minute acknowledgement deadline",
            advisory["advisory_id"], len(deliveries), settings.DARK_ZONE_THRESHOLD_MINUTES,
        )
        return {"advisory": advisory, "deliveries": deliveries, "dark_zones": [], "verification_summary": summary}
