import axios, { AxiosAdapter, AxiosError, CanceledError } from "axios";
import { google } from "googleapis";
import ActionHandler from "../../action-handler";
import { InMemoryMessageBus } from "../../in-memory-message-bus";
import { Message } from "../../message";
import parseAction from "../../parse-action";
import { ModuleManager } from "../module-manager";
import web from "./web";

jest.mock("googleapis", () => ({
  google: { customsearch: jest.fn() },
}));
jest.mock("puppeteer", () => ({ launch: jest.fn() }));

const originalAdapter = axios.defaults.adapter;
const originalEnv = { ...process.env };
let calls: { method: string; params: any; headers: any; url: string }[];
let toolResult: any;
let toolError: Error | undefined;
let sse: boolean;
let pending: boolean;
let wireReply: string | undefined;

beforeEach(() => {
  process.env = { ...originalEnv };
  for (const key of [
    "GOOGLE_API_KEY",
    "GOOGLE_SEARCH_ENGINE_ID",
    "WEB_SEARCH_PROVIDER",
    "PARALLEL_API_KEY",
    "OPENAI_API_KEY",
  ]) {
    delete process.env[key];
  }
  calls = [];
  toolResult = {
    content: [
      {
        type: "text",
        text: "Title: MCP docs\nURL: https://example.org/docs?q=a%20b#section\nExcerpt: Current documentation.",
      },
    ],
  };
  toolError = undefined;
  sse = false;
  pending = false;
  wireReply = undefined;
  jest.clearAllMocks();
  const adapter: AxiosAdapter = async (config) => {
    expect(config.url).toBe("https://search.parallel.ai/mcp");
    expect(config.headers.get("User-Agent")).toBe(
      "ai-legion/1.0.0 (https://github.com/eumemic/ai-legion)"
    );
    expect(config.headers.get("Authorization")).toBeUndefined();
    expect(config.maxRedirects).toBe(0);
    if (config.method === "delete") {
      calls.push({
        method: "delete",
        params: null,
        headers: config.headers.toJSON(),
        url: config.url!,
      });
      return { data: "", status: 200, statusText: "OK", headers: {}, config };
    }
    expect(config.timeout).toBe(30000);
    const request = JSON.parse(config.data);
    calls.push({
      ...request,
      headers: config.headers.toJSON(),
      url: config.url!,
    });
    if (request.method === "tools/call" && pending) {
      await new Promise((resolve, reject) => {
        if (config.signal?.aborted) reject(new CanceledError());
        config.signal?.addEventListener?.("abort", () =>
          reject(new CanceledError())
        );
      });
    }
    if (request.method === "tools/call" && toolError) throw toolError;
    const result =
      request.method === "initialize"
        ? { protocolVersion: "2024-11-05" }
        : toolResult;
    const data = JSON.stringify({ jsonrpc: "2.0", id: request.id, result });
    return {
      data:
        request.method === "notifications/initialized"
          ? ""
          : request.method === "tools/call" && wireReply !== undefined
          ? wireReply
          : sse
          ? `: keepalive\r\n\r\nevent: message\r\ndata: ${data}\r\n\r\n`
          : data,
      status: request.method === "notifications/initialized" ? 202 : 200,
      statusText: "OK",
      headers:
        request.method === "initialize"
          ? { "mcp-session-id": "transport-only" }
          : {},
      config,
    };
  };
  axios.defaults.adapter = adapter;
});

afterEach(() => {
  axios.defaults.adapter = originalAdapter;
  process.env = originalEnv;
  jest.useRealTimers();
});

function agent(id = "1", includeWeb = true) {
  const manager = new ModuleManager(id, ["1", "2"], includeWeb ? [web] : []);
  const bus = new InMemoryMessageBus();
  const messages: Message[] = [];
  bus.subscribe((message) => messages.push(message));
  const handler = new ActionHandler([id], bus, manager);
  return {
    manager,
    messages,
    async act(text: string, signal?: AbortSignal) {
      const parsed = parseAction(manager.actions, text);
      if (parsed.type === "error") throw new Error(parsed.message);
      await handler.handle(id, parsed.action, signal);
      return messages[messages.length - 1];
    },
  };
}

