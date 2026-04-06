# Blackbox

[![npm version](https://img.shields.io/npm/v/blackbox-mcp)](https://www.npmjs.com/package/blackbox-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/sandeepdatalume/blackbox)](https://github.com/sandeepdatalume/blackbox)

> ⚠️ **Vibe-coded.** This project was built in one session with Claude Code as the co-pilot. It works, it's tested, but it's fresh. Expect rough edges. PRs welcome.

**A personal knowledge wiki that your LLM maintains for you.**

No database. No embeddings. No vector store. Just markdown files and an LLM that reads, writes, and interlinks them — the way Karpathy imagined.

```
You: "Ingest this paper on transformer architectures"

LLM: *fetches URL → saves raw HTML → creates source page →
      extracts entities (Vaswani, Google Brain) →
      extracts concepts (attention mechanism, positional encoding) →
      cross-links everything → updates index → logs activity*

You: "How does attention relate to what we read last week about SSMs?"

LLM: *searches wiki → reads relevant pages → follows cross-references →
      synthesizes answer citing specific wiki pages*
```

Your knowledge base is a folder of `.md` files. The LLM is the intelligence layer. MCP tools are its hands.

---

## Demo

### CLI — All commands working

![Blackbox CLI Demo](demo-cli.gif)

### Claude Code + MCP — One URL → 11 interlinked wiki pages

![Blackbox MCP Demo](demo-mcp.gif)

---

## Why not RAG?

| | RAG Pipeline | Blackbox |
|---|---|---|
| **Storage** | Vector DB + embeddings | Markdown files |
| **Intelligence** | Cosine similarity | The LLM reads and reasons |
| **Structure** | Flat chunks | Interlinked wiki with categories |
| **Maintenance** | Re-embed on every change | LLM updates pages naturally |
| **Transparency** | Opaque similarity scores | Read the .md files yourself |
| **Cost** | Embedding API + vector DB | Zero — just filesystem |
| **Portability** | Locked to your vector DB | `cp -r` or `git push` |

RAG retrieves chunks. Blackbox understands your knowledge.

---

## Quickstart

```bash
# Install
npm install -g blackbox-mcp

# Create a knowledge base
mkdir my-research && cd my-research
blackbox init

# Ingest a source (saves to raw/, extracts content)
blackbox ingest https://arxiv.org/abs/1706.03762

# Start the MCP server (stdio — for Claude Desktop/Code)
blackbox serve

# Or start over HTTP/SSE for Cursor, etc.
blackbox serve --sse --port 3777
```

---

## MCP Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "blackbox": {
      "command": "blackbox",
      "args": ["serve"],
      "cwd": "/path/to/my-research"
    }
  }
}
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "blackbox": {
      "command": "blackbox",
      "args": ["serve"],
      "cwd": "/path/to/my-research"
    }
  }
}
```

Or use the CLI:

```bash
claude mcp add blackbox -- blackbox serve
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "blackbox": {
      "url": "http://localhost:3777/sse"
    }
  }
}
```

Then run `blackbox serve --sse --port 3777` in your knowledge base directory.

### OpenCode

Add to your OpenCode MCP config:

```json
{
  "mcpServers": {
    "blackbox": {
      "command": "blackbox",
      "args": ["serve"],
      "cwd": "/path/to/my-research"
    }
  }
}
```

### Codex

Add to your `codex` MCP config or run:

```bash
codex mcp add blackbox -- blackbox serve
```

### npx (zero install — works with any MCP client)

If you don't want to install globally, use `npx` in your MCP config:

```json
{
  "mcpServers": {
    "blackbox": {
      "command": "npx",
      "args": ["-y", "blackbox-mcp", "serve"],
      "cwd": "/path/to/my-research"
    }
  }
}
```

---

## Add to your CLAUDE.md / AGENTS.md

For Claude Code, Codex, or any agent that reads project instructions, add this to your `CLAUDE.md` or `AGENTS.md`:

```markdown
## Knowledge Base

This project has a Blackbox knowledge base at `/path/to/my-research`.

Before answering questions about the domain, use the `read_index` MCP tool to see what's available,
then use `search` and `read_page` to find relevant information.

When you learn something new (from a URL, conversation, or decision), use `fetch_source` to save it
and then create/update wiki pages following the rules in `schema.md`.

