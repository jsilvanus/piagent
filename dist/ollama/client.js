export class OllamaClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    /** Check if Ollama server is reachable */
    async isHealthy() {
        try {
            const res = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
            return res.ok;
        }
        catch {
            return false;
        }
    }
    /** List installed models */
    async listModels() {
        const res = await fetch(`${this.baseUrl}/api/tags`);
        if (!res.ok) {
            throw new Error(`Failed to list Ollama models: HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.models || [];
    }
    /** List models currently loaded in memory */
    async listRunningModels() {
        try {
            const res = await fetch(`${this.baseUrl}/api/ps`);
            if (!res.ok)
                return [];
            const data = await res.json();
            return data.models || [];
        }
        catch {
            return [];
        }
    }
    /** Send chat request (non-streaming) */
    async chat(options) {
        const body = {
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
        return (await res.json());
    }
    /** Send streaming chat request */
    async *chatStream(options) {
        const body = {
            model: options.model,
            messages: options.messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            stream: true,
        };
        if (options.format)
            body.format = options.format;
        if (options.temperature !== undefined)
            body.options = { temperature: options.temperature };
        if (options.tools && options.tools.length > 0)
            body.tools = options.tools;
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
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed)
                        continue;
                    try {
                        const parsed = JSON.parse(trimmed);
                        yield {
                            contentChunk: parsed.message?.content || '',
                            done: !!parsed.done,
                            raw: parsed,
                        };
                    }
                    catch {
                        // Ignore parse errors on partial chunks
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
