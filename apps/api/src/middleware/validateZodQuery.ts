import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

/** Parses `req.query`; on success assigns parsed object to `req.query` (typed loosely). */
export function validateZodQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (result.success) {
      req.query = result.data as Request["query"];
      next();
      return;
    }
    const firstError = result.error.errors[0];
    const message = firstError?.message ?? "Validation failed";
    res.status(400).json({ error: message });
  };
}
