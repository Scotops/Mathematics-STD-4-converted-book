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
const concurrency = Math.max(1, Number(valueAfter('--concurrency') ?? 4));
const idPrefixes = (valueAfter('--id-prefixes') ?? '').split(',').map(value => value.trim()).filter(Boolean);
const excludePrefixes = (valueAfter('--exclude-prefixes') ?? '').split(',').map(value => value.trim()).filter(Boolean);
const romanNumbers = args.has('--roman-numbers');
const voice = valueAfter('--voice') ?? 'coral';
const model = valueAfter('--model') ?? 'gpt-4o-mini-tts';
const instructions = valueAfter('--instructions') ??
  'Read in clear, warm General American English for primary school learners. Pronounce every word, number, mathematical operator, unit, fraction, shilling, and cent carefully and naturally. Use a steady instructional pace.';

function romanValue(numeral) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let previous = 0;
  for (const char of numeral.split('').reverse()) {
    const current = values[char];
    if (current < previous) total -= current;
    else { total += current; previous = current; }
  }
  return total;
}

function cardinal(value) {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (value < 10) return ones[value];
  if (value < 20) return teens[value - 10];
  if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? `-${ones[value % 10]}` : ''}`;
  if (value < 1000) return `${ones[Math.floor(value / 100)]} hundred${value % 100 ? ` ${cardinal(value % 100)}` : ''}`;
  if (value === 1000) return 'one thousand';
  return String(value);
}

function romanNumberWords(numeral) {
  return cardinal(romanValue(numeral));
}

function speakable(text) {
  let result = String(text)
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
  if (romanNumbers) result = result.replace(/\b[IVXLCDM]+\b/g, numeral => `Roman number ${romanNumberWords(numeral)}`);
  return result;
}

const texts = JSON.parse(await fs.readFile(textPath, 'utf8'));
const audioMap = JSON.parse(await fs.readFile(audioMapPath, 'utf8'));
const jobs = Object.entries(audioMap)
  .map(([id, filename]) => ({ id, filename, text: speakable(texts[id]) }))
  .filter(job => idPrefixes.length === 0 || idPrefixes.some(prefix => job.id.startsWith(prefix)))
  .filter(job => !excludePrefixes.some(prefix => job.id.startsWith(prefix)))
  .filter(job => job.text.length > 0)
  .slice(0, limit);

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, model, voice, concurrency, romanNumbers, idPrefixes, excludePrefixes, totalJobs: jobs.length, sample: jobs.slice(0, 3) }, null, 2));
  process.exit(0);
}

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required when using --write.');
await fs.mkdir(audioDir, { recursive: true });
let completed = 0;
let cursor = 0;
async function generate(job) {
  if (job.text.length > 4096) throw new Error(`${job.id} exceeds the TTS input limit.`);
  let response;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, voice, input: job.text, instructions, response_format: 'mp3' }),
      });
      if (response.ok || (response.status !== 429 && response.status < 500)) break;
    } catch (error) {
      if (attempt === 4) throw new Error(`${job.id}: ${error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt * attempt));
  }
  if (!response?.ok) throw new Error(`${job.id}: ${response?.status} ${await response?.text()}`);
  const target = path.join(audioDir, job.filename);
  await fs.writeFile(`${target}.tmp`, Buffer.from(await response.arrayBuffer()));
  await fs.rename(`${target}.tmp`, target);
  completed += 1;
  if (completed % 25 === 0 || completed === jobs.length) console.log(`Generated ${completed}/${jobs.length}`);
}

async function worker() {
  while (true) {
    const job = jobs[cursor++];
    if (!job) return;
    await generate(job);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
