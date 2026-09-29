// Remote entry — stateless Streamable HTTP at POST /mcp, so any agent can call it by URL.
import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 8787);

createHttpServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    return res.end("tokyo-ward-procedures MCP server. POST /mcp (Streamable HTTP).\n");
  }
  if (url.pathname !== "/mcp") {
    res.writeHead(404).end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { allow: "POST" }).end();
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { transport.close(); server.close(); });
  // One line per call so real agent usage can be measured later (no personal data is logged).
  try {
    const msg = JSON.parse(body);
    if (msg?.method === "tools/call") {
      console.log(JSON.stringify({ t: new Date().toISOString(), tool: msg.params?.name, args: msg.params?.arguments, ua: req.headers["user-agent"] ?? null }));
    }
    await server.connect(transport);
    await transport.handleRequest(req, res, msg);
  } catch (e) {
    if (!res.headersSent) res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: String(e?.message ?? e) }, id: null }));
  }
}).listen(PORT, () => console.error(`listening on :${PORT}/mcp`));
