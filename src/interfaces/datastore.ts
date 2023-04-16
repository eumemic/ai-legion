export interface DataStore<T> {
  get<K extends keyof T>(key: K): Promise<T[K]>;
  set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
  delete(key: keyof T): Promise<void>;
  getKeys(): Promise<string[]>;
}
