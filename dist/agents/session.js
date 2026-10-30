export class AgentSessionManager {
    ollamaClient;
    scheduler;
    mcpBridge;
    eventBroker;
    activeTurns = new Map();
    states = new Map();
    constructor(ollamaClient, scheduler, mcpBridge, eventBroker) {
        this.ollamaClient = ollamaClient;
        this.scheduler = scheduler;
        this.mcpBridge = mcpBridge;
        this.eventBroker = eventBroker;
    }
    /** Get current runtime state for an agent */
    getState(manifest) {
        const existing = this.states.get(manifest.id);
        if (existing) {
            existing.manifest = manifest;
            return existing;
        }
        const fresh = {
            manifest,
            status: 'idle',
        };
        this.states.set(manifest.id, fresh);
        return fresh;
    }
    /** Stop / interrupt an agent's active execution */
    stop(agentId, reason = 'Preempted by operator/system') {
        const active = this.activeTurns.get(agentId);
        let stopped = false;
        if (active) {
            active.abortController.abort(reason);
            this.activeTurns.delete(agentId);
            stopped = true;
        }
        // Cancel in scheduler queue if waiting
        const cancelledQueued = this.scheduler.cancelAgent(agentId, reason);
        if (cancelledQueued > 0)
            stopped = true;
        let state = this.states.get(agentId);
        if (!state) {
            state = {
                manifest: { id: agentId },
                status: 'interrupted',
            };
            this.states.set(agentId, state);
        }
        else {
            state.status = 'interrupted';
            state.currentTurnId = undefined;
        }
        this.eventBroker.emit({
            type: 'agent.interrupted',
            agentId,
            data: { reason, wasRunning: stopped },
        });
        return stopped;
    }
    /** Execute a turn with the agent */
    async runTurn(manifest, input, externalSignal) {
        const agentId = manifest.id;
        const turnId = `turn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const abortController = new AbortController();
        // Link external abort signal if provided
        if (externalSignal) {
            if (externalSignal.aborted) {
                throw new Error('Run aborted by caller');
            }
            externalSignal.addEventListener('abort', () => abortController.abort(externalSignal.reason));
        }
        // Stop previous turn if still running for this agent
        if (this.activeTurns.has(agentId)) {
            this.stop(agentId, 'New turn preempted previous execution');
        }
        this.activeTurns.set(agentId, { turnId, abortController });
        const state = this.getState(manifest);
        state.status = 'running';
        state.currentTurnId = turnId;
        state.lastExecutionAt = new Date().toISOString();
        this.eventBroker.emit({
            type: 'agent.started',
            agentId,
            data: { turnId, input: input.message },
        });
        const messages = [];
        // 1. System prompt
        if (manifest.systemPrompt) {
            messages.push({
                role: 'system',
                content: manifest.systemPrompt,
            });
        }
        // 2. Prior context if provided, or single message
        if (input.messages && input.messages.length > 0) {
            messages.push(...input.messages);
        }
        else if (input.message) {
            messages.push({
                role: 'user',
                content: input.message,
            });
        }
        const toolCallsExecuted = [];
        try {
            const responseText = await this.scheduler.enqueue(agentId, manifest.priority, async (signal) => {
                if (signal.aborted)
                    throw new Error('Turn aborted in queue');
                // Query Ollama
                const ollamaRes = await this.ollamaClient.chat({
                    model: manifest.model,
                    messages,
                    format: input.format === 'json' ? 'json' : undefined,
                    temperature: manifest.temperature,
                    signal,
                });
                let text = ollamaRes.message?.content || '';
                // Emit thought/response chunk
                this.eventBroker.emit({
                    type: 'agent.thought',
                    agentId,
                    data: { turnId, content: text },
                });
                // Check if Ollama emitted structured tool calls
                const rawToolCalls = ollamaRes.message?.tool_calls;
                if (rawToolCalls && rawToolCalls.length > 0) {
                    for (const tc of rawToolCalls) {
                        const toolName = tc.function.name;
                        const toolArgs = tc.function.arguments;
                        this.eventBroker.emit({
                            type: 'agent.tool_call',
                            agentId,
                            data: { turnId, tool: toolName, args: toolArgs },
                        });
                        try {
                            const res = await this.mcpBridge.callTool(toolName, toolArgs, input.token);
                            toolCallsExecuted.push({ tool: toolName, args: toolArgs, result: res });
                            this.eventBroker.emit({
                                type: 'agent.tool_result',
                                agentId,
                                data: { turnId, tool: toolName, result: res },
                            });
                        }
                        catch (toolErr) {
                            const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
                            toolCallsExecuted.push({ tool: toolName, args: toolArgs, result: { error: errMsg } });
                        }
                    }
                }
                return text;
            }, abortController.signal);
            state.status = 'idle';
            state.currentTurnId = undefined;
            this.eventBroker.emit({
                type: 'agent.finished',
                agentId,
                data: { turnId, response: responseText, toolCallsExecuted },
            });
            return {
                turnId,
                agentId,
                response: responseText,
                toolCallsExecuted,
                done: true,
            };
        }
        catch (err) {
            if (abortController.signal.aborted) {
                state.status = 'interrupted';
                state.currentTurnId = undefined;
                throw new Error(`Turn interrupted: ${abortController.signal.reason || 'aborted'}`);
            }
            state.status = 'error';
            state.error = err instanceof Error ? err.message : String(err);
            state.currentTurnId = undefined;
            this.eventBroker.emit({
                type: 'agent.error',
                agentId,
                data: { turnId, error: state.error },
            });
            throw err;
        }
        finally {
            this.activeTurns.delete(agentId);
        }
    }
}
