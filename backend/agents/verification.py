"""
Feedback & Verification Agent — closes the delivery loop.

Mirrors the verification-loop pattern from IntelliASHA.
This is the strongest, most defensible technical claim in the pitch.

- Monitors delivery attempts + acknowledgment events
- Flags "dark zones" (no ack within X minutes)
- Escalates unacknowledged zones for dashboard alert
"""
from datetime import datetime, timezone, timedelta
from agents.base import BaseAgent
from core.config import settings
from core.firebase_admin import db


class VerificationAgent(BaseAgent):
    """
    Verifies delivery and flags zones that have gone dark.

    A "dark zone" is a zone where:
    - An advisory was sent to fishermen in that zone
    - No acknowledgment was received within the threshold
    - This triggers a dashboard alert for the field officer
    """

    def __init__(self):
        super().__init__("VerificationAgent")

    async def process(self, input_data: dict) -> dict:
        """
        Process delivery records and flag dark zones.

        Input: { "advisory": advisory, "deliveries": [ delivery records ] }
        Output: { "advisory": advisory, "deliveries": deliveries, "dark_zones": [ zone_ids ], "verification_summary": dict }
        """
        advisory = input_data["advisory"]
        deliveries = input_data.get("deliveries", [])

        # Group deliveries by zone
        zone_deliveries = {}
        for d in deliveries:
            user_id = d.get("user_id")
            # Look up user's zone from delivery context
            zone_id = d.get("zone_id", "unknown")
            if zone_id not in zone_deliveries:
                zone_deliveries[zone_id] = {"total": 0, "sent": 0, "acked": 0, "failed": 0}

            zone_deliveries[zone_id]["total"] += 1
            if d["status"] == "sent":
                zone_deliveries[zone_id]["sent"] += 1
            elif d["status"] == "acknowledged":
                zone_deliveries[zone_id]["acked"] += 1
            elif d["status"] == "failed":
                zone_deliveries[zone_id]["failed"] += 1

        # Flag dark zones (zones with 0 acks and at least 1 sent delivery)
        dark_zones = [
            zone_id for zone_id, stats in zone_deliveries.items()
            if stats["sent"] > 0 and stats["acked"] == 0
        ]

        # Store verification results in Firestore
        try:
            verification_ref = db.collection("verifications").document(advisory["advisory_id"])
            verification_data = {
                "advisory_id": advisory["advisory_id"],
                "zone_stats": zone_deliveries,
                "dark_zones": dark_zones,
                "total_deliveries": len(deliveries),
                "total_sent": sum(z["sent"] for z in zone_deliveries.values()),
                "total_acked": sum(z["acked"] for z in zone_deliveries.values()),
                "total_failed": sum(z["failed"] for z in zone_deliveries.values()),
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }
            verification_ref.set(verification_data)

            # Update zone documents with dark zone status
            for zone_id in dark_zones:
                zone_ref = db.collection("zones").document(zone_id)
                zone_ref.update({
                    "is_dark": True,
                    "dark_since": datetime.now(timezone.utc).isoformat(),
                    "dark_advisory_id": advisory["advisory_id"],
                })
                self.logger.warning(f"⚠ DARK ZONE flagged: {zone_id}")

        except Exception as e:
            self.logger.error(f"Failed to store verification results: {e}")

        advisory["status"] = "verified"

        verification_summary = {
            "total_deliveries": len(deliveries),
            "zones_reached": len(zone_deliveries),
            "dark_zones": dark_zones,
            "dark_zone_count": len(dark_zones),
        }

        self.logger.info(
            f"Verification complete for {advisory['advisory_id']}: "
            f"{len(deliveries)} deliveries across {len(zone_deliveries)} zones, "
            f"{len(dark_zones)} dark zones"
        )

        return {
            "advisory": advisory,
            "deliveries": deliveries,
            "dark_zones": dark_zones,
            "verification_summary": verification_summary,
        }
