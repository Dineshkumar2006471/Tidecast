"""TIDECAST Backend — Core Configuration"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "tidecast-507006")
    GCP_REGION: str = os.getenv("GCP_REGION", "asia-south1")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET", "tidecast-507006.firebasestorage.app")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    PORT: int = int(os.getenv("PORT", "8000"))
    # Demo officer registration is intentionally opt-in. The backend creates the
    # profile through Firebase Admin, so Firestore rules still prevent a client
    # from promoting its own role after registration.
    ALLOW_ADMIN_SIGNUP: bool = os.getenv("ALLOW_ADMIN_SIGNUP", "false").lower() == "true"
    # Backwards-compatible local setting used by existing developer setups.
    ALLOW_LOCAL_ADMIN_SIGNUP: bool = os.getenv("ALLOW_LOCAL_ADMIN_SIGNUP", "false").lower() == "true"

    # Safety glossary path
    SAFETY_GLOSSARY_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "safety_glossary.json"
    )

    # Mock advisories path
    MOCK_ADVISORIES_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "mock_advisories.json"
    )

    # Zones GeoJSON path
    ZONES_GEOJSON_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "zones_geojson.json"
    )

    # Supported languages
    SUPPORTED_LANGUAGES: list = ["en", "ta", "te", "ml"]

    # TTS voice mapping
    TTS_VOICE_MAP: dict = {
        "en": {"language_code": "en-IN", "name": "en-IN-Wavenet-B"},
        "ta": {"language_code": "ta-IN", "name": "ta-IN-Wavenet-A"},
        "te": {"language_code": "te-IN", "name": "te-IN-Standard-A"},
        "ml": {"language_code": "ml-IN", "name": "ml-IN-Wavenet-A"},
    }

    # Delivery thresholds
    ONLINE_THRESHOLD_MINUTES: int = 15
    # Demo deadline: every delivered advisory must be acknowledged within two
    # minutes. The verifier re-evaluates this on dashboard polling and on ACK.
    DARK_ZONE_THRESHOLD_MINUTES: int = int(os.getenv("DARK_ZONE_THRESHOLD_MINUTES", "2"))
    # Required by the Cloud Scheduler-only deadline evaluator endpoint. It is
    # injected at deploy time and never committed to source control.
    DEADLINE_EVALUATOR_TOKEN: str = os.getenv("DEADLINE_EVALUATOR_TOKEN", "")


settings = Settings()
