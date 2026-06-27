import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DB = "sqlite:///./test_fireflies.db"
engine_test = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine_test)
    app.dependency_overrides.clear()


client = TestClient(app)


def test_list_meetings_empty():
    resp = client.get("/api/meetings")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_and_get_meeting():
    resp = client.post("/api/meetings", data={
        "title": "Test Meeting",
        "participants": '["Alice", "Bob"]',
        "transcript_text": "Alice: Hello.\nBob: Hi there.",
        "generate_ai": "false",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Meeting"
    assert len(data["participants"]) == 2
    assert len(data["transcript_lines"]) == 2

    mid = data["id"]
    resp2 = client.get(f"/api/meetings/{mid}")
    assert resp2.status_code == 200
    assert resp2.json()["id"] == mid


def test_get_meeting_not_found():
    resp = client.get("/api/meetings/9999")
    assert resp.status_code == 404


def test_update_meeting():
    resp = client.post("/api/meetings", data={
        "title": "Original Title",
        "participants": '["Alice"]',
        "generate_ai": "false",
    })
    mid = resp.json()["id"]
    resp2 = client.patch(f"/api/meetings/{mid}", json={"title": "Updated Title"})
    assert resp2.status_code == 200
    assert resp2.json()["title"] == "Updated Title"


def test_delete_meeting():
    resp = client.post("/api/meetings", data={
        "title": "Delete Me",
        "participants": '[]',
        "generate_ai": "false",
    })
    mid = resp.json()["id"]
    resp2 = client.delete(f"/api/meetings/{mid}")
    assert resp2.status_code == 204
    resp3 = client.get(f"/api/meetings/{mid}")
    assert resp3.status_code == 404


def test_action_items_crud():
    resp = client.post("/api/meetings", data={
        "title": "Action Test",
        "participants": '[]',
        "generate_ai": "false",
    })
    mid = resp.json()["id"]

    # Create
    r = client.post(f"/api/meetings/{mid}/action-items", json={"text": "Do something", "assignee": "Alice"})
    assert r.status_code == 201
    item_id = r.json()["id"]

    # Toggle completed
    r2 = client.patch(f"/api/action-items/{item_id}", json={"completed": True})
    assert r2.status_code == 200
    assert r2.json()["completed"] is True

    # Delete
    r3 = client.delete(f"/api/action-items/{item_id}")
    assert r3.status_code == 204


def test_search_meetings():
    client.post("/api/meetings", data={
        "title": "Sprint Planning Alpha",
        "participants": '["Alice"]',
        "generate_ai": "false",
    })
    client.post("/api/meetings", data={
        "title": "Design Review Beta",
        "participants": '["Bob"]',
        "generate_ai": "false",
    })
    resp = client.get("/api/meetings?search=Sprint")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert "Sprint" in data[0]["title"]


def test_filter_meetings_by_date():
    client.post("/api/meetings", data={
        "title": "Old Meeting",
        "date": "2024-01-15T10:00:00",
        "participants": "[]",
        "generate_ai": "false",
    })
    client.post("/api/meetings", data={
        "title": "Recent Meeting",
        "date": "2025-06-15T10:00:00",
        "participants": "[]",
        "generate_ai": "false",
    })
    resp = client.get("/api/meetings?date_from=2025-01-01T00:00:00&date_to=2025-12-31T23:59:59")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Recent Meeting"


def test_update_meeting_participants_and_date():
    resp = client.post("/api/meetings", data={
        "title": "Update Test",
        "date": "2024-03-01T09:00:00",
        "participants": '["Alice"]',
        "generate_ai": "false",
    })
    mid = resp.json()["id"]
    resp2 = client.patch(f"/api/meetings/{mid}", json={
        "date": "2024-06-01T14:30:00",
        "participants": ["Alice", "Bob"],
    })
    assert resp2.status_code == 200
    body = resp2.json()
    assert len(body["participants"]) == 2
    assert {p["name"] for p in body["participants"]} == {"Alice", "Bob"}
    assert body["date"].startswith("2024-06-01")
