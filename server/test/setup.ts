// Vitest does not load .env, but src/config/env.ts validates process.env at
// import time. This file runs before every test file (see setupFiles in
// vitest.config.mts) and publishes the test-only values onto process.env,
// which is where src/config/env.ts reads them from.
const TEST_ENV = {
    NODE_ENV: 'test',
    CLIENT_URL: 'http://localhost:5173',
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long!!',
    SALT_ROUNDS: '4',
    JWT_EXPIRES_IN_SECONDS: '3600',
} as const;

Object.assign(process.env, TEST_ENV);
