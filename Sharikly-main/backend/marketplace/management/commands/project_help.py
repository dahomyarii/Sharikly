"""
Print Sharikly project commands. Run: python manage.py project_help
Full doc: Dahomify workspace runbook (SHARIKLY_COMMANDS.md in your workspace)
"""
from django.core.management.base import BaseCommand


HELP_TEXT = """
Sharikly / ekra.app - All commands
Full doc: Dahomify workspace runbook

Backend (cd backend, venv activated):
  python manage.py runserver              Start dev server (port 8000)
  python manage.py migrate               Apply migrations
  python manage.py makemigrations [app]  Create migrations
  python manage.py test accounts marketplace --no-input -v 0  Run tests
  python manage.py seed_demo            Seed demo data
  python manage.py collectstatic --noinput  Collect static (production)
  python manage.py project_help         Print this list

Frontend (cd frontend_v2):
  npm run dev          Start Next.js dev server
  npm run build        Production build
  npm run start        Run production build
  npm run lint         ESLint
  npm run test         Vitest watch
  npm run test:run     Vitest single run

Repo root:
  make help            Print this list (Make)
  npm run help         Print this list (Node)
  docker compose up --build  Backend + frontend

API (backend running): GET /api/health/  GET /api/schema/swagger-ui/
CI: Push to main -> backend tests + frontend lint + frontend test:run
Dahomify: dahomify scan --path .  dahomify status  dahomify next  dahomify --help
"""


class Command(BaseCommand):
    help = "Print all Sharikly project commands (backend, frontend, CI, API, dahomify)."

    def handle(self, *args, **options):
        self.stdout.write(HELP_TEXT)
