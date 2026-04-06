# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-04-06

### Added
- CLI commands: `init`, `ingest`, `search`, `lint`, `serve`
- MCP server with 7 tools: `fetch_source`, `read_page`, `write_page`, `list_pages`, `read_index`, `append_log`, `search`
- MCP resource: `schema.md` auto-loaded into LLM context
- stdio and SSE (HTTP) transport support
- Content extraction via `@mozilla/readability` and `linkedom`
- Wiki consistency linter (broken links, missing index entries, naming violations)
- Knowledge base scaffolding with `blackbox init`
