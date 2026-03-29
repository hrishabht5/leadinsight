"""
LeadPulse — Lead Service Tests
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services import lead_service
from app.schemas.lead import LeadStatus


def make_mock_db(return_data=None, count=0):
    """Build a chainable Supabase mock."""
    mock_result = MagicMock()
    mock_result.data = return_data or []
    mock_result.count = count

    mock_query = MagicMock()
    mock_query.execute.return_value = mock_result
    mock_query.eq.return_value = mock_query
    mock_query.or_.return_value = mock_query
    mock_query.order.return_value = mock_query
    mock_query.range.return_value = mock_query
    mock_query.single.return_value = mock_query
    mock_query.select.return_value = mock_query
    mock_query.insert.return_value = mock_query
    mock_query.update.return_value = mock_query
    mock_query.upsert.return_value = mock_query

    mock_db = MagicMock()
    mock_db.table.return_value = mock_query
    return mock_db, mock_result


@pytest.mark.asyncio
async def test_create_lead():
    db, result = make_mock_db(return_data=[{
        "id": "lead-uuid-1", "name": "Priya Sharma", "status": "new",
        "workspace_id": "ws-1", "source": "facebook",
    }])
    lead = await lead_service.create_lead(db, "ws-1", {
        "name": "Priya Sharma", "phone": "+91 98765 43210",
        "source": "facebook", "fb_lead_id": "fb_001",
    })
    assert lead["name"] == "Priya Sharma"
    assert lead["status"] == "new"


@pytest.mark.asyncio
async def test_get_leads_returns_list():
    rows = [
        {"id": "l1", "name": "Lead One", "status": "new", "source": "facebook"},
        {"id": "l2", "name": "Lead Two", "status": "contacted", "source": "instagram"},
    ]
    db, _ = make_mock_db(return_data=rows, count=2)
    leads, total = await lead_service.get_leads(db, "ws-1")
    assert total == 2
    assert len(leads) == 2


@pytest.mark.asyncio
async def test_get_lead_by_fb_id_found():
    db, _ = make_mock_db(return_data=[{"id": "lead-uuid-1"}])
    result = await lead_service.get_lead_by_fb_id(db, "fb_001", "ws-1")
    assert result["id"] == "lead-uuid-1"


@pytest.mark.asyncio
async def test_get_lead_by_fb_id_not_found():
    db, _ = make_mock_db(return_data=[])
    result = await lead_service.get_lead_by_fb_id(db, "nonexistent", "ws-1")
    assert result is None


@pytest.mark.asyncio
async def test_update_lead_status():
    db, _ = make_mock_db(return_data=[{"id": "l1", "status": "contacted"}])
    result = await lead_service.update_lead_status(db, "l1", "ws-1", LeadStatus.contacted)
    assert result["status"] == "contacted"


@pytest.mark.asyncio
async def test_get_lead_stats():
    rows = [
        {"status": "new",       "source": "facebook"},
        {"status": "new",       "source": "instagram"},
        {"status": "contacted", "source": "facebook"},
        {"status": "converted", "source": "facebook"},
    ]
    db, _ = make_mock_db(return_data=rows, count=4)
    stats = await lead_service.get_lead_stats(db, "ws-1")
    assert stats["total"] == 4
    assert stats["new"] == 2
    assert stats["contacted"] == 1
    assert stats["converted"] == 1
    assert stats["facebook"] == 3
    assert stats["instagram"] == 1
