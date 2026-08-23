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

  /* The inclusivity matrices require a small number of printed instructions
     to begin with "Use accessible tools".  The book is displayed as an exact
     facsimile, so these carefully positioned text patches replace only those
     identified lines while preserving the source font size, colour, spacing,
     diagrams, and every other part of the printed page. */
  var inclusivityPatches = {
    8: [
      { x: 116, y: 323, w: 495, h: 54, text: 'Use accessible tools and various sources, such as Khan Academy, to learn about items that use Roman numbers.' }
    ],
    53: [
      { x: 116, y: 198, w: 512, h: 76, text: 'Use accessible tools to explore various examples of dividing whole numbers through online resources and programs such as GeoGebra and Khan Academy.' }
    ],
    86: [
      { x: 122, y: 333, w: 490, h: 53, text: 'Use accessible tools to put the 0 mark on a tape measure at one corner of the rectangle.' }
    ],
    88: [
      { x: 132, y: 157, w: 476, h: 72, text: 'Use accessible tools to measure the length of an exercise book and record it in centimetres. Also, measure its width and record it in centimetres.' }
    ],
    100: [
      { x: 142, y: 816, w: 472, h: 28, fontSize: 16.5, text: 'Use accessible tools to draw a rectangle of your chosen size.' }
    ],
    103: [
      { x: 151, y: 166, w: 486, h: 29, text: 'Use accessible tools to find the area in each of the following:' }
    ],
    106: [
      { x: 122, y: 502, w: 490, h: 29, fontSize: 16.5, text: 'Use accessible tools to draw a square LMNO on graph paper.' }
    ],
    120: [
      { x: 132, y: 655, w: 455, h: 55, text: 'Use accessible tools; draw three horizontal rectangles and four vertical rectangles in the larger rectangle.' }
    ],
    121: [
      { x: 128, y: 229, w: 350, h: 72, text: 'Use accessible tools to draw four horizontal rectangles and three vertical rectangles within one larger rectangle.' },
      { x: 140, y: 711, w: 169, h: 169, lineHeight: '1.15', text: 'Use accessible tools to draw a rectangle divided into 4 equal horizontal parts and 8 equal vertical parts, as shown in the diagram.' }
    ],
    128: [
      { x: 131, y: 738, w: 478, h: 48, fontSize: 17.5, lineHeight: '1', html: 'Use accessible tools to show <span class="source-facsimile-fraction"><span>2</span><span>5</span></span> on a diagram by drawing five equal boxes as shown in the following diagram:' }
    ],
    130: [
      { x: 94, y: 198, w: 520, h: 55, text: 'Use accessible online tools and reliable programs such as Khan Academy to learn more about fractions.' }
    ]
  };

  function addInclusivityPatches(content, physicalPage) {
    var patches = inclusivityPatches[physicalPage];
    if (!patches || !patches.length) return;

    var referenceWidth = physicalPage === 103 ? 744 : 722;
    var referenceHeight = physicalPage === 103 ? 1024 : 1001;
    var layer = document.createElement('div');
    layer.className = 'source-facsimile-inclusivity';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;';

    patches.forEach(function (patch) {
      var item = document.createElement('div');
      item.className = 'source-facsimile-inclusivity-text';
      item.style.position = 'absolute';
      item.style.left = (patch.x / referenceWidth * 100) + '%';
      item.style.top = (patch.y / referenceHeight * 100) + '%';
      item.style.width = (patch.w / referenceWidth * 100) + '%';
      item.style.height = (patch.h / referenceHeight * 100) + '%';
      item.style.overflow = 'hidden';
      item.style.boxSizing = 'border-box';
      item.style.background = physicalPage === 103 || physicalPage === 120 || physicalPage === 121 || physicalPage === 128
        ? '#fff'
        : '#f6f9f5';
      item.style.color = '#231f20';
      item.style.fontFamily = 'Arial, Helvetica, sans-serif';
      item.style.fontWeight = '400';
      item.style.lineHeight = patch.lineHeight || '1.32';
      item.style.letterSpacing = '0';
      item.style.textAlign = 'left';
      item.setAttribute('data-source-font-size', String(patch.fontSize || 18));
      if (patch.html) item.innerHTML = patch.html;
      else item.textContent = patch.text;
      layer.appendChild(item);
    });

    content.appendChild(layer);

    function fitPatchText() {
      var scale = content.clientWidth / referenceWidth;
      Array.prototype.forEach.call(layer.children, function (item) {
        item.style.fontSize = (Number(item.getAttribute('data-source-font-size')) * scale) + 'px';
      });
      Array.prototype.forEach.call(layer.querySelectorAll('.source-facsimile-fraction'), function (fraction) {
        fraction.style.cssText = 'display:inline-flex;position:relative;top:0.18em;flex-direction:column;align-items:center;justify-content:center;margin:0 .08em;line-height:.82;font-size:.82em;vertical-align:baseline;';
        if (fraction.children[0]) fraction.children[0].style.borderBottom = '1px solid currentColor';
        if (fraction.children[0]) fraction.children[0].style.padding = '0 .1em .05em';
        if (fraction.children[1]) fraction.children[1].style.paddingTop = '.05em';
      });
    }

    fitPatchText();
    if (typeof ResizeObserver === 'function') new ResizeObserver(fitPatchText).observe(content);
    else window.addEventListener('resize', fitPatchText);
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
    addInclusivityPatches(content, physicalPage);
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
