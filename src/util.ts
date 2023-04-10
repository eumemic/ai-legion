export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export function sleepUntil(condition: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}
