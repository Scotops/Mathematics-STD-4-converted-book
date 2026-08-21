(function () {
  "use strict";

  var originalAttribute = "data-tts-original-html";
  var protectedMarkup = new Map();
  var activeClass = "adt-math-tts-active";

  function installHighlightStyle() {
    if (document.getElementById("adt-math-tts-guard-style")) return;

    var style = document.createElement("style");
    style.id = "adt-math-tts-guard-style";
    style.textContent =
      "math." + activeClass + "{background:#fddd4b;border-radius:.12em;box-decoration-break:clone;-webkit-box-decoration-break:clone;}";
    document.head.appendChild(style);
  }

  function rememberMathMarkup(root) {
    var elements = [];

    if (root instanceof Element && root.matches("[data-id]") && root.querySelector("math")) {
      elements.push(root);
    }

    if (root instanceof Element || root instanceof Document) {
      root.querySelectorAll("[data-id]").forEach(function (element) {
        if (element.querySelector("math")) elements.push(element);
      });
    }

    elements.forEach(function (element) {
      var id = element.getAttribute("data-id");
      if (id && !protectedMarkup.has(id)) protectedMarkup.set(id, element.innerHTML);
    });
  }

  function restoreFractionMarkup(element) {
    if (!(element instanceof Element) || !element.matches("[data-id]")) return;

    var id = element.getAttribute("data-id");
    var originalHtml = (id && protectedMarkup.get(id)) || element.getAttribute(originalAttribute) || "";
    if (!/<math(?:\s|>)/i.test(originalHtml)) return;

    // Word highlighting temporarily replaces rich MathML with plain text. Restore
    // the saved structure before the browser paints, so fractions and aligned
    // operations never collapse into a single run of digits.
    if (!element.querySelector("math")) element.innerHTML = originalHtml;

    var math = element.querySelector("math");
    if (math) math.classList.toggle(activeClass, element.hasAttribute(originalAttribute));
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    restoreFractionMarkup(node);
    node.querySelectorAll("[data-id]").forEach(restoreFractionMarkup);
  }

  function start() {
    var content = document.getElementById("content");
    if (!content) return;

    installHighlightStyle();
    rememberMathMarkup(content);
    inspect(content);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        inspect(mutation.target);
        mutation.addedNodes.forEach(function (node) {
          rememberMathMarkup(node);
          inspect(node);
        });
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
