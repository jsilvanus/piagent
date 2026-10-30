export class McpBridge {
    mcpServerUrl;
    constructor(mcpServerUrl) {
        this.mcpServerUrl = mcpServerUrl;
    }
    /** Fetch available tools from picontrol-mcp with optional auth token */
    async listTools(token) {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const body = {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/list',
                params: {},
            };
            const res = await fetch(this.mcpServerUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                return [];
            }
            const data = await res.json();
            return data.result?.tools || [];
        }
        catch {
            // MCP server might be offline during dev/unit tests
            return [];
        }
    }
    /** Execute a tool against picontrol-mcp */
    async callTool(name, args, token) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const body = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
                name,
                arguments: args,
            },
        };
        const res = await fetch(this.mcpServerUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`MCP tool call '${name}' failed (HTTP ${res.status}): ${errText}`);
        }
        const data = await res.json();
        if (data.error) {
            throw new Error(`MCP tool error [${data.error.code}]: ${data.error.message}`);
        }
        return data.result;
    }
}
