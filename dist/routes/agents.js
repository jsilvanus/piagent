import { CreateAgentInputSchema, UpdateAgentInputSchema } from '../types.js';
export function registerAgentRoutes(app, registry, sessionManager, messageBus) {
    // 1. List all agents
    app.get('/api/v1/agents', async () => {
        const list = registry.list();
        return list.map(manifest => {
            const state = sessionManager.getState(manifest);
            const unreadCount = messageBus.getInbox(manifest.id, true).length;
            return {
                ...manifest,
                status: state.status,
                currentTurnId: state.currentTurnId,
                lastExecutionAt: state.lastExecutionAt,
                unreadMessages: unreadCount,
            };
        });
    });
    // 2. Create a new agent
    app.post('/api/v1/agents', async (req, reply) => {
        const parsed = CreateAgentInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: 'Invalid agent definition',
                details: parsed.error.format(),
            });
        }
        try {
            const created = registry.create(parsed.data);
            return reply.code(201).send(created);
        }
        catch (err) {
            return reply.code(409).send({ error: err.message });
        }
    });
    // 3. Get single agent by ID
    app.get('/api/v1/agents/:id', async (req, reply) => {
        const manifest = registry.get(req.params.id);
        if (!manifest) {
            return reply.code(404).send({ error: `Agent '${req.params.id}' not found` });
        }
        const state = sessionManager.getState(manifest);
        const unreadMessages = messageBus.getInbox(manifest.id, true);
        return {
            manifest,
            runtime: {
                status: state.status,
                currentTurnId: state.currentTurnId,
                lastExecutionAt: state.lastExecutionAt,
                error: state.error,
                unreadCount: unreadMessages.length,
            },
        };
    });
    // 4. Update existing agent
    app.patch('/api/v1/agents/:id', async (req, reply) => {
        const parsed = UpdateAgentInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: 'Invalid agent patch',
                details: parsed.error.format(),
            });
        }
        try {
            const updated = registry.update(req.params.id, parsed.data);
            return updated;
        }
        catch (err) {
            return reply.code(404).send({ error: err.message });
        }
    });
    // 5. Delete / Remove agent
    app.delete('/api/v1/agents/:id', async (req, reply) => {
        const agentId = req.params.id;
        // Stop any active turn first
        sessionManager.stop(agentId, 'Agent removed from system');
        const removed = registry.remove(agentId);
        if (!removed) {
            return reply.code(404).send({ error: `Agent '${agentId}' not found` });
        }
        return { status: 'ok', removed: agentId };
    });
    // 6. Stop / Interrupt active agent turn
    app.post('/api/v1/agents/:id/stop', async (req, reply) => {
        const agentId = req.params.id;
        const manifest = registry.get(agentId);
        if (!manifest) {
            return reply.code(404).send({ error: `Agent '${agentId}' not found` });
        }
        const reason = req.body?.reason || 'Operator manual stop request';
        const stopped = sessionManager.stop(agentId, reason);
        return {
            status: 'ok',
            agentId,
            stopped,
            reason,
        };
    });
    // 7. Global interrupt / Emergency Preemption
    app.post('/api/v1/agent/interrupt', async (req) => {
        const reason = req.body?.reason || 'System emergency preemption';
        if (req.body?.targetAgentId) {
            const stopped = sessionManager.stop(req.body.targetAgentId, reason);
            return { status: 'ok', target: req.body.targetAgentId, stopped, reason };
        }
        // Stop all active agents
        const list = registry.list();
        let totalStopped = 0;
        for (const a of list) {
            if (sessionManager.stop(a.id, reason)) {
                totalStopped++;
            }
        }
        return { status: 'ok', stoppedAll: true, count: totalStopped, reason };
    });
}
