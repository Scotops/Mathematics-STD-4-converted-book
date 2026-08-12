import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const textPath = path.join(root, 'content', 'i18n', 'en-US', 'texts.json');
const audioMapPath = path.join(root, 'content', 'i18n', 'en-US', 'audios.json');
const audioDir = path.join(root, 'content', 'i18n', 'en-US', 'audio');
const args = new Set(process.argv.slice(2));
const valueAfter = flag => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const dryRun = !args.has('--write');
const limit = Number(valueAfter('--limit') ?? Number.POSITIVE_INFINITY);
const voice = valueAfter('--voice') ?? 'coral';
const model = valueAfter('--model') ?? 'gpt-4o-mini-tts';
const instructions = valueAfter('--instructions') ??
  'Read English clearly in a warm, natural Tanzanian English voice with a subtle Swahili-influenced Tanzanian accent. Pronounce mathematical operators, units, shillings, cents, fractions, and numbers carefully for primary school learners.';

function speakable(text) {
  return String(text)
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('×', ' multiplied by ')
    .replaceAll('÷', ' divided by ')
    .replaceAll('−', ' minus ')
    .replaceAll('–', ' minus ')
    .replaceAll('=', ' equals ')
    .replaceAll('≤', ' less than or equal to ')
    .replaceAll('≥', ' greater than or equal to ')
    .replaceAll('<', ' less than ')
    .replaceAll('>', ' greater than ')
    .replaceAll('shs', 'shillings')
    .replaceAll('cts', 'cents')
    .replace(/\s+/g, ' ')
    .trim();
}

const texts = JSON.parse(await fs.readFile(textPath, 'utf8'));
const audioMap = JSON.parse(await fs.readFile(audioMapPath, 'utf8'));
const jobs = Object.entries(audioMap)
  .map(([id, filename]) => ({ id, filename, text: speakable(texts[id]) }))
  .filter(job => job.text.length > 0)
  .slice(0, limit);

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, model, voice, totalJobs: jobs.length, sample: jobs.slice(0, 3) }, null, 2));
  process.exit(0);
}

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required when using --write.');
await fs.mkdir(audioDir, { recursive: true });
let completed = 0;
for (const job of jobs) {
  if (job.text.length > 4096) throw new Error(`${job.id} exceeds the TTS input limit.`);
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, voice, input: job.text, instructions, response_format: 'mp3' }),
  });
  if (!response.ok) throw new Error(`${job.id}: ${response.status} ${await response.text()}`);
  const target = path.join(audioDir, job.filename);
  await fs.writeFile(`${target}.tmp`, Buffer.from(await response.arrayBuffer()));
  await fs.rename(`${target}.tmp`, target);
  completed += 1;
  if (completed % 25 === 0 || completed === jobs.length) console.log(`Generated ${completed}/${jobs.length}`);
}
