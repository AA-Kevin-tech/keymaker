import type { ValidationResult } from "../../middleware/validate.js";

export function validateCreatePostBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || !b.title.trim()) {
    return { valid: false, message: "title is required" };
  }
  if (typeof b.communityId !== "string" || !b.communityId.trim()) {
    return { valid: false, message: "communityId is required" };
  }
  if (typeof b.authorId !== "string" || !b.authorId.trim()) {
    return { valid: false, message: "authorId is required" };
  }
  if (b.body !== undefined && b.body !== null && typeof b.body !== "string") {
    return { valid: false, message: "body must be a string or null" };
  }
  return { valid: true };
}

export function validateUpdatePostBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (b.title !== undefined && (typeof b.title !== "string" || !b.title.trim())) {
    return { valid: false, message: "title must be a non-empty string" };
  }
  if (b.body !== undefined && b.body !== null && typeof b.body !== "string") {
    return { valid: false, message: "body must be a string or null" };
  }
  return { valid: true };
}
