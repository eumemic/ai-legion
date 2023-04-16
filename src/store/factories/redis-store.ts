import { createClient, RedisClientType } from "redis";

export class RedisStore<T> {
  private client: RedisClientType;
  public modelState: T;

  constructor(modelState: T) {
    this.client = createClient();
    this.modelState = modelState;

    this.client.on("error", (error) => {
      console.error("Redis error:", error);
    });

    this.client.on("ready", async () => {
      console.log("Redis is ready.");
      await this.initializeStore();
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  private async initializeStore(): Promise<void> {
    for (const key in this.modelState) {
      if (Object.prototype.hasOwnProperty.call(this.modelState, key)) {
        await this.set(key as keyof T, this.modelState[key]);
      }
    }
  }

  async get<K extends keyof T>(key: K): Promise<T[K]> {
    const value = await this.client.get(key.toString());
    return JSON.parse(value as string);
  }

  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    await this.client.set(key.toString(), JSON.stringify(value));
  }

  async delete(key: keyof T): Promise<void> {
    await this.client.del(key.toString());
  }

  async getKeys(): Promise<string[]> {
    const keys = await this.client.keys("*");
    return keys;
  }

  close(): void {
    this.client.quit();
  }
}
