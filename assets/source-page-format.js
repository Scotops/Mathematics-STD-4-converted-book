/* Source-book folios. Decorative only: the reader navigation already
   announces the digital page position. */
(function () {
  function addSourcePageNumber() {
    var titleMeta = document.querySelector('meta[name="title-id"]');
    var content = document.getElementById('content');
    if (!titleMeta || !content || content.querySelector('.source-page-number')) return;

    var match = /^pg(\d{3})_/.exec(titleMeta.content || '');
    if (!match) return;

    var physicalPage = Number(match[1]);
    if (!Number.isFinite(physicalPage) || physicalPage < 2 || physicalPage > 184) return;

    var frontMatter = { 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi' };
    var label = frontMatter[physicalPage] || String(physicalPage - 6);
    var folio = document.createElement('div');
    folio.className = 'source-page-number';
    folio.setAttribute('aria-hidden', 'true');
    folio.textContent = label;
    content.appendChild(folio);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSourcePageNumber, { once: true });
  } else {
    addSourcePageNumber();
  }
})();