const search = "searchWeb\nsearchString: current MCP documentation";
const fetch = "readPage\nurl: https://example.org/docs?q=a%20b#section";
const tools = () => calls.filter((call) => call.method === "tools/call");

test("fresh no-key actions consume search and fetch text with URLs on the message bus", async () => {
  const a = agent();
  expect((await a.act(search)).content).toContain(
    "https://example.org/docs?q=a%20b#section"
  );
  toolResult = {
    content: [{ type: "text", text: "# Page\nRelevant markdown excerpt." }],
  };
  expect((await a.act(fetch)).content).toContain("Relevant markdown excerpt");
  expect(tools().map((call) => call.params.name)).toEqual([
    "web_search",
    "web_fetch",
  ]);
  expect(tools()[0].params.arguments).toEqual({
    objective: "current MCP documentation",
    search_queries: ["current MCP documentation"],
    session_id: a.manager.researchSessionId,
  });
  expect(tools()[1].params.arguments.urls).toEqual([
    "https://example.org/docs?q=a%20b#section",
  ]);
  expect(calls.map((call) => call.method)).toEqual([
    "initialize",
    "notifications/initialized",
    "tools/call",
    "delete",
    "initialize",
    "notifications/initialized",
    "tools/call",
    "delete",
  ]);
  expect(tools()[0].headers["Mcp-Session-Id"]).toBe("transport-only");
  expect(tools()[0].headers["MCP-Protocol-Version"]).toBe("2024-11-05");
  expect(google.customsearch).not.toHaveBeenCalled();
});

test("interleaved agents, retries, quota errors and new research runs keep correct identities", async () => {
  const a = agent();
  const b = agent("2");
  await Promise.all([a.act(search), b.act(fetch)]);
  toolResult = {
    isError: true,
    content: [{ type: "text", text: "Free usage quota exceeded" }],
  };
  expect((await a.act(search)).type).toBe("error");
  toolResult = { content: [{ type: "text", text: "Recovered result" }] };
  await a.act(fetch);
  await b.act(search);
  const restarted = agent();
  await restarted.act(search);
  const ids = tools().map((call) => call.params.arguments.session_id);
  expect(ids).toEqual([
    a.manager.researchSessionId,
    b.manager.researchSessionId,
    a.manager.researchSessionId,
    a.manager.researchSessionId,
    b.manager.researchSessionId,
    restarted.manager.researchSessionId,
  ]);
  expect(new Set([ids[0], ids[1], ids[5]]).size).toBe(3);
  expect(ids[0]).toMatch(/^[a-f0-9]{32}$/);
});

test("explicit Parallel overrides configured Google without forwarding any keys", async () => {
  process.env.WEB_SEARCH_PROVIDER = "parallel";
  process.env.GOOGLE_API_KEY = "google-secret";
  process.env.GOOGLE_SEARCH_ENGINE_ID = "engine";
  process.env.PARALLEL_API_KEY = "ignored-secret";
  await agent().act(search);
  expect(google.customsearch).not.toHaveBeenCalled();
  expect(JSON.stringify(calls)).not.toMatch(/google-secret|ignored-secret/);
});

test.each([undefined, "google"])(
  "configured Google remains selected (%s)",
  async (provider) => {
    if (provider) process.env.WEB_SEARCH_PROVIDER = provider;
    process.env.GOOGLE_API_KEY = "key";
    process.env.GOOGLE_SEARCH_ENGINE_ID = "engine";
    const list = jest.fn().mockResolvedValue({
      data: {
        items: [{ title: "Google result", link: "https://example.org/google" }],
      },
    });
    (google.customsearch as unknown as jest.Mock).mockReturnValue({
      cse: { list },
    });
    const a = agent();
    const message = await a.act(search);
    expect(message.content).toContain("Google result");
    expect(list).toHaveBeenCalledWith({
      q: "current MCP documentation",
      cx: "engine",
      key: "key",
    });
    expect(calls).toHaveLength(0);
    list.mockRejectedValue(new Error("Google rate limited"));
    expect((await a.act(search)).content).toContain("Google rate limited");
    expect(calls).toHaveLength(0);
  }
);

