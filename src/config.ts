import { homedir } from 'node:os';
import { join } from 'node:path';
import { normalizeKeepAlive } from './ollama/client.js';

export interface Config {
  port: number;
  host: string;
  ollamaBaseUrl: string;
  /** Ollama keep_alive sent with every request (PIAGENT_OLLAMA_KEEP_ALIVE, default 15m). */
  ollamaKeepAlive: string | number;
  defaultModel: string;
  mcpServerUrl: string;
  storageDir: string;
  agentsFilePath: string;
}

export function loadConfig(): Config {
  const baseDir = process.env.PIAGENT_CONFIG_DIR || join(homedir(), '.config', 'piagent');
  return {
    port: parseInt(process.env.PORT || '3301', 10),
    host: process.env.HOST || '0.0.0.0',
    ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),
    ollamaKeepAlive: normalizeKeepAlive(process.env.PIAGENT_OLLAMA_KEEP_ALIVE || process.env.OLLAMA_KEEP_ALIVE),
    defaultModel: process.env.DEFAULT_MODEL || 'llama3.2:latest',
    mcpServerUrl: (process.env.MCP_SERVER_URL || 'http://localhost:3600/mcp').replace(/\/+$/, ''),
    storageDir: baseDir,
    agentsFilePath: join(baseDir, 'agents.json'),
  };
}
