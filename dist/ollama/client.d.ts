import type { ChatMessage } from '../types.js';
export interface OllamaModelInfo {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: {
        format: string;
        family: string;
        parameter_size: string;
        quantization_level: string;
    };
}
export interface OllamaChatOptions {
    model: string;
    messages: ChatMessage[];
    stream?: boolean;
    format?: 'json' | Record<string, unknown>;
    temperature?: number;
    tools?: unknown[];
    signal?: AbortSignal;
}
export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
        tool_calls?: Array<{
            function: {
                name: string;
                arguments: Record<string, unknown>;
            };
        }>;
    };
    done: boolean;
    total_duration?: number;
    eval_count?: number;
}
export declare class OllamaClient {
    private readonly baseUrl;
    constructor(baseUrl: string);
    /** Check if Ollama server is reachable */
    isHealthy(): Promise<boolean>;
    /** List installed models */
    listModels(): Promise<OllamaModelInfo[]>;
    /** List models currently loaded in memory */
    listRunningModels(): Promise<unknown[]>;
    /** Send chat request (non-streaming) */
    chat(options: OllamaChatOptions): Promise<OllamaChatResponse>;
    /** Send streaming chat request */
    chatStream(options: OllamaChatOptions): AsyncGenerator<{
        contentChunk: string;
        done: boolean;
        raw?: unknown;
    }>;
}
