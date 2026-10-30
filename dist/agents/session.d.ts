import { type AgentManifest, type AgentRuntimeState, type AgentChatInput } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import type { PriorityScheduler } from '../ollama/scheduler.js';
import type { McpBridge } from '../mcp/bridge.js';
import type { AgentEventBroker } from '../messaging/events.js';
export interface RunTurnResult {
    turnId: string;
    agentId: string;
    response: string;
    toolCallsExecuted: Array<{
        tool: string;
        args: unknown;
        result: unknown;
    }>;
    done: boolean;
}
export declare class AgentSessionManager {
    private ollamaClient;
    private scheduler;
    private mcpBridge;
    private eventBroker;
    private activeTurns;
    private states;
    constructor(ollamaClient: OllamaClient, scheduler: PriorityScheduler, mcpBridge: McpBridge, eventBroker: AgentEventBroker);
    /** Get current runtime state for an agent */
    getState(manifest: AgentManifest): AgentRuntimeState;
    /** Stop / interrupt an agent's active execution */
    stop(agentId: string, reason?: string): boolean;
    /** Execute a turn with the agent */
    runTurn(manifest: AgentManifest, input: AgentChatInput, externalSignal?: AbortSignal): Promise<RunTurnResult>;
}
