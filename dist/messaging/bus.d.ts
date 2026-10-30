import type { AgentManifest, InterAgentMessage } from '../types.js';
import type { AgentEventBroker } from './events.js';
export interface MailboxItem {
    id: string;
    message: InterAgentMessage;
    timestamp: string;
    read: boolean;
}
export declare class AgentMessageBus {
    private eventBroker;
    private mailboxes;
    private topicSubscriptions;
    constructor(eventBroker: AgentEventBroker);
    /** Register or update an agent's messaging profile */
    registerAgent(manifest: AgentManifest): void;
    /** Unregister an agent */
    unregisterAgent(agentId: string): void;
    /** Send a direct message from one agent to another */
    sendMessage(senderManifest: AgentManifest | {
        id: string;
    }, recipientManifest: AgentManifest, content: string, topic?: string, data?: Record<string, unknown>): MailboxItem;
    /** Broadcast a message on a topic to all subscribed agents */
    publishTopic(fromAgentId: string, topic: string, content: string, data?: Record<string, unknown>): MailboxItem[];
    /** Retrieve inbox items for an agent */
    getInbox(agentId: string, unreadOnly?: boolean): MailboxItem[];
    /** Mark message as read */
    markRead(agentId: string, messageId: string): boolean;
}
