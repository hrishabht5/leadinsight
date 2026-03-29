"""
LeadPulse — Auth Route Tests
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Register ──────────────────────────────────────────────────────────────────
@patch("app.api.routes.auth.hash_password", return_value="hashed_pw")
@patch("app.db.supabase.get_db")
def test_register_success(mock_get_db, mock_hash):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db

    # No existing user
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    # Workspace insert
    ws_result = MagicMock(); ws_result.data = [{"id": "ws-001"}]
    # User insert
    user_result = MagicMock(); user_result.data = [{"id": "user-001", "email": "test@test.com"}]

    call_count = [0]
    def side_effect():
        call_count[0] += 1
        return ws_result if call_count[0] == 1 else user_result

    mock_db.table.return_value.insert.return_value.execute.side_effect = side_effect

    resp = client.post("/api/v1/auth/register", json={
        "email": "test@test.com",
        "password": "password123",
        "full_name": "Test User",
        "workspace_name": "Test Biz",
    })
    assert resp.status_code == 201
    assert "access_token" in resp.json()


@patch("app.db.supabase.get_db")
def test_register_duplicate_email(mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": "existing"}]

    resp = client.post("/api/v1/auth/register", json={
        "email": "existing@test.com",
        "password": "password123",
        "full_name": "Existing",
        "workspace_name": "Biz",
    })
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


# ── Login ─────────────────────────────────────────────────────────────────────
@patch("app.api.routes.auth.verify_password", return_value=True)
@patch("app.db.supabase.get_db")
def test_login_success(mock_get_db, mock_verify):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
        "id": "user-001",
        "email": "test@test.com",
        "password_hash": "hashed",
        "workspace_id": "ws-001",
    }]
    resp = client.post("/api/v1/auth/login", json={"email": "test@test.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@patch("app.api.routes.auth.verify_password", return_value=False)
@patch("app.db.supabase.get_db")
def test_login_wrong_password(mock_get_db, mock_verify):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
        "id": "u1", "email": "t@t.com", "password_hash": "hashed", "workspace_id": "ws1",
    }]
    resp = client.post("/api/v1/auth/login", json={"email": "t@t.com", "password": "wrong"})
    assert resp.status_code == 401


@patch("app.db.supabase.get_db")
def test_login_unknown_email(mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    resp = client.post("/api/v1/auth/login", json={"email": "nobody@test.com", "password": "pass"})
    assert resp.status_code == 401


# ── JWT security ──────────────────────────────────────────────────────────────
def test_protected_route_without_token():
    """Accessing a protected route without a token must return 403."""
    resp = client.get("/api/v1/leads")
    assert resp.status_code in (401, 403)


def test_protected_route_with_bad_token():
    resp = client.get("/api/v1/leads", headers={"Authorization": "Bearer invalid.token.here"})
    assert resp.status_code == 401
