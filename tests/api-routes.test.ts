import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../src/app.js';

test('API Routes - health, agent creation, lifecycle, and inter-agent endpoints', async () => {
  const testDb = join(tmpdir(), `api_test_agents_${Date.now()}.json`);
  if (existsSync(testDb)) rmSync(testDb);

  const { app } = await createApp({ agentsFilePath: testDb });

  // 1. Health check
  const healthRes = await app.inject({
    method: 'GET',
    url: '/api/v1/health',
  });
  assert.equal(healthRes.statusCode, 200);
  const health = JSON.parse(healthRes.body);
  assert.equal(health.service, 'piagent');
  assert.equal(health.status, 'ok');

  // 2. List agents
  const listRes = await app.inject({
    method: 'GET',
    url: '/api/v1/agents',
  });
  assert.equal(listRes.statusCode, 200);
  const agents = JSON.parse(listRes.body);
  assert.ok(agents.length >= 3);

  // 3. Create a new agent via HTTP POST
  const createRes = await app.inject({
    method: 'POST',
    url: '/api/v1/agents',
    payload: {
      id: 'custom-hymn-agent',
      name: 'Custom Hymn Searcher',
      description: 'Finds hymn numbers and sheet music',
      model: 'llama3.2:latest',
      priority: 'interactive',
      systemPrompt: 'You find hymns.',
      tools: ['pipgm_hymn'],
      messaging: {
        canReceiveDirect: true,
        allowedSenders: ['*'],
      },
    },
  });
  assert.equal(createRes.statusCode, 201);
  const created = JSON.parse(createRes.body);
  assert.equal(created.id, 'custom-hymn-agent');

  // 4. Get single agent
  const getRes = await app.inject({
    method: 'GET',
    url: '/api/v1/agents/custom-hymn-agent',
  });
  assert.equal(getRes.statusCode, 200);
  const single = JSON.parse(getRes.body);
  assert.equal(single.manifest.name, 'Custom Hymn Searcher');
  assert.equal(single.runtime.status, 'idle');

  // 5. Send message to agent
  const msgRes = await app.inject({
    method: 'POST',
    url: '/api/v1/agents/custom-hymn-agent/messages',
    payload: {
      from: 'copilot',
      content: 'Can you find hymn 332?',
    },
  });
  assert.equal(msgRes.statusCode, 201);

  // 6. Check inbox
  const inboxRes = await app.inject({
    method: 'GET',
    url: '/api/v1/agents/custom-hymn-agent/messages',
  });
  assert.equal(inboxRes.statusCode, 200);
  const inbox = JSON.parse(inboxRes.body);
  assert.equal(inbox.count, 1);
  assert.equal(inbox.messages[0].message.content, 'Can you find hymn 332?');

  // 7. Stop agent
  const stopRes = await app.inject({
    method: 'POST',
    url: '/api/v1/agents/custom-hymn-agent/stop',
    payload: { reason: 'Operator requested pause' },
  });
  assert.equal(stopRes.statusCode, 200);
  const stopBody = JSON.parse(stopRes.body);
  assert.equal(stopBody.agentId, 'custom-hymn-agent');
  assert.equal(stopBody.status, 'ok');

  // 8. Global interrupt
  const interruptRes = await app.inject({
    method: 'POST',
    url: '/api/v1/agent/interrupt',
    payload: { reason: 'Emergency Stop Button' },
  });
  assert.equal(interruptRes.statusCode, 200);
  const interruptBody = JSON.parse(interruptRes.body);
  assert.equal(interruptBody.stoppedAll, true);

  // 9. Remove agent
  const deleteRes = await app.inject({
    method: 'DELETE',
    url: '/api/v1/agents/custom-hymn-agent',
  });
  assert.equal(deleteRes.statusCode, 200);
  const deleteBody = JSON.parse(deleteRes.body);
  assert.equal(deleteBody.removed, 'custom-hymn-agent');

  // 10. Verify agent is gone
  const getDeletedRes = await app.inject({
    method: 'GET',
    url: '/api/v1/agents/custom-hymn-agent',
  });
  assert.equal(getDeletedRes.statusCode, 404);

  await app.close();
  if (existsSync(testDb)) rmSync(testDb);
});
