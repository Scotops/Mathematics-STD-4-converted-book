/*
 * Mobile accessibility chooser
 *
 * The reader runtime puts its individual accessibility controls in the bottom
 * bar. On a phone that leaves too little room for page navigation. The ADT
 * reference reader instead keeps one Accessibility button in the bar and
 * opens a small, labelled chooser from it. This adapter keeps the runtime's
 * own controls and actions, but presents them in that same mobile pattern.
 */
(function () {
  'use strict';

  var mobileQuery = window.matchMedia('(max-width: 48rem)');
  var openingSettings = false;

  function closeChooser() {
    var chooser = document.querySelector('.adt-accessibility-chooser');
    if (chooser) chooser.remove();
    document.removeEventListener('keydown', closeOnEscape, true);
  }

  function closeOnEscape(event) {
    if (event.key === 'Escape') closeChooser();
  }

  function activateRuntimeControl(label) {
    closeChooser();
    var control = document.querySelector('button[aria-label="' + label + '"]');
    if (control) control.click();
  }

  function openSettings() {
    closeChooser();
    var control = document.querySelector('button[aria-label="Accessibility menu"]');
    if (!control) return;
    openingSettings = true;
    control.click();
    window.setTimeout(function () { openingSettings = false; }, 0);
  }

  function option(action, label, icon) {
    return '<button type="button" class="adt-accessibility-option" data-adt-action="' + action + '">' +
      '<i aria-hidden="true" class="fas ' + icon + '"></i>' +
      '<span>' + label + '</span>' +
    '</button>';
  }

  function openChooser() {
    if (!mobileQuery.matches || document.querySelector('.adt-accessibility-chooser')) return;

    var chooser = document.createElement('div');
    chooser.className = 'adt-accessibility-chooser';
    chooser.innerHTML =
      '<section class="adt-accessibility-sheet" role="dialog" aria-modal="true" aria-label="Accessibility menu">' +
        '<span class="adt-accessibility-handle" aria-hidden="true"></span>' +
        '<p class="adt-accessibility-title">Accessibility menu</p>' +
        '<div class="adt-accessibility-options">' +
          option('glossary', 'Glossary', 'fa-book-open') +
          option('speech', 'Text to speech', 'fa-volume-up') +
          option('sign', 'Sign language', 'fa-hands') +
          option('language', 'Language', 'fa-language') +
          option('settings', 'Settings', 'fa-cog') +
        '</div>' +
      '</section>';

    chooser.addEventListener('click', function (event) {
      if (event.target === chooser) closeChooser();
    });
    chooser.querySelector('.adt-accessibility-sheet').addEventListener('click', function (event) {
      var button = event.target.closest('[data-adt-action]');
      if (!button) return;
      var action = button.getAttribute('data-adt-action');
      if (action === 'glossary') activateRuntimeControl('Glossary');
      if (action === 'speech') activateRuntimeControl('Activate text to speech');
      if (action === 'sign') activateRuntimeControl('Sign language');
      if (action === 'language') activateRuntimeControl('Language');
      if (action === 'settings') openSettings();
    });

    document.body.appendChild(chooser);
    document.addEventListener('keydown', closeOnEscape, true);
    window.setTimeout(function () {
      var first = chooser.querySelector('[data-adt-action="glossary"]');
      if (first) first.focus();
    }, 0);
  }

  /* Capture the trigger before the runtime opens its settings-only panel. */
  document.addEventListener('click', function (event) {
    if (openingSettings || !mobileQuery.matches) return;
    var target = event.target;
    if (!(target instanceof Element)) return;
    var trigger = target.closest('button[aria-label="Accessibility menu"]');
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openChooser();
  }, true);
}());
