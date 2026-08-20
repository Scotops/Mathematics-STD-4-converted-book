import fs from 'node:fs';

const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));
const texts = JSON.parse(fs.readFileSync('content/i18n/en-US/texts.json', 'utf8'));
const audios = JSON.parse(fs.readFileSync('content/i18n/en-US/audios.json', 'utf8'));
const ids = new Map();
const interactiveFormFiles = [];

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/<(?:input|textarea|select)\b/i.test(source)) interactiveFormFiles.push(file);
  for (const match of source.matchAll(/data-id="([^"]+)"/g)) {
    if (!ids.has(match[1])) ids.set(match[1], []);
    ids.get(match[1]).push(file);
  }
}

const cleanFallback = value => value
  .replace(/<math\b[\s\S]*?<\/math>/gi, ' mathematical expression ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
  .replace(/\s+/g, ' ')
  .trim();

function fallbackFor(id, files) {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const element = source.match(new RegExp(`<([a-z][\\w-]*)[^>]*data-id="${escaped}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'i'));
    if (element) {
      const value = cleanFallback(element[2]);
      if (value) return value;
    }
    const image = source.match(new RegExp(`<img[^>]*data-id="${escaped}"[^>]*>`, 'i'));
    const alt = image?.[0].match(/alt="([^"]*)"/i)?.[1];
    if (alt) return cleanFallback(alt);
  }
  return '';
}

const missingText = [...ids].filter(([id]) => !(id in texts)).map(([id, files]) => [id, files, fallbackFor(id, files)]);
const referencedNonempty = [...ids].filter(([id]) => texts[id]);
const missingAudio = referencedNonempty.filter(([id]) => {
  const filename = audios[id]?.split('?')[0];
  return !filename || !fs.existsSync(`content/i18n/en-US/audio/${filename}`);
});
const pages = JSON.parse(fs.readFileSync('content/pages.json', 'utf8'));

console.log(JSON.stringify({
  htmlFiles: htmlFiles.length,
  pageEntries: pages.length,
  uniqueDataIds: ids.size,
  missingText: missingText.length,
  missingTextSample: missingText,
  referencedNonempty: referencedNonempty.length,
  referencedMissingAudio: missingAudio.length,
  missingAudioSample: missingAudio.slice(0, 25),
  interactiveFormFiles,
}, null, 2));