Always update `index.md` and `log.md` after writing wiki pages.
```

This tells your agent to use the knowledge base as its memory.

---

## CLI Reference

| Command | Description |
|---|---|
| `blackbox init [dir]` | Scaffold a new knowledge base |
| `blackbox ingest <url>` | Fetch URL → extract content → save to `raw/` |
| `blackbox search <query>` | Search all wiki pages (case-insensitive) |
| `blackbox lint` | Validate wiki consistency (index, links, naming) |
| `blackbox serve` | Start MCP server over stdio |
| `blackbox serve --sse` | Start MCP server over HTTP/SSE |
| `blackbox serve --sse --port 3777` | SSE on custom port (default: 3777) |

---

## MCP Tools (7)

These are the tools the LLM uses to interact with your wiki:

| Tool | Description |
|---|---|
| `fetch_source(url)` | Fetch URL, extract readable content, save raw HTML |
| `read_page(path)` | Read any wiki or raw page |
| `write_page(path, content)` | Create or overwrite a wiki page |
| `list_pages()` | List all `.md` files in `wiki/` |
| `read_index()` | Read `wiki/index.md` — the master catalog |
| `append_log(entry)` | Append to `wiki/log.md` activity log |
| `search(query)` | Full-text search across all wiki pages |

The server also exposes `schema.md` as an **MCP resource** — it's automatically loaded into the LLM's context so it always knows the wiki rules.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  LLM Client                  │
│          (Claude, Cursor, etc.)              │
└──────────────────┬──────────────────────────┘
                   │ MCP (stdio or SSE)
┌──────────────────▼──────────────────────────┐
│              Blackbox MCP Server             │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  7 Tools │ │ Resource │ │  Readability  │ │
│  │ (zod)    │ │ schema   │ │  (linkedom)   │ │
│  └────┬─────┘ └──────────┘ └──────────────┘ │
└───────┼─────────────────────────────────────┘
        │ filesystem
┌───────▼─────────────────────────────────────┐
│            Knowledge Base (on disk)          │
│                                              │
│  schema.md          ← Rules for the LLM     │
│  raw/               ← Immutable sources      │
│  wiki/                                       │
│    ├── index.md     ← Master catalog         │
│    ├── log.md       ← Activity log           │
│    ├── overview.md  ← High-level synthesis   │
│    ├── entities/    ← People, orgs, products │
│    ├── concepts/    ← Ideas, techniques      │
│    ├── sources/     ← Per-source summaries   │
│    └── analyses/    ← Original synthesis     │
└─────────────────────────────────────────────┘
```

**The key insight**: there is no retrieval algorithm. The LLM reads `schema.md` to learn the rules, reads `index.md` to see what exists, uses `search()` to find relevant pages, reads those pages, follows cross-references, and synthesizes answers. The wiki structure IS the knowledge graph.

---

## How It Works

1. **Ingest**: You give the LLM a URL. It fetches the raw content, then creates wiki pages — a source page summarizing the document, entity pages for people/orgs mentioned, concept pages for ideas/techniques, all cross-linked.

2. **Query**: You ask a question. The LLM searches the wiki, reads relevant pages, follows cross-references for context, and answers citing specific pages.

3. **Grow**: Over time, the wiki becomes a dense, interlinked knowledge graph. The LLM maintains it — merging duplicates, updating pages with new information, keeping the index current.

4. **Lint**: Run `blackbox lint` to catch broken links, missing index entries, naming violations, and one-directional cross-references.

---

## Directory Structure

Created by `blackbox init`:

```
my-knowledge/
├── schema.md              ← Rules for how LLM maintains the wiki
├── raw/                   ← Immutable source documents
│   └── assets/            ← Images, PDFs, etc.
├── wiki/
│   ├── index.md           ← Catalog of ALL pages
│   ├── log.md             ← Append-only activity log
│   ├── overview.md        ← High-level synthesis
│   ├── entities/          ← People, orgs, products, projects
│   ├── concepts/          ← Ideas, techniques, frameworks
│   ├── sources/           ← One page per ingested source
│   └── analyses/          ← Synthesis, comparisons, deep-dives
└── .blackbox              ← Sentinel file
```

Everything is plain text. `git init` your knowledge base and you get version history for free.

---

## Stack

- **TypeScript ESM** — modern, type-safe
- **@modelcontextprotocol/sdk** — MCP server implementation
- **@mozilla/readability + linkedom** — content extraction (no browser needed)
- **commander** — CLI framework
- **zod** — tool parameter validation
- **express** — SSE transport

Zero database dependencies. Zero AI/ML dependencies. Just filesystem + HTTP.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Author

[Sandeep Mehta](https://github.com/sandeepdatalume)

---

## License

MIT — see [LICENSE](LICENSE) for details.
