/* Remove source-PDF watermark text from reader pages and read-aloud text. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const watermark = /FOR (?:ONLINE|TEACHING) (?:READING )?ONLY/gi;
const element = /<(div|p|span)\b[^>]*>\s*FOR (?:ONLINE|TEACHING) (?:READING )?ONLY\s*<\/\1>/gi;
const sourceFooter = /(?:MATHEMATICS\s+STD\s+4\s+PB\s+2024\.indd\s+\d+|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i;
const sourceFooterElement = /<(div|p|span)\b[^>]*data-id=["'][^"']+["'][^>]*>\s*(?:MATHEMATICS\s+STD\s+4\s+PB\s+2024\.indd\s+\d+|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*<\/\1>/gi;
let pageChanges = 0;

for (const file of fs.readdirSync(root).filter(name => /^pg\d{3}_sec\d{3}\.html$/i.test(name))) {
  const target = path.join(root, file);
  const original = fs.readFileSync(target, 'utf8');
  const updated = original.replace(element, '').replace(sourceFooterElement, '');
  if (updated !== original) {
    fs.writeFileSync(target, updated, 'utf8');
    pageChanges += 1;
  }
}

const textsPath = path.join(root, 'content', 'i18n', 'en-US', 'texts.json');
const texts = JSON.parse(fs.readFileSync(textsPath, 'utf8'));
let textChanges = 0;
const clearedIds = [];
for (const [id, value] of Object.entries(texts)) {
  if (typeof value === 'string' && watermark.test(value)) {
    texts[id] = value.replace(watermark, '').trim();
    textChanges += 1;
  }
  watermark.lastIndex = 0;
  if (typeof value === 'string' && sourceFooter.test(value.trim())) {
    texts[id] = '';
    clearedIds.push(id);
    textChanges += 1;
  }
}
fs.writeFileSync(textsPath, `${JSON.stringify(texts, null, 2)}\n`, 'utf8');

const audiosPath = path.join(root, 'content', 'i18n', 'en-US', 'audios.json');
const audios = JSON.parse(fs.readFileSync(audiosPath, 'utf8'));
let audioChanges = 0;
for (const id of clearedIds) {
  if (Object.hasOwn(audios, id)) {
    delete audios[id];
    audioChanges += 1;
  }
}
fs.writeFileSync(audiosPath, `${JSON.stringify(audios, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ pageChanges, textChanges, audioChanges }));
