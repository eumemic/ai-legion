"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMessageBus = void 0;
const events_1 = require("events");
class InMemoryMessageBus extends events_1.EventEmitter {
    subscribe(listener) {
        this.addListener("message", listener);
    }
    unsubscribe(listener) {
        this.removeListener("message", listener);
    }
    send(message) {
        this.emit("message", message);
    }
}
exports.InMemoryMessageBus = InMemoryMessageBus;
