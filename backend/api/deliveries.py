"""Delivery API routes — acknowledgments."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.firebase_admin import db
from agents.verification import evaluate_acknowledgment_deadlines

logger = logging.getLogger("tidecast.api.deliveries")
router = APIRouter()


class AckRequest(BaseModel):
    advisory_id: str
    response: str = "received"  # "received" | "safe" | "need_help"


@router.post("/deliveries/ack")
async def acknowledge_delivery(request: AckRequest, user: dict = Depends(get_current_user)):
    """
    Fisherman acknowledges receipt of an advisory.
    Updates delivery status and verification metrics.
    """
    try:
        # Find the delivery record for this user + advisory
        deliveries_ref = db.collection("deliveries")
        query = deliveries_ref.where("advisory_id", "==", request.advisory_id).where(
            "user_id", "==", user["uid"]
        ).limit(1)

        docs = list(query.stream())

        acknowledged_now = False
        if docs:
            # Update existing delivery record
            doc_ref = deliveries_ref.document(docs[0].id)
            existing = docs[0].to_dict()
            if existing.get("status") != "acknowledged":
                doc_ref.update({
                    "status": "acknowledged",
                    "ack_at": datetime.now(timezone.utc).isoformat(),
                    "ack_response": request.response,
                })
                acknowledged_now = True
        else:
            # Create a new ack record if no delivery found (e.g., offline-cached advisory)
            profile = db.collection("users").document(user["uid"]).get().to_dict() or {}
            deliveries_ref.add({
                "advisory_id": request.advisory_id,
                "user_id": user["uid"],
                "zone_id": profile.get("zone_id", "unknown"),
                "channel": "offline_cache",
                "status": "acknowledged",
                "sent_at": None,
                "ack_at": datetime.now(timezone.utc).isoformat(),
                "ack_response": request.response,
            })
            acknowledged_now = True

        # Recompute from source-of-truth delivery records. This keeps totals
        # idempotent and clears an affected dark zone as soon as it recovers.
        verification = evaluate_acknowledgment_deadlines()

        logger.info(
            f"ACK received: user={user['uid']}, advisory={request.advisory_id}, "
            f"response={request.response}"
        )

        return {
            "success": True,
            "message": "Acknowledgment recorded",
            "advisory_id": request.advisory_id,
            "already_acknowledged": not acknowledged_now,
            "dark_zones": verification["dark_zones"],
        }

    except Exception as e:
        logger.error(f"Ack failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
