import { EventEmitter } from 'node:events';
export class AgentEventBroker {
    emitter = new EventEmitter();
    history = [];
    maxHistory = 100;
    constructor() {
        this.emitter.setMaxListeners(100);
    }
    /** Emit an event and store in rolling buffer */
    emit(event) {
        const fullEvent = {
            ...event,
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
        };
        this.history.push(fullEvent);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.emitter.emit('event', fullEvent);
        this.emitter.emit(fullEvent.type, fullEvent);
        this.emitter.emit(`agent:${fullEvent.agentId}`, fullEvent);
        return fullEvent;
    }
    /** Subscribe to all events */
    subscribe(listener) {
        this.emitter.on('event', listener);
        return () => {
            this.emitter.off('event', listener);
        };
    }
    /** Subscribe to specific agent events */
    subscribeAgent(agentId, listener) {
        const channel = `agent:${agentId}`;
        this.emitter.on(channel, listener);
        return () => {
            this.emitter.off(channel, listener);
        };
    }
    /** Get recent events */
    getRecent(limit = 50) {
        return this.history.slice(-limit);
    }
}
