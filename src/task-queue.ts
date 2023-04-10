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

  private async runNext() {
    if (this.isRunning || isEmpty(this.tasks)) return;

    this.isRunning = true;

    try {
      const tasksCopy = [...this.tasks];
      this.tasks.length = 0;

      for (const task of tasksCopy) {
        await task();
      }
    } finally {
      this.isRunning = false;
    }

    this.runNext();
  }
}
