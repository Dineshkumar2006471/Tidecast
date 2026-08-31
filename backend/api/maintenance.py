"""Internal maintenance routes invoked by Cloud Scheduler."""
import hmac

from fastapi import APIRouter, Header, HTTPException

from agents.verification import evaluate_acknowledgment_deadlines
from core.config import settings

router = APIRouter()


@router.post("/internal/evaluate-deadlines")
async def evaluate_deadlines(x_tidecast_task_token: str = Header(default="")):
    """Run the acknowledgement deadline evaluator on a scheduler tick."""
    configured_token = settings.DEADLINE_EVALUATOR_TOKEN
    if not configured_token or not hmac.compare_digest(x_tidecast_task_token, configured_token):
        # Do not expose an operational endpoint to the public Cloud Run service.
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True, **evaluate_acknowledgment_deadlines()}
