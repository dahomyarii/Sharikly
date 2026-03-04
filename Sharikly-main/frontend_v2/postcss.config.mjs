// Vitest/Vite loads this and rejects @tailwindcss/postcss; use no-op so tests run.
const config =
  typeof process !== "undefined" && process.env.VITEST
    ? { plugins: [] }
    : { plugins: ["@tailwindcss/postcss"] };

export default config;
