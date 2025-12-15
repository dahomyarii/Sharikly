
# Peer-to-Peer Rental Marketplace (Django + Next.js) — FatLlama-style (MVP)

A ready-to-run workspace that mimics the look and flow of a peer-to-peer rental marketplace (inspired by FatLlama) with multilingual support (English, Arabic, Spanish). **This is not an exact clone**—branding and assets are original.

## Stack
- **Frontend**: Next.js (App Router) + TailwindCSS + next-i18next (en/ar/es)
- **Backend**: Django + Django REST Framework + SimpleJWT
- **Database**: PostgreSQL
- **Dev Runtime**: Docker Compose

## Quick Start
1. Install Docker & Docker Compose.
2. In this folder, run:
   ```bash
   docker compose up --build
   ```
3. Open:
   - Frontend: http://localhost:3000
   - Backend API: http://127.0.0.1:8000/api/
   - Django Admin: http://localhost:8000/admin/  (user: admin@example.com / pass: admin123)

## Default Accounts (created by seed data)
- Admin: `admin@example.com` / `admin123`
- User: `demo@example.com` / `demo123`

## Notes
- Payments are stubbed. Replace `payments` app with Stripe/PayPal integration later.
- This is an MVP: Listings & Bookings endpoints + Auth + i18n + basic UI.