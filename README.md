# piagent

Centralized Agent Infrastructure Plane for the **Raspberry Pi Production Ecosystem** (`piecosystem`) at Riihimäen Keskuskirkko.

`piagent` bridges local Large Language Models running on **Ollama** with domain consumers (`picontrol`, `pidirector`, `pirundown-designer`) and execution planes (`picontrol-mcp`, `pigateway`).

---

## Capabilities

- **Ollama Local LLM Integration**: Zero cloud latency, strictly private local inference (`llama3.2`, `qwen2.5`, `mistral`) with streaming SSE and structured JSON outputs.
- **Priority Scheduling & Preemption**: Realtime broadcast tasks (`weight: 100`) take immediate precedence over conversational operator chat (`weight: 50`) and background batch jobs (`weight: 10`), preventing VRAM starvation.
- **Agent Lifecycle Management**: Dynamic creation (`POST /api/v1/agents`), status monitoring, runtime updates, agent turn stopping, and agent removal (`DELETE /api/v1/agents/:id`).
- **Out-of-Band Interruption (<5ms)**: Uses Node.js `AbortController` linked with `pigateway`'s SSE event bus to hard-kill in-flight LLM inferences and cancel unexecuted tool commands when human operators take manual control.
- **Inter-Agent Messaging & Mailboxes**: Allows agents to message each other directly (with `allowedSenders` security enforcement) and publish to broadcast topics (e.g. `director.intent`).
- **picontrol-mcp Bridge**: Connects to `picontrol-mcp` tools, carrying caller tokens to preserve role-based authorization.

---

## API Endpoints

### 1. Agents Lifecycle
- `GET /api/v1/agents` — List all registered agents and their current runtime status (`idle`, `running`, `interrupted`).
- `POST /api/v1/agents` — Register a new agent manifest.
- `GET /api/v1/agents/:id` — Get agent details, runtime metrics, and unread message count.
- `PATCH /api/v1/agents/:id` — Update agent manifest (prompt, model, tools, messaging).
- `DELETE /api/v1/agents/:id` — Stop active execution and delete agent from registry.
- `POST /api/v1/agents/:id/stop` — Stop / interrupt active execution turn for `:id`.
- `POST /api/v1/agent/interrupt` — Emergency global interrupt (cancels all active agent turns).

### 2. Execution & Chat
- `POST /api/v1/agents/:id/chat` — Execute turn with agent.
  - Body: `{ message: string, stream?: boolean, format?: "text" | "json", token?: string }`
  - When `stream: true`, streams tokens and tool events via Server-Sent Events (SSE).

### 3. Inter-Agent Communication
- `POST /api/v1/agents/:id/messages` — Send direct message to agent `:id`.
- `GET /api/v1/agents/:id/messages` — Read agent `:id`'s mailbox (optional query `?unread=true`).
- `POST /api/v1/agents/:id/messages/:msgId/read` — Mark message as read.
- `POST /api/v1/messages/broadcast` — Broadcast message on topic to all subscribed agents.

### 4. System & Observability
- `GET /health` — Service health, Ollama connectivity, scheduler queue length.
- `GET /api/v1/models` — Installed and actively loaded Ollama models.
- `GET /api/v1/events` — Real-time Server-Sent Events (SSE) feed of thoughts, tool executions, and state changes.

---

## Quickstart

```bash
# Install dependencies
pnpm install

# Run unit tests
pnpm test

# Build TypeScript to dist/
pnpm run build

# Start server on default port 3301
pnpm start
```

---

## Configuration

Environment variables (or `.env`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3301` | Server listening port |
| `HOST` | `0.0.0.0` | Server listening address |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `DEFAULT_MODEL` | `llama3.2:latest` | Fallback model if omitted |
| `MCP_SERVER_URL` | `http://localhost:3600/mcp` | picontrol-mcp server endpoint |
| `PIAGENT_CONFIG_DIR` | `~/.config/piagent` | Data directory for `agents.json` |
