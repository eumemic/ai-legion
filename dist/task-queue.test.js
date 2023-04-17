"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const task_queue_1 = __importDefault(require("./task-queue"));
const util_1 = require("./util");
describe("TaskQueue", () => {
    let taskQueue;
    beforeEach(() => {
        taskQueue = new task_queue_1.default();
    });
    afterEach(() => taskQueue.stop());
    describe("run", () => {
        it("should run tasks in serial", async () => {
            const results = [];
            const task1 = async () => {
                await (0, util_1.sleep)(100);
                results.push(1);
            };
            const task2 = async () => {
                results.push(2);
            };
            await Promise.all([taskQueue.run(task1), taskQueue.run(task2)]);
            expect(results).toEqual([1, 2]);
        });
    });
    describe("runPeriodically", () => {
        it("should skip re-scheduling task if still pending", async () => {
            let numTasksRun = 0;
            const periodicTask = async () => {
                await (0, util_1.sleep)(100);
                numTasksRun++;
            };
            taskQueue.runPeriodically(periodicTask, 10);
            await (0, util_1.sleep)(500);
            expect(taskQueue.length).toBeLessThanOrEqual(1);
            expect(numTasksRun).toBeGreaterThanOrEqual(3);
            expect(numTasksRun).toBeLessThanOrEqual(5);
        });
    });
});
