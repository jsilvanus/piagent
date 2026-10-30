import type { FastifyInstance } from 'fastify';
import type { AgentRegistry } from '../agents/registry.js';
import type { AgentMessageBus } from '../messaging/bus.js';
export declare function registerMessageRoutes(app: FastifyInstance, registry: AgentRegistry, messageBus: AgentMessageBus): void;
