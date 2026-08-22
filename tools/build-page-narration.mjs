import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const textPath = path.join(root, 'content', 'i18n', 'en-US', 'texts.json');
const audioPath = path.join(root, 'content', 'i18n', 'en-US', 'audios.json');
const pagesPath = path.join(root, 'content', 'pages.json');
const write = process.argv.includes('--write');
const samplePages = new Set((process.argv.find(value => value.startsWith('--samples='))?.split('=')[1] ?? '8,45,61,90,118,132,155,177').split(',').map(Number));

const unitNames = new Map([
  ['mm', ['millimetre', 'millimetres']], ['cm', ['centimetre', 'centimetres']],
  ['dm', ['decimetre', 'decimetres']], ['m', ['metre', 'metres']],
  ['dam', ['decametre', 'decametres']], ['hm', ['hectometre', 'hectometres']],
  ['km', ['kilometre', 'kilometres']], ['mg', ['milligram', 'milligrams']],
  ['cg', ['centigram', 'centigrams']], ['dg', ['decigram', 'decigrams']],
  ['g', ['gram', 'grams']], ['dag', ['decagram', 'decagrams']],
  ['hg', ['hectogram', 'hectograms']], ['kg', ['kilogram', 'kilograms']],
  ['t', ['tonne', 'tonnes']], ['mL', ['millilitre', 'millilitres']],
  ['L', ['litre', 'litres']], ['seconds', ['second', 'seconds']],
  ['minutes', ['minute', 'minutes']], ['hours', ['hour', 'hours']],
  ['shs', ['shilling', 'shillings']], ['cts', ['cent', 'cents']],
]);

function decodeEntities(value) {
  return String(value)
    .replaceAll('&nbsp;', ' ').replaceAll('&#160;', ' ')
    .replaceAll('&times;', '×').replaceAll('&divide;', '÷').replaceAll('&minus;', '−')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}

function plainText(value) {
  return decodeEntities(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cardinal(value) {
  const small = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (!Number.isInteger(value) || value < 0) return String(value);
  if (value < 20) return small[value];
  if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? `-${small[value % 10]}` : ''}`;
  if (value < 1000) return `${small[Math.floor(value / 100)]} hundred${value % 100 ? ` ${cardinal(value % 100)}` : ''}`;
  if (value < 1_000_000) return `${cardinal(Math.floor(value / 1000))} thousand${value % 1000 ? ` ${cardinal(value % 1000)}` : ''}`;
  return String(value);
}

function romanValue(numeral) {
  const values = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let total = 0;
  let previous = 0;
  for (const character of numeral.split('').reverse()) {
    const current = values[character];
    if (!current) return NaN;
    if (current < previous) total -= current;
    else { total += current; previous = current; }
  }
  return total;
}

function mathmlToSpeech(markup) {
  const rootNode = { tag: 'root', children: [] };
  const stack = [rootNode];
  for (const token of markup.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (!token.startsWith('<')) { stack.at(-1).children.push({ text: decodeEntities(token) }); continue; }
    if (/^<\//.test(token)) {
      const closing = token.match(/^<\/\s*([^\s>]+)/)?.[1]?.toLowerCase();
      while (stack.length > 1) if (stack.pop().tag === closing) break;
      continue;
    }
    const tag = token.match(/^<\s*([^\s/>]+)/)?.[1]?.toLowerCase();
    if (!tag) continue;
    const node = { tag, children: [] };
    stack.at(-1).children.push(node);
    if (!/\/\s*>$/.test(token) && !['mspace','mprescripts','none'].includes(tag)) stack.push(node);
  }
  const render = node => {
    if ('text' in node) return node.text;
    const children = node.children.map(render).join(' ').replace(/\s+/g, ' ').trim();
    if (node.tag === 'mfrac') return `${render(node.children[0] ?? {text:''})} over ${render(node.children[1] ?? {text:''})}`;
    if (node.tag === 'msup') {
      const base = render(node.children[0] ?? {text:''});
      const exponent = render(node.children[1] ?? {text:''});
      if (exponent === '2') return `${base} squared`;
      if (exponent === '3') return `${base} cubed`;
      return `${base} to the power of ${exponent}`;
    }
    if (node.tag === 'mtable') return node.children.map(render).join('; ');
    if (node.tag === 'mrow' && node.children.length === 2 && node.children[1]?.tag === 'menclose') {
      const divisor = render(node.children[0]);
      const dividend = render(node.children[1]).replace(/^\)\s*/, '');
      return `${dividend} divided by ${divisor}, using long division`;
    }
    return children;
  };
  return render(rootNode);
}

function unitPhrase(numberToken, unitToken) {
  const names = unitNames.get(unitToken);
  if (!names) return `${numberToken} ${unitToken}`;
  const numeric = Number(String(numberToken).replaceAll(',', ''));
  return `${numberToken} ${numeric === 1 ? names[0] : names[1]}`;
}

function expandStandaloneUnits(value) {
  let result = value;
  for (const [token, names] of [...unitNames].sort((a, b) => b[0].length - a[0].length)) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b(\\d[\\d,]*(?:\\.\\d+)?)\\s*${escaped}\\b`, 'g'), (_, number) => unitPhrase(number, token));
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'g'), names[1]);
  }
  return result;
}

