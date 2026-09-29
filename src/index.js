#!/usr/bin/env node
// Local (stdio) entry — for Claude Desktop / Claude Code / any MCP client.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

await createServer().connect(new StdioServerTransport());
