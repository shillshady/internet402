import { createInternet402Handler, type Internet402Options } from '../middleware.js';

type FastifyRequest = {
  headers: Record<string, string | string[] | undefined>;
};

type FastifyReply = {
  code(statusCode: number): FastifyReply;
  headers(values: Record<string, string>): FastifyReply;
  send(payload: unknown): FastifyReply;
};

export function fastifyInternet402(options: Internet402Options) {
  const handler = createInternet402Handler(options);

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = await handler((name) => {
      const value = request.headers[name];
      return Array.isArray(value) ? value[0] : value;
    });

    if (result.action === 'pass') {
      return;
    }

    if (result.headers) {
      reply.headers(result.headers);
    }

    reply.code(result.status ?? 402).send(result.body);
  };
}
