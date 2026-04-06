/**
 * `blackbox lint` — validate wiki consistency.
 *
 * Checks: index coverage, cross-reference integrity, naming conventions,
 * page structure, bidirectional links.
 */

import { readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { findRoot, listPages, paths } from "./wiki.js";

export interface LintIssue {
  severity: "error" | "warning";
  file: string;
  message: string;
}

export async function lint(root?: string): Promise<LintIssue[]> {
  const r = root ?? (await findRoot());
  const issues: LintIssue[] = [];
  const pages = await listPages(r);

  // Load index
  const indexContent = await readFile(paths.index(r), "utf-8");

  // ---- Check 1: every page on disk is in index.md ----
  for (const page of pages) {
    if (page === "wiki/index.md" || page === "wiki/log.md" || page === "wiki/overview.md") continue;
    const wikiRef = page.replace(/^wiki\//, "").replace(/\.md$/, "");
    if (!indexContent.includes(wikiRef)) {
      issues.push({ severity: "error", file: page, message: `Page not listed in index.md` });
    }
  }

  // ---- Check 2: every [[ref]] in index.md points to existing page ----
  const indexRefs = extractWikiLinks(indexContent);
  for (const ref of indexRefs) {
    const target = `wiki/${ref}.md`;
    if (!pages.includes(target)) {
      issues.push({ severity: "error", file: "wiki/index.md", message: `Broken link: [[${ref}]] — file does not exist` });
    }
  }

  // ---- Check 3: naming conventions & page structure ----
  const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;
  const allLinks = new Map<string, Set<string>>(); // page -> set of [[refs]]

  for (const page of pages) {
    const name = basename(page);

    // Naming check (skip special files)
    if (!["index.md", "log.md", "overview.md"].includes(name)) {
      if (!kebabPattern.test(name)) {
        issues.push({ severity: "warning", file: page, message: `Filename "${name}" is not lowercase kebab-case` });
      }
    }

    // Read content and check structure
    const content = await readFile(join(r, page), "utf-8");

    if (page !== "wiki/log.md" && page !== "wiki/index.md") {
      // Check for H1 title
      if (!content.match(/^# .+/m)) {
        issues.push({ severity: "warning", file: page, message: "Missing H1 title" });
      }
    }

    // Collect cross-references
    const refs = extractWikiLinks(content);
    const pageKey = page.replace(/^wiki\//, "").replace(/\.md$/, "");
    allLinks.set(pageKey, new Set(refs));

    // Check cross-references point to existing pages
    for (const ref of refs) {
      const target = `wiki/${ref}.md`;
      if (!pages.includes(target)) {
        issues.push({ severity: "error", file: page, message: `Broken cross-reference: [[${ref}]]` });
      }
    }
  }

  // ---- Check 4: bidirectional links ----
  for (const [pageKey, refs] of allLinks) {
    for (const ref of refs) {
      const backLinks = allLinks.get(ref);
      if (backLinks && !backLinks.has(pageKey)) {
        // Skip index/log/overview — they link out but don't need back-links
        if (["index", "log", "overview"].includes(pageKey)) continue;
        issues.push({
          severity: "warning",
          file: `wiki/${ref}.md`,
          message: `Missing back-link to [[${pageKey}]] (linked from wiki/${pageKey}.md)`,
        });
      }
    }
  }

  return issues;
}

function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  return [...matches].map((m) => m[1]);
}
