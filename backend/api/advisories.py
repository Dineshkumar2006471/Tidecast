"""Advisory API routes."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user, require_admin
from core.firebase_admin import db
from agents.pipeline import pipeline

logger = logging.getLogger("tidecast.api.advisories")
router = APIRouter()


class IngestRequest(BaseModel):
    raw_text: str
    source: str = "MANUAL"
    bulletin_type: str = "GENERAL"
    zone_ids: list[str] = []


class ComposeRequest(BaseModel):
    raw_text: str
    bulletin_type: str = "GENERAL"
    zone_ids: list[str] = []


@router.post("/advisories/ingest")
async def ingest_advisory(request: IngestRequest, user: dict = Depends(require_admin)):
    """
    Trigger the full advisory pipeline.
    Admin-only: ingests, classifies, translates, voices, delivers, and verifies.
    """
    logger.info(f"Advisory ingestion triggered by {user['uid']}")

    try:
        result = await pipeline.process_advisory(
            raw_advisory={
                "raw_text": request.raw_text,
                "source": request.source,
                "bulletin_type": request.bulletin_type,
                "zone_ids": request.zone_ids,
            }
        )

        return {
            "success": True,
            "advisory_id": result["advisory"]["advisory_id"],
            "severity": result["advisory"].get("severity"),
            "languages": list(result["advisory"].get("translations", {}).keys()),
            "deliveries_count": len(result.get("deliveries", [])),
            "dark_zones": result.get("verification", {}).get("dark_zones", []),
            "pipeline_time_seconds": result.get("pipeline_elapsed_seconds"),
        }

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")


@router.get("/advisories/active")
async def get_active_advisories(zone_id: str = None, user: dict = Depends(get_current_user)):
    """
    Get active advisories, optionally filtered by zone.
    Used by the fisherman PWA to show current advisories.
    """
    try:
        # The advisory payload includes the user's actual acknowledgement state,
        # so refreshes and new sessions never show an already-acknowledged alert
        # as pending again.
        acknowledged_at = {}
        for delivery in db.collection("deliveries").where("user_id", "==", user["uid"]).stream():
            delivery_data = delivery.to_dict()
            if delivery_data.get("status") == "acknowledged":
                acknowledged_at[delivery_data.get("advisory_id")] = delivery_data.get("ack_at")

        query = db.collection("advisories").order_by("created_at", direction="DESCENDING").limit(20)

        docs = query.stream()
        advisories = []
        for doc in docs:
            data = doc.to_dict()
            # Filter within the recent advisory window to avoid requiring a
            # composite Firestore index for the dashboard's zone view.
            if zone_id and zone_id not in data.get("zone_ids", []):
                continue
            data["id"] = doc.id
            data["acknowledged"] = data.get("advisory_id", doc.id) in acknowledged_at
            data["ack_at"] = acknowledged_at.get(data.get("advisory_id", doc.id))
            advisories.append(data)

        return {"advisories": advisories, "count": len(advisories)}

    except Exception as e:
        logger.error(f"Failed to fetch advisories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advisories/compose")
async def compose_advisory(request: ComposeRequest, user: dict = Depends(require_admin)):
    """
    Admin manual advisory composer — creates and broadcasts an advisory.
    """
    logger.info(f"Manual advisory composed by {user['uid']}")

    try:
        result = await pipeline.process_advisory(
            raw_advisory={
                "raw_text": request.raw_text,
                "source": "ADMIN_MANUAL",
                "bulletin_type": request.bulletin_type,
                "zone_ids": request.zone_ids,
            }
        )

        return {
            "success": True,
            "advisory_id": result["advisory"]["advisory_id"],
            "severity": result["advisory"].get("severity"),
            "languages": list(result["advisory"].get("translations", {}).keys()),
            "deliveries_count": len(result.get("deliveries", [])),
            "dark_zones": result.get("verification", {}).get("dark_zones", []),
            "pipeline_time_seconds": result.get("pipeline_elapsed_seconds"),
            "message": "Advisory composed and delivered successfully",
        }

    except Exception as e:
        logger.error(f"Compose failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/advisories/{advisory_id}")
async def get_advisory(advisory_id: str, user: dict = Depends(get_current_user)):
    """Get a specific advisory by ID."""
    doc = db.collection("advisories").document(advisory_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Advisory not found")

    data = doc.to_dict()
    data["id"] = doc.id
    return data
