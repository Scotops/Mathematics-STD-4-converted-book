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
const startAt = Math.max(0, Number(valueAfter('--start-at') ?? 0));
const concurrency = Math.max(1, Number(valueAfter('--concurrency') ?? 4));
const idPrefixes = (valueAfter('--id-prefixes') ?? '').split(',').map(value => value.trim()).filter(Boolean);
const excludePrefixes = (valueAfter('--exclude-prefixes') ?? '').split(',').map(value => value.trim()).filter(Boolean);
const romanNumbers = args.has('--roman-numbers');
const questionNumbersOnly = args.has('--question-numbers-only');
const stepNumbersOnly = args.has('--step-numbers-only');
const answerLinesOnly = args.has('--answer-lines-only');
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

function isStandaloneQuestionNumber(text) {
  return /^\d+\.$/.test(String(text).trim());
}

function plainText(value) {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function findStepNumberIds(sourceTexts) {
  const entries = Object.entries(sourceTexts);
  const ids = new Set();
  for (let index = 0; index < entries.length; index += 1) {
    const [id, value] = entries[index];
    if (plainText(value) !== 'Steps') continue;
    const pagePrefix = id.slice(0, 5);
    for (let cursor = index + 1; cursor < entries.length && entries[cursor][0].slice(0, 5) === pagePrefix; cursor += 1) {
      const [candidateId, candidateValue] = entries[cursor];
      const text = plainText(candidateValue);
      if (/^(Example|Exercise|Activity|Chapter|Introduction|Revision Exercise)\b/i.test(text)) break;
      if (/^\d+\.(?:\s|$)/.test(text)) ids.add(candidateId);
    }
  }
  for (const [id, value] of entries) if (/\bSteps\s+\d+\./i.test(String(value))) ids.add(id);
  return ids;
}

function decodeEntities(value) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#160;', ' ')
    .replaceAll('&times;', '×')
    .replaceAll('&divide;', '÷')
    .replaceAll('&minus;', '−')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function mathmlToSpeech(markup) {
  const root = { tag: 'root', children: [] };
  const stack = [root];
  for (const token of markup.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (!token.startsWith('<')) {
      stack.at(-1).children.push({ text: decodeEntities(token) });
      continue;
    }
    if (/^<\//.test(token)) {
      const closingTag = token.match(/^<\/\s*([^\s>]+)/)?.[1]?.toLowerCase();
      while (stack.length > 1) {
        const node = stack.pop();
        if (node.tag === closingTag) break;
      }
      continue;
    }
    const tag = token.match(/^<\s*([^\s/>]+)/)?.[1]?.toLowerCase();
    if (!tag) continue;
    const node = { tag, children: [] };
    stack.at(-1).children.push(node);
    if (!/\/\s*>$/.test(token) && !['mspace', 'mprescripts', 'none'].includes(tag)) stack.push(node);
  }
  const render = node => {
    if ('text' in node) return node.text;
    const children = node.children.map(render).join(' ').replace(/\s+/g, ' ').trim();
    if (node.tag === 'mrow' && node.children.length === 2 && node.children[1]?.tag === 'menclose') {
      const divisor = render(node.children[0]);
      const enclosed = render(node.children[1]);
      if (enclosed.startsWith(')')) return `${enclosed.slice(1).trim()} divided by ${divisor}`;
    }
    if (node.tag === 'mfrac') {
      const numerator = render(node.children[0] ?? { text: '' });
      const denominator = render(node.children[1] ?? { text: '' });
      return `${numerator} over ${denominator}`;
    }
    if (node.tag === 'msup') return `${render(node.children[0] ?? { text: '' })} to the power of ${render(node.children[1] ?? { text: '' })}`;
    if (node.tag === 'msub') return `${render(node.children[0] ?? { text: '' })} subscript ${render(node.children[1] ?? { text: '' })}`;
    if (node.tag === 'msqrt') return `square root of ${children}`;
    if (node.tag === 'mroot') return `${render(node.children[0] ?? { text: '' })} root of ${render(node.children[1] ?? { text: '' })}`;
    if (node.tag === 'mtable') return node.children.map(render).join('; ');
    return children;
  };
  return render(root);
}

function texArraysToSpeech(value) {
  return value.replace(/\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}/g, (_, contents) => contents
    .replaceAll('\\hline', '')
    .replaceAll('\\,', ' ')
    .split(/\\\\/)
    .map(row => row.trim())
    .filter(Boolean)
    .join('; '));
}

