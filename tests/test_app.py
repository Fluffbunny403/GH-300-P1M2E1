from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    email = "test_user@example.com"

    # Ensure clean start
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    url = f"/activities/{quote(activity)}/signup?email={email}"
    res = client.post(url)
    assert res.status_code == 200
    j = res.json()
    assert email in j["activity"]["participants"]

    # Duplicate signup should fail
    res2 = client.post(url)
    assert res2.status_code == 400

    # Unregister
    url_un = f"/activities/{quote(activity)}/unregister?email={email}"
    res3 = client.delete(url_un)
    assert res3.status_code == 200
    j3 = res3.json()
    assert email not in j3["activity"]["participants"]

    # Unregistering again should return 404
    res4 = client.delete(url_un)
    assert res4.status_code == 404


def test_nonexistent_activity_signup_unsubscribe():
    res = client.post("/activities/This%20Does%20Not%20Exist/signup?email=foo@example.com")
    assert res.status_code == 404

    res2 = client.delete("/activities/This%20Does%20Not%20Exist/unregister?email=foo@example.com")
    assert res2.status_code == 404


def test_unregister_nonexistent_student():
    activity = "Chess Club"
    email = "someone-not-signed-up@example.com"
    # Ensure the email is not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    url_un = f"/activities/{quote(activity)}/unregister?email={email}"
    res = client.delete(url_un)
    assert res.status_code == 404
