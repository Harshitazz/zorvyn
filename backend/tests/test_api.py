import os

os.environ["DATABASE_URL"] = "sqlite:///./data/test_finance.db"
os.environ["JWT_SECRET"] = "test-secret"

from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.main import app
from app.models.entities import User

client = TestClient(app)


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    admin = User(
        name="Admin",
        email="admin@finance.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
    )
    viewer = User(
        name="Viewer",
        email="viewer@finance.com",
        password_hash=hash_password("Viewer@123"),
        role="viewer",
    )
    analyst = User(
        name="Analyst",
        email="analyst@finance.com",
        password_hash=hash_password("Analyst@123"),
        role="analyst",
    )
    db.add_all([admin, viewer, analyst])
    db.commit()
    db.close()


def _token(email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.json()["data"]["token"]


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_login_and_me():
    token = _token("admin@finance.com", "Admin@123")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["role"] == "admin"


def test_admin_can_create_record():
    token = _token("admin@finance.com", "Admin@123")
    res = client.post(
        "/api/records",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 1000, "type": "income", "category": "salary", "date": "2025-01-01", "notes": "x"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_viewer_cannot_create_record():
    token = _token("viewer@finance.com", "Viewer@123")
    res = client.post(
        "/api/records",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 1000, "type": "income", "category": "salary", "date": "2025-01-01"},
    )
    assert res.status_code == 403


def test_viewer_can_dashboard_cannot_list_records():
    token = _token("viewer@finance.com", "Viewer@123")
    dash = client.get("/api/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash.status_code == 200
    assert "overview" in dash.json()["data"]
    rec = client.get("/api/records", headers={"Authorization": f"Bearer {token}"})
    assert rec.status_code == 403


def test_analyst_can_list_records_and_trends():
    token = _token("analyst@finance.com", "Analyst@123")
    rec = client.get("/api/records", headers={"Authorization": f"Bearer {token}"})
    assert rec.status_code == 200
    tr = client.get("/api/dashboard/trends/monthly", headers={"Authorization": f"Bearer {token}"})
    assert tr.status_code == 200


def test_search_and_pagination_and_soft_delete():
    token = _token("admin@finance.com", "Admin@123")

    # create multiple records
    for i in range(1, 12):
        client.post(
            "/api/records",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": 100 + i, "type": "expense", "category": "food", "date": f"2025-02-{i:02d}", "notes": f"meal {i}"},
        )

    # search results
    r = client.get("/api/records", params={"q": "meal", "limit": 5, "page": 1}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["pagination"]["total"] == 11
    assert len(data["items"]) == 5

    # soft delete one record and confirm omission
    rid = data["items"][0]["id"]
    del_resp = client.delete(f"/api/records/{rid}", headers={"Authorization": f"Bearer {token}"})
    assert del_resp.status_code == 200

    r2 = client.get("/api/records", params={"q": "meal", "limit": 20}, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["data"]["pagination"]["total"] == 10


def test_dashboard_summary_and_trends_content():
    token = _token("viewer@finance.com", "Viewer@123")
    dash = client.get("/api/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash.status_code == 200
    assert "overview" in dash.json()["data"]
    assert "by_category" in dash.json()["data"]

    summary = client.get("/api/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert summary.status_code == 200

    analyst_token = _token("analyst@finance.com", "Analyst@123")
    month = client.get("/api/dashboard/trends/monthly", headers={"Authorization": f"Bearer {analyst_token}"})
    week = client.get("/api/dashboard/trends/weekly", headers={"Authorization": f"Bearer {analyst_token}"})
    assert month.status_code == 200
    assert week.status_code == 200

