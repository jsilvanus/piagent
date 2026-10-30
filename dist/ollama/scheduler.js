import { PRIORITY_WEIGHTS } from '../types.js';
export class PriorityScheduler {
    queue = [];
    activeCount = 0;
    maxConcurrent;
    constructor(maxConcurrent = 1) {
        this.maxConcurrent = Math.max(1, maxConcurrent);
    }
    /** Current number of active inference jobs */
    get runningCount() {
        return this.activeCount;
    }
    /** Current number of tasks waiting in queue */
    get pendingCount() {
        return this.queue.length;
    }
    /** Schedule a task to run according to priority */
    enqueue(agentId, priority, execute, callerSignal) {
        return new Promise((resolve, reject) => {
            const abortController = new AbortController();
            // If caller already has an abort signal, link it
            if (callerSignal) {
                if (callerSignal.aborted) {
                    return reject(new Error('Task was aborted before execution'));
                }
                callerSignal.addEventListener('abort', () => {
                    abortController.abort(callerSignal.reason);
                });
            }
            const task = {
                id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                agentId,
                priority,
                weight: PRIORITY_WEIGHTS[priority] || 50,
                abortController,
                execute,
                resolve,
                reject,
                createdAt: Date.now(),
            };
            // Handle self abort
            abortController.signal.addEventListener('abort', () => {
                const idx = this.queue.findIndex(t => t.id === task.id);
                if (idx !== -1) {
                    this.queue.splice(idx, 1);
                }
                task.reject(new Error(`Task aborted: ${abortController.signal.reason || 'aborted'}`));
            });
            this.insertByPriority(task);
            this.tick();
        });
    }
    /** Cancel any active or queued task for a specific agent */
    cancelAgent(agentId, reason = 'Cancelled by user/system') {
        let count = 0;
        // 1. Remove and abort from queue
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (this.queue[i]?.agentId === agentId) {
                const task = this.queue.splice(i, 1)[0];
                if (task) {
                    task.abortController.abort(reason);
                    count++;
                }
            }
        }
        return count;
    }
    insertByPriority(task) {
        // Insert sorted by weight descending, then createdAt ascending (FIFO for same priority)
        let insertIndex = this.queue.length;
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            if (!item)
                continue;
            if (task.weight > item.weight) {
                insertIndex = i;
                break;
            }
        }
        this.queue.splice(insertIndex, 0, task);
    }
    tick() {
        if (this.activeCount >= this.maxConcurrent)
            return;
        if (this.queue.length === 0)
            return;
        const task = this.queue.shift();
        if (!task)
            return;
        this.activeCount++;
        task
            .execute(task.abortController.signal)
            .then(result => {
            task.resolve(result);
        })
            .catch(err => {
            task.reject(err);
        })
            .finally(() => {
            this.activeCount--;
            // Immediately try next task
            setImmediate(() => this.tick());
        });
    }
}
