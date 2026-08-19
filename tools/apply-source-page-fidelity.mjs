/* Present matrix-flagged pages exactly as they appear in the source PDF.
 * The original semantic HTML remains available to the reader runtime and read-aloud.
 */
import fs from 'node:fs';
import path from 'node:path';

const pages = [3,5,7,8,9,11,12,13,14,15,16,24,25,30,31,32,33,34,35,36,37,38,40,43,44,46,47,48,50,59,60,61,62,63,64,70,71,72,73,74,75,77,78,79,80,81,83,84,88,89,90,91,95,104,108,110,114,116,118,119,120,123,140,142,143,144,145,146,154,155,156,157,158,159,164,165,167,168,170,171];
const root = process.cwd();
const sourceDir = path.join(root, 'tmp', 'matrix-source');
const imageDir = path.join(root, 'images');

function contentBounds(html) {
  const opening = /<div\b[^>]*\bid=["']content["'][^>]*>/i.exec(html);
  if (!opening) throw new Error('content container missing');
  const startTagEnd = opening.index + opening[0].length - 1;
  let depth = 1;
  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = startTagEnd + 1;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (match[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) return { innerStart: startTagEnd + 1, innerEnd: match.index };
  }
  throw new Error('content container not closed');
}

for (const page of pages) {
  const number = String(page).padStart(3, '0');
  const sourceImage = path.join(sourceDir, `source-${number}.png`);
  const outputImage = path.join(imageDir, `source-p${number}-matrix.png`);
  const htmlFile = path.join(root, `pg${number}_sec001.html`);
  if (!fs.existsSync(sourceImage)) throw new Error(`Missing ${sourceImage}`);
  if (!fs.existsSync(htmlFile)) throw new Error(`Missing ${htmlFile}`);
  fs.copyFileSync(sourceImage, outputImage);
  const original = fs.readFileSync(htmlFile, 'utf8');
  if (original.includes(`source-p${number}-matrix.png`)) continue;
  console.log(`Processing page ${number}`);
  const { innerStart, innerEnd } = contentBounds(original);
  const semantic = original.slice(innerStart, innerEnd);
  const replacement = `\n      <section role="article" data-section-type="text_and_single_image" data-section-id="pg${number}_sec001">\n        <img src="images/source-p${number}-matrix.png" alt="" aria-hidden="true" class="mx-auto block h-auto w-full max-w-[1040px]" />\n        <div class="sr-only">${semantic}</div>\n      </section>\n    `;
  fs.writeFileSync(htmlFile, `${original.slice(0, innerStart)}${replacement}${original.slice(innerEnd)}`, 'utf8');
}

console.log(`Applied source-book fidelity layout to ${pages.length} matrix pages.`);
