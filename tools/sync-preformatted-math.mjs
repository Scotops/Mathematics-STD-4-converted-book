#!/usr/bin/env node
// Restores the line breaks intentionally present in the HTML fallbacks for
// long multiplication/division layouts. The runtime reads texts.json, so the
// localized value must retain those breaks as well.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const textsPath = path.join(root, 'content/i18n/en-US/texts.json');
const texts = JSON.parse(await readFile(textsPath, 'utf8'));
const decode = (value) => value
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let changes = 0;
for (const file of await readdir(root)) {
  if (!/^pg\d+_sec\d+\.html$/.test(file)) continue;
  const filePath = path.join(root, file);
  const source = await readFile(filePath, 'utf8');
  let updatedSource = source;
  const re = /<([a-z0-9]+)([^>]*\bdata-id="([^"]+)"[^>]*\bwhitespace-pre\b[^>]*)>([\s\S]*?)<\/\1>/gi;
  for (const match of source.matchAll(re)) {
    const id = match[3];
    const fallback = decode(match[4]).replace(/<[^>]*>/g, '').replace(/^\s*\n/, '').replace(/\s*$/, '');
    // The reader runtime normalizes plain newline characters. Explicit line
    // breaks survive localization replacement and retain the original vertical
    // working layout.
    const localized = fallback.replace(/\n/g, '<br>');
    if (fallback.includes('\n') && texts[id] !== localized) {
      texts[id] = localized;
      changes += 1;
    }
    updatedSource = updatedSource.replace(match[0], match[0].replace(match[4], match[4].replace(/\n/g, '<br>')));
  }
  if (updatedSource !== source) await writeFile(filePath, updatedSource, 'utf8');
}
await writeFile(textsPath, `${JSON.stringify(texts, null, 2)}\n`, 'utf8');
console.log(`Restored vertical layout text for ${changes} math blocks.`);
