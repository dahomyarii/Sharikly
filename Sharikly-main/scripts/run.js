#!/usr/bin/env node
/**
 * Run backend, frontend, dahomify, or docker from Sharikly-main root.
 * Usage: node run.js <context> [args...]
 *        npm run backend -- runserver
 *        npm run frontend -- dev
 *        npm run dahomify -- scan --path .
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "backend");
const FRONTEND_DIR = path.join(ROOT, "frontend_v2");

const isWin = process.platform === "win32";
const backendPython = isWin
  ? path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe")
  : path.join(BACKEND_DIR, ".venv", "bin", "python");
const backendPythonFallback = "python";

function loadEnvFromDotEnv(baseEnv) {
  const envPath = path.join(ROOT, ".env");
  const env = { ...baseEnv };
  if (!fs.existsSync(envPath)) return env;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    env[key] = value;
  }
  return env;
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: isWin,
    cwd: opts.cwd || ROOT,
    env: opts.env || process.env,
  });
  process.exit(result.status !== null ? result.status : 1);
}

const context = process.argv[2];
const rest = process.argv.slice(3);

if (!context) {
  console.error(`
Usage: node run.js <context> [args...]
       npm run backend -- <manage.py args>
       npm run frontend -- <npm script or args>
       npm run dahomify -- <dahomify args>

Contexts:
  backend   Run Django (manage.py) in backend/ with venv. Examples:
            npm run backend -- runserver
            npm run backend -- test accounts marketplace --no-input -v 0
            npm run backend -- migrate
  frontend  Run npm in frontend_v2/. Examples:
            npm run frontend -- dev
            npm run frontend -- run test:run
            npm run frontend -- run lint
  dahomify  Run Dahomify models from project root. Examples:
            npm run dahomify -- scan --path .
            npm run dahomify -- status
            npm run dahomify -- next
  docker    Run docker compose up --build (backend + frontend).

From repo root (Sharikly-main): npm run help
`);
  process.exit(1);
}

switch (context) {
  case "backend": {
    const python = fs.existsSync(backendPython) ? backendPython : backendPythonFallback;
    const args = rest[0] === "manage.py" ? rest : ["manage.py", ...rest];
    if (args.length === 1) args.push("--help");
    run(python, args, { cwd: BACKEND_DIR });
    break;
  }
  case "frontend": {
    const npmArgs = rest[0] === "run" ? rest : ["run", ...rest];
    if (npmArgs.length === 1) npmArgs.push("dev");
    run("npm", npmArgs, { cwd: FRONTEND_DIR });
    break;
  }
  case "dahomify": {
    const args = rest.length ? rest : ["--help"];
    const env = loadEnvFromDotEnv(process.env);
    run("python", ["-m", "desloppify", ...args], { cwd: ROOT, env });
    break;
  }
  case "docker": {
    run("docker", ["compose", "up", "--build"], { cwd: ROOT });
    break;
  }
  default:
    console.error(`Unknown context: ${context}. Use backend | frontend | dahomify | docker`);
    process.exit(1);
}
