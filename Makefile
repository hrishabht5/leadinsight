# ─────────────────────────────────────────────────────────────────────────────
# LeadPulse — Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help dev backend frontend test lint clean build

help:
	@echo ""
	@echo "  ⚡ LeadPulse — Dev Commands"
	@echo ""
	@echo "  make dev        Start full stack (Docker)"
	@echo "  make backend    Run FastAPI dev server (no Docker)"
	@echo "  make frontend   Run Vite dev server (no Docker)"
	@echo "  make test       Run backend tests"
	@echo "  make lint       Lint Python code"
	@echo "  make build      Build frontend for production"
	@echo "  make clean      Remove build artifacts"
	@echo ""

# ── Full stack via Docker ─────────────────────────────────────────────────────
dev:
	docker compose --profile dev up --build

# ── Backend only (no Docker) ──────────────────────────────────────────────────
backend:
	cd backend && \
	  [ -d venv ] || python -m venv venv && \
	  . venv/bin/activate && \
	  pip install -r requirements.txt -q && \
	  uvicorn app.main:app --reload --port 8000

# ── Frontend only (no Docker) ─────────────────────────────────────────────────
frontend:
	cd frontend && npm install && npm run dev

# ── Tests ─────────────────────────────────────────────────────────────────────
test:
	cd backend && \
	  . venv/bin/activate && \
	  pytest tests/ -v

# ── Lint ──────────────────────────────────────────────────────────────────────
lint:
	cd backend && \
	  . venv/bin/activate && \
	  python -m ruff check app/ || true

# ── Build frontend ────────────────────────────────────────────────────────────
build:
	cd frontend && npm ci && npm run build
	@echo "✅ Frontend built → frontend/dist/"

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/dist frontend/node_modules/.vite
	@echo "✅ Cleaned"
