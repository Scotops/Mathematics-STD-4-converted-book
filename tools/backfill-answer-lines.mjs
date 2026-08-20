import fs from 'node:fs/promises';

const textPath = 'content/i18n/en-US/texts.json';
const audioPath = 'content/i18n/en-US/audios.json';
const texts = JSON.parse(await fs.readFile(textPath, 'utf8'));
const audios = JSON.parse(await fs.readFile(audioPath, 'utf8'));
const files = (await fs.readdir('.')).filter(file => file.endsWith('.html'));
const referenced = new Set();

for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  for (const match of source.matchAll(/data-id="([^"]+)"/g)) referenced.add(match[1]);
}

const ids = [...referenced].filter(id => !(id in texts) && !/_im\d/i.test(id));
for (const id of ids) {
  texts[id] = '<span class="answer-line" aria-hidden="true"></span>';
  audios[id] = `${id}.mp3?v=43`;
}

await fs.writeFile(textPath, `${JSON.stringify(texts, null, 2)}\n`);
await fs.writeFile(audioPath, `${JSON.stringify(audios, null, 2)}\n`);
console.log(`Backfilled ${ids.length} answer-line placeholders.`);
