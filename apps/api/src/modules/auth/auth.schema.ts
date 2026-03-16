import type { ValidationResult } from "../../middleware/validate.js";

export function validateRegisterBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.username !== "string" || !b.username.trim()) {
    return { valid: false, message: "username is required" };
  }
  if (b.username.length < 2 || b.username.length > 32) {
    return { valid: false, message: "username must be 2–32 characters" };
  }
  if (typeof b.password !== "string" || b.password.length < 8) {
    return { valid: false, message: "password must be at least 8 characters" };
  }
  return { valid: true };
}

export function validateLoginBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.username !== "string" || !b.username.trim()) {
    return { valid: false, message: "username is required" };
  }
  if (typeof b.password !== "string" || !b.password) {
    return { valid: false, message: "password is required" };
  }
  return { valid: true };
}
