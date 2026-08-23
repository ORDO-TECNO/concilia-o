// Set required env vars for e2e tests before the Nest app module is loaded.
// Tries .env (gitignored) first; falls back to the example dev values so
// `npm run test:e2e` works out of the box in a fresh clone with docker-compose up.
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load a real .env from the monorepo root (gitignored — contains actual secrets).
config({ path: resolve(__dirname, '../../../.env') });

// Fall back: if required vars are still missing, apply the dev defaults from
// .env.example so that a fresh checkout + docker-compose up can run e2e tests.
const defaults: Record<string, string> = {
  DATABASE_URL: 'postgresql://conciliacao:conciliacao@localhost:55432/conciliacao?schema=public',
  JWT_ACCESS_SECRET: 'e2e-access-secret',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '30d',
  CORS_ORIGIN: 'http://localhost:3000',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
