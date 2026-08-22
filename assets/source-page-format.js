/* Source-book folios. Decorative only: the reader navigation already
   announces the digital page position. */
(function () {
  function getPhysicalPageNumber() {
    var titleMeta = document.querySelector('meta[name="title-id"]');
    var match = titleMeta && /^pg(\d{3})_/.exec(titleMeta.content || '');
    if (!match) return null;
    var physicalPage = Number(match[1]);
    return Number.isFinite(physicalPage) && physicalPage >= 1 && physicalPage <= 184
      ? physicalPage
      : null;
  }

  function enableFacsimileMode() {
    var content = document.getElementById('content');
    var physicalPage = getPhysicalPageNumber();
    if (!content || !physicalPage || content.classList.contains('source-facsimile-mode')) return;

    var semanticLayer = document.createElement('div');
    semanticLayer.className = 'source-facsimile-semantic';
    semanticLayer.setAttribute('data-purpose', 'accessible-text-and-read-aloud');
    while (content.firstChild) semanticLayer.appendChild(content.firstChild);

    var pageImage = document.createElement('img');
    pageImage.className = 'source-facsimile-page';
    pageImage.src = 'images/facsimile/pg' + String(physicalPage).padStart(3, '0') + '.png';
    pageImage.alt = '';
    pageImage.setAttribute('aria-hidden', 'true');
    pageImage.decoding = 'async';
    pageImage.loading = 'eager';
    pageImage.draggable = false;

    content.classList.add('source-facsimile-mode');
    content.appendChild(pageImage);
    content.appendChild(semanticLayer);
  }

  function restoreSourceBlockOrder() {
    /* Page 15 was split into three conversion sections.  In the print page,
       question 4 (the Roman-number table) precedes question 5 inside the same
       exercise panel.  Move the existing accessible node; do not clone it, so
       its text IDs and read-aloud mappings remain unchanged. */
    var romanExercise = document.querySelector('section[data-section-id="pg015_sec002"]');
    var romanTable = document.querySelector('section[data-section-id="pg015_sec003"]');
    var questionList = romanExercise && romanExercise.querySelector('.space-y-7');
    if (romanTable && questionList && questionList.children.length >= 4) {
      questionList.insertBefore(romanTable, questionList.lastElementChild);
    }
  }

  function addSourcePageNumber() {
    var titleMeta = document.querySelector('meta[name="title-id"]');
    var content = document.getElementById('content');
    if (!titleMeta || !content || content.classList.contains('source-facsimile-mode') || content.querySelector('.source-page-number')) return;

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

  function setSourcePageFit(content, fit) {
    var safeFit = Math.max(0.38, Math.min(1, fit));
    content.dataset.sourcePageFit = safeFit.toFixed(4);
    content.style.setProperty('--source-page-scale', String(0.6666667 * safeFit));
    content.style.setProperty('--source-page-layout-width', String(1081.5 / safeFit) + 'px');
    content.style.setProperty('--source-page-layout-height', String(1501.5 / safeFit) + 'px');
    content.style.setProperty('--source-body-width', String(816 / safeFit) + 'px');
    content.style.setProperty('--source-page-padding-top', String(125 / safeFit) + 'px');
    content.style.setProperty('--source-page-padding-x', String(48 / safeFit) + 'px');
    content.style.setProperty('--source-page-padding-bottom', String(150 / safeFit) + 'px');
    content.style.setProperty('--source-folio-width', String(96 / safeFit) + 'px');
    content.style.setProperty('--source-folio-height', String(48 / safeFit) + 'px');
    content.style.setProperty('--source-folio-bottom', String(84 / safeFit) + 'px');
    content.style.setProperty('--source-folio-font-size', String(28 / safeFit) + 'px');
  }

  function fitSourcePageContent() {
    var content = document.getElementById('content');
    if (content && content.classList.contains('source-facsimile-mode')) return;
    var folio = content && content.querySelector('.source-page-number');
    var sections = content && Array.prototype.slice.call(content.querySelectorAll(':scope > section'));
    if (!content || !folio || !sections || !sections.length) return;

    setSourcePageFit(content, 1);
    var fit = 1;
    var low = 0.38;
    var high = 1;
    var best = 0.38;
    var attempts = 0;

    function measureAndFit() {
      var visible = sections.filter(function (section) {
        var style = window.getComputedStyle(section);
        var rect = section.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      if (!visible.length) return;

      var top = Math.min.apply(null, visible.map(function (section) {
        return section.getBoundingClientRect().top;
      }));
      var bottom = Math.max.apply(null, visible.map(function (section) {
        return section.getBoundingClientRect().bottom;
      }));
      var allowedBottom = folio.getBoundingClientRect().top - 14;
      var available = allowedBottom - top;
      var required = bottom - top;

      var fits = required <= available + 2;
      if (attempts === 0 && fits) return;

      if (attempts > 0) {
        if (fits) {
          best = fit;
          low = fit;
        } else {
          high = fit;
        }
      }

      if (attempts >= 8) {
        setSourcePageFit(content, Math.max(0.38, best * 0.98));
        return;
      }

      fit = (low + high) / 2;
      setSourcePageFit(content, fit);
      attempts += 1;
      window.requestAnimationFrame(measureAndFit);
    }

    window.requestAnimationFrame(measureAndFit);
  }

  function applySourceFormatting() {
    restoreSourceBlockOrder();
    enableFacsimileMode();
    addSourcePageNumber();
    window.setTimeout(fitSourcePageContent, 260);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySourceFormatting, { once: true });
  } else {
    applySourceFormatting();
  }
})();
