"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMessageBus = void 0;
const events_1 = require("events");
class InMemoryMessageBus {
    constructor() {
        this.emitter = new events_1.EventEmitter();
    }
    subscribe(listener) {
        this.emitter.on("message", listener);
    }
    unsubscribe(listener) {
        this.emitter.off("message", listener);
    }
    send(message) {
        this.emitter.emit("message", message);
    }
}
exports.InMemoryMessageBus = InMemoryMessageBus;
