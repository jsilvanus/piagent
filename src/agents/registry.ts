import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  AgentManifestSchema,
  type AgentManifest,
  type CreateAgentInput,
  type UpdateAgentInput,
} from '../types.js';
import { DEFAULT_AGENTS } from './default-agents.js';
import type { AgentMessageBus } from '../messaging/bus.js';
import type { AgentEventBroker } from '../messaging/events.js';

export class AgentRegistry {
  private agents: Map<string, AgentManifest> = new Map();

  constructor(
    private readonly filePath: string,
    private readonly messageBus: AgentMessageBus,
    private readonly eventBroker: AgentEventBroker
  ) {
    this.load();
  }

  /** Load agents from JSON file or initialize with defaults */
  private load(): void {
    if (existsSync(this.filePath)) {
      try {
        const raw = readFileSync(this.filePath, 'utf-8');
        const list = JSON.parse(raw) as unknown[];
        for (const item of list) {
          const parsed = AgentManifestSchema.safeParse(item);
          if (parsed.success) {
            this.agents.set(parsed.data.id, parsed.data);
            this.messageBus.registerAgent(parsed.data);
          }
        }
        return;
      } catch (err) {
        console.error(`Failed to load agents from ${this.filePath}:`, err);
      }
    }

    // Seed defaults if file doesn't exist
    for (const def of DEFAULT_AGENTS) {
      this.agents.set(def.id, def);
      this.messageBus.registerAgent(def);
    }
    this.save();
  }

  /** Persist agents map to disk */
  private save(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.agents.values());
      writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to save agents to ${this.filePath}:`, err);
    }
  }

  /** List all registered agent manifests */
  list(): AgentManifest[] {
    return Array.from(this.agents.values());
  }

  /** Get an agent by ID */
  get(id: string): AgentManifest | undefined {
    return this.agents.get(id);
  }

  /** Create a new agent */
  create(input: CreateAgentInput): AgentManifest {
    if (this.agents.has(input.id)) {
      throw new Error(`Agent with ID '${input.id}' already exists.`);
    }

    const now = new Date().toISOString();
    const manifest: AgentManifest = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    // Validate schema
    const validated = AgentManifestSchema.parse(manifest);

    this.agents.set(validated.id, validated);
    this.messageBus.registerAgent(validated);
    this.save();

    this.eventBroker.emit({
      type: 'agent.created',
      agentId: validated.id,
      data: validated,
    });

    return validated;
  }

  /** Update an existing agent */
  update(id: string, patch: UpdateAgentInput): AgentManifest {
    const existing = this.agents.get(id);
    if (!existing) {
      throw new Error(`Agent with ID '${id}' not found.`);
    }

    const updated: AgentManifest = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    const validated = AgentManifestSchema.parse(updated);
    this.agents.set(id, validated);
    this.messageBus.registerAgent(validated);
    this.save();

    this.eventBroker.emit({
      type: 'agent.updated',
      agentId: id,
      data: validated,
    });

    return validated;
  }

  /** Delete / remove an agent */
  remove(id: string): boolean {
    const existing = this.agents.get(id);
    if (!existing) return false;

    this.agents.delete(id);
    this.messageBus.unregisterAgent(id);
    this.save();

    this.eventBroker.emit({
      type: 'agent.removed',
      agentId: id,
      data: { id },
    });

    return true;
  }
}
