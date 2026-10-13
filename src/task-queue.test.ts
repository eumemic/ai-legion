import TaskQueue, { TaskQueueStoppedError } from "./task-queue";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("TaskQueue", () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  afterEach(async () => {
    await taskQueue.stop();
    jest.useRealTimers();
  });

  describe("run", () => {
    it("should run tasks in serial", async () => {
      const results: number[] = [];
      const active = deferred<void>();

      const task1 = async () => {
        await active.promise;
        results.push(1);
      };
      const task2 = async () => {
        results.push(2);
      };

      const tasks = [taskQueue.run(task1), taskQueue.run(task2)];
      expect(results).toEqual([]);
      expect(taskQueue.length).toBe(1);
      active.resolve();
      await Promise.all(tasks);

      expect(results).toEqual([1, 2]);
    });

    it.each(["rejection", "synchronous throw"])(
      "should reject a task's caller and continue after a %s",
      async (failure) => {
        const error = new Error("task failed");
        const failed = taskQueue.run(() => {
          if (failure === "synchronous throw") throw error;
          return Promise.reject(error);
        });
        const next = taskQueue.run(async () => 2);

        await expect(failed).rejects.toBe(error);
        await expect(next).resolves.toBe(2);
      }
    );
  });

  describe("runPeriodically", () => {
    it("should skip re-scheduling task if still pending", async () => {
      jest.useFakeTimers();
      const active = deferred<void>();
      const periodicTask = jest.fn(() => active.promise);

      taskQueue.runPeriodically(periodicTask, 10);

      await jest.advanceTimersByTimeAsync(500);

      expect(taskQueue.length).toBe(0);
      expect(periodicTask).toHaveBeenCalledTimes(1);
      active.resolve();
      await jest.advanceTimersByTimeAsync(10);
      expect(periodicTask).toHaveBeenCalledTimes(2);
    });

    it("should handle cancellation of queued periodic work and clear timers", async () => {
      jest.useFakeTimers();
      const active = deferred<void>();
      const activeResult = taskQueue.run(() => active.promise);
      const periodicTask = jest.fn(async () => undefined);
      taskQueue.runPeriodically(periodicTask, 10);
      await jest.advanceTimersByTimeAsync(10);
      expect(taskQueue.length).toBe(1);

      const stopping = taskQueue.stop();
      // Flush the fire-and-forget promise handlers, including cancellation.
      await jest.advanceTimersByTimeAsync(100);
      expect(jest.getTimerCount()).toBe(0);
      expect(periodicTask).not.toHaveBeenCalled();
      active.resolve();
      await activeResult;
      await stopping;
    });
  });

  describe("stop", () => {
    it("should reject every queued caller while letting the active task finish", async () => {
      const active = deferred<number>();
      const activeResult = taskQueue.run(() => active.promise);
      const queuedTask = jest.fn(async () => 2);
      const cancelled: unknown[] = [];
      const queuedResults = [
        taskQueue.run(queuedTask),
        taskQueue.run(queuedTask),
      ].map((result) => result.catch((error) => cancelled.push(error)));
      let stopped = false;
      const stopping = taskQueue.stop().then(() => {
        stopped = true;
      });

      // Observe cancellation without waiting forever for an unsettled promise.
      await Promise.resolve();
      await Promise.resolve();
      const cancelledBeforeFinish = [...cancelled];
      const stoppedBeforeFinish = stopped;
      active.resolve(1);
      await stopping;

      expect(stoppedBeforeFinish).toBe(false);
      expect(await activeResult).toBe(1);
      expect(queuedTask).not.toHaveBeenCalled();
      expect(taskQueue.length).toBe(0);
      expect(cancelledBeforeFinish).toEqual([
        expect.any(TaskQueueStoppedError),
        expect.any(TaskQueueStoppedError),
      ]);
      await Promise.all(queuedResults);
    });

    it("should allow new tasks during and after stopping", async () => {
      const active = deferred<void>();
      const activeResult = taskQueue.run(() => active.promise);
      const stopping = taskQueue.stop();
      const next = taskQueue.run(async () => 2);

      active.resolve();
      await stopping;
      await activeResult;
      await expect(next).resolves.toBe(2);
      await expect(taskQueue.run(async () => 3)).resolves.toBe(3);
      await taskQueue.stop();
      await taskQueue.stop();
    });
  });
});
