#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'assets', 'offline-preloader.js');
const source = await readFile(file, 'utf8');
const start = source.indexOf('var INLINE = ') + 'var INLINE = '.length;
const end = source.indexOf(';\n  var BASE_DIR', start);
if (start < 'var INLINE = '.length || end < 0) throw new Error('Could not locate the offline cache payload.');
const cache = JSON.parse(source.slice(start, end));
for (const key of ['./assets/config.json', './content/pages.json', './content/i18n/en-US/texts.json']) {
  cache[key] = JSON.parse(await readFile(path.join(root, key.slice(2)), 'utf8'));
}
await writeFile(file, `${source.slice(0, start)}${JSON.stringify(cache)}${source.slice(end)}`, 'utf8');

const bundleVersion = cache['./assets/config.json'].bundleVersion;
const pages = cache['./content/pages.json'];
for (const page of pages) {
  const htmlPath = path.join(root, page.href);
  const html = await readFile(htmlPath, 'utf8');
  const refreshed = html.replace(
    /offline-preloader\.js\?v=[^"']+/g,
    `offline-preloader.js?v=${bundleVersion}`,
  );
  if (refreshed !== html) await writeFile(htmlPath, refreshed, 'utf8');
}

console.log(`Refreshed offline cache and ${pages.length} active page references for bundle ${bundleVersion}.`);
