"""Delivery API routes — acknowledgments."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.firebase_admin import db

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

        if docs:
            # Update existing delivery record
            doc_ref = deliveries_ref.document(docs[0].id)
            doc_ref.update({
                "status": "acknowledged",
                "ack_at": datetime.now(timezone.utc).isoformat(),
                "ack_response": request.response,
            })
        else:
            # Create a new ack record if no delivery found (e.g., offline-cached advisory)
            deliveries_ref.add({
                "advisory_id": request.advisory_id,
                "user_id": user["uid"],
                "channel": "offline_cache",
                "status": "acknowledged",
                "sent_at": None,
                "ack_at": datetime.now(timezone.utc).isoformat(),
                "ack_response": request.response,
            })

        # Update verification stats
        verification_ref = db.collection("verifications").document(request.advisory_id)
        verification_doc = verification_ref.get()
        if verification_doc.exists:
            from google.cloud.firestore_v1 import Increment
            verification_ref.update({"total_acked": Increment(1)})

        logger.info(
            f"ACK received: user={user['uid']}, advisory={request.advisory_id}, "
            f"response={request.response}"
        )

        return {
            "success": True,
            "message": "Acknowledgment recorded",
            "advisory_id": request.advisory_id,
        }

    except Exception as e:
        logger.error(f"Ack failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
