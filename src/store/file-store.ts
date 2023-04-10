import { Store } from ".";
import { readFile, writeFile, mkdir, stat, unlink, readdir } from "fs/promises";
import path from "path";

const STORE_DIR = ".store";

export class FileStore implements Store {
  constructor(private namespaces: string[]) {}

  async get(key: string) {
    await this.mkdirs();
    const path = this.pathFor(key);
    const fileExists = await checkExists(path);
    if (!fileExists) return undefined;
    const buffer = await readFile(path, "utf-8");
    return buffer.toString();
  }

  async set(key: string, value: string) {
    await this.mkdirs();
    await writeFile(this.pathFor(key), value, "utf-8");
  }

  async delete(key: string) {
    await this.mkdirs();
    const path = this.pathFor(key);
    const fileExists = await checkExists(path);
    if (!fileExists) return false;
    await unlink(path);
    return true;
  }

  async list() {
    await this.mkdirs();
    return readdir(this.dirPath);
  }

  private async mkdirs() {
    await mkdir(this.dirPath, { recursive: true });
  }

  private pathFor(key: string) {
    return path.join(this.dirPath, key);
  }

  private get dirPath() {
    return path.join(STORE_DIR, ...this.namespaces);
  }
}

async function checkExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (e: any) {
    if (e.code === "ENOENT") {
      // Does not exist
      return false;
    } else {
      // Some other error occurred
      throw e;
    }
  }
}
