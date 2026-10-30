import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AgentChatInputSchema } from '../types.js';
import type { AgentRegistry } from '../agents/registry.js';
import type { AgentSessionManager } from '../agents/session.js';
import type { OllamaClient } from '../ollama/client.js';

export function registerChatRoutes(
  app: FastifyInstance,
  registry: AgentRegistry,
  sessionManager: AgentSessionManager,
  ollamaClient: OllamaClient
): void {
  app.post(
    '/api/v1/agents/:id/chat',
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const manifest = registry.get(req.params.id);
      if (!manifest) {
        return reply.code(404).send({ error: `Agent '${req.params.id}' not found` });
      }

      const parsed = AgentChatInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid chat parameters',
          details: parsed.error.format(),
        });
      }

      const input = parsed.data;

      // Handle Streaming Mode (SSE)
      if (input.stream) {
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.flushHeaders?.();

        const abortController = new AbortController();
        req.raw.on('close', () => {
          abortController.abort('Client closed connection');
        });

        try {
          const messages: import('../types.js').ChatMessage[] = [
            { role: 'system', content: manifest.systemPrompt }
          ];
          if (input.messages) {
            messages.push(...input.messages);
          } else if (input.message) {
            messages.push({ role: 'user' as const, content: input.message });
          }

          const stream = ollamaClient.chatStream({
            model: manifest.model,
            messages,
            format: input.format === 'json' ? 'json' : undefined,
            temperature: manifest.temperature,
            signal: abortController.signal,
          });

          for await (const chunk of stream) {
            const data = JSON.stringify({
              chunk: chunk.contentChunk,
              done: chunk.done,
            });
            reply.raw.write(`data: ${data}\n\n`);
          }

          reply.raw.write('event: done\ndata: {"status":"completed"}\n\n');
          reply.raw.end();
          return;
        } catch (err) {
          const errMsg = JSON.stringify({
            error: err instanceof Error ? err.message : String(err),
          });
          reply.raw.write(`event: error\ndata: ${errMsg}\n\n`);
          reply.raw.end();
          return;
        }
      }

      // Non-Streaming Mode (Execute Turn)
      try {
        const result = await sessionManager.runTurn(manifest, input);
        return reply.send(result);
      } catch (err) {
        return reply.code(500).send({
          error: 'Turn execution failed',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );
}
