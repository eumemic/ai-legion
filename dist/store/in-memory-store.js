"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InMemoryStore {
    constructor() {
        this.map = new Map();
    }
    async get(key) {
        return this.map.get(key);
    }
    async set(key, value) {
        this.map.set(key, value);
    }
    async delete(key) {
        return this.map.delete(key);
    }
    async getKeys() {
        return [...this.map.keys()];
    }
}
exports.default = InMemoryStore;
