"""
LeadPulse — Facebook / Meta Service
Handles:
  1. Webhook signature verification
  2. Parsing lead gen webhook payloads
  3. Fetching full lead data from the Graph API
  4. OAuth token exchange

Production notes:
  - All Graph API calls use retry with exponential backoff
  - Shared httpx client for connection pooling
  - Configurable timeouts
"""
import asyncio
import hashlib
import hmac
import logging
import httpx
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("leadpulse.facebook")


GRAPH_BASE = f"https://graph.facebook.com/{settings.FACEBOOK_API_VERSION}"

# Shared httpx client — created lazily, reused for connection pooling
_http_client: Optional[httpx.AsyncClient] = None

_DEFAULT_TIMEOUT = 15
_MAX_RETRIES = 3


async def _get_client() -> httpx.AsyncClient:
    """Get or create the shared httpx client."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT)
    return _http_client


async def _request_with_retry(
    method: str, url: str, *, max_retries: int = _MAX_RETRIES, **kwargs
) -> httpx.Response:
    """HTTP request with exponential backoff retry on network/5xx errors."""
    client = await _get_client()
    last_exc = None

    for attempt in range(1, max_retries + 1):
        try:
            resp = await getattr(client, method)(url, **kwargs)
            # Retry on 5xx server errors
            if resp.status_code >= 500 and attempt < max_retries:
                wait = 2 ** (attempt - 1)
                logger.warning(
                    f"⚠️  Graph API {resp.status_code} on attempt {attempt}/{max_retries}, "
                    f"retrying in {wait}s..."
                )
                await asyncio.sleep(wait)
                continue
            return resp
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            last_exc = e
            if attempt < max_retries:
                wait = 2 ** (attempt - 1)
                logger.warning(
                    f"⚠️  Network error on attempt {attempt}/{max_retries}: {e}. "
                    f"Retrying in {wait}s..."
                )
                await asyncio.sleep(wait)
            else:
                logger.error(f"❌ Graph API request failed after {max_retries} attempts: {e}")
                raise

    raise last_exc  # Should not reach here


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
    resp = await _request_with_retry("get", url, params=params)
    if resp.status_code != 200:
        logger.error(f"❌ Graph API error for lead {lead_id}: status={resp.status_code} body={resp.text[:300]}")
        return None
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
    resp = await _request_with_retry("get", url, params=params)
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
    resp = await _request_with_retry("get", url, params=params)
    resp.raise_for_status()
    return resp.json()


async def get_pages(user_access_token: str) -> list[dict]:
    """
    Return ALL pages the user manages:
    - Personal pages via /me/accounts
    - Business Manager pages via /me/businesses → /owned_pages + /client_pages
    """
    all_pages: list[dict] = []
    seen_ids: set[str] = set()

    def _add(pages: list[dict]):
        for p in pages:
            pid = p.get("id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                all_pages.append(p)

    fields = "id,name,access_token"
    client = await _get_client()

    # ── 1. Personal pages (/me/accounts) ─────────────────────────────────
    logger.info("📃 Fetching personal pages via /me/accounts...")
    r = await client.get(
        f"{GRAPH_BASE}/me/accounts",
        params={"access_token": user_access_token, "fields": fields, "limit": 100},
    )
    data = r.json()
    logger.info(f"📃 /me/accounts → status={r.status_code} raw={data}")
    _add(data.get("data", []))

    # ── 2. Business Manager pages ─────────────────────────────────────────
    logger.info("🏢 Fetching businesses via /me/businesses...")
    biz_r = await client.get(
        f"{GRAPH_BASE}/me/businesses",
        params={"access_token": user_access_token, "fields": "id,name", "limit": 50},
    )
    biz_data = biz_r.json()
    logger.info(f"🏢 /me/businesses → status={biz_r.status_code} count={len(biz_data.get('data', []))}")

    for biz in biz_data.get("data", []):
        biz_id = biz["id"]
        biz_name = biz.get("name", biz_id)

        # Owned pages
        owned_r = await client.get(
            f"{GRAPH_BASE}/{biz_id}/owned_pages",
            params={"access_token": user_access_token, "fields": fields, "limit": 100},
        )
        owned = owned_r.json()
        logger.info(f"   → {biz_name}/owned_pages status={owned_r.status_code} pages={[p.get('name') for p in owned.get('data', [])]}")
        _add(owned.get("data", []))

        # Client pages
        client_r = await client.get(
            f"{GRAPH_BASE}/{biz_id}/client_pages",
            params={"access_token": user_access_token, "fields": fields, "limit": 100},
        )
        client_pages = client_r.json()
        logger.info(f"   → {biz_name}/client_pages status={client_r.status_code} pages={[p.get('name') for p in client_pages.get('data', [])]}")
        _add(client_pages.get("data", []))

    logger.info(f"✅ Total pages found: {len(all_pages)} → {[p.get('name') for p in all_pages]}")
    return all_pages


async def subscribe_page_to_leadgen(page_id: str, page_access_token: str) -> bool:
    """Subscribe a page to leadgen webhook field."""
    url = f"{GRAPH_BASE}/{page_id}/subscribed_apps"
    resp = await _request_with_retry("post", url, params={
        "subscribed_fields": "leadgen",
        "access_token": page_access_token,
    })
    data = resp.json()
    logger.info(f"🔗 Subscribing page {page_id} to webhook → status={resp.status_code} raw={data}")
    return data.get("success", False)

