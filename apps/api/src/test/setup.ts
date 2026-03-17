/**
 * Test setup: ensure required env vars exist so app and services can load.
 * CI sets DATABASE_URL and JWT_SECRET; locally use .env or export them.
 */
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/keymaker_test";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-min-32-characters-long";
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}
