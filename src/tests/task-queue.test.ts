import TaskQueue from "../task-queue";
import { sleep } from "../util";

describe("TaskQueue", () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  afterEach(() => taskQueue.stop());

  describe("run", () => {
    it("should run tasks in serial", async () => {
      const results: number[] = [];

      const task1 = async () => {
        await sleep(100);
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
        await sleep(100);
        numTasksRun++;
      };

      taskQueue.runPeriodically(periodicTask, 10);

      await sleep(500);

      expect(taskQueue.length).toBeLessThanOrEqual(1);
      expect(numTasksRun).toBeGreaterThanOrEqual(3);
      expect(numTasksRun).toBeLessThanOrEqual(5);
    });
  });
});
