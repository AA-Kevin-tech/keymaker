import type { NextFunction, Request, Response } from "express";
import * as reportsService from "../reports/reports.service.js";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const result = await reportsService.listReportsAdmin(req.user.id, req.query as never);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const detail = await reportsService.getReportDetailAdmin(req.user.id, req.params.id);
    res.json(detail);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function dismiss(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const detail = await reportsService.dismissReport(req.user.id, req.params.id, req.body);
    res.json(detail);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function action(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const detail = await reportsService.actionReport(req.user.id, req.params.id, req.body);
    res.json(detail);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
