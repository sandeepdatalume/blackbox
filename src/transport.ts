/**
 * Transport helpers for running the MCP server over stdio or SSE.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";

/** Start the MCP server over stdin/stdout (default for Claude Desktop). */
export async function serveStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/** Start the MCP server over SSE on the given port. */
export async function serveSSE(server: McpServer, port: number): Promise<void> {
  const app = express();

  // Store transports by session
  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (_req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => {
      transports.delete(transport.sessionId);
    });
    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(400).json({ error: "Unknown session" });
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  app.listen(port, () => {
    console.error(`Blackbox MCP server (SSE) listening on http://localhost:${port}`);
    console.error(`  SSE endpoint:     GET  http://localhost:${port}/sse`);
    console.error(`  Message endpoint: POST http://localhost:${port}/messages`);
  });
}
