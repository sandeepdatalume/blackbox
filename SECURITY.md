# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email **sandeep@datalume.co.uk** with details
3. Include steps to reproduce if possible

I'll respond within 48 hours and work with you on a fix before any public disclosure.

## Scope

Blackbox runs locally on your machine. The main security concerns are:

- **URL fetching** — `fetch_source` makes HTTP requests to user-provided URLs
- **File writes** — `write_page` writes to the local filesystem within the knowledge base directory
- **SSE server** — when running `blackbox serve --sse`, the server listens on localhost

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
