import type { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  console.error(err);
  const body: { error: string; code?: string } = {
    error: err.message ?? "Internal server error",
  };
  if (err.code !== undefined && err.code.length > 0) {
    body.code = err.code;
  }
  res.status(status).json(body);
}
