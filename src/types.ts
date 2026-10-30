import { z } from 'zod';

// --- Priority Levels ---
export const AgentPrioritySchema = z.enum(['realtime', 'interactive', 'background']).default('interactive');
export type AgentPriority = z.infer<typeof AgentPrioritySchema>;

// Numeric priority weights for scheduling (higher = runs first)
export const PRIORITY_WEIGHTS: Record<AgentPriority, number> = {
  realtime: 100,      // e.g. Live director or critical audio cuts
  interactive: 50,    // e.g. Human UI chat copilot
  background: 10,     // e.g. Batch sermon analysis, background log analyzer
};

// --- Messaging & Communication Manifest ---
export const AgentMessagingSchema = z.object({
  canReceiveDirect: z.boolean().default(true).describe('Can other agents directly message this agent?'),
  allowedSenders: z.array(z.string()).optional().describe('List of agent IDs allowed to message this agent, or ["*"]'),
  subscriptions: z.array(z.string()).default([]).describe('Broadcast event topics this agent listens to, e.g. ["director.intent"]'),
});
export type AgentMessaging = z.infer<typeof AgentMessagingSchema>;

// --- Agent Manifest (Creation & Definition) ---
export const AgentManifestSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-_]+$/, 'Agent ID must be lowercase alphanumeric with hyphens/underscores'),
  name: z.string().min(1),
  description: z.string().optional(),
  model: z.string().default('llama3.2:latest'),
  systemPrompt: z.string().default('You are a helpful AI assistant in the church AV broadcast ecosystem.'),
  priority: AgentPrioritySchema,
  tools: z.array(z.string()).default([]).describe('List of allowed MCP tools or wildcards, e.g. ["atem_switch", "cameras:*"]'),
  temperature: z.number().min(0).max(2).optional(),
  messaging: AgentMessagingSchema.default({}),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export const CreateAgentInputSchema = AgentManifestSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

export const UpdateAgentInputSchema = CreateAgentInputSchema.partial().omit({
  id: true,
});
export type UpdateAgentInput = z.infer<typeof UpdateAgentInputSchema>;

// --- Agent Runtime Status ---
export type AgentStatus = 'idle' | 'running' | 'interrupted' | 'error';

export interface AgentRuntimeState {
  manifest: AgentManifest;
  status: AgentStatus;
  currentTurnId?: string;
  lastExecutionAt?: string;
  error?: string;
}

// --- Chat Messages ---
export const ChatMessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ChatMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  content: z.string(),
  name: z.string().optional(),
  toolCalls: z.array(ToolCallSchema).optional(),
  toolCallId: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const AgentChatInputSchema = z.object({
  message: z.string().min(1).optional(),
  messages: z.array(ChatMessageSchema).optional(),
  stream: z.boolean().default(false),
  format: z.enum(['text', 'json']).default('text'),
  jsonSchema: z.record(z.unknown()).optional(),
  token: z.string().optional().describe('Caller personal access token / JWT to forward to MCP'),
});
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

// --- Inter-Agent Messaging ---
export const InterAgentMessageSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  content: z.string().min(1),
  topic: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  requireResponse: z.boolean().default(false),
});
export type InterAgentMessage = z.infer<typeof InterAgentMessageSchema>;

// --- System & Broadcast Events ---
export interface AgentEvent {
  id: string;
  type:
    | 'agent.created'
    | 'agent.updated'
    | 'agent.removed'
    | 'agent.started'
    | 'agent.thought'
    | 'agent.tool_call'
    | 'agent.tool_result'
    | 'agent.finished'
    | 'agent.interrupted'
    | 'agent.error'
    | 'agent.message';
  agentId: string;
  timestamp: string;
  data: unknown;
}
