import { Store } from ".";
import { readFile, writeFile, mkdir, stat } from "fs/promises";
import path from "path";

const STORE_DIR = ".store";

export class FileStore implements Store {
  async get(key: string) {
    const path = pathFor(key);
    const fileExists = await checkExists(path);
    if (!fileExists) return undefined;
    const buffer = await readFile(path, "utf-8");
    return buffer.toString();
  }

  async set(key: string, value: string) {
    const dirExists = await checkExists(STORE_DIR);
    if (!dirExists) await mkdir(STORE_DIR);
    await writeFile(pathFor(key), value, "utf-8");
  }
}

function pathFor(key: string) {
  return path.join(STORE_DIR, key);
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
