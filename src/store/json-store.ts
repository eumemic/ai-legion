import { Store } from "../interfaces/store.interface";

export default class JsonStore<T> implements Store<T> {
  constructor(private stringStore: Store<string>) {}

  async get(key: string) {
    const stringValue = await this.stringStore.get(key);
    return stringValue && JSON.parse(stringValue);
  }

  async set(key: string, value: T) {
    return this.stringStore.set(key, JSON.stringify(value, null, 2));
  }

  async delete(key: string) {
    return this.stringStore.delete(key);
  }

  async getKeys() {
    return this.stringStore.getKeys();
  }
}
