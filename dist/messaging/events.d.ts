import type { AgentEvent } from '../types.js';
export declare class AgentEventBroker {
    private emitter;
    private history;
    private maxHistory;
    constructor();
    /** Emit an event and store in rolling buffer */
    emit(event: Omit<AgentEvent, 'id' | 'timestamp'>): AgentEvent;
    /** Subscribe to all events */
    subscribe(listener: (event: AgentEvent) => void): () => void;
    /** Subscribe to specific agent events */
    subscribeAgent(agentId: string, listener: (event: AgentEvent) => void): () => void;
    /** Get recent events */
    getRecent(limit?: number): AgentEvent[];
}
