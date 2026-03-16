import type { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  console.error(err);
  res.status(status).json({
    error: err.message ?? "Internal server error",
  });
}
