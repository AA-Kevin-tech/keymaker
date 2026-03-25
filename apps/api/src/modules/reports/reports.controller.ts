import type { NextFunction, Request, Response } from "express";
import * as reportsService from "./reports.service.js";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const report = await reportsService.createReport(req.user.id, req.body);
    res.status(201).json({
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reasonCode: report.reasonCode,
      reasonText: report.reasonText,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reporter: { id: report.reporter.id, username: report.reporter.username },
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
