import { EventEmitter } from 'node:events';
import type { AgentEvent } from '../types.js';

export class AgentEventBroker {
  private emitter = new EventEmitter();
  private history: AgentEvent[] = [];
  private maxHistory = 100;

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  /** Emit an event and store in rolling buffer */
  emit(event: Omit<AgentEvent, 'id' | 'timestamp'>): AgentEvent {
    const fullEvent: AgentEvent = {
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
  subscribe(listener: (event: AgentEvent) => void): () => void {
    this.emitter.on('event', listener);
    return () => {
      this.emitter.off('event', listener);
    };
  }

  /** Subscribe to specific agent events */
  subscribeAgent(agentId: string, listener: (event: AgentEvent) => void): () => void {
    const channel = `agent:${agentId}`;
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  /** Get recent events */
  getRecent(limit = 50): AgentEvent[] {
    return this.history.slice(-limit);
  }
}
