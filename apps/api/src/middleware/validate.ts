import type { Request, Response, NextFunction } from "express";
import { SCORE_MIN, SCORE_MAX } from "@keymaker/shared";

export type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateRatingBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "Body must be an object" };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.targetType !== "string" || !["post", "comment"].includes(b.targetType)) {
    return { valid: false, message: "targetType must be 'post' or 'comment'" };
  }
  if (typeof b.targetId !== "string" || !b.targetId.trim()) {
    return { valid: false, message: "targetId is required" };
  }
  const score = (key: string): ValidationResult => {
    const v = b[key];
    if (typeof v !== "number" || !Number.isInteger(v) || v < SCORE_MIN || v > SCORE_MAX) {
      return { valid: false, message: `${key} must be an integer from ${SCORE_MIN} to ${SCORE_MAX}` };
    }
    return { valid: true };
  };
  for (const key of ["clarity", "evidence", "kindness", "novelty"]) {
    const r = score(key);
    if (!r.valid) return r;
  }
  return { valid: true };
}

export function validateBody<T>(
  body: unknown,
  validator: (b: unknown) => ValidationResult
): { valid: true; data: T } | { valid: false; message: string } {
  const result = validator(body);
  if (!result.valid) return { valid: false, message: result.message };
  return { valid: true, data: body as T };
}

export function requireBody(validator: (body: unknown) => ValidationResult) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req.body);
    if (!result.valid) {
      res.status(400).json({ error: result.message });
      return;
    }
    next();
  };
}
