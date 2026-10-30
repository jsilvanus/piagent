import type { FastifyInstance } from 'fastify';
import type { OllamaClient } from '../ollama/client.js';
import type { PriorityScheduler } from '../ollama/scheduler.js';
export declare function registerOllamaRoutes(app: FastifyInstance, ollamaClient: OllamaClient, scheduler: PriorityScheduler): void;
