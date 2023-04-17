"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisMessageBus = void 0;
const redis_1 = require("redis");
class RedisMessageBus {
    constructor() {
        this.channel = "messages";
        this.publisher = (0, redis_1.createClient)();
        this.subscriber = (0, redis_1.createClient)();
    }
    subscribe(listener) {
        this.subscriber.on("message", (channel, message) => {
            if (channel === this.channel) {
                listener(JSON.parse(message));
            }
        });
        this.subscriber.subscribe(this.channel, () => { });
    }
    unsubscribe(listener) {
        this.subscriber.removeListener("message", listener);
        this.subscriber.unsubscribe(this.channel, () => { });
    }
    send(message) {
        this.publisher.publish(this.channel, JSON.stringify(message));
    }
}
exports.RedisMessageBus = RedisMessageBus;
