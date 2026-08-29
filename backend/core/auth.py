"""Firebase Auth middleware for FastAPI — token verification and role extraction."""
import logging

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from core.firebase_admin import db

security = HTTPBearer(auto_error=False)
logger = logging.getLogger("tidecast.auth")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify Firebase Auth token and return the user.
    Returns user dict with uid, role, and profile data from Firestore.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Firebase tokens can be issued a fraction of a second ahead of a local
        # development machine. Keep verification strict while tolerating a small,
        # documented clock skew for the issued-at timestamp.
        decoded_token = auth.verify_id_token(
            credentials.credentials,
            clock_skew_seconds=60,
        )
        uid = decoded_token["uid"]

        # Fetch user profile from Firestore
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_data["uid"] = uid
            return user_data
        else:
            # User exists in Auth but not in Firestore yet (pre-onboarding)
            return {
                "uid": uid,
                "email": decoded_token.get("email"),
                "phone": decoded_token.get("phone_number"),
                "role": "fisherman",  # default role
                "onboarded": False,
            }

    except auth.InvalidIdTokenError as error:
        logger.warning("Invalid Firebase ID token: %s", error)
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except auth.ExpiredIdTokenError as error:
        logger.warning("Expired Firebase ID token: %s", error)
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.warning("Firebase token verification failed: %s", e)
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def optional_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    """Optional auth — returns user if authenticated, None otherwise."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
