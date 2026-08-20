/* Restore the original semantic HTML from a source-page fidelity wrapper. */
import fs from 'node:fs';

const pages = process.argv.slice(2).map(value => String(value).padStart(3, '0'));
if (!pages.length || pages.some(page => !/^\d{3}$/.test(page))) throw new Error('Pass one or more three-digit page numbers.');

for (const page of pages) {
  const file = `pg${page}_sec001.html`;
  const html = fs.readFileSync(file, 'utf8');
  const contentMatch = /<div\b[^>]*\bid=["']content["'][^>]*>/i.exec(html);
  if (!contentMatch) throw new Error(`${file}: content container missing`);
  const innerStart = contentMatch.index + contentMatch[0].length;
  const marker = '<div class="sr-only">';
  const semanticStart = html.indexOf(marker, innerStart);
  if (semanticStart < 0) throw new Error(`${file}: source-page wrapper missing`);
  const scanStart = semanticStart + marker.length;
  let depth = 1;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = scanStart;
  let match;
  while ((match = tags.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) break;
  }
  if (!match) throw new Error(`${file}: semantic wrapper not closed`);
  const semantic = html.slice(scanStart, match.index);
  const sectionEnd = html.indexOf('</section>', match.index) + '</section>'.length;
  if (sectionEnd < '</section>'.length) throw new Error(`${file}: source section not closed`);
  fs.writeFileSync(file, `${html.slice(0, innerStart)}${semantic}${html.slice(sectionEnd)}`, 'utf8');
  console.log(`Restored semantic HTML on ${file}`);
}
