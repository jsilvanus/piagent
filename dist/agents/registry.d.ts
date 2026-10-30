import { type AgentManifest, type CreateAgentInput, type UpdateAgentInput } from '../types.js';
import type { AgentMessageBus } from '../messaging/bus.js';
import type { AgentEventBroker } from '../messaging/events.js';
export declare class AgentRegistry {
    private readonly filePath;
    private readonly messageBus;
    private readonly eventBroker;
    private agents;
    constructor(filePath: string, messageBus: AgentMessageBus, eventBroker: AgentEventBroker);
    /** Load agents from JSON file or initialize with defaults */
    private load;
    /** Persist agents map to disk */
    private save;
    /** List all registered agent manifests */
    list(): AgentManifest[];
    /** Get an agent by ID */
    get(id: string): AgentManifest | undefined;
    /** Create a new agent */
    create(input: CreateAgentInput): AgentManifest;
    /** Update an existing agent */
    update(id: string, patch: UpdateAgentInput): AgentManifest;
    /** Delete / remove an agent */
    remove(id: string): boolean;
}
