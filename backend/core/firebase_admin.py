"""Firebase Admin SDK initialization — single instance, shared across the app."""
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from core.config import settings


def initialize_firebase():
    """Initialize Firebase Admin SDK using Application Default Credentials."""
    if not firebase_admin._apps:
        # Uses ADC (Application Default Credentials) — works locally with
        # `gcloud auth application-default login` and on Cloud Run automatically
        firebase_admin.initialize_app(options={
            "projectId": settings.GCP_PROJECT_ID,
            "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        })


def get_firestore_client():
    """Get Firestore client instance."""
    initialize_firebase()
    return firestore.client()


def get_storage_bucket():
    """Get Cloud Storage bucket instance."""
    initialize_firebase()
    return storage.bucket()


def get_auth():
    """Get Firebase Auth instance."""
    initialize_firebase()
    return auth


# Convenience: initialize on import
initialize_firebase()
db = firestore.client()
bucket = storage.bucket()
