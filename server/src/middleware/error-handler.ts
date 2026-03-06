import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Zod validation errors → 400 with field-level details
  if (err instanceof z.ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({
      message: 'Validation failed',
      errors: fieldErrors,
    });
  }

  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) {
    console.error(err);
  }
  return res.status(status).json({ message: err.message ?? 'Unexpected error' });
};
