/* Visible glossary access for the Mathematics Standard Four reader.
   The runtime loads glossary data for inline term matching, but this control
   gives every reader a direct, keyboard-accessible way to browse the full
   book glossary. */
(function () {
  'use strict';

  var glossaryUrl = new URL('./content/i18n/en-US/glossary.json', window.location.href).href;
  var trigger;
  var dialog;
  var search;
  var list;
  var status;
  var closeButton;
  var entries = [];
  var loaded = false;
  var lastFocused;

  function normalise(value) {
    return String(value || '').trim().toLocaleLowerCase();
  }

  function sortEntries(glossary) {
    return Object.keys(glossary || {}).map(function (key) {
      var entry = glossary[key] || {};
      return {
        term: entry.word || key,
        definition: entry.definition || '',
        variations: Array.isArray(entry.variations) ? entry.variations : []
      };
    }).filter(function (entry) {
      return entry.term && entry.definition;
    }).sort(function (first, second) {
      return first.term.localeCompare(second.term, 'en', { sensitivity: 'base' });
    });
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function renderEntries(query) {
    var needle = normalise(query);
    var visible = entries.filter(function (entry) {
      if (!needle) return true;
      return normalise(entry.term).indexOf(needle) !== -1 ||
        normalise(entry.definition).indexOf(needle) !== -1 ||
        entry.variations.some(function (variation) { return normalise(variation).indexOf(needle) !== -1; });
    });

    clearElement(list);
    status.textContent = visible.length === entries.length
      ? entries.length + ' glossary terms'
      : visible.length + ' matching glossary terms';

    if (!visible.length) {
      var empty = document.createElement('p');
      empty.className = 'adt-glossary-empty';
      empty.textContent = 'No glossary terms match your search.';
      list.appendChild(empty);
      return;
    }

    visible.forEach(function (entry) {
      var item = document.createElement('article');
      item.className = 'adt-glossary-entry';
      var heading = document.createElement('h2');
      heading.textContent = entry.term;
      var definition = document.createElement('p');
      definition.textContent = entry.definition;
      item.appendChild(heading);
      item.appendChild(definition);
      list.appendChild(item);
    });
  }

  function setLoading(message) {
    clearElement(list);
    status.textContent = message;
  }

  function loadGlossary() {
    if (loaded) return Promise.resolve();
    setLoading('Loading glossary…');
    return fetch(glossaryUrl, { cache: 'force-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Glossary data could not be loaded.');
        return response.json();
      })
      .then(function (glossary) {
        entries = sortEntries(glossary);
        loaded = true;
        renderEntries(search.value);
      })
      .catch(function () {
        clearElement(list);
        status.textContent = 'The glossary could not be loaded on this page.';
        var error = document.createElement('p');
        error.className = 'adt-glossary-empty';
        error.textContent = 'Please check your connection and try again.';
        list.appendChild(error);
      });
  }

  function openGlossary() {
    lastFocused = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add('adt-glossary-open');
    loadGlossary().then(function () { search.focus(); });
  }

  function closeGlossary() {
    dialog.hidden = true;
    document.body.classList.remove('adt-glossary-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function buildControl() {
    var style = document.createElement('style');
    style.textContent = [
      '.adt-glossary-trigger{position:fixed;right:1rem;bottom:5.25rem;z-index:80;display:inline-flex;align-items:center;gap:.45rem;padding:.68rem .9rem;border:2px solid #197b8e;border-radius:999px;background:#fff;color:#123146;font:700 .92rem/1 Arial,Helvetica,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.22);cursor:pointer}',
      '.adt-glossary-trigger:hover,.adt-glossary-trigger:focus-visible{background:#e7f8fb;outline:3px solid #f4cd42;outline-offset:2px}',
      '.adt-glossary-overlay{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:1rem;background:rgba(10,26,35,.58)}',
      '.adt-glossary-dialog{width:min(44rem,100%);max-height:min(80vh,48rem);display:flex;flex-direction:column;overflow:hidden;border:0;border-radius:1rem;background:#fff;color:#17212b;box-shadow:0 18px 60px rgba(0,0,0,.42);font-family:Arial,Helvetica,sans-serif}',
      '.adt-glossary-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;background:#e6f5df;border-bottom:3px solid #78ad65}',
      '.adt-glossary-header h1{margin:0;font-size:1.35rem;line-height:1.2;color:#15556a}',
      '.adt-glossary-close{min-width:2.25rem;min-height:2.25rem;border:1px solid #15556a;border-radius:.4rem;background:#fff;color:#123146;font:700 1.25rem/1 Arial,Helvetica,sans-serif;cursor:pointer}',
      '.adt-glossary-search{width:calc(100% - 2.4rem);margin:1rem 1.2rem .4rem;padding:.7rem .8rem;border:1px solid #5d7b88;border-radius:.45rem;color:#17212b;font:1rem/1.2 Arial,Helvetica,sans-serif}',
      '.adt-glossary-status{display:block;padding:0 1.2rem .6rem;color:#49626c;font-size:.88rem}',
      '.adt-glossary-list{overflow:auto;padding:0 1.2rem 1.2rem}',
      '.adt-glossary-entry{padding:.8rem 0;border-top:1px solid #d6e4dd}',
      '.adt-glossary-entry h2{margin:0 0 .28rem;color:#1d7b8d;font-size:1.08rem;line-height:1.25}',
      '.adt-glossary-entry p,.adt-glossary-empty{margin:0;color:#17212b;font-size:1rem;line-height:1.45}',
      'body.adt-glossary-open{overflow:hidden!important}',
      '@media(max-width:40rem){.adt-glossary-trigger{right:.65rem;bottom:5rem;padding:.6rem .75rem}.adt-glossary-overlay{padding:.55rem}.adt-glossary-dialog{max-height:88vh}.adt-glossary-header{padding:.85rem 1rem}}'
    ].join('');
    document.head.appendChild(style);

    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'adt-glossary-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'adt-book-glossary');
    trigger.innerHTML = '<span aria-hidden="true">📖</span><span>Glossary</span>';
    trigger.addEventListener('click', openGlossary);

    dialog = document.createElement('div');
    dialog.className = 'adt-glossary-overlay';
    dialog.id = 'adt-book-glossary';
    dialog.hidden = true;
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeGlossary();
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeGlossary();
      }
    });

    var panel = document.createElement('section');
    panel.className = 'adt-glossary-dialog';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'adt-glossary-title');

    var header = document.createElement('header');
    header.className = 'adt-glossary-header';
    var title = document.createElement('h1');
    title.id = 'adt-glossary-title';
    title.textContent = 'Book glossary';
    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'adt-glossary-close';
    closeButton.setAttribute('aria-label', 'Close glossary');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', closeGlossary);
    header.appendChild(title);
    header.appendChild(closeButton);

    search = document.createElement('input');
    search.type = 'search';
    search.className = 'adt-glossary-search';
    search.placeholder = 'Search glossary terms';
    search.setAttribute('aria-label', 'Search glossary terms');
    search.addEventListener('input', function () { if (loaded) renderEntries(search.value); });

    status = document.createElement('output');
    status.className = 'adt-glossary-status';
    status.setAttribute('aria-live', 'polite');
    list = document.createElement('div');
    list.className = 'adt-glossary-list';
    list.setAttribute('role', 'region');
    list.setAttribute('aria-label', 'Glossary terms');

    panel.appendChild(header);
    panel.appendChild(search);
    panel.appendChild(status);
    panel.appendChild(list);
    dialog.appendChild(panel);
    document.body.appendChild(trigger);
    document.body.appendChild(dialog);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildControl, { once: true });
  else buildControl();
}());
