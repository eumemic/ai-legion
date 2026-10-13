type Task<T = void> = () => Promise<T>;

export class TaskQueueStoppedError extends Error {
  constructor() {
    super("Task cancelled because the queue was stopped");
    this.name = "TaskQueueStoppedError";
  }
}

type QueuedTask = {
  run: Task;
  cancel: () => void;
};

export default class TaskQueue {
  private tasks: QueuedTask[] = [];
  private running: Promise<void> | undefined;
  private intervals: NodeJS.Timer[] = [];

  get length() {
    return this.tasks.length;
  }

  run<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.tasks.push({
        run: () => Promise.resolve().then(task).then(resolve).catch(reject),
        cancel: () => reject(new TaskQueueStoppedError()),
      });
      this.runNext();
    });
  }

  runPeriodically(task: Task, milliseconds: number): void {
    let pending = false;
    this.intervals.push(
      setInterval(() => {
        if (pending) return;
        pending = true;
        this.run(task)
          .catch((error) => {
            if (!(error instanceof TaskQueueStoppedError)) throw error;
          })
          .finally(() => {
            pending = false;
          });
      }, milliseconds)
    );
  }

  // Cancel currently queued tasks and timers, and wait for the active task.
  // The queue remains reusable; tasks submitted after this call are accepted.
  async stop() {
    this.tasks.splice(0).forEach((task) => task.cancel());
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    if (this.running) {
      await this.running;
    }
  }

  private async runNext() {
    if (this.running) return;

    const task = this.tasks.shift();
    if (!task) return;

    try {
      await (this.running = task.run());
    } finally {
      this.running = undefined;
    }

    this.runNext();
  }
}
