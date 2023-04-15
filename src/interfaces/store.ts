export interface Store<T = string> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  getKeys(): Promise<string[]>;
}
