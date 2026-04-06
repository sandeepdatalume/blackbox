#!/usr/bin/env node

/**
 * Blackbox CLI — manage your knowledge base from the terminal.
 *
 * Commands: init, ingest, search, lint, serve
 */

import { Command } from "commander";
import { resolve } from "node:path";
import { init } from "./init.js";
import { lint } from "./lint.js";
import { findRoot, fetchSource, search } from "./wiki.js";
import { createServer } from "./server.js";
import { serveStdio, serveSSE } from "./transport.js";

const program = new Command();

program
  .name("blackbox")
  .description("Personal knowledge wiki as an MCP server. No database — just markdown.")
  .version("0.1.0");

// ---------------------------------------------------------------------------
// blackbox init [directory]
// ---------------------------------------------------------------------------
program
  .command("init")
  .description("Initialize a new knowledge base")
  .argument("[directory]", "Target directory", ".")
  .action(async (directory: string) => {
    const target = resolve(directory);
    await init(target);
    console.log(`✓ Knowledge base initialized at ${target}`);
    console.log(`  Edit schema.md to customize wiki rules.`);
    console.log(`  Run \`blackbox serve\` to start the MCP server.`);
  });

// ---------------------------------------------------------------------------
// blackbox ingest <url>
// ---------------------------------------------------------------------------
program
  .command("ingest")
  .description("Fetch a URL and save extracted content to raw/")
  .argument("<url>", "URL to fetch")
  .action(async (url: string) => {
    const root = await findRoot();
    console.log(`Fetching ${url}...`);
    let result;
    try {
      result = await fetchSource(root, url);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`Error: Could not fetch ${url} — ${reason}`);
      process.exit(1);
    }
    console.log(`✓ Saved raw HTML to ${result.rawPath}`);
    console.log(`  Title: ${result.title}`);
    console.log(`  Content: ${result.content.length} chars extracted`);
    console.log();
    console.log(`  Next: connect an LLM via \`blackbox serve\` and ask it to`);
    console.log(`  process this source into wiki pages.`);
  });

// ---------------------------------------------------------------------------
// blackbox search <query>
// ---------------------------------------------------------------------------
program
  .command("search")
  .description("Search wiki pages for a query string")
  .argument("<query>", "Search text (case-insensitive)")
  .action(async (query: string) => {
    const root = await findRoot();
    const hits = await search(root, query);
    if (hits.length === 0) {
      console.log(`No results for "${query}"`);
      return;
    }
    console.log(`Found ${hits.length} result(s) for "${query}":\n`);
    for (const hit of hits.slice(0, 30)) {
      console.log(`  ${hit.path}:${hit.line}: ${hit.text}`);
    }
    if (hits.length > 30) {
      console.log(`  ... and ${hits.length - 30} more`);
    }
  });

// ---------------------------------------------------------------------------
// blackbox lint
// ---------------------------------------------------------------------------
program
  .command("lint")
  .description("Validate wiki consistency (index, links, naming, structure)")
  .action(async () => {
    const root = await findRoot();
    const issues = await lint(root);
    if (issues.length === 0) {
      console.log("✓ Wiki is consistent. No issues found.");
      return;
    }
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    for (const issue of issues) {
      const icon = issue.severity === "error" ? "✗" : "⚠";
      console.log(`  ${icon} [${issue.severity}] ${issue.file}: ${issue.message}`);
    }
    console.log();
    console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
    if (errors.length > 0) process.exit(1);
  });

// ---------------------------------------------------------------------------
// blackbox serve [--sse] [--port <n>]
// ---------------------------------------------------------------------------
program
  .command("serve")
  .description("Start the MCP server (stdio by default, --sse for HTTP)")
  .option("--sse", "Use SSE transport instead of stdio")
  .option("--port <number>", "Port for SSE transport", "3777")
  .action(async (opts: { sse?: boolean; port: string }) => {
    const server = createServer();
    if (opts.sse) {
      await serveSSE(server, parseInt(opts.port, 10));
    } else {
      console.error("Blackbox MCP server running on stdio...");
      await serveStdio(server);
    }
  });

program.parse();
