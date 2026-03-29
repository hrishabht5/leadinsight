#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# LeadPulse — Production Deploy Script
# Run on your VPS/server after initial setup.
# Usage: ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "🚀 LeadPulse — Deploying..."

# ── 1. Pull latest code ────────────────────────────────────────────────────────
git pull origin main

# ── 2. Build frontend ─────────────────────────────────────────────────────────
echo "📦 Building frontend..."
cd frontend
npm ci --silent
npm run build
cd ..

# Copy built files to Nginx root
sudo mkdir -p /var/www/leadpulse
sudo cp -r frontend/dist /var/www/leadpulse/dist
echo "✅ Frontend built and deployed to /var/www/leadpulse/dist"

# ── 3. Restart backend ────────────────────────────────────────────────────────
echo "🔄 Restarting backend..."
cd backend

# Option A: Docker
docker compose pull
docker compose up -d --build api
echo "✅ Backend restarted via Docker"

# Option B: systemd (uncomment if using systemd instead of Docker)
# source venv/bin/activate
# pip install -r requirements.txt --quiet
# sudo systemctl restart leadpulse-api
# echo "✅ Backend restarted via systemd"

cd ..

# ── 4. Reload Nginx ────────────────────────────────────────────────────────────
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "🎉 Deployment complete!"
echo "   Frontend: https://app.leadpulse.io"
echo "   API docs: https://app.leadpulse.io/docs (debug mode only)"
