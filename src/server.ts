/**
 * Blackbox MCP Server — exposes 7 tools for LLM wiki management.
 *
 * Tools: fetch_source, read_page, write_page, list_pages, read_index, append_log, search
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  findRoot,
  readPage,
  writePage,
  listPages,
  readIndex,
  appendLog,
  search,
  fetchSource,
  paths,
} from "./wiki.js";
import { readFile } from "node:fs/promises";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "blackbox",
    version: "0.1.0",
  });

  // ------------------------------------------------------------------
  // Tool: fetch_source
  // ------------------------------------------------------------------
  server.tool(
    "fetch_source",
    "Fetch a URL, extract readable content with Readability, and save raw HTML to raw/. Returns extracted title, content, and the raw file path. The LLM should then create wiki pages from the returned content.",
    { url: z.string().url().describe("The URL to fetch and extract content from") },
    async ({ url }) => {
      const root = await findRoot();
      const result = await fetchSource(root, url);
      const text = [
        `# ${result.title}`,
        "",
        result.byline ? `**Author**: ${result.byline}` : null,
        result.excerpt ? `**Excerpt**: ${result.excerpt}` : null,
        `**Raw saved to**: ${result.rawPath}`,
        `**Source URL**: ${url}`,
        "",
        "---",
        "",
        result.content,
      ]
        .filter(Boolean)
        .join("\n");

      return { content: [{ type: "text" as const, text }] };
    },
  );

  // ------------------------------------------------------------------
  // Tool: read_page
  // ------------------------------------------------------------------
  server.tool(
    "read_page",
    "Read a wiki page by its relative path (e.g. 'wiki/entities/openai.md' or 'entities/openai.md'). Also works for raw/ files.",
    { path: z.string().describe("Relative path to the page, e.g. 'wiki/concepts/rlhf.md'") },
    async ({ path }) => {
      const root = await findRoot();
      const content = await readPage(root, path);
      return { content: [{ type: "text" as const, text: content }] };
    },
  );

  // ------------------------------------------------------------------
  // Tool: write_page
  // ------------------------------------------------------------------
  server.tool(
    "write_page",
    "Create or overwrite a wiki page. Provide the relative path and full markdown content. Parent directories are created automatically. Remember to also update index.md and log.md per schema.md.",
    {
      path: z.string().describe("Relative path for the page, e.g. 'wiki/entities/openai.md'"),
      content: z.string().describe("Full markdown content for the page"),
    },
    async ({ path, content }) => {
      const root = await findRoot();
      await writePage(root, path, content);
      return { content: [{ type: "text" as const, text: `Wrote ${path} (${content.length} bytes)` }] };
    },
  );

  // ------------------------------------------------------------------
  // Tool: list_pages
  // ------------------------------------------------------------------
  server.tool(
    "list_pages",
    "List all markdown files in the wiki/ directory. Returns relative paths sorted alphabetically.",
    {},
    async () => {
      const root = await findRoot();
      const pages = await listPages(root);
      const text = pages.length > 0 ? pages.join("\n") : "(no pages yet)";
      return { content: [{ type: "text" as const, text }] };
    },
  );

  // ------------------------------------------------------------------
  // Tool: read_index
  // ------------------------------------------------------------------
  server.tool(
    "read_index",
    "Read wiki/index.md — the master catalog of all pages. Read this to understand what's in the wiki before searching or writing.",
    {},
    async () => {
      const root = await findRoot();
      const content = await readIndex(root);
      return { content: [{ type: "text" as const, text: content }] };
    },
  );

  // ------------------------------------------------------------------
  // Tool: append_log
  // ------------------------------------------------------------------
  server.tool(
    "append_log",
    "Append an entry to wiki/log.md (the append-only activity log). Timestamp is added automatically.",
    { entry: z.string().describe("Log entry text, e.g. 'Created entities/openai.md from source'") },
    async ({ entry }) => {
      const root = await findRoot();
      await appendLog(root, entry);
      return { content: [{ type: "text" as const, text: `Logged: ${entry}` }] };
    },
  );

  // ------------------------------------------------------------------
  // Tool: search
  // ------------------------------------------------------------------
  server.tool(
    "search",
    "Search all wiki markdown files for a query string (case-insensitive). Returns matching lines with file paths and line numbers.",
    { query: z.string().describe("Search query — matched as case-insensitive substring") },
    async ({ query }) => {
      const root = await findRoot();
      const hits = await search(root, query);
      if (hits.length === 0) {
        return { content: [{ type: "text" as const, text: `No results for "${query}"` }] };
      }
      const text = hits
        .slice(0, 50) // cap results
        .map((h) => `${h.path}:${h.line}: ${h.text}`)
        .join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${hits.length} result(s) for "${query}"${hits.length > 50 ? " (showing first 50)" : ""}:\n\n${text}`,
          },
        ],
      };
    },
  );

  // ------------------------------------------------------------------
  // Resource: schema.md — always available to the LLM
  // ------------------------------------------------------------------
  server.resource(
    "schema",
    "schema://blackbox/schema.md",
    { mimeType: "text/markdown", description: "The wiki schema and workflow instructions. Read this first." },
    async () => {
      const root = await findRoot();
      const content = await readFile(paths.schema(root), "utf-8");
      return { contents: [{ uri: "schema://blackbox/schema.md", mimeType: "text/markdown", text: content }] };
    },
  );

  return server;
}
