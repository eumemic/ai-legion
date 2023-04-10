import { isEmpty } from "lodash";

type Task<T = void> = () => Promise<T>;

export default class TaskQueue {
  private tasks: Task[] = [];
  private isRunning = false;

  run<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.tasks.push(() => task().then(resolve).catch(reject));
      this.runNext();
    });
  }

  runPeriodically(task: Task, milliseconds: number): void {
    let pending = false;
    setInterval(() => {
      if (pending) {
        console.log("skipping task");
        return;
      }
      pending = true;
      try {
        this.run(task);
      } finally {
        pending = false;
      }
    }, milliseconds);
  }

  private async runNext() {
    if (this.isRunning) return;

    const task = this.tasks.shift();
    if (!task) return;

    this.isRunning = true;

    try {
      await task();
    } finally {
      this.isRunning = false;
    }

    this.runNext();
  }
}