test.each(["GOOGLE_API_KEY", "GOOGLE_SEARCH_ENGINE_ID"])(
  "partial Google configuration is not silently replaced: %s",
  async (key) => {
    process.env[key] = "configured";
    expect((await agent().act(search)).content).toContain(
      "Google search requires"
    );
    expect(calls).toHaveLength(0);
  }
);

test.each(["none", "typo", "google"])(
  "explicit %s does not fall back",
  async (provider) => {
    process.env.WEB_SEARCH_PROVIDER = provider;
    const a = agent();
    expect((await a.act(search)).type).toBe("error");
    if (provider !== "google") expect((await a.act(fetch)).type).toBe("error");
    expect(calls).toHaveLength(0);
  }
);

test("omitting web registration prevents the normal dispatcher from accepting web actions", async () => {
  const a = agent("1", false);
  await expect(a.act(search)).rejects.toThrow("Unknown action");
  await expect(a.act(fetch)).rejects.toThrow("Unknown action");
  expect(calls).toHaveLength(0);
});

test.each([
  "file:///etc/passwd",
  "javascript:alert(1)",
  "https://name:secret@example.org",
  "invalid",
])("invalid fetch URL does not reach MCP: %s", async (url) => {
  expect((await agent().act(`readPage\nurl: ${url}`)).type).toBe("error");
  expect(calls).toHaveLength(0);
});

test("finite SSE responses preserve useful text", async () => {
  sse = true;
  expect((await agent().act(search)).content).toContain(
    "Current documentation"
  );
});

test.each([
  "garbage",
  '{"jsonrpc":"2.0","id":9,"result":{}}',
  '{"jsonrpc":"2.0","id":2,"error":{"message":"Bad query"}}',
])("protocol failures become agent errors", async (reply) => {
  wireReply = reply;
  expect((await agent().act(search)).type).toBe("error");
  expect(calls[calls.length - 1].method).toBe("delete");
});

test.each([
  { content: {} },
  { content: [{ type: "text", text: 42 }] },
  { content: [] },
  { isError: true, content: [{ type: "text", text: "Quota exceeded" }] },
])("empty/error tool output is not reported as success", async (result) => {
  toolResult = result;
  expect((await agent().act(fetch)).type).toBe("error");
});

test("transport timeout reaches the agent without provider fallback", async () => {
  toolError = new AxiosError("timeout of 30000ms exceeded", "ECONNABORTED");
  expect((await agent().act(search)).content).toContain("timeout");
  expect(tools()).toHaveLength(1);
  expect(google.customsearch).not.toHaveBeenCalled();
});

test("the normal dispatcher passes cancellation to pending MCP requests", async () => {
  pending = true;
  const controller = new AbortController();
  const action = agent().act(search, controller.signal);
  while (!tools().length) await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  expect((await action).type).toBe("error");
  expect(calls[calls.length - 1].method).toBe("delete");
});

test("long responses are bounded before message consumption", async () => {
  toolResult = { content: [{ type: "text", text: "x".repeat(13000) }] };
  const message = await agent().act(search);
  expect(message.content).toHaveLength(12020);
  expect(message.content.endsWith("[Content truncated]")).toBe(true);
});

test("an absolute deadline cancels a pending tool even if the connection stays open", async () => {
  jest.useFakeTimers({ doNotFake: ["setImmediate"] });
  pending = true;
  const action = agent().act(search);
  while (!tools().length) await new Promise((resolve) => setImmediate(resolve));
  await jest.advanceTimersByTimeAsync(30000);
  const message = await action;
  expect(message.type).toBe("error");
  expect(message.content).toContain("timed out after 30 seconds");
  expect(calls[calls.length - 1].method).toBe("delete");
});
