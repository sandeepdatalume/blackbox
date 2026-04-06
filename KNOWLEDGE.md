# Knowledge Base Instructions

> Copy this section into your CLAUDE.md, AGENTS.md, or system prompt.
> Adjust the path to match your knowledge base location.

---

## Knowledge Base (Blackbox)

This project uses a Blackbox knowledge base at `./knowledge` (or wherever you initialized it).

### Before answering domain questions:
1. Call `read_index` to see what's in the wiki
2. Use `search` to find relevant pages
3. Use `read_page` to read full pages and follow cross-references
4. Synthesize your answer from wiki content, citing pages

### When you learn something new:
1. Call `fetch_source` to save the URL to `raw/`
2. Read the returned content carefully
3. Create/update wiki pages following `schema.md` rules:
   - One page per entity in `wiki/entities/`
   - One page per concept in `wiki/concepts/`
   - One summary per source in `wiki/sources/`
   - Cross-link everything bidirectionally
4. Update `wiki/index.md` with new pages
5. Call `append_log` to record what you did

### When making decisions:
File important decisions as `wiki/analyses/` pages so they're preserved and searchable.

### Periodically:
Run a lint check — look for orphaned pages, missing cross-references, stale content, and contradictions between pages.

### Rules:
- Never modify files in `raw/` — those are immutable source documents
- Always follow the conventions in `schema.md`
- Keep `index.md` alphabetically sorted within each section
- Use relative markdown links for cross-references: `[Page Title](../category/page-name.md)`
- Every page should have at least one inbound and one outbound link

---

## MCP Configuration

If using MCP, add to your config:

```json
{
  "mcpServers": {
    "blackbox": {
      "command": "blackbox",
      "args": ["serve"],
      "cwd": "/path/to/your/knowledge-base"
    }
  }
}
```

If not using MCP, the agent can read/write the wiki files directly — it's just a folder of markdown.
