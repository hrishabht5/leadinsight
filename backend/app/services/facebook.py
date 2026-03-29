"""
LeadPulse — Facebook / Meta Service
Handles:
  1. Webhook signature verification
  2. Parsing lead gen webhook payloads
  3. Fetching full lead data from the Graph API
  4. OAuth token exchange
"""
import hashlib
import hmac
import logging
import httpx
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("leadpulse.facebook")


GRAPH_BASE = f"https://graph.facebook.com/{settings.FACEBOOK_API_VERSION}"


# ── Webhook verification ──────────────────────────────────────────────────────
def verify_webhook_signature(payload_body: bytes, x_hub_signature: str) -> bool:
    """
    Facebook signs every webhook POST with HMAC-SHA256.
    Header format: sha256=<hex_digest>
    """
    if not x_hub_signature.startswith("sha256="):
        return False
    expected = hmac.new(
        settings.FACEBOOK_APP_SECRET.encode(),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, x_hub_signature[7:])


# ── Parse raw webhook body ────────────────────────────────────────────────────
def extract_lead_entries(payload: dict) -> list[dict]:
    """
    Parse Meta Lead Gen webhook payload and return a flat list of lead entries.

    Payload shape:
    {
      "object": "page",
      "entry": [{
        "id": "<page_id>",
        "changes": [{
          "field": "leadgen",
          "value": {
            "leadgen_id": "...",
            "page_id": "...",
            "form_id": "...",
            "ad_id": "...",
            "adset_id": "...",
            "campaign_id": "..."
          }
        }]
      }]
    }
    """
    entries = []
    for entry in payload.get("entry", []):
        page_id = entry.get("id")
        for change in entry.get("changes", []):
            if change.get("field") != "leadgen":
                continue
            value = change.get("value", {})
            entries.append({
                "fb_lead_id":   value.get("leadgen_id"),
                "fb_form_id":   value.get("form_id"),
                "fb_page_id":   page_id or value.get("page_id"),
                "fb_ad_id":     value.get("ad_id"),
                "fb_adset_id":  value.get("adset_id"),
                "fb_campaign_id": value.get("campaign_id"),
            })
    return entries


# ── Fetch lead detail from Graph API ─────────────────────────────────────────
async def fetch_lead_detail(lead_id: str, page_access_token: str) -> Optional[dict]:
    """
    GET /{lead_id}?fields=field_data,created_time,ad_id,adset_id,campaign_id,form_id
    Returns a normalised dict with name/phone/email extracted.
    """
    url = f"{GRAPH_BASE}/{lead_id}"
    params = {
        "fields": "field_data,created_time,ad_id,adset_id,campaign_id,form_id,ad_name,adset_name,campaign_name,form_name",
        "access_token": page_access_token,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    # Flatten field_data list into a dict
    fields: dict = {}
    for item in data.get("field_data", []):
        key = item.get("name", "").lower().replace(" ", "_")
        values = item.get("values", [])
        fields[key] = values[0] if values else None

    return {
        "fb_lead_id":    lead_id,
        "name":          fields.get("full_name") or fields.get("name") or "Unknown",
        "phone":         fields.get("phone_number") or fields.get("phone"),
        "email":         fields.get("email"),
        "city":          fields.get("city"),
        "fb_ad_id":      data.get("ad_id"),
        "fb_adset_id":   data.get("adset_id"),
        "fb_campaign_id":data.get("campaign_id"),
        "fb_form_id":    data.get("form_id"),
        "campaign_name": data.get("campaign_name"),
        "adset_name":    data.get("adset_name"),
        "form_name":     data.get("form_name"),
        "raw_fields":    fields,
    }


# ── OAuth token exchange ──────────────────────────────────────────────────────
async def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """Exchange a short-lived user code for a long-lived user access token."""
    url = f"{GRAPH_BASE}/oauth/access_token"
    params = {
        "client_id":     settings.FACEBOOK_APP_ID,
        "client_secret": settings.FACEBOOK_APP_SECRET,
        "redirect_uri":  redirect_uri,
        "code":          code,
    }
    logger.info(f"🔑 Exchanging code for token. redirect_uri={redirect_uri}")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        data = resp.json()
        logger.info(f"🔑 Token exchange response status={resp.status_code} keys={list(data.keys())}")
        if resp.status_code != 200:
            logger.error(f"❌ Token exchange failed: {data}")
        resp.raise_for_status()
        return data   # { access_token, token_type }


async def get_long_lived_token(short_lived_token: str) -> dict:
    """Exchange short-lived user token → long-lived (60-day) token."""
    url = f"{GRAPH_BASE}/oauth/access_token"
    params = {
        "grant_type":        "fb_exchange_token",
        "client_id":         settings.FACEBOOK_APP_ID,
        "client_secret":     settings.FACEBOOK_APP_SECRET,
        "fb_exchange_token": short_lived_token,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()


async def get_pages(user_access_token: str) -> list[dict]:
    """Return the list of pages the user manages."""
    url = f"{GRAPH_BASE}/me/accounts"
    params = {
        "access_token": user_access_token,
        "fields": "id,name,access_token,instagram_business_account",
        "limit": 100,
    }
    logger.info("📃 Fetching /me/accounts from Facebook Graph API...")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        data = resp.json()
        logger.info(f"📃 /me/accounts response status={resp.status_code} raw={data}")
        resp.raise_for_status()
        pages = data.get("data", [])
        logger.info(f"📃 Found {len(pages)} page(s): {[p.get('name') for p in pages]}")
        return pages


async def subscribe_page_to_leadgen(page_id: str, page_access_token: str) -> bool:
    """Subscribe a page to leadgen webhook field."""
    url = f"{GRAPH_BASE}/{page_id}/subscribed_apps"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, params={
            "subscribed_fields": "leadgen",
            "access_token": page_access_token,
        })
    return resp.json().get("success", False)
