import pytest
import os
import sqlite3
from database import DatabaseManager

@pytest.fixture
def db():
    # Use in-memory SQLite for tests
    db_manager = DatabaseManager(":memory:")
    
    # We need to apply schema. Assuming schema.sql is one level up
    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
    db_manager.apply_schema(schema_path)
    
    yield db_manager
    
    db_manager.close_all()

def test_schema_applied(db):
    # Verify tables exist
    res = db.fetch_all("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r['name'] for r in res]
    
    assert "series" in tables
    assert "comics" in tables
    assert "files" in tables
    assert "settings" in tables

def test_crud_series(db):
    series_id = db.execute("INSERT INTO series (name, publisher) VALUES (?, ?)", ("X-Men", "Marvel"))
    assert series_id is not None
    
    row = db.fetch_one("SELECT * FROM series WHERE id = ?", (series_id,))
    assert row['name'] == "X-Men"
    assert row['publisher'] == "Marvel"

def test_crud_comic_and_file(db):
    series_id = db.execute("INSERT INTO series (name, publisher) VALUES (?, ?)", ("Batman", "DC"))
    
    comic_id = db.execute(
        "INSERT INTO comics (series_id, issue_number, title, volume) VALUES (?, ?, ?, ?)",
        (series_id, "1", "Batman", "Vol 1")
    )
    
    db.execute(
        "INSERT INTO files (comic_id, file_path, file_size, checksum, cover_page_index) VALUES (?, ?, ?, ?, ?)",
        (comic_id, "/tmp/batman1.cbz", 1024, "hash123", 0)
    )
    
    row = db.fetch_one('''
        SELECT c.title, f.file_path 
        FROM comics c 
        JOIN files f ON c.id = f.comic_id 
        WHERE c.id = ?
    ''', (comic_id,))
    
    assert row['title'] == "Batman"
    assert row['file_path'] == "/tmp/batman1.cbz"
