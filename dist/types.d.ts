import { z } from 'zod';
export declare const AgentPrioritySchema: z.ZodDefault<z.ZodEnum<["realtime", "interactive", "background"]>>;
export type AgentPriority = z.infer<typeof AgentPrioritySchema>;
export declare const PRIORITY_WEIGHTS: Record<AgentPriority, number>;
export declare const AgentMessagingSchema: z.ZodObject<{
    canReceiveDirect: z.ZodDefault<z.ZodBoolean>;
    allowedSenders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    subscriptions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    canReceiveDirect: boolean;
    subscriptions: string[];
    allowedSenders?: string[] | undefined;
}, {
    canReceiveDirect?: boolean | undefined;
    allowedSenders?: string[] | undefined;
    subscriptions?: string[] | undefined;
}>;
export type AgentMessaging = z.infer<typeof AgentMessagingSchema>;
export declare const AgentManifestSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    systemPrompt: z.ZodDefault<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["realtime", "interactive", "background"]>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    temperature: z.ZodOptional<z.ZodNumber>;
    messaging: z.ZodDefault<z.ZodObject<{
        canReceiveDirect: z.ZodDefault<z.ZodBoolean>;
        allowedSenders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subscriptions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        canReceiveDirect: boolean;
        subscriptions: string[];
        allowedSenders?: string[] | undefined;
    }, {
        canReceiveDirect?: boolean | undefined;
        allowedSenders?: string[] | undefined;
        subscriptions?: string[] | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    model: string;
    systemPrompt: string;
    priority: "realtime" | "interactive" | "background";
    tools: string[];
    messaging: {
        canReceiveDirect: boolean;
        subscriptions: string[];
        allowedSenders?: string[] | undefined;
    };
    description?: string | undefined;
    temperature?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    id: string;
    name: string;
    description?: string | undefined;
    model?: string | undefined;
    systemPrompt?: string | undefined;
    priority?: "realtime" | "interactive" | "background" | undefined;
    tools?: string[] | undefined;
    temperature?: number | undefined;
    messaging?: {
        canReceiveDirect?: boolean | undefined;
        allowedSenders?: string[] | undefined;
        subscriptions?: string[] | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type AgentManifest = z.infer<typeof AgentManifestSchema>;
export declare const CreateAgentInputSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    systemPrompt: z.ZodDefault<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["realtime", "interactive", "background"]>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    temperature: z.ZodOptional<z.ZodNumber>;
    messaging: z.ZodDefault<z.ZodObject<{
        canReceiveDirect: z.ZodDefault<z.ZodBoolean>;
        allowedSenders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subscriptions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        canReceiveDirect: boolean;
        subscriptions: string[];
        allowedSenders?: string[] | undefined;
    }, {
        canReceiveDirect?: boolean | undefined;
        allowedSenders?: string[] | undefined;
        subscriptions?: string[] | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    model: string;
    systemPrompt: string;
    priority: "realtime" | "interactive" | "background";
    tools: string[];
    messaging: {
        canReceiveDirect: boolean;
        subscriptions: string[];
        allowedSenders?: string[] | undefined;
    };
    description?: string | undefined;
    temperature?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name: string;
    description?: string | undefined;
    model?: string | undefined;
    systemPrompt?: string | undefined;
    priority?: "realtime" | "interactive" | "background" | undefined;
    tools?: string[] | undefined;
    temperature?: number | undefined;
    messaging?: {
        canReceiveDirect?: boolean | undefined;
        allowedSenders?: string[] | undefined;
        subscriptions?: string[] | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;
export declare const UpdateAgentInputSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    model: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    systemPrompt: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["realtime", "interactive", "background"]>>>;
    tools: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    temperature: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    messaging: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        canReceiveDirect: z.ZodDefault<z.ZodBoolean>;
        allowedSenders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subscriptions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        canReceiveDirect: boolean;
        subscriptions: string[];
        allowedSenders?: string[] | undefined;
    }, {
        canReceiveDirect?: boolean | undefined;
        allowedSenders?: string[] | undefined;
        subscriptions?: string[] | undefined;
    }>>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "id">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    model?: string | undefined;
    systemPrompt?: string | undefined;
    priority?: "realtime" | "interactive" | "background" | undefined;
    tools?: string[] | undefined;
    temperature?: number | undefined;
    messaging?: {
        canReceiveDirect: boolean;
        subscriptions: string[];
        allowedSenders?: string[] | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    model?: string | undefined;
    systemPrompt?: string | undefined;
    priority?: "realtime" | "interactive" | "background" | undefined;
    tools?: string[] | undefined;
    temperature?: number | undefined;
    messaging?: {
        canReceiveDirect?: boolean | undefined;
        allowedSenders?: string[] | undefined;
        subscriptions?: string[] | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentInputSchema>;
export type AgentStatus = 'idle' | 'running' | 'interrupted' | 'error';
export interface AgentRuntimeState {
    manifest: AgentManifest;
    status: AgentStatus;
    currentTurnId?: string;
    lastExecutionAt?: string;
    error?: string;
}
export declare const ChatMessageRoleSchema: z.ZodEnum<["system", "user", "assistant", "tool"]>;
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;
export declare const ToolCallSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    args: Record<string, unknown>;
}, {
    id: string;
    name: string;
    args: Record<string, unknown>;
}>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export declare const ChatMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant", "tool"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        args: Record<string, unknown>;
    }, {
        id: string;
        name: string;
        args: Record<string, unknown>;
    }>, "many">>;
    toolCallId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string | undefined;
    toolCalls?: {
        id: string;
        name: string;
        args: Record<string, unknown>;
    }[] | undefined;
    toolCallId?: string | undefined;
}, {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string | undefined;
    toolCalls?: {
        id: string;
        name: string;
        args: Record<string, unknown>;
    }[] | undefined;
    toolCallId?: string | undefined;
}>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export declare const AgentChatInputSchema: z.ZodObject<{
    message: z.ZodOptional<z.ZodString>;
    messages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant", "tool"]>;
        content: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            args: Record<string, unknown>;
        }, {
            id: string;
            name: string;
            args: Record<string, unknown>;
        }>, "many">>;
        toolCallId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCalls?: {
            id: string;
            name: string;
            args: Record<string, unknown>;
        }[] | undefined;
        toolCallId?: string | undefined;
    }, {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCalls?: {
            id: string;
            name: string;
            args: Record<string, unknown>;
        }[] | undefined;
        toolCallId?: string | undefined;
    }>, "many">>;
    stream: z.ZodDefault<z.ZodBoolean>;
    format: z.ZodDefault<z.ZodEnum<["text", "json"]>>;
    jsonSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    stream: boolean;
    format: "text" | "json";
    message?: string | undefined;
    messages?: {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCalls?: {
            id: string;
            name: string;
            args: Record<string, unknown>;
        }[] | undefined;
        toolCallId?: string | undefined;
    }[] | undefined;
    jsonSchema?: Record<string, unknown> | undefined;
    token?: string | undefined;
}, {
    message?: string | undefined;
    messages?: {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCalls?: {
            id: string;
            name: string;
            args: Record<string, unknown>;
        }[] | undefined;
        toolCallId?: string | undefined;
    }[] | undefined;
    stream?: boolean | undefined;
    format?: "text" | "json" | undefined;
    jsonSchema?: Record<string, unknown> | undefined;
    token?: string | undefined;
}>;
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;
export declare const InterAgentMessageSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    content: z.ZodString;
    topic: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    requireResponse: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content: string;
    from: string;
    to: string;
    requireResponse: boolean;
    topic?: string | undefined;
    data?: Record<string, unknown> | undefined;
}, {
    content: string;
    from: string;
    to: string;
    topic?: string | undefined;
    data?: Record<string, unknown> | undefined;
    requireResponse?: boolean | undefined;
}>;
export type InterAgentMessage = z.infer<typeof InterAgentMessageSchema>;
export interface AgentEvent {
    id: string;
    type: 'agent.created' | 'agent.updated' | 'agent.removed' | 'agent.started' | 'agent.thought' | 'agent.tool_call' | 'agent.tool_result' | 'agent.finished' | 'agent.interrupted' | 'agent.error' | 'agent.message';
    agentId: string;
    timestamp: string;
    data: unknown;
}
