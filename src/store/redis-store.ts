import { createClient, RedisClientType } from "redis";
import { promisify } from "util";
import { Store } from "../interfaces/store.interface";

// Create a RedisStore class that implements the Store interface
export class RedisStore<T = string> implements Store<T> {
  private client: RedisClientType;
  private getAsync: (key: string) => Promise<string | null>;
  private setAsync: (key: string, value: string) => Promise<void>;
  private delAsync: (key: string) => Promise<number>;
  private keysAsync: (pattern: string) => Promise<string[]>;

  constructor() {
    // Create a Redis client
    this.client = createClient();

    // Promisify Redis commands
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.keysAsync = promisify(this.client.keys).bind(this.client);
  }

  async get(key: string): Promise<T | undefined> {
    const value = await this.getAsync(key);
    if (value === null) {
      return undefined;
    }
    return JSON.parse(value);
  }

  async set(key: string, value: T): Promise<void> {
    await this.setAsync(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<boolean> {
    const numDeleted = await this.delAsync(key);
    return numDeleted > 0;
  }

  async getKeys(): Promise<string[]> {
    const keys = await this.keysAsync("*");
    return keys;
  }
}
