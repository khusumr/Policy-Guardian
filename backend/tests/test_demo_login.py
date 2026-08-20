import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest

import demo_login_db
import demo_login_repository


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """Points the demo DB at a throwaway file per test so tests never
    touch (or depend on) the real backend/demo_login.db."""
    test_db_path = tmp_path / "test_demo_login.db"
    monkeypatch.setattr(demo_login_db, "DB_PATH", test_db_path)
    demo_login_db.init_demo_db()
    return test_db_path


def test_init_demo_db_seeds_one_user_per_role():
    conn = demo_login_db.get_connection()
    try:
        rows = conn.execute("SELECT role FROM users ORDER BY role").fetchall()
    finally:
        conn.close()

    roles = sorted(row["role"] for row in rows)
    assert roles == ["Engineer", "HR", "Intern", "Manager"]


def test_init_demo_db_is_idempotent():
    # Calling init again shouldn't duplicate rows or error on the UNIQUE
    # email constraint.
    demo_login_db.init_demo_db()
    demo_login_db.init_demo_db()

    conn = demo_login_db.get_connection()
    try:
        count = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
    finally:
        conn.close()

    assert count == 4


def test_get_user_by_email_found():
    user = demo_login_repository.get_user_by_email("hr@bugbusters.demo")

    assert user == {
        "email": "hr@bugbusters.demo",
        "display_name": "Demo HR User",
        "role": "HR",
    }


def test_get_user_by_email_case_insensitive():
    user = demo_login_repository.get_user_by_email("HR@BugBusters.Demo")

    assert user["role"] == "HR"


def test_get_user_by_email_not_found():
    assert demo_login_repository.get_user_by_email("nobody@example.com") is None
