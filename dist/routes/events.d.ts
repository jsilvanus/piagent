import type { FastifyInstance } from 'fastify';
import type { AgentEventBroker } from '../messaging/events.js';
export declare function registerEventRoutes(app: FastifyInstance, eventBroker: AgentEventBroker): void;
