import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { type Config, loadConfig } from './config.js';
import { OllamaClient } from './ollama/client.js';
import { PriorityScheduler } from './ollama/scheduler.js';
import { McpBridge } from './mcp/bridge.js';
import { AgentEventBroker } from './messaging/events.js';
import { AgentMessageBus } from './messaging/bus.js';
import { AgentRegistry } from './agents/registry.js';
import { AgentSessionManager } from './agents/session.js';
import { registerAgentRoutes } from './routes/agents.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerMessageRoutes } from './routes/messages.js';
import { registerOllamaRoutes } from './routes/ollama.js';
import { registerEventRoutes } from './routes/events.js';

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

export async function createApp(configOverride?: Partial<Config>): Promise<AppContext> {
  const config = { ...loadConfig(), ...configOverride };

  const app = fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: '*',
  });

  // 1. Initialize core services
  const ollamaClient = new OllamaClient(config.ollamaBaseUrl);
  const scheduler = new PriorityScheduler(1);
  const mcpBridge = new McpBridge(config.mcpServerUrl);
  const eventBroker = new AgentEventBroker();
  const messageBus = new AgentMessageBus(eventBroker);
  const registry = new AgentRegistry(config.agentsFilePath, messageBus, eventBroker);
  const sessionManager = new AgentSessionManager(ollamaClient, scheduler, mcpBridge, eventBroker);

  // 2. Register HTTP & SSE routes
  registerAgentRoutes(app, registry, sessionManager, messageBus);
  registerChatRoutes(app, registry, sessionManager, ollamaClient);
  registerMessageRoutes(app, registry, messageBus);
  registerOllamaRoutes(app, ollamaClient, scheduler);
  registerEventRoutes(app, eventBroker);

  return {
    app,
    config,
    ollamaClient,
    scheduler,
    mcpBridge,
    eventBroker,
    messageBus,
    registry,
    sessionManager,
  };
}
