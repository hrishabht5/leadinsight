"""
LeadPulse — Real-time Notification Service (Server-Sent Events)

Architecture:
  - Each connected dashboard client holds an open SSE connection
  - When a webhook fires, we broadcast the new lead to all connected clients
    in the same workspace
  - In-process pub/sub is used for single-server deployments.
    For multi-server, swap `_connections` for a Redis pub/sub channel.
"""
import asyncio
import json
from collections import defaultdict
from typing import AsyncGenerator

# workspace_id → list of asyncio.Queue instances (one per connected client)
_connections: dict[str, list[asyncio.Queue]] = defaultdict(list)


def _serialise(event_type: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    payload = json.dumps({"type": event_type, "data": data})
    return f"data: {payload}\n\n"


async def subscribe(workspace_id: str) -> tuple[asyncio.Queue, AsyncGenerator]:
    """
    Register a new SSE client for a workspace.
    Returns (queue, generator).
    The generator yields raw SSE strings indefinitely until the client disconnects.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=50)
    _connections[workspace_id].append(queue)

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            # Send a heartbeat immediately so the browser knows the connection is alive
            yield _serialise("connected", {"workspace_id": workspace_id})
            while True:
                # Wait up to 20 s then send a keep-alive comment
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20)
                    yield event
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            _connections[workspace_id].remove(queue)

    return queue, event_stream()


async def broadcast_new_lead(workspace_id: str, lead: dict) -> int:
    """
    Push a 'new_lead' event to every SSE client in the workspace.
    Returns the number of clients notified.
    """
    if workspace_id not in _connections:
        return 0
    message = _serialise("new_lead", lead)
    queues = _connections[workspace_id]
    notified = 0
    for q in list(queues):
        try:
            q.put_nowait(message)
            notified += 1
        except asyncio.QueueFull:
            pass  # Slow client — drop event rather than block
    return notified


async def broadcast_status_change(workspace_id: str, lead_id: str, new_status: str) -> None:
    """Broadcast a status update so all open dashboard tabs stay in sync."""
    message = _serialise("status_updated", {"lead_id": lead_id, "status": new_status})
    for q in list(_connections.get(workspace_id, [])):
        try:
            q.put_nowait(message)
        except asyncio.QueueFull:
            pass
