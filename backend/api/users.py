"""User API routes."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.firebase_admin import db

logger = logging.getLogger("tidecast.api.users")
router = APIRouter()


class RegisterRequest(BaseModel):
    preferred_language: str = "en"
    zone_id: str = ""
    name: str = ""
    phone: str = ""
    boat_id: str = ""


class UpdateProfileRequest(BaseModel):
    preferred_language: str | None = None
    zone_id: str | None = None
    name: str | None = None
    fcm_token: str | None = None


@router.get("/users/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return user


@router.post("/users/register")
async def register_user(request: RegisterRequest, user: dict = Depends(get_current_user)):
    """Complete user registration / onboarding."""
    try:
        user_data = {
            "uid": user["uid"],
            "email": user.get("email"),
            "phone": request.phone or user.get("phone"),
            "name": request.name,
            "preferred_language": request.preferred_language,
            "zone_id": request.zone_id,
            "boat_id": request.boat_id,
            "role": "fisherman",
            "onboarded": True,
            "last_seen_online": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        db.collection("users").document(user["uid"]).set(user_data, merge=True)
        logger.info(f"User registered: {user['uid']} — zone: {request.zone_id}, lang: {request.preferred_language}")

        return {"success": True, "user": user_data}

    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/me")
async def update_profile(request: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    """Update user profile."""
    updates = {k: v for k, v in request.model_dump().items() if v is not None}
    updates["last_seen_online"] = datetime.now(timezone.utc).isoformat()

    try:
        db.collection("users").document(user["uid"]).update(updates)
        return {"success": True, "updated_fields": list(updates.keys())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/heartbeat")
async def heartbeat(user: dict = Depends(get_current_user)):
    """Update last-seen-online timestamp — used by Delivery Agent for channel selection."""
    try:
        db.collection("users").document(user["uid"]).update({
            "last_seen_online": datetime.now(timezone.utc).isoformat(),
        })
        return {"success": True, "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
