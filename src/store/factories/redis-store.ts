import { createClient, RedisClientType } from "redis";
import { promisify } from "util";
import { DataStore } from "interfaces/datastore";

// Implement the RedisDataStore class with generics
export class RedisStore<T> implements DataStore<T> {
  private client: RedisClientType;
  public modelState: T;

  // Promisify Redis client methods
  private getAsync: (key: string) => Promise<string>;
  private setAsync: (key: string, value: string) => Promise<void>;
  private delAsync: (key: string) => Promise<void>;
  private keysAsync: (pattern: string) => Promise<string[]>;

  constructor(modelState: T) {
    this.client = createClient();
    this.modelState = modelState;

    // Bind and promisify Redis client methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.keysAsync = promisify(this.client.keys).bind(this.client);

    this.client.on("error", (error) => {
      console.error("Redis error:", error);
    });

    this.client.on("ready", async () => {
      console.log("Redis is ready.");
    });

    this.client.connect();
  }

  async get<K extends keyof T>(key: K): Promise<T[K]> {
    const value = await this.getAsync(key as string);
    return JSON.parse(value);
  }

  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    await this.setAsync(key as string, JSON.stringify(value));
  }

  async delete(key: keyof T): Promise<void> {
    await this.delAsync(key as string);
  }

  async getKeys(): Promise<string[]> {
    return this.keysAsync("*");
  }

  close(): void {
    this.client.quit();
  }
}
