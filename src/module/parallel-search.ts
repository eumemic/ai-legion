import axios from "axios";

const endpoint = "https://search.parallel.ai/mcp";
const protocolVersion = "2024-11-05";
const userAgent = "ai-legion/1.0.0 (https://github.com/eumemic/ai-legion)";

// One short-lived HTTP MCP connection per call. The research session belongs to
// the agent, independently of this connection's Mcp-Session-Id.
export async function callParallel(
  name: "web_search" | "web_fetch",
  args: Record<string, unknown>,
  sessionId: string,
  signal?: AbortSignal
): Promise<string> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 30000);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "User-Agent": userAgent,
  };
  const options = {
    headers,
    timeout: 30000,
    signal: controller.signal,
    responseType: "text" as const,
    maxContentLength: 2 * 1024 * 1024,
    maxRedirects: 0,
  };
  try {
    const initialized = await axios.post(
      endpoint,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: "ai-legion", version: "1.0.0" },
        },
      },
      options
    );
    if (initialized.headers["mcp-session-id"]) {
      headers["Mcp-Session-Id"] = initialized.headers["mcp-session-id"];
    }
    const initialization = readReply(initialized.data, 1);
    if (initialization.protocolVersion !== protocolVersion) {
      throw new Error("Parallel MCP returned an unsupported protocol version.");
    }
    headers["MCP-Protocol-Version"] = protocolVersion;
    await axios.post(
      endpoint,
      { jsonrpc: "2.0", method: "notifications/initialized" },
      options
    );
    const response = await axios.post(
      endpoint,
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name, arguments: { ...args, session_id: sessionId } },
      },
      options
    );
    const result = readReply(response.data, 2);
    if (!Array.isArray(result.content)) {
      throw new Error("Invalid Parallel MCP tool content.");
    }
    const blocks = result.content.filter(
      (block: any) => block?.type === "text"
    );
    if (blocks.some((block: any) => typeof block.text !== "string")) {
      throw new Error("Invalid Parallel MCP text content.");
    }
    const text = blocks.map((block: any) => block.text).join("\n");
    if (result.isError) throw new Error(text || "Parallel tool failed.");
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Parallel MCP returned no text content.");
    }
    // Bound the material added to the agent's memory/context.
    return text.length > 12000
      ? text.slice(0, 12000) + "\n[Content truncated]"
      : text;
  } catch (error) {
    if (timedOut)
      throw new Error("Parallel MCP operation timed out after 30 seconds.");
    throw error;
  } finally {
    clearTimeout(deadline);
    signal?.removeEventListener("abort", abort);
    if (headers["Mcp-Session-Id"]) {
      // Session cleanup must not replace a useful result or the original error.
      await axios
        .delete(endpoint, { headers, timeout: 5000, maxRedirects: 0 })
        .catch(() => undefined);
    }
  }
}

function readReply(body: string, id: number): any {
  let messages: any[];
  try {
    // Streamable HTTP permits either JSON or a finite SSE response.
    messages = body.trimStart().startsWith("{")
      ? [JSON.parse(body)]
      : body
          .split(/\r?\n\r?\n/)
          .map((event) =>
            event
              .split(/\r?\n/)
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trimStart())
              .join("\n")
          )
          .filter(Boolean)
          .map((data) => JSON.parse(data));
  } catch {
    throw new Error("Invalid Parallel MCP response.");
  }
  const reply = messages.find((message) => message?.id === id);
  if (!reply || reply.jsonrpc !== "2.0") {
    throw new Error("Missing Parallel MCP response.");
  }
  if (reply.error)
    throw new Error(reply.error.message || "Parallel MCP failed.");
  if (!reply.result || typeof reply.result !== "object") {
    throw new Error("Invalid Parallel MCP result.");
  }
  return reply.result;
}
