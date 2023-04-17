"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TaskQueue {
    constructor() {
        this.tasks = [];
        this.intervals = [];
    }
    get length() {
        return this.tasks.length;
    }
    run(task) {
        return new Promise((resolve, reject) => {
            this.tasks.push(() => task().then(resolve).catch(reject));
            this.runNext();
        });
    }
    runPeriodically(task, milliseconds) {
        let pending = false;
        this.intervals.push(setInterval(() => {
            if (pending)
                return;
            pending = true;
            this.run(task).finally(() => {
                pending = false;
            });
        }, milliseconds));
    }
    async stop() {
        this.tasks.length = 0;
        this.intervals.forEach(clearInterval);
        this.intervals = [];
        if (this.running) {
            await this.running;
        }
    }
    async runNext() {
        if (this.running)
            return;
        const task = this.tasks.shift();
        if (!task)
            return;
        try {
            await (this.running = task());
        }
        finally {
            this.running = undefined;
        }
        this.runNext();
    }
}
exports.default = TaskQueue;
