import { Store } from "../interfaces/store.interface";

export default class InMemoryStore implements Store<string> {
  private map = new Map<string, string>();

  async get(key: string) {
    return this.map.get(key);
  }

  async set(key: string, value: string) {
    this.map.set(key, value);
  }

  async delete(key: string) {
    return this.map.delete(key);
  }

  async getKeys() {
    return [...this.map.keys()];
  }
}
