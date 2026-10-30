import type { FastifyInstance } from 'fastify';
import type { OllamaClient } from '../ollama/client.js';
import type { PriorityScheduler } from '../ollama/scheduler.js';

export function registerOllamaRoutes(
  app: FastifyInstance,
  ollamaClient: OllamaClient,
  scheduler: PriorityScheduler
): void {
  // Check Ollama health & status
  app.get('/api/v1/health', async () => {
    const isHealthy = await ollamaClient.isHealthy();
    return {
      service: 'piagent',
      status: 'ok',
      ollama: isHealthy ? 'connected' : 'offline',
      scheduler: {
        running: scheduler.runningCount,
        pending: scheduler.pendingCount,
      },
    };
  });

  // List installed and active models
  app.get('/api/v1/models', async (_req, reply) => {
    try {
      const [installed, running] = await Promise.all([
        ollamaClient.listModels().catch(() => []),
        ollamaClient.listRunningModels().catch(() => []),
      ]);
      return {
        installed,
        running,
      };
    } catch (err) {
      return reply.code(502).send({
        error: 'Failed to query Ollama models',
        message: (err as Error).message,
      });
    }
  });
}
