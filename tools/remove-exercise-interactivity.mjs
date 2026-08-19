/* Convert ADT activities into noninteractive, printed-book exercise layouts. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const textsPath = path.join(root, 'content', 'i18n', 'en-US', 'texts.json');
const blankMarkup = '<span class="adt-print-blank inline-block align-bottom mx-1 h-[1.4em] min-w-[4ch] border-b-2 border-gray-400" aria-hidden="true"></span><span class="sr-only">blank</span>';

function count(content) {
  return {
    inputs: (content.match(/<input\b/gi) ?? []).length,
    textareas: (content.match(/<textarea\b/gi) ?? []).length,
    buttons: (content.match(/<button\b/gi) ?? []).length,
    activitySections: (content.match(/data-section-type=["']activity_[^"']+["']/gi) ?? []).length,
    blankTokens: (content.match(/\[\[blank:item-\d+(?::[^\]]+)?\]\]/g) ?? []).length,
  };
}

function addDisplayClass(attributes) {
  const classMatch = attributes.match(/\bclass\s*=\s*(["'])([\s\S]*?)\1/i);
  const classValue = classMatch ? `adt-print-blank inline-block align-bottom pointer-events-none select-none ${classMatch[2]}` : 'adt-print-blank inline-block align-bottom pointer-events-none select-none min-w-[4ch] border-b-2 border-gray-400';
  return `<span class="${classValue}" aria-hidden="true"></span>`;
}

function transformHtml(content) {
  return content
    .replace(/\bdata-section-type=(["'])activity_[^"']+\1/gi, 'data-section-type="text_only"')
    .replace(/<textarea\b([^>]*)>[\s\S]*?<\/textarea>/gi, (_match, attributes) => addDisplayClass(attributes))
    .replace(/<input\b([^>]*)\/?\s*>/gi, (_match, attributes) => addDisplayClass(attributes))
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/\[\[blank:item-\d+(?::[^\]]+)?\]\]/g, blankMarkup);
}

const pageFiles = fs.readdirSync(root).filter(file => /^pg\d{3}_sec\d{3}\.html$/i.test(file));
const before = { inputs: 0, textareas: 0, buttons: 0, activitySections: 0, blankTokens: 0 };
const after = { ...before };

for (const file of pageFiles) {
  const original = fs.readFileSync(path.join(root, file), 'utf8');
  const updated = transformHtml(original);
  for (const [key, value] of Object.entries(count(original))) before[key] += value;
  for (const [key, value] of Object.entries(count(updated))) after[key] += value;
  if (!checkOnly && updated !== original) fs.writeFileSync(path.join(root, file), updated, 'utf8');
}

const texts = JSON.parse(fs.readFileSync(textsPath, 'utf8'));
let textTokensBefore = 0;
let textTokensAfter = 0;
for (const [id, value] of Object.entries(texts)) {
  textTokensBefore += count(value).blankTokens;
  const updated = value.replace(/\[\[blank:item-\d+(?::[^\]]+)?\]\]/g, blankMarkup);
  textTokensAfter += count(updated).blankTokens;
  if (!checkOnly) texts[id] = updated;
}
if (!checkOnly) fs.writeFileSync(textsPath, `${JSON.stringify(texts, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  mode: checkOnly ? 'check' : 'write',
  pageFiles: pageFiles.length,
  before,
  after,
  textTokensBefore,
  textTokensAfter,
}, null, 2));

if (after.inputs || after.textareas || after.buttons || after.activitySections || after.blankTokens || textTokensAfter) {
  process.exitCode = 1;
}
