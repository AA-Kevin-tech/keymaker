import type { Response } from "express";
import { HttpError } from "./http-error.js";

/** If `err` is `HttpError`, sends JSON and returns true; otherwise false. */
export function respondIfHttpError(res: Response, err: unknown): boolean {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return true;
  }
  return false;
}
