from fastapi.testclient import TestClient
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
