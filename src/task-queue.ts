type Task<T = void> = () => Promise<T>;

export default class TaskQueue {
  private tasks: Task[] = [];
  private running: Promise<void> | undefined;
  private intervals: NodeJS.Timer[] = [];

  get length() {
    return this.tasks.length;
  }

  run<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.tasks.push(() => task().then(resolve).catch(reject));
      this.runNext();
    });
  }

  runPeriodically(task: Task, milliseconds: number): void {
    let pending = false;
    this.intervals.push(
      setInterval(() => {
        if (pending) return;
        pending = true;
        this.run(task).finally(() => {
          pending = false;
        });
      }, milliseconds)
    );
  }

  async stop() {
    this.tasks.length = 0;
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
      await (this.running = task());
    } finally {
      this.running = undefined;
    }

    this.runNext();
  }
}
