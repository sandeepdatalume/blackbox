/**
 * Core filesystem operations for the Blackbox wiki.
 * Every tool and command ultimately calls through here.
 */

import { readFile, writeFile, readdir, appendFile, mkdir, access } from "node:fs/promises";
import { join, relative, extname } from "node:path";

// ---------------------------------------------------------------------------
// Root resolution
// ---------------------------------------------------------------------------

/** Walk up from `cwd` looking for the `.blackbox` sentinel directory. */
export async function findRoot(cwd: string = process.cwd()): Promise<string> {
  let dir = cwd;
  while (true) {
    try {
      await access(join(dir, ".blackbox"));
      return dir;
    } catch {
      const parent = join(dir, "..");
      if (parent === dir) throw new Error("Not inside a Blackbox knowledge base. Run `blackbox init` first.");
      dir = parent;
    }
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const paths = {
  schema: (root: string) => join(root, "schema.md"),
  raw: (root: string) => join(root, "raw"),
  rawAssets: (root: string) => join(root, "raw", "assets"),
  wiki: (root: string) => join(root, "wiki"),
  index: (root: string) => join(root, "wiki", "index.md"),
  log: (root: string) => join(root, "wiki", "log.md"),
  overview: (root: string) => join(root, "wiki", "overview.md"),
  entities: (root: string) => join(root, "wiki", "entities"),
  concepts: (root: string) => join(root, "wiki", "concepts"),
  sources: (root: string) => join(root, "wiki", "sources"),
  analyses: (root: string) => join(root, "wiki", "analyses"),
  sentinel: (root: string) => join(root, ".blackbox"),
} as const;

// ---------------------------------------------------------------------------
// Read / Write / List
// ---------------------------------------------------------------------------

/** Read a wiki page by relative path (e.g. `wiki/entities/openai.md`). */
export async function readPage(root: string, pagePath: string): Promise<string> {
  const abs = resolvePagePath(root, pagePath);
  return readFile(abs, "utf-8");
}

/** Write (create or overwrite) a wiki page. Creates parent dirs as needed. */
export async function writePage(root: string, pagePath: string, content: string): Promise<void> {
  const abs = resolvePagePath(root, pagePath);
  await mkdir(join(abs, ".."), { recursive: true });
  await writeFile(abs, content, "utf-8");
}

/** Recursively list all `.md` files under `wiki/`, returning relative paths. */
export async function listPages(root: string): Promise<string[]> {
  const wikiDir = paths.wiki(root);
  const results: string[] = [];
  await walk(wikiDir, results);
  return results.map((abs) => relative(root, abs)).sort();
}

/** Read the wiki index file. */
export async function readIndex(root: string): Promise<string> {
  return readFile(paths.index(root), "utf-8");
}

/** Append an entry to the activity log. */
export async function appendLog(root: string, entry: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await appendFile(paths.log(root), `- ${timestamp} — ${entry}\n`, "utf-8");
}

// ---------------------------------------------------------------------------
// Search — simple but effective substring/regex search across all .md files
// ---------------------------------------------------------------------------

export interface SearchHit {
  path: string;
  line: number;
  text: string;
}

/** Search all wiki .md files for a query string (case-insensitive). */
export async function search(root: string, query: string): Promise<SearchHit[]> {
  const pages = await listPages(root);
  const hits: SearchHit[] = [];
  const pattern = new RegExp(escapeRegex(query), "i");

  for (const page of pages) {
    const content = await readFile(join(root, page), "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        hits.push({ path: page, line: i + 1, text: lines[i].trim() });
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Fetch source — download a URL and extract readable content
// ---------------------------------------------------------------------------

export interface FetchResult {
  title: string;
  content: string;       // cleaned markdown-ish text
  rawPath: string;       // where the raw HTML was saved
  byline: string | null;
  excerpt: string | null;
}

export async function fetchSource(root: string, url: string): Promise<FetchResult> {
  const { Readability } = await import("@mozilla/readability");
  const { parseHTML } = await import("linkedom");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const html = await res.text();

  // Save raw HTML
  const slug = urlToSlug(url);
  const rawPath = join("raw", `${slug}.html`);
  await mkdir(paths.raw(root), { recursive: true });
  await writeFile(join(root, rawPath), html, "utf-8");

  // Extract readable content
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    return {
      title: slug,
      content: `(Could not extract readable content from ${url}. Raw HTML saved to ${rawPath}.)`,
      rawPath,
      byline: null,
      excerpt: null,
    };
  }

  return {
    title: article.title,
    content: article.textContent.trim(),
    rawPath,
    byline: article.byline,
    excerpt: article.excerpt,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolvePagePath(root: string, pagePath: string): string {
  // Normalize: allow both "wiki/entities/foo.md" and "entities/foo.md"
  const normalized = pagePath.startsWith("wiki/") ? pagePath : pagePath.startsWith("raw/") ? pagePath : `wiki/${pagePath}`;
  const abs = join(root, normalized);
  // Basic path traversal guard
  if (!abs.startsWith(root)) throw new Error("Path traversal not allowed");
  return abs;
}

async function walk(dir: string, results: string[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, results);
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      results.push(full);
    }
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function urlToSlug(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname)
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 80);
  } catch {
    return url.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 80);
  }
}
