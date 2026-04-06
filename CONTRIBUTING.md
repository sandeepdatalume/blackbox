# Contributing to Blackbox

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/sandeepme/blackbox.git
cd blackbox

# Install dependencies
npm install

# Build
npm run build

# Run in dev mode (watch)
npm run dev
```

## Project Structure

```
src/
  cli.ts         — CLI entry point (commander)
  server.ts      — MCP server setup and tool definitions
  transport.ts   — stdio and SSE transport layers
  wiki.ts        — Core filesystem operations
  init.ts        — Knowledge base scaffolding
  lint.ts        — Wiki consistency checks
  templates/     — Default schema template
```

## Making Changes

1. Fork the repo and create a branch from `main`.
2. Make your changes in `src/`.
3. Run `npm run build` to verify clean compilation.
4. Run `npm run lint` to check for type errors.
5. Test your changes manually against a local knowledge base.

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Write a clear description of what changed and why.
- Ensure `npm run build` passes with no errors.
- Follow the existing code style (TypeScript, ESM, no default exports).

## Reporting Bugs

Use the [bug report template](https://github.com/sandeepme/blackbox/issues/new?template=bug_report.md) and include your Node.js version, OS, and steps to reproduce.

## Code of Conduct

Be kind and constructive. We're all here to build something useful.
