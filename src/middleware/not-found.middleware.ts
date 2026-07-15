import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../shared/errors/app-error.js";

export const notFoundMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
