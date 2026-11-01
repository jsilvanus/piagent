import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadConfig } from '../config.js';
import { OllamaClient } from '../ollama/client.js';
import { AgentRegistry } from '../agents/registry.js';
import { AgentMessageBus } from '../messaging/bus.js';
import { AgentEventBroker } from '../messaging/events.js';
import { PriorityScheduler } from '../ollama/scheduler.js';
import { McpBridge } from '../mcp/bridge.js';
import { AgentSessionManager } from '../agents/session.js';
import type { AgentManifest, ChatMessage } from '../types.js';

export async function runTerminalChat() {
  const config = loadConfig();
  const serverUrl = `http://localhost:${config.port}`;

  console.log(`\n======================================================`);
  console.log(`              PIAGENT — Terminal Chat                 `);
  console.log(`======================================================`);

  // 1. Check if daemon is running
  let isDaemonRunning = false;
  try {
    const res = await fetch(`${serverUrl}/health`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) isDaemonRunning = true;
  } catch {
    isDaemonRunning = false;
  }

  // 2. Initialize in-process fallback services if daemon is offline
  const eventBroker = new AgentEventBroker();
  const messageBus = new AgentMessageBus(eventBroker);
  const registry = new AgentRegistry(config.agentsFilePath, messageBus, eventBroker);
  const ollamaClient = new OllamaClient(config.ollamaBaseUrl);
  const scheduler = new PriorityScheduler(1);
  const mcpBridge = new McpBridge(config.mcpServerUrl);
  const sessionManager = new AgentSessionManager(ollamaClient, scheduler, mcpBridge, eventBroker);

  // Check Ollama health
  const ollamaOk = await ollamaClient.isHealthy();
  if (!ollamaOk) {
    console.log(`\x1b[33mWarning: Ollama is offline at ${config.ollamaBaseUrl}. Ensure 'ollama serve' is running.\x1b[0m\n`);
  } else {
    console.log(`\x1b[32m✔ Ollama connected at ${config.ollamaBaseUrl}\x1b[0m`);
  }

  console.log(`Mode: ${isDaemonRunning ? `\x1b[36mConnected to daemon (: ${config.port})\x1b[0m` : '\x1b[33mStandalone in-process\x1b[0m'}`);

  // 3. Select agent from CLI arguments or default
  const args = process.argv.slice(2);
  let agentId = 'copilot';
  const agentFlagIdx = args.indexOf('--agent');
  if (agentFlagIdx !== -1 && args[agentFlagIdx + 1]) {
    agentId = args[agentFlagIdx + 1]!;
  }

  let activeAgent: AgentManifest | undefined = registry.get(agentId) || registry.list()[0];

  if (!activeAgent) {
    console.error(`Error: No agents found in registry.`);
    process.exit(1);
  }

  console.log(`Active Agent: \x1b[1m\x1b[35m${activeAgent.name}\x1b[0m (\x1b[36m${activeAgent.model}\x1b[0m, priority: \x1b[33m${activeAgent.priority}\x1b[0m)`);
  console.log(`Commands: \x1b[90m/agents, /switch <id>, /models, /clear, /stop, /help, /exit\x1b[0m\n`);

  const rl = readline.createInterface({ input, output });
  const conversationHistory: ChatMessage[] = [];
  let isGenerating = false;
  let activeAbortController: AbortController | null = null;

  // Handle Ctrl+C to interrupt active stream rather than immediately killing terminal
  process.on('SIGINT', () => {
    if (isGenerating && activeAbortController) {
      console.log('\n\x1b[31m[Interrupted by operator Ctrl+C]\x1b[0m');
      activeAbortController.abort('Operator Ctrl+C');
      activeAbortController = null;
      isGenerating = false;
      promptUser();
    } else {
      console.log('\nExiting piagent terminal chat. Goodbye!\n');
      process.exit(0);
    }
  });

  const promptUser = () => {
    const promptLabel = `\x1b[32m${activeAgent?.id || 'agent'}\x1b[0m \x1b[90m(${activeAgent?.model || ''})\x1b[0m > `;
    rl.question(promptLabel).then(handleLine);
  };

  const handleLine = async (line: string) => {
    const inputTrimmed = line.trim();

    if (!inputTrimmed) {
      promptUser();
      return;
    }

    // Slash Commands
    if (inputTrimmed.startsWith('/')) {
      const parts = inputTrimmed.slice(1).split(/\s+/);
      const cmd = parts[0]?.toLowerCase();
      const arg = parts.slice(1).join(' ');

      switch (cmd) {
        case 'help':
          console.log(`\n\x1b[1mAvailable Commands:\x1b[0m`);
          console.log(`  /agents       - List all agents and switch to one`);
          console.log(`  /switch <id>  - Switch to agent by ID`);
          console.log(`  /models       - List installed Ollama models`);
          console.log(`  /clear        - Clear conversation memory`);
          console.log(`  /stop         - Emergency stop/interrupt current agent turn`);
          console.log(`  /exit, /quit  - Close terminal chat\n`);
          break;

        case 'agents': {
          const agents = registry.list();
          console.log(`\n\x1b[1mRegistered Agents:\x1b[0m`);
          for (const a of agents) {
            const isCur = a.id === activeAgent?.id;
            console.log(`  ${isCur ? '\x1b[32m* ' : '  '}\x1b[1m${a.id}\x1b[0m - ${a.name} [model: ${a.model}, priority: ${a.priority}]${isCur ? '\x1b[0m' : ''}`);
          }
          console.log('');
          break;
        }

        case 'switch': {
          if (!arg) {
            console.log(`Usage: /switch <agent-id>`);
            break;
          }
          const target = registry.get(arg.trim());
          if (!target) {
            console.log(`\x1b[31mAgent '${arg}' not found. Use /agents to see available agents.\x1b[0m`);
          } else {
            activeAgent = target;
            conversationHistory.length = 0; // Reset history for new agent
            console.log(`\x1b[32mSwitched to: ${activeAgent.name} (${activeAgent.model})\x1b[0m`);
          }
          break;
        }

        case 'models': {
          try {
            const models = await ollamaClient.listModels();
            console.log(`\n\x1b[1mInstalled Ollama Models:\x1b[0m`);
            for (const m of models) {
              console.log(`  • \x1b[36m${m.name}\x1b[0m (${m.details?.parameter_size || 'N/A'}, ${m.details?.family || 'family'})`);
            }
            console.log('');
          } catch (err) {
            console.log(`\x1b[31mFailed to query models: ${(err as Error).message}\x1b[0m`);
          }
          break;
        }

        case 'clear':
          conversationHistory.length = 0;
          console.log(`\x1b[33mConversation history cleared.\x1b[0m\n`);
          break;

        case 'stop':
          sessionManager.stop(activeAgent!.id, 'Terminal operator /stop command');
          console.log(`\x1b[31mSent interrupt signal to '${activeAgent!.id}'.\x1b[0m\n`);
          break;

        case 'exit':
        case 'quit':
          console.log('Exiting piagent terminal chat. Goodbye!\n');
          rl.close();
          process.exit(0);

        default:
          console.log(`Unknown command: /${cmd}. Type /help for assistance.`);
          break;
      }

      promptUser();
      return;
    }

    // Execute Chat Turn
    isGenerating = true;
    activeAbortController = new AbortController();

    conversationHistory.push({
      role: 'user',
      content: inputTrimmed,
    });

    process.stdout.write(`\x1b[35m${activeAgent!.name}:\x1b[0m `);

    try {
      // If daemon is running, use SSE streaming endpoint
      if (isDaemonRunning) {
        const res = await fetch(`${serverUrl}/api/v1/agents/${activeAgent!.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            stream: true,
          }),
          signal: activeAbortController.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Daemon error: HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.slice(6).trim();
              if (rawData === '[DONE]') break;
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.chunk) {
                  process.stdout.write(parsed.chunk);
                  fullResponse += parsed.chunk;
                }
              } catch {}
            }
          }
        }
        process.stdout.write('\n\n');
        conversationHistory.push({ role: 'assistant', content: fullResponse });
      } else {
        // Fallback: In-process direct streaming with OllamaClient
        const messages: ChatMessage[] = [
          { role: 'system', content: activeAgent!.systemPrompt },
          ...conversationHistory,
        ];

        let fullResponse = '';
        const stream = ollamaClient.chatStream({
          model: activeAgent!.model,
          messages,
          temperature: activeAgent!.temperature,
          signal: activeAbortController.signal,
        });

        for await (const chunk of stream) {
          process.stdout.write(chunk.contentChunk);
          fullResponse += chunk.contentChunk;
        }

        process.stdout.write('\n\n');
        conversationHistory.push({ role: 'assistant', content: fullResponse });
      }
    } catch (err: any) {
      if (activeAbortController?.signal.aborted) {
        // Handled in SIGINT / /stop
      } else {
        console.log(`\n\x1b[31mError: ${err.message || String(err)}\x1b[0m\n`);
      }
    } finally {
      isGenerating = false;
      activeAbortController = null;
      promptUser();
    }
  };

  promptUser();
}

// Execute if run directly
if (process.argv[1]?.endsWith('chat.ts') || process.argv[1]?.endsWith('chat.js') || process.argv[1]?.endsWith('piagent-chat.mjs')) {
  runTerminalChat().catch(err => {
    console.error('Terminal chat error:', err);
    process.exit(1);
  });
}
