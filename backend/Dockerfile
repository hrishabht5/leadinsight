# ─────────────────────────────────────────────────────────────────────────────
# LeadPulse Backend — Dockerfile
# Multi-stage: builder + slim production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM python:3.12-slim AS production

# Non-root user for security
RUN groupadd -r leadpulse && useradd -r -g leadpulse leadpulse

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/

# Switch to non-root user
USER leadpulse

EXPOSE 8000

# Uvicorn with 2 workers; increase workers for higher traffic
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--no-access-log"]
