(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicShapesMode = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MODES = Object.freeze({
    PRACTICE: "practice",
    ATLAS: "atlas"
  });

  function modeFromHash(hash, currentMode = MODES.PRACTICE) {
    const target = String(hash || "").toLowerCase();
    if (target === "#atlas" || target === "#classic-atlas-title") return MODES.ATLAS;
    if (target === "#page-top") return currentMode === MODES.ATLAS ? MODES.ATLAS : MODES.PRACTICE;
    return MODES.PRACTICE;
  }

  function applyMode(doc, hash, { focus = false } = {}) {
    if (!doc || !doc.body) return null;
    const mode = modeFromHash(hash, doc.body.dataset.classicMode);
    doc.body.dataset.classicMode = mode;

    for (const panel of doc.querySelectorAll("[data-classic-mode-panel]")) {
      panel.hidden = panel.dataset.classicModePanel !== mode;
    }

    for (const link of doc.querySelectorAll("[data-classic-mode-link]")) {
      const active = link.dataset.classicModeLink === mode;
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }

    const skip = doc.querySelector(".skip-link");
    if (skip) {
      skip.href = mode === MODES.ATLAS ? "#classic-atlas-title" : "#classic-practice-mode-title";
      skip.textContent = mode === MODES.ATLAS ? "跳到世界名型對照" : "跳到棋形練習";
    }

    if (focus && (hash === "#practice" || hash === "#atlas")) {
      const heading = doc.getElementById(mode === MODES.ATLAS ? "classic-atlas-title" : "classic-practice-mode-title");
      if (heading && typeof heading.focus === "function") heading.focus({ preventScroll: true });
    }
    return mode;
  }

  function init(doc, win) {
    if (!doc || !win) return null;
    let mode = applyMode(doc, win.location.hash);
    win.addEventListener("hashchange", () => {
      mode = applyMode(doc, win.location.hash, { focus: true });
    });
    return mode;
  }

  if (typeof document !== "undefined" && typeof window !== "undefined") {
    init(document, window);
  }

  return Object.freeze({
    version: "classic-shapes-mode-v1",
    MODES,
    modeFromHash,
    applyMode,
    init
  });
});
