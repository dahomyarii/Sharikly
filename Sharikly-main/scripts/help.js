#!/usr/bin/env node
/**
 * Print Sharikly project commands. Run: npm run help (from repo root)
 * Full doc: desloppify-workspace/SHARIKLY_COMMANDS.md
 */
const lines = [
  "",
  "Sharikly / ekra.app — All commands (run from Sharikly-main root)",
  "Full doc: desloppify-workspace/SHARIKLY_COMMANDS.md",
  "",
  "Ecosystem (no cd — run from Sharikly-main):",
  "  npm run backend -- runserver              Start Django (uses backend/.venv)",
  "  npm run backend -- migrate                Apply migrations",
  "  npm run backend -- test accounts marketplace --no-input -v 0",
  "  npm run backend -- seed_demo",
  "  npm run frontend -- dev                   Start Next.js",
  "  npm run frontend -- run test:run          Run frontend tests",
  "  npm run frontend -- run lint",
  "  npm run dahomify -- scan --path .         Scan project",
  "  npm run dahomify -- status",
  "  npm run dahomify -- next",
  "  npm run docker                            Backend + frontend via Docker",
  "  npm run help                              This message",
  "",
  "Backend (if you cd backend and activate venv):",
  "  python manage.py runserver   python manage.py migrate   python manage.py project_help",
  "",
  "Frontend (if you cd frontend_v2): npm run dev   npm run test:run   npm run lint",
  "",
  "API (backend running): GET /api/health/  GET /api/schema/swagger-ui/",
  "CI: Push to main -> backend tests + frontend lint + frontend test:run",
  "",
];
console.log(lines.join("\n"));
