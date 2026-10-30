export class AgentMessageBus {
    eventBroker;
    mailboxes = new Map();
    topicSubscriptions = new Map();
    constructor(eventBroker) {
        this.eventBroker = eventBroker;
    }
    /** Register or update an agent's messaging profile */
    registerAgent(manifest) {
        if (!this.mailboxes.has(manifest.id)) {
            this.mailboxes.set(manifest.id, []);
        }
        // Clear old subscriptions for this agent
        for (const [topic, subs] of this.topicSubscriptions.entries()) {
            subs.delete(manifest.id);
        }
        // Register new subscriptions
        if (manifest.messaging?.subscriptions) {
            for (const topic of manifest.messaging.subscriptions) {
                if (!this.topicSubscriptions.has(topic)) {
                    this.topicSubscriptions.set(topic, new Set());
                }
                this.topicSubscriptions.get(topic).add(manifest.id);
            }
        }
    }
    /** Unregister an agent */
    unregisterAgent(agentId) {
        this.mailboxes.delete(agentId);
        for (const subs of this.topicSubscriptions.values()) {
            subs.delete(agentId);
        }
    }
    /** Send a direct message from one agent to another */
    sendMessage(senderManifest, recipientManifest, content, topic, data) {
        // 1. Verify recipient can receive direct messages
        if (recipientManifest.messaging?.canReceiveDirect === false) {
            throw new Error(`Agent '${recipientManifest.id}' does not accept direct messages.`);
        }
        // 2. Verify access control (allowedSenders)
        const allowed = recipientManifest.messaging?.allowedSenders;
        if (allowed && allowed.length > 0 && !allowed.includes('*') && !allowed.includes(senderManifest.id)) {
            throw new Error(`Agent '${senderManifest.id}' is not authorized to message '${recipientManifest.id}' (allowed: ${allowed.join(', ')})`);
        }
        const item = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            message: {
                from: senderManifest.id,
                to: recipientManifest.id,
                content,
                topic,
                data,
                requireResponse: false,
            },
            timestamp: new Date().toISOString(),
            read: false,
        };
        const inbox = this.mailboxes.get(recipientManifest.id) || [];
        inbox.push(item);
        this.mailboxes.set(recipientManifest.id, inbox);
        this.eventBroker.emit({
            type: 'agent.message',
            agentId: recipientManifest.id,
            data: item,
        });
        return item;
    }
    /** Broadcast a message on a topic to all subscribed agents */
    publishTopic(fromAgentId, topic, content, data) {
        const subscribers = this.topicSubscriptions.get(topic);
        if (!subscribers || subscribers.size === 0)
            return [];
        const delivered = [];
        for (const subAgentId of subscribers) {
            if (subAgentId === fromAgentId)
                continue; // Don't echo to self
            const item = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                message: {
                    from: fromAgentId,
                    to: subAgentId,
                    content,
                    topic,
                    data,
                    requireResponse: false,
                },
                timestamp: new Date().toISOString(),
                read: false,
            };
            const inbox = this.mailboxes.get(subAgentId) || [];
            inbox.push(item);
            this.mailboxes.set(subAgentId, inbox);
            delivered.push(item);
        }
        return delivered;
    }
    /** Retrieve inbox items for an agent */
    getInbox(agentId, unreadOnly = false) {
        const items = this.mailboxes.get(agentId) || [];
        if (unreadOnly) {
            return items.filter(i => !i.read);
        }
        return [...items];
    }
    /** Mark message as read */
    markRead(agentId, messageId) {
        const inbox = this.mailboxes.get(agentId);
        if (!inbox)
            return false;
        const msg = inbox.find(m => m.id === messageId);
        if (msg) {
            msg.read = true;
            return true;
        }
        return false;
    }
}
