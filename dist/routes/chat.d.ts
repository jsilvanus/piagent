import type { FastifyInstance } from 'fastify';
import type { AgentRegistry } from '../agents/registry.js';
import type { AgentSessionManager } from '../agents/session.js';
import type { OllamaClient } from '../ollama/client.js';
export declare function registerChatRoutes(app: FastifyInstance, registry: AgentRegistry, sessionManager: AgentSessionManager, ollamaClient: OllamaClient): void;
