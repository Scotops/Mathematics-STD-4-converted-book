/* Remove source-PDF watermark text from reader pages and read-aloud text. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const watermark = /FOR (?:ONLINE|TEACHING) (?:READING )?ONLY/gi;
const element = /<(div|p|span)\b[^>]*>\s*FOR (?:ONLINE|TEACHING) (?:READING )?ONLY\s*<\/\1>/gi;
let pageChanges = 0;

for (const file of fs.readdirSync(root).filter(name => /^pg\d{3}_sec\d{3}\.html$/i.test(name))) {
  const target = path.join(root, file);
  const original = fs.readFileSync(target, 'utf8');
  const updated = original.replace(element, '');
  if (updated !== original) {
    fs.writeFileSync(target, updated, 'utf8');
    pageChanges += 1;
  }
}

const textsPath = path.join(root, 'content', 'i18n', 'en-US', 'texts.json');
const texts = JSON.parse(fs.readFileSync(textsPath, 'utf8'));
let textChanges = 0;
for (const [id, value] of Object.entries(texts)) {
  if (typeof value === 'string' && watermark.test(value)) {
    texts[id] = value.replace(watermark, '').trim();
    textChanges += 1;
  }
  watermark.lastIndex = 0;
}
fs.writeFileSync(textsPath, `${JSON.stringify(texts, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ pageChanges, textChanges }));
