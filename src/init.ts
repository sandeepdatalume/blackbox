/**
 * `blackbox init` — scaffold a new knowledge base directory.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "./wiki.js";
import { SCHEMA_TEMPLATE } from "./templates/schema.js";

const INITIAL_INDEX = `# Index

_Catalog of all wiki pages. Updated by the LLM after every write._

## Entities

_(none yet)_

## Concepts

_(none yet)_

## Sources

_(none yet)_

## Analyses

_(none yet)_
`;

const INITIAL_LOG = `# Activity Log

_Append-only record of wiki changes._

- ${new Date().toISOString()} — Knowledge base initialized.
`;

const INITIAL_OVERVIEW = `# Overview

_High-level synthesis of everything in the wiki. Updated by the LLM as the knowledge base grows._

This knowledge base is empty. Ingest your first source to get started.
`;

export async function init(target: string): Promise<void> {
  // Create directory tree
  const dirs = [
    paths.rawAssets(target),
    paths.entities(target),
    paths.concepts(target),
    paths.sources(target),
    paths.analyses(target),
  ];
  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }

  // Write sentinel
  await writeFile(paths.sentinel(target), `initialized=${new Date().toISOString()}\n`);

  // Write template files
  await writeFile(paths.schema(target), SCHEMA_TEMPLATE);
  await writeFile(paths.index(target), INITIAL_INDEX);
  await writeFile(paths.log(target), INITIAL_LOG);
  await writeFile(paths.overview(target), INITIAL_OVERVIEW);

  // Add .gitkeep files to empty dirs
  for (const dir of [paths.rawAssets(target), paths.entities(target), paths.concepts(target), paths.sources(target), paths.analyses(target)]) {
    await writeFile(join(dir, ".gitkeep"), "");
  }
}
