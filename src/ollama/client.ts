import type { ChatMessage, ToolCall } from '../types.js';

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaChatOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  format?: 'json' | Record<string, unknown>;
  temperature?: number;
  tools?: unknown[];
  signal?: AbortSignal;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    tool_calls?: Array<{
      function: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
  };
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export class OllamaClient {
  constructor(private readonly baseUrl: string) {}

  /** Check if Ollama server is reachable */
  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** List installed models */
  async listModels(): Promise<OllamaModelInfo[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`);
    if (!res.ok) {
      throw new Error(`Failed to list Ollama models: HTTP ${res.status}`);
    }
    const data = await res.json() as { models: OllamaModelInfo[] };
    return data.models || [];
  }

  /** List models currently loaded in memory */
  async listRunningModels(): Promise<unknown[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ps`);
      if (!res.ok) return [];
      const data = await res.json() as { models: unknown[] };
      return data.models || [];
    } catch {
      return [];
    }
  }

  /** Send chat request (non-streaming) */
  async chat(options: OllamaChatOptions): Promise<OllamaChatResponse> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
    };

    if (options.format) {
      body.format = options.format;
    }

    if (options.temperature !== undefined) {
      body.options = { temperature: options.temperature };
    }

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools;
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama chat error HTTP ${res.status}: ${errText}`);
    }

    return (await res.json()) as OllamaChatResponse;
  }

  /** Send streaming chat request */
  async *chatStream(
    options: OllamaChatOptions
  ): AsyncGenerator<{ contentChunk: string; done: boolean; raw?: unknown }> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    if (options.format) body.format = options.format;
    if (options.temperature !== undefined) body.options = { temperature: options.temperature };
    if (options.tools && options.tools.length > 0) body.tools = options.tools;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama streaming error HTTP ${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as {
              message?: { content?: string };
              done?: boolean;
            };
            yield {
              contentChunk: parsed.message?.content || '',
              done: !!parsed.done,
              raw: parsed,
            };
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
