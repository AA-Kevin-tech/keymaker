import type { ValidationResult } from "../../middleware/validate.js";

export function validateCreateCommentBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.body !== "string" || !b.body.trim()) {
    return { valid: false, message: "body is required" };
  }
  if (typeof b.postId !== "string" || !b.postId.trim()) {
    return { valid: false, message: "postId is required" };
  }
  if (typeof b.authorId !== "string" || !b.authorId.trim()) {
    return { valid: false, message: "authorId is required" };
  }
  if (b.parentId !== undefined && b.parentId !== null && typeof b.parentId !== "string") {
    return { valid: false, message: "parentId must be a string or null" };
  }
  return { valid: true };
}
