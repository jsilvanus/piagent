import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentRegistry } from '../src/agents/registry.js';
import { AgentEventBroker } from '../src/messaging/events.js';
import { AgentMessageBus } from '../src/messaging/bus.js';
import { AgentSessionManager } from '../src/agents/session.js';
import { OllamaClient } from '../src/ollama/client.js';
import { PriorityScheduler } from '../src/ollama/scheduler.js';
import { McpBridge } from '../src/mcp/bridge.js';

test('Agent Lifecycle - creates, retrieves, updates, and removes an agent', () => {
  const testDb = join(tmpdir(), `test_agents_${Date.now()}.json`);
  if (existsSync(testDb)) rmSync(testDb);

  const eventBroker = new AgentEventBroker();
  const messageBus = new AgentMessageBus(eventBroker);
  const registry = new AgentRegistry(testDb, messageBus, eventBroker);

  // 1. Initial count should be seed defaults
  const initial = registry.list();
  assert.ok(initial.length >= 3);

  // 2. Create new agent
  const created = registry.create({
    id: 'test-sound-agent',
    name: 'Test Sound Assistant',
    description: 'Automates church audio gain and muting',
    model: 'llama3.2:latest',
    systemPrompt: 'You manage BSS sound levels.',
    priority: 'realtime',
    tools: ['sound_mute', 'sound_gain'],
    messaging: {
      canReceiveDirect: true,
      allowedSenders: ['copilot'],
      subscriptions: ['audio.peak'],
    },
  });

  assert.equal(created.id, 'test-sound-agent');
  assert.equal(created.priority, 'realtime');

  // 3. Fetch from registry
  const fetched = registry.get('test-sound-agent');
  assert.ok(fetched);
  assert.equal(fetched.name, 'Test Sound Assistant');

  // 4. Duplicate ID should throw
  assert.throws(() => {
    registry.create({
      id: 'test-sound-agent',
      name: 'Duplicate Agent',
      priority: 'interactive',
      model: 'llama3.2:latest',
      systemPrompt: '',
      tools: [],
      messaging: { canReceiveDirect: true, subscriptions: [] },
    });
  }, /already exists/);

  // 5. Update agent
  const updated = registry.update('test-sound-agent', {
    name: 'Updated Sound Pro',
  });
  assert.equal(updated.name, 'Updated Sound Pro');

  // 6. Delete / remove agent
  const removed = registry.remove('test-sound-agent');
  assert.equal(removed, true);
  assert.equal(registry.get('test-sound-agent'), undefined);

  if (existsSync(testDb)) rmSync(testDb);
});

test('Agent Lifecycle - stops and interrupts an active agent turn', async () => {
  const testDb = join(tmpdir(), `test_agents_stop_${Date.now()}.json`);
  const eventBroker = new AgentEventBroker();
  const messageBus = new AgentMessageBus(eventBroker);
  const registry = new AgentRegistry(testDb, messageBus, eventBroker);

  const ollamaClient = new OllamaClient('http://localhost:11434');
  const scheduler = new PriorityScheduler(1);
  const mcpBridge = new McpBridge('http://localhost:3200/mcp');
  const sessionManager = new AgentSessionManager(ollamaClient, scheduler, mcpBridge, eventBroker);

  const agent = registry.get('copilot')!;
  assert.ok(agent);

  let interruptedEventFired = false;
  eventBroker.subscribe(ev => {
    if (ev.type === 'agent.interrupted' && ev.agentId === 'copilot') {
      interruptedEventFired = true;
    }
  });

  // Call stop on idle agent
  const stoppedIdle = sessionManager.stop('copilot', 'Manual operator override');
  assert.equal(stoppedIdle, false); // Wasn't running, but event fires
  assert.equal(interruptedEventFired, true);

  const state = sessionManager.getState(agent);
  assert.equal(state.status, 'interrupted');

  if (existsSync(testDb)) rmSync(testDb);
});
