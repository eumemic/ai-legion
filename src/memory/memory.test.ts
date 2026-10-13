jest.mock("../openai", () => ({ createChatCompletion: jest.fn() }));
jest.mock("../parameters", () => ({ model: "test-model" }));

import { Event, Memory } from ".";
import { ModuleManager } from "../module/module-manager";
import { createChatCompletion } from "../openai";
import { Store } from "../store";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

function decision(actionText: string): Event {
  return { type: "decision", actionText };
}

function createStore(initialEvents?: Event[]) {
  let events = initialEvents;
  const store: Store<Event[]> = {
    get: jest.fn(async () => events?.slice()),
    set: jest.fn(async (_key, value) => {
      events = value.slice();
    }),
    delete: jest.fn(async () => false),
    getKeys: jest.fn(async () => []),
  };
  return { store, read: () => events };
}

describe("Memory", () => {
  const completion = jest.mocked(createChatCompletion);

  beforeEach(() => {
    completion.mockReset();
    completion.mockRejectedValue(new Error("Unexpected model request"));
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  function createMemory(store: Store<Event[]>, threshold = Infinity) {
    return new Memory("1", new ModuleManager("1", ["1"], []), store, threshold);
  }

  it("preserves concurrent appends while a write is pending", async () => {
    const { store, read } = createStore();
    const memory = createMemory(store);
    await memory.retrieve();

    const writeStarted = deferred();
    const releaseWrite = deferred();
    const write = jest.mocked(store.set).getMockImplementation()!;
    jest.mocked(store.set).mockImplementationOnce(async (key, events) => {
      writeStarted.resolve();
      await releaseWrite.promise;
      await write(key, events);
    });

    const first = memory.append(decision("first"));
    await writeStarted.promise;
    const second = memory.append(decision("second"));
    // Drain the other call's promise continuations before releasing the write.
    await new Promise<void>((resolve) => setImmediate(resolve));
    releaseWrite.resolve();
    await Promise.all([first, second]);

    expect(read()).toEqual([
      decision("noop"),
      decision("first"),
      decision("second"),
    ]);
    expect(completion).not.toHaveBeenCalled();
  });

  it("does not let first retrieval overwrite a concurrent append", async () => {
    const { store, read } = createStore();
    const memory = createMemory(store);
    const writeStarted = deferred();
    const releaseWrite = deferred();
    const write = jest.mocked(store.set).getMockImplementation()!;
    jest.mocked(store.set).mockImplementationOnce(async (key, events) => {
      writeStarted.resolve();
      await releaseWrite.promise;
      await write(key, events);
    });

    const retrieval = memory.retrieve();
    await writeStarted.promise;
    const append = memory.append(decision("first"));
    await new Promise<void>((resolve) => setImmediate(resolve));
    releaseWrite.resolve();
    await Promise.all([retrieval, append]);

    expect(read()).toEqual([decision("noop"), decision("first")]);
    expect(completion).not.toHaveBeenCalled();
  });

  it("waits for summarization before reading for the next append", async () => {
    const { store, read } = createStore();
    const memory = createMemory(store, 100);
    await memory.retrieve();
    const summaryStarted = deferred();
    const releaseSummary = deferred();
    completion.mockImplementationOnce(async () => {
      summaryStarted.resolve();
      await releaseSummary.promise;
      return "Summary";
    });
    jest.mocked(store.get).mockClear();

    const first = memory.append(decision("long history ".repeat(100)));
    await summaryStarted.promise;
    const second = memory.append(decision("second"));
    await new Promise<void>((resolve) => setImmediate(resolve));
    const readsWhileSummarizing = jest.mocked(store.get).mock.calls.length;
    releaseSummary.resolve();
    await Promise.all([first, second]);

    expect(readsWhileSummarizing).toBe(1);
    expect(read()?.slice(-1)).toEqual([decision("second")]);
    expect(completion).toHaveBeenCalledTimes(1);
  });

  it("continues queued operations after a rejected write", async () => {
    const { store, read } = createStore();
    const memory = createMemory(store);
    await memory.retrieve();
    const failure = new Error("Write failed");
    jest.mocked(store.set).mockRejectedValueOnce(failure);

    const failed = memory.append(decision("failed"));
    const rejection = expect(failed).rejects.toBe(failure);
    const successful = memory.append(decision("successful"));
    await rejection;
    await successful;

    expect(read()).toEqual([decision("noop"), decision("successful")]);
  });

  it("retries first retrieval after a rejected initialization write", async () => {
    const { store, read } = createStore();
    const memory = createMemory(store);
    const failure = new Error("Write failed");
    jest.mocked(store.set).mockRejectedValueOnce(failure);

    await expect(memory.retrieve()).rejects.toBe(failure);
    await memory.retrieve();

    expect(store.set).toHaveBeenCalledTimes(2);
    expect(read()).toEqual([decision("noop")]);
  });

  it("continues queued operations after rejected summarization", async () => {
    const { store } = createStore([decision("long history ".repeat(100))]);
    const memory = createMemory(store, 20);
    const failure = new Error("Summary failed");
    completion.mockRejectedValueOnce(failure).mockResolvedValueOnce("Summary");

    const failed = memory.retrieve();
    const rejection = expect(failed).rejects.toBe(failure);
    const successful = memory.retrieve();
    await rejection;
    await successful;

    expect(completion).toHaveBeenCalledTimes(2);
    expect(store.set).toHaveBeenCalledTimes(1);
  });
});
