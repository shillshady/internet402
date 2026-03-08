import type { Request, Response, NextFunction } from 'express';
import { createInternet402Handler, type Internet402Options } from '../middleware.js';

export function expressInternet402(options: Internet402Options) {
  const handler = createInternet402Handler(options);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await handler((name) => req.headers[name] as string | undefined);

      if (result.action === 'pass') {
        next();
        return;
      }

      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
      }

      res.status(result.status ?? 402).json(result.body);
    } catch (err) {
      next(err);
    }
  };
}
