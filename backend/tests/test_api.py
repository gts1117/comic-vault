import pytest
from fastapi.testclient import TestClient
from server import app, db
import os

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    # Before each test, clear out settings to avoid side-effects
    db.execute("DELETE FROM settings;")
    yield

def test_ping():
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_settings_crud():
    # Create setting
    payload = {"settings": {"library_path": "/test/path/comics"}}
    response = client.post("/api/settings", json=payload)
    assert response.status_code == 200
    
    # Fetch setting
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "library_path" in data
    assert data["library_path"] == "/test/path/comics"

def test_db_stats():
    # Insert a dummy series and comic
    series_id = db.execute("INSERT INTO series (name, publisher) VALUES (?, ?)", ("Test Series", "Test Pub"))
    db.execute("INSERT INTO comics (series_id, issue_number, title, volume) VALUES (?, ?, ?, ?)", (series_id, "1", "Test Title", "1"))
    
    response = client.get("/api/db/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["counts"]["series"] > 0
    assert data["counts"]["comics"] > 0
