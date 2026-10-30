import { type AgentPriority } from '../types.js';
export interface ScheduledTask<T> {
    id: string;
    agentId: string;
    priority: AgentPriority;
    weight: number;
    abortController: AbortController;
    execute: (signal: AbortSignal) => Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
    createdAt: number;
}
export declare class PriorityScheduler {
    private queue;
    private activeCount;
    private readonly maxConcurrent;
    constructor(maxConcurrent?: number);
    /** Current number of active inference jobs */
    get runningCount(): number;
    /** Current number of tasks waiting in queue */
    get pendingCount(): number;
    /** Schedule a task to run according to priority */
    enqueue<T>(agentId: string, priority: AgentPriority, execute: (signal: AbortSignal) => Promise<T>, callerSignal?: AbortSignal): Promise<T>;
    /** Cancel any active or queued task for a specific agent */
    cancelAgent(agentId: string, reason?: string): number;
    private insertByPriority;
    private tick;
}
