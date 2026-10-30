import { homedir } from 'node:os';
import { join } from 'node:path';

export interface Config {
  port: number;
  host: string;
  ollamaBaseUrl: string;
  defaultModel: string;
  mcpServerUrl: string;
  storageDir: string;
  agentsFilePath: string;
}

export function loadConfig(): Config {
  const baseDir = process.env.PIAGENT_CONFIG_DIR || join(homedir(), '.config', 'piagent');
  return {
    port: parseInt(process.env.PORT || '3120', 10),
    host: process.env.HOST || '0.0.0.0',
    ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),
    defaultModel: process.env.DEFAULT_MODEL || 'llama3.2:latest',
    mcpServerUrl: (process.env.MCP_SERVER_URL || 'http://localhost:3200/mcp').replace(/\/+$/, ''),
    storageDir: baseDir,
    agentsFilePath: join(baseDir, 'agents.json'),
  };
}
