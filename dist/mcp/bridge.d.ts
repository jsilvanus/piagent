export interface McpToolDefinition {
    name: string;
    description?: string;
    inputSchema?: {
        type?: string;
        properties?: Record<string, unknown>;
        required?: string[];
    };
}
export declare class McpBridge {
    private readonly mcpServerUrl;
    constructor(mcpServerUrl: string);
    /** Fetch available tools from picontrol-mcp with optional auth token */
    listTools(token?: string): Promise<McpToolDefinition[]>;
    /** Execute a tool against picontrol-mcp */
    callTool(name: string, args: Record<string, unknown>, token?: string): Promise<unknown>;
}
