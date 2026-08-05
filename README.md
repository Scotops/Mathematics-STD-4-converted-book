# Mathematics Pupil's Book Standard Four

An accessible, offline-capable web edition of the Tanzania Institute of
Education's *Mathematics Pupil's Book Standard Four*.

Open `index.html` locally, or use the GitHub Pages deployment after a push to
the `main` branch.

## Quality checks applied

- Corrected UTF-8/Windows-1252 character corruption in text and MathML.
- Confirmed every mapped MP3 file exists and is non-empty.
- Checked arithmetic equalities and verified the apparent carry-over examples
  against the source PDF.

`tools/repair-mojibake.mjs` is an idempotent maintenance utility for detecting
and repairing this class of conversion error if a future import introduces it.
