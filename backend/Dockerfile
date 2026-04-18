# ─────────────────────────────────────────────────────────────────────────────
# LeadPulse Backend — Dockerfile
# Multi-stage: builder + slim production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .

RUN pip install --upgrade pip==24.0 \
 && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM python:3.12-slim AS production

LABEL maintainer="LeadPulse Team"
LABEL version="1.0.0"
LABEL description="LeadPulse — Real-time Lead Management CRM API"

# Non-root user for security
RUN groupadd -r leadpulse && useradd -r -g leadpulse leadpulse

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Switch to non-root user
USER leadpulse

EXPOSE 8000

# Health check — used by Docker, K8s, Render, etc.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Uvicorn with 2 workers; increase workers for higher traffic
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--no-access-log"]

