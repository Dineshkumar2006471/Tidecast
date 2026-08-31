from fastapi.testclient import TestClient
from api.advisories import ComposeRequest
from main import app

def test_health_check():
    """Test the backend health check endpoint."""
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "tidecast-backend" in data["service"]

def test_get_active_advisories():
    """Test the active advisories endpoint."""
    # Override authentication dependency
    from core.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"uid": "testuser"}

    try:
        response = TestClient(app).get("/api/advisories/active")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"advisories": [], "count": 0}


def test_zone_directory_is_available_before_sign_up():
    response = TestClient(app).get("/api/zones")

    assert response.status_code == 200
    assert response.json() == {"zones": [], "count": 0}


def test_compose_request_preserves_the_selected_bulletin_type():
    request = ComposeRequest(
        raw_text="High waves expected. Do not venture into sea.",
        bulletin_type="HIGH_WAVE_ALERT",
        zone_ids=["zone-kanyakumari"],
    )

    assert request.bulletin_type == "HIGH_WAVE_ALERT"
    assert request.zone_ids == ["zone-kanyakumari"]


def test_deadline_evaluator_route_rejects_public_calls_and_accepts_scheduler(monkeypatch):
    import api.maintenance as maintenance
    from core.config import settings

    monkeypatch.setattr(settings, "DEADLINE_EVALUATOR_TOKEN", "scheduler-test-token")
    monkeypatch.setattr(maintenance, "evaluate_acknowledgment_deadlines", lambda: {
        "dark_zones": ["zone-kochi"],
        "dark_zone_count": 1,
    })

    client = TestClient(app)
    assert client.post("/api/internal/evaluate-deadlines").status_code == 404

    response = client.post(
        "/api/internal/evaluate-deadlines",
        headers={"X-Tidecast-Task-Token": "scheduler-test-token"},
    )
    assert response.status_code == 200
    assert response.json()["dark_zone_count"] == 1
