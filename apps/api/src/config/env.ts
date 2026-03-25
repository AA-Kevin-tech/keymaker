/**
 * Load and validate env. Fail fast if required vars missing.
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

/**
 * Public URL of the web app (used in verification email links). Defaults for local dev.
 */
const appPublicUrl = process.env.APP_PUBLIC_URL ?? "http://localhost:3000";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3001", 10),
  DATABASE_URL: getEnv("DATABASE_URL"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  /** Base URL of the Next.js app (no trailing slash). */
  APP_PUBLIC_URL: appPublicUrl.replace(/\/$/, ""),
  /** Resend API key; if empty, verification emails are logged to the console in development. */
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  /** From address for transactional email (must be allowed in Resend for your domain). */
  EMAIL_FROM: process.env.EMAIL_FROM ?? "Keymaker <onboarding@resend.dev>",
} as const;
