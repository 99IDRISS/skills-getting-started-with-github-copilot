from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_initial():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect at least the sample activities
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_get_updates():
    activity = "Chess Club"
    email = "pytest_user@example.com"

    # Ensure user not already in participants
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"

    # Now GET should include the new participant
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    data = resp2.json()
    assert email in data[activity]["participants"]


def test_unregister_participant():
    activity = "Chess Club"
    email = "pytest_remove@example.com"

    # Add then remove
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {email} from {activity}"

    # Verify removal
    resp2 = client.get("/activities")
    data = resp2.json()
    assert email not in data[activity]["participants"]
