-- Runtime startup creates the MVP tables from SQLAlchemy metadata.
-- This marker allows future Alembic migrations to start from version 1.
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO schema_version(version) VALUES (1);
