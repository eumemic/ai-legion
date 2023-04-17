"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonStore {
    constructor(stringStore) {
        this.stringStore = stringStore;
    }
    async get(key) {
        const stringValue = await this.stringStore.get(key);
        return stringValue && JSON.parse(stringValue);
    }
    async set(key, value) {
        return this.stringStore.set(key, JSON.stringify(value, null, 2));
    }
    async delete(key) {
        return this.stringStore.delete(key);
    }
    async getKeys() {
        return this.stringStore.getKeys();
    }
}
exports.default = JsonStore;
