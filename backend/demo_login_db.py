"""SQLite backing store for the demo login fallback.

This is intentionally the ONLY SQL database in the project — every other
feature persists to Azure Blob Storage via storage_service.py. A single
`users` lookup table doesn't need a document store; SQLite keeps this
isolated, zero-config, and easy to turn into an ER diagram (one table,
explicit columns, no ORM layer to abstract the schema away).

Kept as its own module (not folded into storage_service.py or main.py)
so this whole flow can be deleted in one piece once real Entra login is
confirmed working and the fallback is no longer needed.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "demo_login.db"

# role is deliberately a free-text column (not a foreign-keyed roles
# table) - there are exactly four fixed values app-wide (see
# Frontend/src/roleConfig.js) and a second table for four static rows
# would be overhead, not structure. The CHECK constraint below is what
# actually enforces the fixed set.
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('HR', 'Manager', 'Intern', 'Engineer')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

# One demo account per role so every dashboard is reachable without
# needing real Entra accounts. Seeded once, idempotently - re-running
# this on an existing DB is a no-op (INSERT OR IGNORE on the UNIQUE
# email column).
SEED_USERS = [
    ("hr@bugbusters.demo", "Demo HR User", "HR"),
    ("manager@bugbusters.demo", "Demo Manager User", "Manager"),
    ("intern@bugbusters.demo", "Demo Intern User", "Intern"),
    ("engineer@bugbusters.demo", "Demo Engineer User", "Engineer"),
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_demo_db() -> None:
    """Creates the schema and seeds demo accounts if they don't already
    exist. Safe to call on every app startup."""
    conn = get_connection()

    try:
        conn.execute(SCHEMA)

        conn.executemany(
            "INSERT OR IGNORE INTO users (email, display_name, role) VALUES (?, ?, ?)",
            SEED_USERS,
        )

        conn.commit()
    finally:
        conn.close()
