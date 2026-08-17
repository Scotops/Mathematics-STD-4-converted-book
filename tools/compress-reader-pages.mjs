/*
 * Rebuild the ADT reading spine as one reader page per physical source-PDF
 * page.  Existing text IDs, sections, and their audio mappings are retained;
 * only split sections are placed together in the first section's HTML file.
 *
 * Run with --check first.  This script intentionally does not delete the
 * former split-section HTML files, so their source remains available.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagesPath = path.join(root, 'content', 'pages.json');
const checkOnly = process.argv.includes('--check');
const tocOnly = process.argv.includes('--toc-only');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, 'utf8');
}

function findElement(html, tagName, startAt = 0, predicate = () => true) {
  const tag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const token = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  token.lastIndex = startAt;
  let match;
  while ((match = token.exec(html))) {
    if (match[0].startsWith('</') || !predicate(match[0])) continue;
    const start = match.index;
    const openEnd = token.lastIndex;
    let depth = 1;
    let nested;
    while ((nested = token.exec(html))) {
      depth += nested[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        return { start, openEnd, end: token.lastIndex, inner: html.slice(openEnd, nested.index), outer: html.slice(start, token.lastIndex) };
      }
    }
    throw new Error(`Unclosed <${tagName}> element at character ${start}`);
  }
  return null;
}

function contentContainer(html, file) {
  const container = findElement(html, 'div', 0, opening => /\bid\s*=\s*(["'])content\1/i.test(opening));
  if (!container) throw new Error(`${file}: #content container not found`);
  return container;
}

function sectionBlocks(html, file) {
  const container = contentContainer(html, file);
  const blocks = [];
  let offset = 0;
  while (true) {
    const section = findElement(container.inner, 'section', offset);
    if (!section) break;
    blocks.push(section.outer);
    offset = section.end;
  }
  if (blocks.length === 0) throw new Error(`${file}: no section inside #content`);
  return blocks;
}

function replaceContentInner(html, replacement, file) {
  const container = contentContainer(html, file);
  return `${html.slice(0, container.openEnd)}\n${replacement}\n${html.slice(container.end - `</div>`.length)}`;
}

function updateMetadata(html, sectionId, position) {
  html = html.replace(/(<meta\s+name=["']title-id["']\s+content=["'])[^"']*(["']\s*\/?>)/i, `$1${sectionId}$2`);
  html = html.replace(/(<meta\s+name=["']page-section-id["']\s+content=["'])[^"']*(["']\s*\/?>)/i, `$1${position}$2`);
  return html;
}

function blankPage(sectionId, position) {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mathematics Pupil's Book Standard Four</title>
  <meta name="title-id" content="${sectionId}" />
  <meta name="page-section-id" content="${position}" />
  <link href="./content/tailwind_output.css" rel="stylesheet">
  <link href="./assets/libs/fontawesome/css/all.min.css" rel="stylesheet">
  <link href="./assets/fonts.css" rel="stylesheet">
</head>
<body class="min-h-screen flex items-center justify-center">
  <main class="w-full">
    <h1 class="sr-only" id="page-heading">Mathematics Pupil's Book Standard Four</h1>
    <div id="content" class="mx-auto min-h-screen bg-white opacity-0">
      <section data-section-type="blank_page" data-section-id="${sectionId}" class="min-h-screen bg-white" aria-label="Blank page"></section>
    </div>
  </main>
  <div class="relative z-50" id="interface-container"></div>
  <div class="relative z-50" id="nav-container"></div>
  <script src="./assets/offline-preloader.js"></script>
  <script src="./assets/scorm.js"></script>
  <script src="./assets/base.bundle.local.js"></script>
</body>
</html>
`;
}

function sourceImagePage(sectionId, position) {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mathematics Pupil's Book Standard Four</title>
  <meta name="title-id" content="${sectionId}" />
  <meta name="page-section-id" content="${position}" />
  <link href="./content/tailwind_output.css" rel="stylesheet">
  <link href="./assets/libs/fontawesome/css/all.min.css" rel="stylesheet">
  <link href="./assets/fonts.css" rel="stylesheet">
</head>
<body class="min-h-screen flex items-center justify-center">
  <main class="w-full">
    <h1 class="sr-only" id="page-heading">Table of contents</h1>
    <div id="content" class="mx-auto bg-white opacity-0">
      <section data-section-type="table_of_contents" data-section-id="${sectionId}" class="bg-white">
        <img src="images/pg003_source_page.jpg" alt="Table of contents" class="block h-auto w-full max-w-full" />
      </section>
    </div>
  </main>
  <div class="relative z-50" id="interface-container"></div>
  <div class="relative z-50" id="nav-container"></div>
  <script src="./assets/offline-preloader.js"></script>
  <script src="./assets/scorm.js"></script>
  <script src="./assets/base.bundle.local.js"></script>
</body>
</html>
`;
}

const originalSpine = JSON.parse(read('content/pages.json'));
const physicalPages = [];

// Physical source pages 1–6 are front matter. Pages 3 and 6 are absent from
// the converted spine, but present in the supplied source PDF.
physicalPages.push({ section_id: 'pg001_sec001', href: 'index.html', sourceFiles: ['index.html'] });
physicalPages.push({ section_id: 'pg002_sec001', href: 'pg002_sec001.html', sourceFiles: ['pg002_sec001.html'] });
physicalPages.push({ section_id: 'pg003_sec001', href: 'pg003_sec001.html', generated: 'source-image' });
physicalPages.push({ section_id: 'pg004_sec001', href: 'pg004_sec001.html', sourceFiles: ['pg004_sec001.html'] });
physicalPages.push({ section_id: 'pg005_sec001', href: 'pg005_sec001.html', sourceFiles: ['pg005_sec001.html'] });
physicalPages.push({ section_id: 'pg006_sec001', href: 'pg006_sec001.html', generated: 'blank' });

for (let physical = 7; physical <= 184; physical += 1) {
  const prefix = `pg${String(physical).padStart(3, '0')}_`;
  const entries = originalSpine.filter(entry => entry.href.startsWith(prefix));
  if (entries.length === 0) throw new Error(`No current spine entry for source PDF page ${physical}`);
  physicalPages.push({
    section_id: entries[0].section_id,
    href: entries[0].href,
    sourceFiles: entries.map(entry => entry.href),
  });
}

const report = physicalPages.map((page, index) => ({
  physicalPage: index + 1,
  href: page.href,
  mergedSections: page.sourceFiles?.length ?? 1,
  generated: page.generated ?? null,
}));
const split = report.filter(item => item.mergedSections > 1);
console.log(JSON.stringify({ sourcePdfPages: 184, resultingReaderPages: physicalPages.length, splitPages: split.length, generatedPages: report.filter(item => item.generated), split }, null, 2));

if (physicalPages.length !== 184) throw new Error(`Expected 184 physical pages, got ${physicalPages.length}`);
if (checkOnly) process.exit(0);

if (tocOnly) {
  const pageForPrefix = new Map();
  for (const page of physicalPages) {
    const match = page.href.match(/^(pg\d{3})_/);
    if (match) pageForPrefix.set(match[1], page);
  }
  const tocPath = path.join(root, 'content', 'toc.json');
  const toc = JSON.parse(fs.readFileSync(tocPath, 'utf8'));
  let updated = 0;
  const compressedToc = toc.map(entry => {
    const match = entry.href.match(/^(pg\d{3})_/);
    const target = match && pageForPrefix.get(match[1]);
    if (!target || (entry.href === target.href && entry.section_id === target.section_id)) return entry;
    updated += 1;
    return { ...entry, section_id: target.section_id, href: target.href };
  });
  write('content/toc.json', `${JSON.stringify(compressedToc, null, 2)}\n`);
  console.log(`Updated ${updated} table-of-contents links to their consolidated reader pages.`);
  process.exit(0);
}

for (let index = 0; index < physicalPages.length; index += 1) {
  const page = physicalPages[index];
  const position = index + 1;
  if (page.generated === 'blank') {
    write(page.href, blankPage(page.section_id, position));
    continue;
  }
  if (page.generated === 'source-image') {
    write(page.href, sourceImagePage(page.section_id, position));
    continue;
  }

  let html = read(page.href);
  if (page.sourceFiles.length > 1) {
    const sections = page.sourceFiles.flatMap(file => sectionBlocks(read(file), file));
    html = replaceContentInner(html, sections.join('\n'), page.href);
  }
  write(page.href, updateMetadata(html, page.section_id, position));
}

const compressedSpine = physicalPages.map((page, index) => ({
  section_id: page.section_id,
  href: page.href,
  page_number: index + 1,
}));
write('content/pages.json', `${JSON.stringify(compressedSpine, null, 2)}\n`);
console.log(`Wrote ${compressedSpine.length} reader pages.`);
