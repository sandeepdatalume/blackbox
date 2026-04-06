export const SCHEMA_TEMPLATE = `# Blackbox Knowledge Base — Schema & Workflows

> This file teaches the LLM how to maintain this wiki.
> Read it before every ingest, query, or lint operation.

---

## 1. Philosophy

This knowledge base is a **living wiki maintained by you (the LLM)**. There is no database, no vector store, no embeddings. You read and write markdown files directly. The structure IS the knowledge graph — cross-references between pages ARE the edges.

Your job: keep this wiki **accurate, interlinked, and useful**.

---

## 2. Directory Structure

\`\`\`
<root>/
├── schema.md              ← THIS FILE — read it first, always
├── raw/                   ← Immutable source documents (never edit)
│   └── assets/            ← Images, PDFs, etc.
├── wiki/
│   ├── index.md           ← Catalog of ALL pages (you maintain this)
│   ├── log.md             ← Append-only activity log
│   ├── overview.md        ← High-level synthesis of the entire wiki
│   ├── entities/          ← People, orgs, products, projects
│   ├── concepts/          ← Ideas, techniques, frameworks, terms
│   ├── sources/           ← One page per ingested source document
│   └── analyses/          ← Your synthesis, comparisons, deep-dives
└── .blackbox              ← Sentinel file (do not edit)
\`\`\`

---

## 3. Naming Conventions

### File names
- **Lowercase kebab-case**: \`transformer-architecture.md\`, \`openai.md\`
- **No spaces, no special chars**: letters, numbers, hyphens only
- **Descriptive and stable**: choose names that won't need renaming

### Page categories
| Directory      | What goes here                        | Example files                          |
| -------------- | ------------------------------------- | -------------------------------------- |
| \`entities/\`    | People, orgs, products, projects      | \`geoffrey-hinton.md\`, \`openai.md\`      |
| \`concepts/\`    | Ideas, techniques, terms              | \`attention-mechanism.md\`, \`rlhf.md\`    |
| \`sources/\`     | One page per ingested URL/doc         | \`arxiv-1706-03762.md\`                   |
| \`analyses/\`    | Your synthesis and original analysis  | \`transformer-vs-ssm-comparison.md\`      |

---

## 4. Page Template

Every wiki page MUST follow this structure:

\`\`\`markdown
# Page Title

> One-line summary of what this page covers.

## Key Facts

- Bullet points of the most important information
- Keep these scannable and self-contained

## Details

Extended prose, explanations, context.

## Cross-References

- [[concepts/attention-mechanism]] — Related concept
- [[entities/google-deepmind]] — Originated here
- [[sources/arxiv-1706-03762]] — Original paper

## Sources

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- Ingested from: raw/arxiv-org-abs-1706-03762.html

---
_Last updated: 2025-01-15T10:30:00Z_
\`\`\`

### Rules for every page:
1. **Title** = H1 at the top, must match the index entry
2. **Summary** = blockquote immediately after the title
3. **Cross-References** section = links to related pages using \`[[path]]\` notation
4. **Sources** section = external URLs and/or pointer to raw/ files
5. **Timestamp** = ISO 8601 date at the bottom after a horizontal rule

---

## 5. Cross-Reference Format

Use double-bracket wiki links: \`[[category/page-name]]\`

- Always use the path relative to \`wiki/\`: \`[[entities/openai]]\`, NOT \`[[wiki/entities/openai]]\`
- Omit the \`.md\` extension: \`[[concepts/rlhf]]\`, NOT \`[[concepts/rlhf.md]]\`
- Cross-references MUST be bidirectional: if A links to B, B should link back to A

---

## 6. Index Maintenance

\`wiki/index.md\` is the **master catalog**. After creating or deleting any page:

1. Add/remove the entry under the correct heading (Entities, Concepts, Sources, Analyses)
2. Use format: \`- [[category/page-name]] — One-line description\`
3. Keep entries sorted alphabetically within each section
4. The index must always reflect the actual files on disk — no orphans, no ghosts

---

## 7. Activity Log

\`wiki/log.md\` is append-only. After every write operation, append a line:

\`\`\`
- 2025-01-15T10:30:00Z — Created entities/openai.md from source arxiv-1706-03762
\`\`\`

Never edit or delete existing log entries.

---

## 8. Overview Maintenance

\`wiki/overview.md\` is a **high-level synthesis** of the entire knowledge base. Update it when:
- A new source is ingested (add it to the narrative)
- A new analysis is written
- The knowledge base crosses a meaningful threshold (10 sources, new domain, etc.)

Keep it readable — this is the "executive summary" of everything you know.

---

## 9. Workflows

### 9.1 INGEST (new source)

When asked to ingest a URL or document:

1. **Fetch**: Use \`fetch_source(url)\` → saves raw HTML to \`raw/\`, returns extracted text
2. **Create source page**: Use \`write_page("sources/<slug>.md", ...)\` with:
   - Title, URL, date fetched, key excerpts
   - Summary of the document in your own words
3. **Extract entities**: For each notable person, org, product mentioned:
   - If page exists → update it with new information, add cross-reference to source
   - If page doesn't exist → create it in \`entities/\`
4. **Extract concepts**: Same as entities but for ideas/techniques/terms → \`concepts/\`
5. **Cross-link**: Ensure every new page links to related existing pages (and vice versa)
6. **Update index**: Add all new pages to \`wiki/index.md\`
7. **Update overview**: Weave the new knowledge into \`wiki/overview.md\`
8. **Log**: Append to \`wiki/log.md\` what you did

### 9.2 QUERY (answering questions)

When asked a question about the knowledge base:

1. **Search**: Use \`search(query)\` to find relevant pages
2. **Read**: Use \`read_page(path)\` on the most relevant hits
3. **Follow cross-references**: Read linked pages for additional context
4. **Synthesize**: Answer using information from the wiki, citing specific pages
5. **Identify gaps**: If the wiki can't answer the question, say so explicitly

### 9.3 LINT (consistency check)

When asked to lint/validate the wiki:

1. **List all pages**: Use \`list_pages()\`
2. **Check index**: Every page on disk must appear in index.md, and vice versa
3. **Check cross-references**: Every \`[[link]]\` must point to an existing page
4. **Check bidirectional links**: If A→B exists, B→A should exist
5. **Check page structure**: Every page should have the required sections
6. **Check naming**: All files should be lowercase kebab-case
7. **Report**: List all issues found with severity (error/warning)

### 9.4 REORGANIZE (maintenance)

Periodically, or when asked:

1. **Merge duplicates**: If two pages cover the same topic, merge them
2. **Split large pages**: If a page exceeds ~500 lines, consider splitting
3. **Reclassify**: Move pages to the correct category if miscategorized
4. **Prune stale links**: Remove cross-references to deleted pages
5. **Update overview**: Ensure overview.md reflects current state

---

## 10. Quality Standards

- **Accuracy over completeness**: Never invent information. If unsure, note the uncertainty.
- **Cite everything**: Every claim should trace back to a source page or raw document.
- **Atomic pages**: Each page covers ONE entity, concept, source, or analysis.
- **Scannable**: Use bullet points, short paragraphs, clear headings.
- **Evergreen**: Write pages that remain useful as the wiki grows.
- **No redundancy**: Don't repeat information across pages. Link instead.

---

## 11. Anti-Patterns (Do NOT Do These)

- ❌ Creating pages without adding them to the index
- ❌ One-directional cross-references (A→B but not B→A)
- ❌ Editing files in \`raw/\` (they are immutable source material)
- ❌ Deleting log entries
- ❌ Dumping raw text into a page without summarizing
- ❌ Creating deeply nested subdirectories beyond the four categories
- ❌ Using page titles that differ from the filename slug

---

_This schema is version 1.0. The LLM should follow it precisely._
`;
