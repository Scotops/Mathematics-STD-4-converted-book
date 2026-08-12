#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const removed = new Set(['pg055_sec002', 'pg136_sec003', 'pg165_sec001']);
const manifestPath = path.join(root, 'content', 'pages.json');
const pages = JSON.parse(await readFile(manifestPath, 'utf8')).filter((page) => !removed.has(page.section_id));
await writeFile(manifestPath, `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
const indexByHref = new Map(pages.map((page, index) => [page.href, index + 1]));
for (const file of await readdir(root)) {
  if (!indexByHref.has(file)) continue;
  const filePath = path.join(root, file);
  const html = await readFile(filePath, 'utf8');
  const updated = html.replace(/(<meta name="page-section-id" content=")[^"]+("\s*\/>)/, `$1${indexByHref.get(file)}$2`);
  if (updated !== html) await writeFile(filePath, updated, 'utf8');
}
console.log(`Removed ${removed.size} blank sections and renumbered ${pages.length} manifest entries.`);
