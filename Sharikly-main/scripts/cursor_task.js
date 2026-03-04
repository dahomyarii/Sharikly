#!/usr/bin/env node
/**
 * Generate a ready-to-paste Cursor agent prompt that combines:
 * - Your high-level goal
 * - Dahomify (desloppify) status / next plan
 * - Sharikly ecosystem commands
 *
 * Usage (from Sharikly-main):
 *   npm run cursor-task -- "Short description of what you want to do"
 */

const goal = process.argv.slice(2).join(" ").trim() || "<describe your goal here>";

const prompt = `
You are a Cursor agent working on the Sharikly (ekra.app) repo.

## High-level goal from the user
- ${goal}

## Tools and commands you can use (already wired in this repo)

From \`Sharikly-main\` root (no cd):

- Backend (Django, uses \`backend/.venv\`):
  - \`npm run backend -- runserver\`
  - \`npm run backend -- migrate\`
  - \`npm run backend -- test accounts marketplace --no-input -v 0\`
  - \`npm run backend -- seed_demo\`

- Frontend (Next.js, \`frontend_v2\`):
  - \`npm run frontend -- dev\`
  - \`npm run frontend -- run test:run\`
  - \`npm run frontend -- run lint\`

- Dahomify (code health, via \`python -m desloppify\`):
  - \`npm run dahomify -- scan --path .\`        # rescan project (if status says tool changed)
  - \`npm run dahomify -- status\`               # overall health + AGENT PLAN
  - \`npm run dahomify -- next --count 10\`      # top 10 prioritized findings
  - \`npm run dahomify -- show security --status open\`
  - \`npm run dahomify -- show smells --status open\`

- DevOps / CI:
  - \`npm run docker\`                           # docker compose up --build
  - GitHub Actions CI: backend tests + frontend lint + frontend tests on push/PR to main

- Project runbook:
  - \`desloppify-workspace/SHARIKLY_COMMANDS.md\`

## How you should use Dahomify to drive your work

1. If Dahomify status mentions "tool code changed since last scan", run:
   - \`npm run dahomify -- scan --path .\`

2. Always inspect:
   - \`npm run dahomify -- status\`      (look at "AGENT PLAN", structural debt by area, and biggest drags)
   - \`npm run dahomify -- next --count 10\`   (top prioritized items)

3. Use Dahomify's recommendations to choose safe, high‑impact tasks that also support the user goal:
   - Prefer security, correctness, and test health before cosmetic refactors.
   - When status suggests concrete commands (e.g. "run \`dahomify show review --status open\`"), follow them.

4. For each task you decide to take:
   - Explain briefly why you chose it (based on Dahomify output and the user goal).
   - Implement the change in small, safe steps.
   - Add/adjust tests where reasonable.
   - Re‑run relevant commands:
     - Backend: \`npm run backend -- test accounts marketplace --no-input -v 0\`
     - Frontend: \`npm run frontend -- run test:run\` and \`npm run frontend -- run lint\`
     - Dahomify: \`npm run dahomify -- status\` or a targeted \`show\` command

5. Keep iterating:
   - After each completed task, re-run \`npm run dahomify -- next\` to pick the next highest‑value item.
   - Stop or change direction when the user asks or when additional context is needed.

## Important constraints

- Never commit or print real secrets (API keys in any \`.env\` files).
- Prefer using the ecosystem commands above instead of manual \`cd\` and ad‑hoc commands.
- Use existing runbooks:
  - \`SHARIKLY_COMMANDS.md\`
  - Dahomify status + next output
- Stay aligned with the user goal at the top of this prompt while respecting Dahomify's priority ordering.

Start by summarizing the Dahomify status and next recommendations that are most relevant to: ${goal}
Then propose a short, ordered plan (3–7 steps), and immediately begin executing step 1.
`;

console.log(prompt.trimStart());

