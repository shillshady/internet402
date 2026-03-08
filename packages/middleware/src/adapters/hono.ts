import { createInternet402Handler, type Internet402Options } from '../middleware.js';

type HonoContext = {
  req: { header: (name: string) => string | undefined };
  json: (body: unknown, status?: number) => Response;
  header: (name: string, value: string) => void;
};

type HonoNext = () => Promise<void>;

export function honoInternet402(options: Internet402Options) {
  const handler = createInternet402Handler(options);

  return async (c: HonoContext, next: HonoNext) => {
    const result = await handler((name) => c.req.header(name));

    if (result.action === 'pass') {
      await next();
      return;
    }

    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        c.header(key, value);
      }
    }

    return c.json(result.body, result.status ?? 402);
  };
}
