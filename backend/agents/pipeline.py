"""
Pipeline Orchestrator — coordinates the 6-agent pipeline.

Ingest → Classify → Localize → Voice → Deliver → Verify

Each stage is independently testable. The pipeline logs every stage
transition with timing data for observability.
"""
import logging
from datetime import datetime, timezone

from agents.ingestion import IngestionAgent
from agents.classification import ClassificationAgent
from agents.localization import LocalizationAgent
from agents.voice_synthesis import VoiceSynthesisAgent
from agents.delivery import DeliveryOrchestrationAgent
from agents.verification import VerificationAgent
from core.firebase_admin import db

logger = logging.getLogger("tidecast.pipeline")


class AdvisoryPipeline:
    """
    Orchestrates the full 6-agent advisory processing pipeline.

    Pipeline stages:
    1. Ingestion — normalize raw advisory
    2. Classification — Gemini severity classification
    3. Localization — translate with locked glossary
    4. Voice Synthesis — Cloud TTS audio generation
    5. Delivery — multi-channel dispatch
    6. Verification — feedback loop and dark zone detection
    """

    def __init__(self):
        self.ingestion = IngestionAgent()
        self.classification = ClassificationAgent()
        self.localization = LocalizationAgent()
        self.voice = VoiceSynthesisAgent()
        self.delivery = DeliveryOrchestrationAgent()
        self.verification = VerificationAgent()

    async def process_advisory(self, raw_advisory: dict, target_users: list[dict] = None) -> dict:
        """
        Run the full pipeline on a single advisory.

        Args:
            raw_advisory: Raw advisory data (from feed or manual compose)
            target_users: List of user dicts to deliver to. If None, fetches from Firestore.

        Returns:
            Complete pipeline result with advisory, deliveries, and verification summary.
        """
        pipeline_start = datetime.now(timezone.utc)
        logger.info(f"{'='*60}")
        logger.info(f"🌊 TIDECAST PIPELINE — Processing advisory...")
        logger.info(f"{'='*60}")

        try:
            # Stage 1: Ingest
            ingestion_result = await self.ingestion.run(raw_advisory)

            # Stage 2: Classify
            classification_result = await self.classification.run(ingestion_result)

            # Stage 3: Localize
            localization_result = await self.localization.run(classification_result)

            # Stage 4: Voice Synthesis
            voice_result = await self.voice.run(localization_result)

            # Fetch target users if not provided
            advisory = voice_result["advisory"]
            if target_users is None:
                target_users = await self._fetch_target_users(advisory.get("zone_ids", []))

            # Stage 5: Deliver
            delivery_input = {
                "advisory": advisory,
                "target_users": target_users,
            }
            delivery_result = await self.delivery.run(delivery_input)

            # Stage 6: Verify
            verification_result = await self.verification.run(delivery_result)

            # Store final advisory in Firestore
            await self._store_advisory(verification_result["advisory"])

            # Store delivery records in Firestore
            await self._store_deliveries(verification_result.get("deliveries", []))

            pipeline_elapsed = (datetime.now(timezone.utc) - pipeline_start).total_seconds()
            logger.info(f"{'='*60}")
            logger.info(f"✅ PIPELINE COMPLETE in {pipeline_elapsed:.2f}s")
            logger.info(f"   Advisory: {advisory['advisory_id']}")
            logger.info(f"   Severity: {advisory.get('severity', 'N/A')}")
            logger.info(f"   Languages: {list(advisory.get('translations', {}).keys())}")
            logger.info(f"   Deliveries: {len(verification_result.get('deliveries', []))}")
            logger.info(f"   Dark zones: {verification_result.get('dark_zones', [])}")
            logger.info(f"{'='*60}")

            return {
                "success": True,
                "advisory": verification_result["advisory"],
                "deliveries": verification_result.get("deliveries", []),
                "verification": verification_result.get("verification_summary", {}),
                "pipeline_elapsed_seconds": pipeline_elapsed,
            }

        except Exception as e:
            pipeline_elapsed = (datetime.now(timezone.utc) - pipeline_start).total_seconds()
            logger.error(f"❌ PIPELINE FAILED after {pipeline_elapsed:.2f}s: {str(e)}")
            raise

    async def _fetch_target_users(self, zone_ids: list[str]) -> list[dict]:
        """Fetch users in the target zones from Firestore."""
        users = []
        try:
            if zone_ids:
                users_ref = db.collection("users").where("zone_id", "in", zone_ids[:10])
                docs = users_ref.stream()
                for doc in docs:
                    user_data = doc.to_dict()
                    user_data["uid"] = doc.id
                    users.append(user_data)

            logger.info(f"Fetched {len(users)} target users for zones: {zone_ids}")

        except Exception as e:
            logger.warning(f"Could not fetch target users: {e}")

        return users

    async def _store_advisory(self, advisory: dict):
        """Store the processed advisory in Firestore."""
        try:
            doc_ref = db.collection("advisories").document(advisory["advisory_id"])
            doc_ref.set(advisory)
            logger.info(f"Stored advisory {advisory['advisory_id']} in Firestore")
        except Exception as e:
            logger.error(f"Failed to store advisory: {e}")

    async def _store_deliveries(self, deliveries: list[dict]):
        """Store delivery records in Firestore."""
        try:
            batch = db.batch()
            for delivery in deliveries:
                doc_ref = db.collection("deliveries").document()
                batch.set(doc_ref, delivery)
            batch.commit()
            logger.info(f"Stored {len(deliveries)} delivery records in Firestore")
        except Exception as e:
            logger.error(f"Failed to store deliveries: {e}")


# Singleton pipeline instance
pipeline = AdvisoryPipeline()
