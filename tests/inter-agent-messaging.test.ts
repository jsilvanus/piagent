import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AgentMessageBus } from '../src/messaging/bus.js';
import { AgentEventBroker } from '../src/messaging/events.js';
import type { AgentManifest } from '../src/types.js';

test('AgentMessageBus - delivers direct messages and enforces allowedSenders', () => {
  const eventBroker = new AgentEventBroker();
  const bus = new AgentMessageBus(eventBroker);

  const copilot: AgentManifest = {
    id: 'copilot',
    name: 'Copilot',
    model: 'llama3.2:latest',
    systemPrompt: '',
    priority: 'interactive',
    tools: [],
    messaging: {
      canReceiveDirect: true,
      allowedSenders: ['*'],
      subscriptions: [],
    },
  };

  const restrictedAgent: AgentManifest = {
    id: 'secure-vault',
    name: 'Secure Vault',
    model: 'llama3.2:latest',
    systemPrompt: '',
    priority: 'background',
    tools: [],
    messaging: {
      canReceiveDirect: true,
      allowedSenders: ['admin-agent'], // Only admin-agent allowed!
      subscriptions: [],
    },
  };

  const deafAgent: AgentManifest = {
    id: 'deaf-agent',
    name: 'No Inbound',
    model: 'llama3.2:latest',
    systemPrompt: '',
    priority: 'background',
    tools: [],
    messaging: {
      canReceiveDirect: false, // Refuses all direct messages
      subscriptions: [],
    },
  };

  bus.registerAgent(copilot);
  bus.registerAgent(restrictedAgent);
  bus.registerAgent(deafAgent);

  // 1. Valid message from copilot to copilot/open agent
  const msg1 = bus.sendMessage(copilot, copilot, 'Self test memo');
  assert.equal(msg1.message.content, 'Self test memo');
  assert.equal(bus.getInbox('copilot').length, 1);

  // 2. Unauthorized sender to restrictedAgent
  assert.throws(() => {
    bus.sendMessage(copilot, restrictedAgent, 'Unauthorized ping');
  }, /not authorized to message/);

  // 3. Authorized sender to restrictedAgent
  const adminMsg = bus.sendMessage({ id: 'admin-agent' }, restrictedAgent, 'Authorized alert');
  assert.equal(adminMsg.message.content, 'Authorized alert');
  assert.equal(bus.getInbox('secure-vault').length, 1);

  // 4. Message to deaf agent throws
  assert.throws(() => {
    bus.sendMessage(copilot, deafAgent, 'Hello?');
  }, /does not accept direct messages/);
});

test('AgentMessageBus - broadcasts topic messages to subscribed agents', () => {
  const eventBroker = new AgentEventBroker();
  const bus = new AgentMessageBus(eventBroker);

  const sub1: AgentManifest = {
    id: 'sub1',
    name: 'Sub 1',
    model: 'llama3.2:latest',
    systemPrompt: '',
    priority: 'interactive',
    tools: [],
    messaging: { canReceiveDirect: true, subscriptions: ['director.intent', 'audio.cue'] },
  };

  const sub2: AgentManifest = {
    id: 'sub2',
    name: 'Sub 2',
    model: 'llama3.2:latest',
    systemPrompt: '',
    priority: 'interactive',
    tools: [],
    messaging: { canReceiveDirect: true, subscriptions: ['director.intent'] },
  };

  const nonSub: AgentManifest = {
    id: 'nonSub',
    name: 'Non Sub',
    model: 'llama3.2:latest',
    systemPrompt: '',
    priority: 'interactive',
    tools: [],
    messaging: { canReceiveDirect: true, subscriptions: [] },
  };

  bus.registerAgent(sub1);
  bus.registerAgent(sub2);
  bus.registerAgent(nonSub);

  const delivered = bus.publishTopic('director', 'director.intent', 'Cutting to Cam 2 in 3 seconds');
  assert.equal(delivered.length, 2);

  assert.equal(bus.getInbox('sub1').length, 1);
  assert.equal(bus.getInbox('sub2').length, 1);
  assert.equal(bus.getInbox('nonSub').length, 0);

  // Mark read
  const msgId = bus.getInbox('sub1')[0]!.id;
  const marked = bus.markRead('sub1', msgId);
  assert.equal(marked, true);
  assert.equal(bus.getInbox('sub1', true).length, 0); // 0 unread
});
