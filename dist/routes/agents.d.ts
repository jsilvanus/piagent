import type { FastifyInstance } from 'fastify';
import type { AgentRegistry } from '../agents/registry.js';
import type { AgentSessionManager } from '../agents/session.js';
import type { AgentMessageBus } from '../messaging/bus.js';
export declare function registerAgentRoutes(app: FastifyInstance, registry: AgentRegistry, sessionManager: AgentSessionManager, messageBus: AgentMessageBus): void;