function currencyLongDivision(value) {
  const text = plainText(String(value).replace(/<br\s*\/?\s*>/gi, ' '));
  const match = text.match(/^(?:(\d+(?:\s+\d+)?)\s+)?(\d+)\)(\d+)\s+(\d+)$/);
  if (!match) return null;
  const [, quotient, divisor, shillings, cents] = match;
  const calculation = `${shillings} shillings ${cents} cents divided by ${divisor}, using long division`;
  if (!quotient) return calculation;
  const quotientParts = quotient.split(/\s+/);
  const quotientSpeech = quotientParts.length === 2
    ? `${quotientParts[0]} shillings ${quotientParts[1]} cents`
    : `${quotientParts[0]} shillings`;
  return `Quotient ${quotientSpeech}. ${calculation}`;
}

function speakable(source, { questionNumber = false, stepNumber = false, romanNumbers = false } = {}) {
  const raw = String(source);
  if (/^\d+\.$/.test(plainText(raw))) {
    const number = cardinal(Number(plainText(raw).slice(0, -1)));
    return stepNumber ? `Step number ${number}.` : `Question number ${number}.`;
  }
  let result = raw
    .replace(/\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}/g, (_, content) => content.replaceAll('\\hline','').replaceAll('\\,',' ').split(/\\\\/).map(row => row.trim()).filter(Boolean).join('; '))
    .replace(/<math\b[\s\S]*?<\/math>/gi, mathmlToSpeech)
    .replace(/<span\b[^>]*\bclass=(["'])[^"']*\banswer-line\b[^"']*\1[^>]*>\s*<\/span>/gi, ' dash ')
    .replace(/<br\s*\/?\s*>/gi, '; ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(\d[\d,.]*)\s*[⟌)]\s*(\d[\d,.]*)/g, '$2 divided by $1, using long division')
    .replaceAll('↓', ' bring down ')
    .replace(/─+/g, '; ')
    .replaceAll('½',' one over two ').replaceAll('¼',' one over four ').replaceAll('¾',' three over four ')
    .replaceAll('⅓',' one over three ').replaceAll('⅔',' two over three ')
    .replaceAll('⅛',' one over eight ').replaceAll('⅜',' three over eight ').replaceAll('⅝',' five over eight ').replaceAll('⅞',' seven over eight ')
    .replace(/(?<!\d\/)(\b\d+)\s*\/\s*(\d+\b)(?!\s*\/)/g, '$1 over $2')
    .replaceAll('×',' multiplied by ').replaceAll('÷',' divided by ')
    .replaceAll('−',' minus ').replaceAll('–',' minus ')
    .replaceAll('=',' equals ').replaceAll('≤',' less than or equal to ').replaceAll('≥',' greater than or equal to ')
    .replaceAll('<',' less than ').replaceAll('>',' greater than ')
    .replaceAll('²',' squared').replaceAll('³',' cubed')
    .replace(/\(([a-z])\)/gi, (_, letter) => `part ${letter}`)
    .replace(/(?<![\d\w])-\s*(\d)/g, ' minus $1');
  result = expandStandaloneUnits(result);
  result = result
    .replace(/\bshillings\s+(\d[\d,.]*)\b/gi, '$1 shillings')
    .replace(/\bcents\s+(\d[\d,.]*)\b/gi, '$1 cents')
    .replace(/\bDrop (\d+) (ones|tens|hundreds), then divide by (\d+)\b/gi, 'Drop $1 $2, then divide $1 by $3')
    .replace(/symbols\s*\(greater than\)/gi, 'symbols less than and greater than');
  if (questionNumber) result = result.replace(/^(\d+)\.\s+/, (_, number) => `Question number ${cardinal(Number(number))}. `);
  if (stepNumber) result = result.replace(/^(\d+)\.\s+/, (_, number) => `Step number ${cardinal(Number(number))}. `);
  if (romanNumbers) result = result.replace(/\b[IVXLCDM]+\b/g, numeral => {
    const value = romanValue(numeral);
    return Number.isFinite(value) ? `Roman number ${cardinal(value)}` : numeral;
  });
  return result.replace(/\s+/g, ' ').replace(/(?:;\s*){2,}/g, '; ').trim();
}

function isUnitHeader(value) {
  const tokens = plainText(value).split(/\s+/).filter(Boolean);
  return tokens.length >= 1 && tokens.length <= 4 && tokens.every(token => unitNames.has(token));
}

function measurementRow(value, units) {
  const text = plainText(value).replace(/^\+/, '+ ').replace(/^[-−]/, '− ');
  const tokens = text.split(/\s+/).filter(Boolean);
  let operator = '';
  if (['+','−','-'].includes(tokens[0])) operator = tokens.shift();
  if (tokens.length !== units.length || tokens.some(token => !/^\d[\d,.]*$/.test(token))) return null;
  const prefix = operator === '+' ? 'plus ' : operator ? 'minus ' : '';
  return `${prefix}${tokens.map((number, index) => unitPhrase(number, units[index])).join(' ')}`;
}

function buildNarration(entries, pageNumber) {
  const output = [];
  let inSteps = false;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const text = plainText(entry.value);
    if (!text || entry.id.includes('_ans_item-') || /_read\d{3}$/.test(entry.id)) continue;
    if (/^Steps$/i.test(text)) inSteps = true;
    if (/^(Example|Exercise|Activity|Revision Exercise|Summary|Vocabulary|Chapter)\b/i.test(text)) inSteps = false;

    if (isUnitHeader(text)) {
      const units = text.split(/\s+/);
      if (units.join(' ') === 'shs cts' && entries[index + 1]) {
        const longDivision = currencyLongDivision(entries[index + 1].value);
        if (longDivision) {
          output.push(`${longDivision}.`);
          index += 1;
          continue;
        }
      }
      const rows = [];
      let cursor = index + 1;
      while (cursor < entries.length) {
        const row = measurementRow(entries[cursor].value, units);
        if (!row) break;
        rows.push(row);
        cursor += 1;
      }
      if (rows.length) {
        const answerEntry = entries[cursor];
        const hasAnswerDash = Boolean(answerEntry) && (!plainText(answerEntry.value) || /answer-line/i.test(answerEntry.value));
        output.push(`${rows.join('; ')}${hasAnswerDash ? '; dash' : ''}.`);
        index = cursor - 1 + (hasAnswerDash ? 1 : 0);
        continue;
      }
    }

    if (pageNumber === 177 && /^pg177_n00(?:16|18|20|22)$/.test(entry.id)) {
      const match = text.match(/^(\d+)\s+divided by\s+(\d+)$/i);
      if (match) {
        output.push(`${match[1]} shillings divided by ${match[2]}, using long division, equals dash.`);
        continue;
      }
    }

    const spoken = speakable(entry.value, {
      questionNumber: /^\d+\.\s+/.test(text) && !inSteps,
      stepNumber: inSteps,
      romanNumbers: pageNumber >= 7 && pageNumber <= 27,
    });
    if (!spoken) continue;
    if (output.at(-1)?.toLowerCase() === spoken.toLowerCase()) continue;
    output.push(/[.!?;:]$/.test(spoken) ? spoken : `${spoken}.`);
  }
  return output;
}

