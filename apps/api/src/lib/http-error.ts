/** Express errorMiddleware respects `statusCode` and optional `code` when present. */
export class HttpError extends Error {
  readonly statusCode: number;
  /** Machine-readable error code for clients (e.g. restriction enforcement). */
  readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
