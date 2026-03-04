# Peer-to-Peer Rental Marketplace (Django + Next.js)

A ready-to-run workspace that mimics the look and flow of a peer-to-peer rental marketplace (inspired by FatLlama) with multilingual support (English, Arabic, Spanish). **This is not an exact clone**—branding and assets are original.

## Stack
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS 4 + i18n (en/ar/es)
- **Backend**: Django 5 + Django REST Framework + SimpleJWT
- **Database**: PostgreSQL (or SQLite for local dev)
- **Payments**: Tap Payments (see [backend/TAP_SETUP.md](backend/TAP_SETUP.md))
- **Dev runtime**: Docker Compose

## Quick Start (Docker)

1. Install Docker & Docker Compose.
2. Copy env files and set secrets (see [Environment](#environment) below).
3. In this folder, run:
   ```bash
   docker compose up --build
   ```
   Or from repo root: `npm run docker`.
4. Open:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://127.0.0.1:8000/api/
   - **Django Admin**: http://localhost:8000/admin/

Default seed accounts (change in production):
- Admin: `admin@example.com` / `admin123`
- Demo user: `demo@example.com` / `demo123`

## Run without Docker

**From Sharikly-main root (no `cd`):** Use the ecosystem runner so you never leave the repo root:

```bash
npm run backend -- runserver    # Django (uses backend/.venv)
npm run frontend -- dev         # Next.js
npm run dahomify -- scan --path .
npm run help                    # list all commands
```

**Or run each app in its folder:**

**Backend**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env      # then edit .env with your values
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

**Frontend**
```bash
cd frontend_v2
npm install
cp .env.local.example .env.local   # then set NEXT_PUBLIC_API_URL etc.
npm run dev
```

**Database**: Use SQLite (default) or set `DB_ENGINE=postgresql` and `DATABASE_URL` in backend `.env`.

## Environment

- **Backend**: Copy `backend/.env.example` to `backend/.env` and set `DJANGO_SECRET_KEY`, database, and optional R2/SES/Tap keys. See comments in `.env.example`.
- **Frontend**: Copy `frontend_v2/.env.local.example` to `frontend_v2/.env.local` and set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` (or your backend URL).

## Notes
- **Commands:** From repo root run `npm run help` or `make help`; from backend (venv) run `python manage.py project_help`. Full list: [desloppify-workspace/SHARIKLY_COMMANDS.md](../desloppify-workspace/SHARIKLY_COMMANDS.md) (or see that file in the workspace).
- **Payments**: Production payments use Tap (15% platform / 85% owner). See [backend/TAP_SETUP.md](backend/TAP_SETUP.md).
- **MVP scope**: Listings, bookings, auth, chat, notifications, reports, i18n. Roadmap: [ROADMAP.md](ROADMAP.md).
