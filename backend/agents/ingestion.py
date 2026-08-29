"""Ingestion Agent — parses raw advisory feeds and normalizes them."""
import json
import uuid
from datetime import datetime, timezone

from agents.base import BaseAgent
from core.config import settings


class IngestionAgent(BaseAgent):
    """
    Takes raw advisory data (from mock feed or manual compose)
    and normalizes it into a standard advisory object.
    """

    def __init__(self):
        super().__init__("IngestionAgent")
        self._load_mock_feed()

    def _load_mock_feed(self):
        """Load mock advisories for demo."""
        try:
            with open(settings.MOCK_ADVISORIES_PATH, "r", encoding="utf-8") as f:
                self.mock_advisories = json.load(f)
            self.logger.info(f"Loaded {len(self.mock_advisories)} mock advisories")
        except FileNotFoundError:
            self.mock_advisories = []
            self.logger.warning("Mock advisories file not found")

    async def process(self, input_data: dict) -> dict:
        """
        Normalize a raw advisory into the standard format.

        Input: { "raw_text": str, "source": str, "bulletin_type": str, "zone_ids": list }
        Output: { "advisory": { normalized advisory object } }
        """
        advisory = {
            "advisory_id": input_data.get("advisory_id", f"ADV-{uuid.uuid4().hex[:8].upper()}"),
            "source": input_data.get("source", "MANUAL"),
            "bulletin_type": input_data.get("bulletin_type", "GENERAL"),
            "raw_text": input_data["raw_text"],
            "zone_ids": input_data.get("zone_ids", []),
            "issued_at": input_data.get("issued_at", datetime.now(timezone.utc).isoformat()),
            "expires_at": input_data.get("expires_at", None),
            "status": "ingested",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        self.logger.info(
            f"Ingested advisory {advisory['advisory_id']} "
            f"from {advisory['source']} — {advisory['bulletin_type']} "
            f"affecting {len(advisory['zone_ids'])} zones"
        )

        return {"advisory": advisory}

    async def ingest_from_mock_feed(self) -> list[dict]:
        """Ingest all advisories from the mock feed."""
        results = []
        for raw in self.mock_advisories:
            result = await self.run(raw)
            results.append(result["advisory"])
        return results
