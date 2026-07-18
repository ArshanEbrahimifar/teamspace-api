import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../shared/errors/app-error.js";

export const validateRequest = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      next(new AppError(message, 400));
      return;
    }
    res.locals.validatedData = result.data;
    next();
  };
};