function chunksFrom(parts, maximum = 3000) {
  const chunks = [];
  let current = '';
  for (const part of parts) {
    if (part.length > maximum) {
      if (current) { chunks.push(current); current = ''; }
      const sentences = part.split(/(?<=[.!?;])\s+/);
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > maximum && current) { chunks.push(current); current = ''; }
        current = `${current} ${sentence}`.trim();
      }
      continue;
    }
    if ((current + ' ' + part).trim().length > maximum && current) { chunks.push(current); current = ''; }
    current = `${current} ${part}`.trim();
  }
  if (current) chunks.push(current);
  return chunks;
}

const pages = JSON.parse(await fs.readFile(pagesPath, 'utf8'));
const texts = JSON.parse(await fs.readFile(textPath, 'utf8'));
const audios = JSON.parse(await fs.readFile(audioPath, 'utf8'));
const report = [];

for (let index = 0; index < pages.length; index += 1) {
  const pageNumber = index + 1;
  const href = pages[index].href;
  const filePath = path.join(root, href);
  let html = await fs.readFile(filePath, 'utf8');
  html = html.replace(/<div class=["']sr-only adt-page-narration["'][^>]*>[\s\S]*?<\/div>/i, '');
  const orderedIds = [...html.matchAll(/\bdata-(?:source-)?id=["']([^"']+)["']/g)].map(match => match[1]);
  const seen = new Set();
  const entries = orderedIds.filter(id => !seen.has(id) && seen.add(id)).map(id => ({ id, value: texts[id] ?? '' }));
  const narration = buildNarration(entries, pageNumber);
  const chunks = chunksFrom(narration);
  const pagePrefix = `pg${String(pageNumber).padStart(3, '0')}`;
  const ids = chunks.map((text, chunkIndex) => ({
    id: `${pagePrefix}_read${String(chunkIndex + 1).padStart(3, '0')}`,
    text,
    filename: `${pagePrefix}_read${String(chunkIndex + 1).padStart(3, '0')}.mp3`,
  }));
  report.push({ pageNumber, href, sourceIds: entries.length, narrationParts: narration.length, characters: chunks.reduce((sum, chunk) => sum + chunk.length, 0), chunks: ids });

  if (!write) continue;
  for (const item of ids) { texts[item.id] = item.text; audios[item.id] = item.filename; }
  html = html.replace(/\bdata-id=/g, 'data-source-id=');
  const narrationHtml = `<div class="sr-only adt-page-narration" aria-label="Complete page narration">${ids.map(item => `<span data-id="${item.id}">${item.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</span>`).join('')}</div>`;
  html = html.replace(/(<div\b[^>]*\bid=["']content["'][^>]*>)/i, `$1${narrationHtml}`);
  await fs.writeFile(filePath, html);
}

if (write) {
  await fs.writeFile(textPath, `${JSON.stringify(texts, null, 2)}\n`);
  await fs.writeFile(audioPath, `${JSON.stringify(audios, null, 2)}\n`);
}

const samples = report.filter(page => samplePages.has(page.pageNumber)).map(page => ({
  page: page.pageNumber,
  href: page.href,
  sourceIds: page.sourceIds,
  characters: page.characters,
  chunks: page.chunks.map(chunk => chunk.text),
}));
console.log(JSON.stringify({ write, pages: report.length, totalChunks: report.reduce((sum, page) => sum + page.chunks.length, 0), emptyPages: report.filter(page => page.chunks.length === 0).map(page => page.pageNumber), samples }, null, 2));
