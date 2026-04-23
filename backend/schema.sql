-- Comic Vault SQLite Schema
-- Version 1.0

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Series: Groups individual issues
CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    publisher TEXT,
    year_started INTEGER,
    comicvine_id INTEGER
);

-- 2. Comics: Represents metadata of a specific comic issue
CREATE TABLE IF NOT EXISTS comics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id INTEGER NOT NULL,
    issue_number TEXT,  -- TEXT handles partial issues like 10.5 or 1A
    title TEXT,
    volume INTEGER,
    summary TEXT,
    read_status INTEGER DEFAULT 0,  -- 0: Unread, 1: In Progress, 2: Read
    current_page INTEGER DEFAULT 0, -- Saves reading progress
    user_rating INTEGER,
    FOREIGN KEY(series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- 3. Files: Tracks physical filesystem footprint and specific variants
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comic_id INTEGER NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    checksum TEXT UNIQUE,  -- Fingerprint hash to block duplicates
    variant_name TEXT, -- e.g., 'Retailer Incentive Cover', 'WebRip'
    cover_page_index INTEGER DEFAULT 0, -- Which page in the zip acts as the cover thumbnail
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- 4. Tags: Genere/Event tags
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- 5. Comic_Tags: Many-to-Many junction
CREATE TABLE IF NOT EXISTS comic_tags (
    comic_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (comic_id, tag_id),
    FOREIGN KEY(comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 6. Settings: Key-Value store for app configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Initial default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('library_path', NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_series_name ON series(name);
CREATE INDEX IF NOT EXISTS idx_comics_series ON comics(series_id);
CREATE INDEX IF NOT EXISTS idx_files_comic ON files(comic_id);
