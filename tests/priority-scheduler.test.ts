import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriorityScheduler } from '../src/ollama/scheduler.js';

test('PriorityScheduler - runs realtime tasks ahead of queued background tasks', async () => {
  const scheduler = new PriorityScheduler(1);
  const executedOrder: string[] = [];

  // 1. Start a slow task that occupies the single slot
  let finishFirst: () => void;
  const firstPromise = scheduler.enqueue('agent-1', 'interactive', async () => {
    executedOrder.push('first');
    await new Promise<void>(res => { finishFirst = res; });
    return 'first_done';
  });

  // 2. Queue a background task
  const bgPromise = scheduler.enqueue('agent-bg', 'background', async () => {
    executedOrder.push('background');
    return 'bg_done';
  });

  // 3. Queue an interactive task
  const interPromise = scheduler.enqueue('agent-inter', 'interactive', async () => {
    executedOrder.push('interactive');
    return 'inter_done';
  });

  // 4. Queue a realtime task (should leap to front of queue!)
  const rtPromise = scheduler.enqueue('agent-rt', 'realtime', async () => {
    executedOrder.push('realtime');
    return 'rt_done';
  });

  // Release the first task
  finishFirst!();

  await Promise.all([firstPromise, bgPromise, interPromise, rtPromise]);

  // Order should be: first -> realtime -> interactive -> background
  assert.deepEqual(executedOrder, ['first', 'realtime', 'interactive', 'background']);
});

test('PriorityScheduler - cancels tasks for a specific agent', async () => {
  const scheduler = new PriorityScheduler(1);

  let holdSlot: () => void;
  scheduler.enqueue('occupier', 'realtime', async () => {
    await new Promise<void>(res => { holdSlot = res; });
  });

  // Enqueue a task for agent-victim
  let victimRan = false;
  const victimPromise = scheduler.enqueue('agent-victim', 'interactive', async () => {
    victimRan = true;
  });

  assert.equal(scheduler.pendingCount, 1);

  // Cancel victim
  const cancelledCount = scheduler.cancelAgent('agent-victim', 'Operator abort');
  assert.equal(cancelledCount, 1);
  assert.equal(scheduler.pendingCount, 0);

  // The victim promise should reject
  await assert.rejects(victimPromise, /Operator abort/);
  assert.equal(victimRan, false);

  holdSlot!();
});
