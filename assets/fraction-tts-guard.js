(function () {
  "use strict";

  var originalAttribute = "data-tts-original-html";

  function restoreFractionMarkup(element) {
    if (!(element instanceof Element) || !element.hasAttribute(originalAttribute)) return;

    var originalHtml = element.getAttribute(originalAttribute) || "";
    if (!/<math(?:\s|>)/i.test(originalHtml)) return;

    // Word highlighting temporarily replaces rich MathML with plain text. Keep
    // the original fraction markup visible while the corresponding audio plays.
    if (!element.querySelector("math")) element.innerHTML = originalHtml;
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    restoreFractionMarkup(node);
    node.querySelectorAll("[" + originalAttribute + "]").forEach(restoreFractionMarkup);
  }

  function start() {
    var content = document.getElementById("content");
    if (!content) return;

    inspect(content);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        inspect(mutation.target);
        mutation.addedNodes.forEach(inspect);
      });
    }).observe(content, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [originalAttribute]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
