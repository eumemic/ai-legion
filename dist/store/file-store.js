"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const STORE_DIR = ".store";
class FileStore {
    constructor(namespaces) {
        this.namespaces = namespaces;
    }
    async get(key) {
        await this.mkdirs();
        const path = this.pathFor(key);
        const fileExists = await checkExists(path);
        if (!fileExists)
            return undefined;
        const buffer = await (0, promises_1.readFile)(path, "utf-8");
        return buffer.toString();
    }
    async set(key, value) {
        await this.mkdirs();
        await (0, promises_1.writeFile)(this.pathFor(key), value, "utf-8");
    }
    async delete(key) {
        await this.mkdirs();
        const path = this.pathFor(key);
        const fileExists = await checkExists(path);
        if (!fileExists)
            return false;
        await (0, promises_1.unlink)(path);
        return true;
    }
    async getKeys() {
        await this.mkdirs();
        const fileNames = await (0, promises_1.readdir)(this.dirPath);
        // Get file stats for each file in parallel
        const withStats = await Promise.all(fileNames.map(async (fileName) => {
            const stats = await (0, promises_1.stat)(`${this.dirPath}/${fileName}`);
            return { keyName: decodeFilename(fileName), stats };
        }));
        // Sort by last modified date
        const sortedKeys = withStats
            .sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime())
            .map(({ keyName }) => keyName);
        return sortedKeys;
    }
    async mkdirs() {
        await (0, promises_1.mkdir)(this.dirPath, { recursive: true });
    }
    pathFor(key) {
        return path_1.default.join(this.dirPath, encodeFilename(key));
    }
    get dirPath() {
        return path_1.default.join(STORE_DIR, ...this.namespaces);
    }
}
exports.default = FileStore;
async function checkExists(path) {
    try {
        await (0, promises_1.stat)(path);
        return true;
    }
    catch (e) {
        if (e.code === "ENOENT") {
            // Does not exist
            return false;
        }
        else {
            // Some other error occurred
            throw e;
        }
    }
}
function encodeChar(char) {
    return "%" + char.charCodeAt(0).toString(16);
}
function decodeChar(encodedChar) {
    return String.fromCharCode(parseInt(encodedChar.slice(1), 16));
}
function encodeFilename(filename) {
    // Replace invalid characters with their encoded versions
    const replaced = filename.replace(/[\\/:*?"<>|]/g, encodeChar);
    // Limit the filename length, as some file systems have restrictions
    const maxLength = 255;
    const trimmed = replaced.slice(0, maxLength);
    return trimmed;
}
function decodeFilename(filename) {
    // Decode the escaped characters back to their original form
    return filename.replace(/%[0-9a-fA-F]{2}/g, decodeChar);
}
