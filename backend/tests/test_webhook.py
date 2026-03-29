"""
LeadPulse — Webhook Tests
Run: pytest tests/ -v
"""
import hashlib
import hmac
import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

from app.main import app
from app.core.config import settings

client = TestClient(app)


# ── Helpers ───────────────────────────────────────────────────────────────────
def make_signature(body: bytes) -> str:
    digest = hmac.new(settings.FACEBOOK_APP_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


SAMPLE_WEBHOOK_PAYLOAD = {
    "object": "page",
    "entry": [{
        "id": "123456789",
        "changes": [{
            "field": "leadgen",
            "value": {
                "leadgen_id":  "lead_001",
                "form_id":     "form_001",
                "page_id":     "123456789",
                "ad_id":       "ad_001",
                "adset_id":    "adset_001",
                "campaign_id": "campaign_001",
            }
        }]
    }]
}


# ── Webhook verification ──────────────────────────────────────────────────────
def test_webhook_verify_success():
    resp = client.get("/webhook/facebook", params={
        "hub.mode":         "subscribe",
        "hub.verify_token": settings.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
        "hub.challenge":    "challenge_token_123",
    })
    assert resp.status_code == 200
    assert resp.text == "challenge_token_123"


def test_webhook_verify_wrong_token():
    resp = client.get("/webhook/facebook", params={
        "hub.mode":         "subscribe",
        "hub.verify_token": "wrong_token",
        "hub.challenge":    "challenge_token_123",
    })
    assert resp.status_code == 403


# ── Webhook lead ingestion ────────────────────────────────────────────────────
def test_webhook_rejects_invalid_signature():
    body = json.dumps(SAMPLE_WEBHOOK_PAYLOAD).encode()
    resp = client.post(
        "/webhook/facebook",
        content=body,
        headers={"x-hub-signature-256": "sha256=invalidsignature", "Content-Type": "application/json"},
    )
    assert resp.status_code == 401


@patch("app.api.routes.webhook._process_lead", new_callable=AsyncMock)
@patch("app.db.supabase.get_db")
def test_webhook_accepts_valid_signature(mock_db, mock_process):
    body = json.dumps(SAMPLE_WEBHOOK_PAYLOAD).encode()
    sig = make_signature(body)
    resp = client.post(
        "/webhook/facebook",
        content=body,
        headers={"x-hub-signature-256": sig, "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_webhook_ignores_non_page_objects():
    payload = {"object": "user", "entry": []}
    body = json.dumps(payload).encode()
    sig = make_signature(body)
    resp = client.post(
        "/webhook/facebook",
        content=body,
        headers={"x-hub-signature-256": sig, "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "ignored"}


# ── Facebook service unit tests ───────────────────────────────────────────────
def test_extract_lead_entries():
    from app.services.facebook import extract_lead_entries
    entries = extract_lead_entries(SAMPLE_WEBHOOK_PAYLOAD)
    assert len(entries) == 1
    assert entries[0]["fb_lead_id"] == "lead_001"
    assert entries[0]["fb_page_id"] == "123456789"
    assert entries[0]["fb_form_id"] == "form_001"


def test_extract_lead_entries_empty():
    from app.services.facebook import extract_lead_entries
    assert extract_lead_entries({"object": "page", "entry": []}) == []


def test_extract_lead_entries_non_leadgen_field():
    from app.services.facebook import extract_lead_entries
    payload = {"object": "page", "entry": [{"id": "1", "changes": [{"field": "feed", "value": {}}]}]}
    assert extract_lead_entries(payload) == []


def test_verify_webhook_signature_valid():
    from app.services.facebook import verify_webhook_signature
    body = b'{"test": "data"}'
    sig = make_signature(body)
    assert verify_webhook_signature(body, sig) is True


def test_verify_webhook_signature_invalid():
    from app.services.facebook import verify_webhook_signature
    assert verify_webhook_signature(b'data', "sha256=badvalue") is False


def test_verify_webhook_signature_missing_prefix():
    from app.services.facebook import verify_webhook_signature
    assert verify_webhook_signature(b'data', "invalidsig") is False
