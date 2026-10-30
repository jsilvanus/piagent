import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OllamaClient } from '../src/ollama/client.js';

test('OllamaClient - parses model list and tags', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/tags')) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: 'llama3.2:3b',
                modified_at: '2026-10-25T10:00:00Z',
                size: 2000000000,
                digest: 'sha256:123',
                details: { parameter_size: '3B', family: 'llama' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.includes('/api/ps')) {
        return new Response(JSON.stringify({ models: [] }), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    };

    const client = new OllamaClient('http://localhost:11434');
    const isHealthy = await client.isHealthy();
    assert.equal(isHealthy, true);

    const models = await client.listModels();
    assert.equal(models.length, 1);
    assert.equal(models[0]!.name, 'llama3.2:3b');
    assert.equal(models[0]!.details?.parameter_size, '3B');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OllamaClient - executes chat and streaming responses', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/chat')) {
        const body = JSON.parse(init?.body as string);
        if (body.stream) {
          // Stream mock
          const chunks = [
            JSON.stringify({ message: { content: 'Hello ' }, done: false }) + '\n',
            JSON.stringify({ message: { content: 'operator!' }, done: true }) + '\n',
          ];
          const stream = new ReadableStream({
            start(controller) {
              for (const c of chunks) {
                controller.enqueue(new TextEncoder().encode(c));
              }
              controller.close();
            },
          });
          return new Response(stream, { status: 200 });
        } else {
          return new Response(
            JSON.stringify({
              model: 'llama3.2:latest',
              message: { role: 'assistant', content: 'Camera 2 preset pulpit set.' },
              done: true,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      return new Response('Not found', { status: 404 });
    };

    const client = new OllamaClient('http://localhost:11434');

    // 1. Non-streaming chat
    const chatRes = await client.chat({
      model: 'llama3.2:latest',
      messages: [{ role: 'user', content: 'Select preset pulpit' }],
    });
    assert.equal(chatRes.message.content, 'Camera 2 preset pulpit set.');

    // 2. Streaming chat
    const chunks: string[] = [];
    for await (const chunk of client.chatStream({
      model: 'llama3.2:latest',
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      chunks.push(chunk.contentChunk);
    }
    assert.equal(chunks.join(''), 'Hello operator!');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
