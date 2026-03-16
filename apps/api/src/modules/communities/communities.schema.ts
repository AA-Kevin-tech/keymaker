import type { ValidationResult } from "../../middleware/validate.js";

export function validateCreateCommunityBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name.trim()) {
    return { valid: false, message: "name is required" };
  }
  if (typeof b.slug !== "string" || !b.slug.trim()) {
    return { valid: false, message: "slug is required" };
  }
  const slug = (b.slug as string).toLowerCase().replace(/\s+/g, "-");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, message: "slug must be alphanumeric and hyphens only" };
  }
  return { valid: true };
}
