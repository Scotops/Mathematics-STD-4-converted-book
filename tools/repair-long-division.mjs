import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const textPath = path.join(root, 'content', 'i18n', 'en-US', 'texts.json');
const texts = JSON.parse(fs.readFileSync(textPath, 'utf8'));
let replacements = 0;

function divisionMarkup(divisor, dividend, id) {
  const spoken = `${dividend} divided by ${divisor}`;
  texts[id] = spoken;
  return `<span data-id="${id}" class="sr-only">${spoken}</span><span aria-hidden="true" class="inline-flex items-start font-mono leading-none"><span class="border-r-2 border-gray-800 pr-1 pt-1">${divisor}</span><span class="border-t-2 border-gray-800 pl-1 pt-1">${dividend}</span></span>`;
}

for (const filename of ['pg044_sec002.html']) {
  const file = path.join(root, filename);
  const source = fs.readFileSync(file, 'utf8');
  const output = source.replace(
    /<span data-id="([^"]+)" class="font-medium tracking-tight">(\d+)\\right\)(\d+)<\/span>/g,
    (_, id, divisor, dividend) => {
      replacements += 1;
      return divisionMarkup(divisor, dividend, id);
    },
  );
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg046_sec002.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source.replace(
    /<div class="mb-8 flex justify-center"><img src="images\/pg046_im004_crop_v1\.png"[^>]+><\/div>/,
    '',
  );
  output = output.replace(
    /<span data-id="([^"]+)" class="text-2xl font-semibold text-gray-800"><math><mrow><mn>(\d+)<\/mn><menclose notation="top" class="tml-overline"><mrow><mo form="postfix" stretchy="false" lspace="0em" rspace="0em">\)<\/mo><mn>(\d+)<\/mn><\/mrow><\/menclose><\/mrow><\/math><\/span>/g,
    (_, id, divisor, dividend) => {
      replacements += 1;
      return `<span class="text-2xl font-semibold text-gray-800">${divisionMarkup(divisor, dividend, id)}</span>`;
    },
  );
  output = output.replace('grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5', 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg053_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source
    .replace(/\s*<div class="flex items-start gap-2">\s*<input[^>]+>\s*<\/div>/g, '')
    .replace(/\s*<input[^>]+>/g, '')
    .replace(/<script>\s*\(function\(\) \{[\s\S]*?<\/script>/, '')
    .replace(/ &#xf7; (\d+) =/g, ' &#xf7; $1')
    .replace(/\s*<div class="mt-6 flex flex-col items-center gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/, '\n      </div>\n  </section>');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg061_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source
    .replace('container mx-auto max-w-5xl bg-white', 'container mx-auto max-w-6xl bg-white')
    .replace('class="mx-auto max-w-4xl"><div class="relative border', 'class="mx-auto max-w-6xl"><div class="relative border');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg070_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source
    .replaceAll('grid grid-cols-2 gap-x-4 text-center', 'grid w-28 grid-cols-2 gap-x-4 text-center')
    .replaceAll('grid grid-cols-2 gap-x-6 text-center', 'grid w-28 grid-cols-2 gap-x-6 text-center');
  for (const id of ['pg070_n0009', 'pg070_n0010', 'pg070_n0011', 'pg070_n0027', 'pg070_n0028', 'pg070_n0029']) {
    output = output.replace(`data-id="${id}" `, '');
  }
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg072_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  const output = source.replace('container mx-auto max-w-5xl bg-white', 'container mx-auto max-w-6xl bg-white');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg073_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source
    .replaceAll('grid grid-cols-2 gap-x-6 text-center', 'grid w-28 grid-cols-2 gap-x-6 text-center')
    .replaceAll('grid grid-cols-3 gap-x-6 text-center', 'grid w-40 grid-cols-3 gap-x-6 text-center');
  for (const id of ['pg073_n0009', 'pg073_n0010', 'pg073_n0011']) output = output.replace(` data-id="${id}"`, '');
  texts.pg073_n0011 = '− 6 420';
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg078_sec002.html');
  const source = fs.readFileSync(file, 'utf8');
  const output = source
    .replaceAll('grid grid-cols-2 gap-x-6 text-center', 'grid w-28 grid-cols-2 gap-x-6 text-center')
    .replace(' data-id="pg078_n0037"', '');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg114_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const id of ['pg114_n0004','pg114_n0006','pg114_n0007','pg114_n0008','pg114_n0009','pg114_n0010','pg114_n0014','pg114_n0016','pg114_n0017','pg114_n0018','pg114_n0019','pg114_n0020']) {
    output = output.replace(` data-id="${id}"`, '');
  }
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg124_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source.replace(
    /<span class="inline-flex[^\"]*"[^>]*><span>(\d+)<\/span><span class="border-t border-gray-900 mt-\[2px\] pt-\[2px\]">(\d+)<\/span><\/span>/g,
    '<math><mfrac><mn>$1</mn><mn>$2</mn></mfrac></math>',
  );
  output = output.replaceAll('text-gray-900 leading-none flex-1" aria-hidden="true"', 'text-gray-900 leading-none flex-1 whitespace-nowrap" aria-hidden="true"');
  output = output.replace('container mx-auto max-w-5xl bg-white', 'container mx-auto max-w-6xl bg-white');
  output = output.replace('gap-x-14 gap-y-8', 'gap-x-6 gap-y-8');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  for (const filename of ['pg137_sec001.html', 'pg138_sec001.html', 'pg138_sec002.html', 'pg140_sec001.html', 'pg140_sec002.html', 'pg142_sec002.html', 'pg143_sec001.html']) {
    const file = path.join(root, filename);
    const source = fs.readFileSync(file, 'utf8');
    const output = source.split(/(\r?\n)/).map(line => line.includes('<math>') ? line.replace(/\sdata-id="[^"]+"/g, '') : line).join('');
    if (source !== output) fs.writeFileSync(file, output);
  }
}

{
  const file = path.join(root, 'pg154_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const id of ['pg154_n0007','pg154_n0008','pg154_n0009','pg154_n0016','pg154_n0017','pg154_n0018','pg154_n0019','pg154_n0023','pg154_n0024','pg154_n0025','pg154_n0027','pg154_n0028','pg154_n0029','pg154_n0030']) output = output.replaceAll(` data-id="${id}"`, '');
  if (source !== output) fs.writeFileSync(file, output);
}

// Keep adjacent hour/minute columns as authored.  Localizing their wrapper
// replaces the grid with a flattened string (for example, "8 37" -> "837").
{
  const file = path.join(root, 'pg159_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const id of ['pg159_n0005','pg159_n0009','pg159_n0014','pg159_n0018']) output = output.replace(` data-id="${id}"`, '');
  output = output.replace('7   97<br>-3   22<br>5   15', '8   37<br>-3   22<br>5   15');
  output = output.replace('7   97<br>-4   28<br>3   69<br>3   09', '8   37<br>-4   28<br>4   09');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg160_sec002.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const id of ['pg160_n0055','pg160_n0056','pg160_n0078','pg160_n0079','pg160_n0080']) output = output.replace(` data-id="${id}"`, '');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg161_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const id of ['pg161_n0005','pg161_n0020','pg161_n0026','pg161_n0029']) output = output.replace(` data-id="${id}"`, '');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg172_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const id of ['pg172_n0005','pg172_n0006','pg172_n0007','pg172_n0018','pg172_n0019','pg172_n0020','pg172_n0021','pg172_n0029','pg172_n0030','pg172_n0031','pg172_n0032','pg172_n0039','pg172_n0040','pg172_n0041','pg172_n0045','pg172_n0046','pg172_n0047','pg172_n0048']) output = output.replace(` data-id="${id}"`, '');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg178_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  const long = (id, divisor, dividend, suffix = '') => `${divisionMarkup(divisor, dividend, id)}${suffix}`;
  output = output
    .replace('<span data-id="pg178_n0006">45)205312  50</span>', long('pg178_n0006', '45', '205312', ' <span aria-hidden="true">50</span>'))
    .replace('<span data-id="pg178_n0021">45)205312  50</span>', long('pg178_n0021', '45', '205312', ' <span aria-hidden="true">50</span>'))
    .replace('<span data-id="pg178_n0031">45)205290  50</span>', long('pg178_n0031', '45', '205290', ' <span aria-hidden="true">50</span>'))
    .replace('<span data-id="pg178_n0040">9)19000  80</span>', long('pg178_n0040', '9', '19000', ' <span aria-hidden="true">80</span>'))
    .replace('<span data-id="pg178_n0045">9)19000  80</span>', long('pg178_n0045', '9', '19000', ' <span aria-hidden="true">80</span>'));
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg179_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source.replace('<div data-id="pg179_n0013" class="border-b-2 border-zinc-700 pb-1 text-center">5)80</div>', `<div class="border-b-2 border-zinc-700 pb-1 text-center">${divisionMarkup('5', '80', 'pg179_n0013')}</div>`);
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg184_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const [id, divisor, dividend, cents] of [
    ['pg184_n0010', '18', '44284', '14'], ['pg184_n0015', '19', '95460', '37'],
    ['pg184_n0020', '13', '7653', '62'], ['pg184_n0025', '14', '19007', '66'],
  ]) {
    const old = `<span class="border-b border-gray-600 px-1 pb-1" data-id="${id}">${divisor})${dividend} ${cents}</span>`;
    const replacement = `<span class="border-b border-gray-600 px-1 pb-1">${divisionMarkup(divisor, dividend, id)} <span aria-hidden="true">${cents}</span></span>`;
    output = output.replace(old, replacement);
  }
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg049_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source.replace(
    /<div data-id="([^"]+)" class="([^"]+)"><math><mrow><mn>(\d+)<\/mn><menclose notation="top" class="tml-overline"><mrow><mo form="postfix" stretchy="false" lspace="0em" rspace="0em">\)<\/mo><mn>(\d+)<\/mn><\/mrow><\/menclose><\/mrow><\/math><\/div>/g,
    (_, id, classes, divisor, dividend) => {
      replacements += 1;
      return `<div class="${classes}">${divisionMarkup(divisor, dividend, id)}</div>`;
    },
  );
  output = output.replace(/\\downarrow/g, '↓');
  output = output.replace(/\s*<div class="mt-2 w-\[32%\][\s\S]*?<\/div>\s*<\/div>\s*\n\s*<h1/, '\n    </div>\n\n    <h1');
  for (const [id, value] of Object.entries(texts)) {
    if (id.startsWith('pg049_') && typeof value === 'string') texts[id] = value.replace(/\\downarrow/g, '↓');
  }
  if (source !== output) fs.writeFileSync(file, output);
}

// Currency-division examples must retain the book's long-division notation;
// a localized flat text string otherwise replaces the visual working.
{
  const file = path.join(root, 'pg176_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source
    .replace('38&#x203e;)2850 = 75, 285 - 266 = 19, 190 - 190 = 0', `${divisionMarkup('38', '2850', 'pg176_n0023')} <span class="ml-4">= 75</span><div class="ml-8 mt-2 leading-tight">−266<br>190<br>−190<br>0</div>`)
    .replace('118&#x203e;)9912 = 84', `${divisionMarkup('118', '9912', 'pg176_n0030')} <span class="ml-4">= 84</span>`);
  output = output.replace('<div data-id="pg176_n0023" class=', '<div class=').replace('<div data-id="pg176_n0030" class=', '<div class=');
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg177_sec001.html');
  const source = fs.readFileSync(file, 'utf8');
  let output = source;
  for (const [id, divisor, dividend] of [
    ['pg177_n0016', '14', '13440'], ['pg177_n0018', '45', '33750'],
    ['pg177_n0020', '64', '40640'], ['pg177_n0022', '57', '468084'],
  ]) {
    output = output.replace(/<span data-id="" class="fitb-sentence">[^<]*<\/span>/, '');
    const original = texts[id];
    output = output.replace(`<span data-id="${id}" class="fitb-sentence">${original}</span>`, `<span class="fitb-sentence">shs ${divisionMarkup(divisor, dividend, id)} = [[blank:item-${id === 'pg177_n0016' ? 7 : id === 'pg177_n0018' ? 8 : id === 'pg177_n0020' ? 9 : 10}]]</span>`);
  }
  output = output.replace(/ = \[\[blank:item-(7|8|9|10)\]\]/g, (_, item) => ` = <input class="ml-2 w-20 border-0 border-b border-gray-500 bg-transparent text-center outline-none" data-activity-item="item-${item}" aria-label="Answer for exercise ${item}" type="text">`);
  if (source !== output) fs.writeFileSync(file, output);
}

{
  const file = path.join(root, 'pg183_sec002.html');
  const source = fs.readFileSync(file, 'utf8');
  const item = (n, working, answer) => `<div class="flex items-start gap-3"><span class="text-xl font-semibold text-green-600">${n}.</span><div class="min-w-[7rem] text-center text-lg leading-tight">${working}<div class="mt-2 border-t-2 border-gray-800 pt-3"><input class="w-full border-0 border-b border-gray-400 bg-transparent text-center outline-none" data-activity-item="item-${n}" aria-label="Answer for exercise ${n}" type="text"></div></div></div>`;
  const vertical = (a, b) => `<div class="whitespace-pre font-mono text-left">${a}<br>× ${b}</div>`;
  const div = (d, n) => `<div class="inline-flex items-start font-mono"><span class="border-r-2 border-gray-800 pr-1 pt-1">${d}</span><span class="border-t-2 border-gray-800 pl-1 pt-1">${n}</span></div>`;
  const replacement = `<section data-section-type="activity_fill_in_the_blank" data-section-id="pg183_sec002" class="mx-auto max-w-5xl rounded-[2rem] bg-[#f1f7ec] px-8 py-8 max-sm:px-4"><h1 class="mb-7 inline-block rounded-tl-2xl rounded-br-2xl bg-lime-200 px-7 py-3 text-2xl font-bold">Revision Exercise</h1><div class="grid grid-cols-3 gap-x-12 gap-y-9 max-lg:grid-cols-2 max-sm:grid-cols-1">${item(1, vertical('shs   764', '6'))}${item(2, vertical('shs  cts<br>5675  39', '8'))}${item(3, vertical('shs  cts<br>190   90', '9'))}${item(4, vertical('shs  cts<br>45330 80', '28'))}${item(5, vertical('shs 3500', '9'))}${item(6, vertical('shs  cts<br>39850 77', '79'))}${item(7, vertical('shs  cts<br>198   96', '69'))}${item(8, div('26', '67678 52'))}${item(9, div('6', '45360 96'))}</div></section>`;
  const output = source.replace(/<section data-section-type="activity_fill_in_the_blank" data-section-id="pg183_sec002"[\s\S]*?<\/section>/, replacement);
  if (source !== output) fs.writeFileSync(file, output);
}

fs.writeFileSync(textPath, `${JSON.stringify(texts, null, 2)}\n`);
console.log(`Repaired ${replacements} long-division expressions.`);
