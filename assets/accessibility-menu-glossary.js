/* Keep Glossary available from the standard Accessibility menu on every
   screen size. The visible item mirrors the runtime's Settings item and
   activates the existing Glossary feature rather than creating a second
   glossary implementation. */
(function () {
  'use strict';

  function buttonText(button) {
    return (button && button.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function insertGlossaryItem() {
    var dialog = Array.prototype.find.call(document.querySelectorAll('[role="dialog"]'), function (candidate) {
      return /accessibility menu/i.test(candidate.textContent || '');
    });
    if (!dialog || dialog.querySelector('[data-adt-glossary-menu-item]')) return;

    var menuButtons = Array.prototype.slice.call(dialog.querySelectorAll('button'));
    if (menuButtons.some(function (button) { return buttonText(button).toLowerCase() === 'glossary'; })) return;

    var glossaryControl = document.querySelector('button[aria-label="Glossary"]');
    if (!glossaryControl) return;

    var settingsButton = menuButtons.find(function (button) { return buttonText(button).toLowerCase() === 'settings'; });
    var item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('data-adt-glossary-menu-item', 'true');
    item.setAttribute('aria-label', 'Glossary');
    item.className = settingsButton ? settingsButton.className : 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent';
    item.textContent = 'Glossary';
    item.addEventListener('click', function () {
      glossaryControl.click();
    });

    if (settingsButton && settingsButton.parentNode) settingsButton.parentNode.insertBefore(item, settingsButton);
    else dialog.appendChild(item);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('button[aria-label="Accessibility menu"]');
    if (trigger) window.setTimeout(insertGlossaryItem, 0);
  });

  var observer = new MutationObserver(function () { window.setTimeout(insertGlossaryItem, 0); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}());
