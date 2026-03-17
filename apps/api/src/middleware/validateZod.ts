import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

/**
 * Validates req.body against a Zod schema. On success, sets req.body to the parsed value.
 * On failure, sends 400 with the first error message.
 */
export function validateZod<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
      return;
    }
    const firstError = result.error.errors[0];
    const message = firstError?.message ?? "Validation failed";
    res.status(400).json({ error: message });
  };
}
