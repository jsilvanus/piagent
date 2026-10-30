import { z } from 'zod';
const SendMessageBodySchema = z.object({
    from: z.string().min(1),
    content: z.string().min(1),
    topic: z.string().optional(),
    data: z.record(z.unknown()).optional(),
});
const BroadcastTopicBodySchema = z.object({
    from: z.string().min(1),
    topic: z.string().min(1),
    content: z.string().min(1),
    data: z.record(z.unknown()).optional(),
});
export function registerMessageRoutes(app, registry, messageBus) {
    // 1. Send direct message to agent
    app.post('/api/v1/agents/:id/messages', async (req, reply) => {
        const recipient = registry.get(req.params.id);
        if (!recipient) {
            return reply.code(404).send({ error: `Recipient agent '${req.params.id}' not found` });
        }
        const parsed = SendMessageBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: 'Invalid message payload',
                details: parsed.error.format(),
            });
        }
        const senderId = parsed.data.from;
        const sender = registry.get(senderId) || { id: senderId };
        try {
            const item = messageBus.sendMessage(sender, recipient, parsed.data.content, parsed.data.topic, parsed.data.data);
            return reply.code(201).send(item);
        }
        catch (err) {
            return reply.code(403).send({ error: err.message });
        }
    });
    // 2. Read agent's inbox
    app.get('/api/v1/agents/:id/messages', async (req, reply) => {
        const manifest = registry.get(req.params.id);
        if (!manifest) {
            return reply.code(404).send({ error: `Agent '${req.params.id}' not found` });
        }
        const unreadOnly = req.query.unread === 'true';
        const messages = messageBus.getInbox(req.params.id, unreadOnly);
        return { agentId: req.params.id, count: messages.length, messages };
    });
    // 3. Mark message as read
    app.post('/api/v1/agents/:id/messages/:msgId/read', async (req, reply) => {
        const ok = messageBus.markRead(req.params.id, req.params.msgId);
        if (!ok) {
            return reply.code(404).send({ error: 'Message not found in agent inbox' });
        }
        return { status: 'ok', read: true };
    });
    // 4. Broadcast topic message
    app.post('/api/v1/messages/broadcast', async (req, reply) => {
        const parsed = BroadcastTopicBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: 'Invalid broadcast payload',
                details: parsed.error.format(),
            });
        }
        const { from, topic, content, data } = parsed.data;
        const delivered = messageBus.publishTopic(from, topic, content, data);
        return {
            status: 'ok',
            topic,
            recipientsCount: delivered.length,
            delivered,
        };
    });
}