function speakable(text, stepNumbered = false) {
  if (isStandaloneQuestionNumber(text)) {
    const number = cardinal(Number(String(text).trim().slice(0, -1)));
    return stepNumbered ? `Step number ${number}.` : `Question number ${number}.`;
  }
  let result = texArraysToSpeech(String(text))
    .replace(/<math\b[\s\S]*?<\/math>/gi, mathmlToSpeech)
    .replace(/<span\b[^>]*\bclass=(["'])[^"']*\banswer-line\b[^"']*\1[^>]*>\s*<\/span>/gi, ' dash ')
    .replace(/<br\s*\/?\s*>/gi, '; ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(\d+(?:\.\d+)?)\s*⟌\s*(\d+(?:\.\d+)?)/g, '$2 divided by $1')
    .replaceAll('↓', ' bring down ')
    .replace(/─+/g, '; ')
    .replaceAll('½', ' one over two ')
    .replaceAll('¼', ' one over four ')
    .replaceAll('¾', ' three over four ')
    .replaceAll('⅓', ' one over three ')
    .replaceAll('⅔', ' two over three ')
    .replaceAll('⅛', ' one over eight ')
    .replaceAll('⅜', ' three over eight ')
    .replaceAll('⅝', ' five over eight ')
    .replaceAll('⅞', ' seven over eight ')
    .replace(/(?<!\d\/)(\b\d+)\s*\/\s*(\d+\b)(?!\s*\/)/g, '$1 over $2')
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
    .replace(/(?<![\d\w])-\s*(\d)/g, ' minus $1')
    .replace(/\s+/g, ' ')
    .replace(/(?:;\s*){2,}/g, '; ')
    .trim();
  if (romanNumbers) result = result.replace(/\b[IVXLCDM]+\b/g, numeral => `Roman number ${romanNumberWords(numeral)}`);
  if (stepNumbered) {
    result = result
      .replace(/^(\d+)\.\s*/, (_, number) => `Step number ${cardinal(Number(number))}. `)
      .replace(/\bSteps\s+(\d+)\./gi, (_, number) => `Steps. Step number ${cardinal(Number(number))}.`)
      .replace(/;\s*(\d+)\./g, (_, number) => `; Step number ${cardinal(Number(number))}.`)
      .replace(/(\.)\s+([1-9]\d?)\.(?=\s+(?:Add|Subtract|Write|Multiply|Divide|Count|Draw|Shade|Convert|Change|Show|Identify|Measure|Put|Take|Drop|Regroup))/g, (_, period, number) => `${period} Step number ${cardinal(Number(number))}.`);
  }
  return result;
}

const texts = JSON.parse(await fs.readFile(textPath, 'utf8'));
const audioMap = JSON.parse(await fs.readFile(audioMapPath, 'utf8'));
const stepNumberIds = findStepNumberIds(texts);
const allJobs = Object.entries(audioMap)
  .map(([id, filename]) => ({ id, filename, text: speakable(texts[id], stepNumberIds.has(id)) }))
  .filter(job => idPrefixes.length === 0 || idPrefixes.some(prefix => job.id.startsWith(prefix)))
  .filter(job => !excludePrefixes.some(prefix => job.id.startsWith(prefix)))
  .filter(job => !questionNumbersOnly || isStandaloneQuestionNumber(texts[job.id]))
  .filter(job => !stepNumbersOnly || stepNumberIds.has(job.id))
  .filter(job => !answerLinesOnly || /\banswer-line\b/i.test(String(texts[job.id])))
  .filter(job => job.text.length > 0);
const jobs = allJobs.slice(startAt, Number.isFinite(limit) ? startAt + limit : undefined);

if (args.has('--audit-math-speech')) {
  const fractionSource = /<mfrac\b|[½¼¾⅓⅔⅛⅜⅝⅞]/i;
  const divisionSource = /⟌|<menclose\b[^>]*\bnotation=["']top["'][^>]*>\s*<mrow>\s*<mo[^>]*>\)<\/mo>/i;
  const fractions = allJobs.filter(job => fractionSource.test(texts[job.id]));
  const divisions = allJobs.filter(job => divisionSource.test(texts[job.id]));
  const fractionFailures = fractions.filter(job => !/\bover\b/i.test(job.text));
  const divisionFailures = divisions.filter(job => !/\bdivided by\b/i.test(job.text));
  console.log(JSON.stringify({
    fractionExpressions: fractions.length,
    fractionFailures: fractionFailures.map(job => ({ id: job.id, speech: job.text })),
    longDivisionExpressions: divisions.length,
    longDivisionFailures: divisionFailures.map(job => ({ id: job.id, speech: job.text })),
  }, null, 2));
  process.exit(0);
}

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, model, voice, concurrency, romanNumbers, idPrefixes, excludePrefixes, startAt, totalJobs: jobs.length, sourceJobs: allJobs.length, sample: jobs.slice(0, 3) }, null, 2));
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
        signal: AbortSignal.timeout(90000),
      });
      if (response.ok || (response.status !== 429 && response.status < 500)) break;
    } catch (error) {
      if (attempt === 4) throw new Error(`${job.id}: ${error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt * attempt));
  }
  if (!response?.ok) throw new Error(`${job.id}: ${response?.status} ${await response?.text()}`);
  const target = path.join(audioDir, job.filename.split('?')[0]);
  await fs.writeFile(`${target}.tmp`, Buffer.from(await response.arrayBuffer()));
  await fs.rename(`${target}.tmp`, target);
  completed += 1;
  if (completed % 25 === 0 || completed === jobs.length) console.log(`Generated ${startAt + completed}/${allJobs.length}`);
}

async function worker() {
  while (true) {
    const job = jobs[cursor++];
    if (!job) return;
    await generate(job);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
