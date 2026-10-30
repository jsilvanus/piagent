export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export class McpBridge {
  constructor(private readonly mcpServerUrl: string) {}

  /** Fetch available tools from picontrol-mcp with optional auth token */
  async listTools(token?: string): Promise<McpToolDefinition[]> {
    try {
      const headers: Record<string, string> = {
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

      const data = await res.json() as {
        result?: { tools?: McpToolDefinition[] };
      };
      return data.result?.tools || [];
    } catch {
      // MCP server might be offline during dev/unit tests
      return [];
    }
  }

  /** Execute a tool against picontrol-mcp */
  async callTool(name: string, args: Record<string, unknown>, token?: string): Promise<unknown> {
    const headers: Record<string, string> = {
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

    const data = await res.json() as {
      result?: unknown;
      error?: { code: number; message: string };
    };

    if (data.error) {
      throw new Error(`MCP tool error [${data.error.code}]: ${data.error.message}`);
    }

    return data.result;
  }
}
