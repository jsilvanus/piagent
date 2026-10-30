import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AgentEventBroker } from '../messaging/events.js';

export function registerEventRoutes(
  app: FastifyInstance,
  eventBroker: AgentEventBroker
): void {
  app.get('/api/v1/events', (req: FastifyRequest, reply: FastifyReply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();

    // Send initial status ping
    reply.raw.write(`event: ping\ndata: {"time":"${new Date().toISOString()}"}\n\n`);

    // Stream recent events
    const recent = eventBroker.getRecent(10);
    for (const ev of recent) {
      reply.raw.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
    }

    // Subscribe to ongoing events
    const unsubscribe = eventBroker.subscribe(event => {
      reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });

    req.raw.on('close', () => {
      unsubscribe();
    });
  });
}
