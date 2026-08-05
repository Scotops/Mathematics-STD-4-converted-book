#!/usr/bin/env node
/**
 * Repairs UTF-8 text that was accidentally decoded as Windows-1252 during
 * conversion. It is deliberately idempotent and only changes a value when
 * decoding removes known mojibake markers.
 *
 * Run from the ADT root: node tools/repair-mojibake.mjs
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const cp1252 = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a],
  ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92],
  ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f],
]);
const marker = /[ÃÂâ]/g;

function score(value) {
  return (value.match(marker) || []).length;
}

function repair(value) {
  let current = value;
  while (score(current)) {
    const bytes = [];
    for (const char of current) {
      const byte = cp1252.get(char) ?? (char.codePointAt(0) <= 0xff ? char.codePointAt(0) : undefined);
      if (byte === undefined) return current;
      bytes.push(byte);
    }
    const decoded = Buffer.from(bytes).toString('utf8');
    if (decoded.includes('\ufffd') || score(decoded) >= score(current)) return current;
    current = decoded;
  }
  return current;
}

async function repairJson(file) {
  const data = JSON.parse(await readFile(file, 'utf8'));
  let changes = 0;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue;
    const repaired = repair(value);
    if (repaired !== value) {
      data[key] = repaired;
      changes += 1;
    }
  }
  if (changes) await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return changes;
}

async function repairHtmlFiles() {
  let files = 0;
  let changes = 0;
  for (const name of await readdir(root)) {
    if (!/^pg\d+_sec\d+\.html$/.test(name)) continue;
    const file = path.join(root, name);
    const source = await readFile(file, 'utf8');
    const repaired = repair(source);
    if (repaired !== source) {
      await writeFile(file, repaired, 'utf8');
      files += 1;
      changes += score(source) - score(repaired);
    }
  }
  return { files, changes };
}

const jsonChanges = await repairJson(path.join(root, 'content', 'i18n', 'en-US', 'texts.json'));
const html = await repairHtmlFiles();
console.log(`Repaired ${jsonChanges} text entries and ${html.changes} markers across ${html.files} HTML files.`);
