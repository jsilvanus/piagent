import { type FastifyInstance } from 'fastify';
import { type Config } from './config.js';
import { OllamaClient } from './ollama/client.js';
import { PriorityScheduler } from './ollama/scheduler.js';
import { McpBridge } from './mcp/bridge.js';
import { AgentEventBroker } from './messaging/events.js';
import { AgentMessageBus } from './messaging/bus.js';
import { AgentRegistry } from './agents/registry.js';
import { AgentSessionManager } from './agents/session.js';
export interface AppContext {
    app: FastifyInstance;
    config: Config;
    ollamaClient: OllamaClient;
    scheduler: PriorityScheduler;
    mcpBridge: McpBridge;
    eventBroker: AgentEventBroker;
    messageBus: AgentMessageBus;
    registry: AgentRegistry;
    sessionManager: AgentSessionManager;
}
export declare function createApp(configOverride?: Partial<Config>): Promise<AppContext>;
