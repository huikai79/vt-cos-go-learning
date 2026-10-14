(function (root) {
  "use strict";
  // Public site routing only. Every non-source locale is BLOCKED until a
  // separately reviewed full-site bundle is wired and accepted for release.
  // No learner event, first-answer, exposure, scoring, or storage mutation.
  const SOURCE = "zh-Hant-TW";
  const LOCALES = Object.freeze([
    { id: "zh-Hant-TW", label: "繁體中文", available: true },
    { id: "en", label: "English", available: false },
    { id: "ko-KR", label: "한국어", available: false },
    { id: "ms-MY", label: "Bahasa Melayu (Malaysia)", available: false },
    { id: "th-TH", label: "ภาษาไทย", available: false },
    { id: "id-ID", label: "Bahasa Indonesia", available: false },
    { id: "de-DE", label: "Deutsch", available: false }
  ]);
  const messages = Object.freeze({
    en: "The English edition is not available yet. This page is still in Traditional Chinese.",
    "ko-KR": "한국어 전체 사이트는 아직 제공되지 않습니다. 현재 페이지는 번체 중국어입니다.",
    "ms-MY": "Versi penuh Bahasa Melayu belum tersedia. Halaman ini masih dalam bahasa Cina Tradisional.",
    "th-TH": "เว็บไซต์ภาษาไทยฉบับสมบูรณ์ยังไม่พร้อมให้บริการ หน้านี้ยังเป็นภาษาจีนตัวเต็ม",
    "id-ID": "Situs lengkap berbahasa Indonesia belum tersedia. Halaman ini masih menggunakan bahasa Tionghoa Tradisional.",
    "de-DE": "Die vollständige deutsche Website ist noch nicht verfügbar. Diese Seite ist weiterhin auf traditionellem Chinesisch."
  });
  function stateFor(href) {
    const uri = new URL(href);
    const requested = uri.searchParams.get("lang") || SOURCE;
    const found = LOCALES.find((entry) => entry.id === requested);
    return Object.freeze({
      requested, rendered: SOURCE, supported: Boolean(found && found.available),
      recognized: Boolean(found), status: found && found.available ? "source" : found ? "unavailable" : "unknown"
    });
  }
  function routeFor(href, selected) {
    if (!LOCALES.some((entry) => entry.id === selected)) return null;
    const uri = new URL(href);
    if (selected === SOURCE) uri.searchParams.delete("lang");
    else uri.searchParams.set("lang", selected);
    return uri.href;
  }
  function localDocumentLink(rawHref, pageHref) {
    if (!rawHref || rawHref.startsWith("#")) return false;
    let target, page;
    try {
      page = new URL(pageHref);
      target = new URL(rawHref, page);
    } catch (_) { return false; }
    if (!["http:", "https:", "file:"].includes(target.protocol)) return false;
    if (target.protocol !== page.protocol || target.origin !== page.origin) return false;
    const dir = page.pathname.slice(0, page.pathname.lastIndexOf("/") + 1);
    if (!target.pathname.startsWith(dir)) return false;
    const name = target.pathname.slice(dir.length);
    return !name.includes("/") && (name === "" || /\.html$/i.test(name));
  }
  function preserveLocaleLinks(doc, href, requested) {
    for (const anchor of doc.querySelectorAll("a[href]")) {
      if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) continue;
      const raw = anchor.getAttribute("href");
      if (!localDocumentLink(raw, href)) continue;
      const uri = new URL(raw, href);
      if (requested === SOURCE) uri.searchParams.delete("lang");
      else uri.searchParams.set("lang", requested);
      anchor.setAttribute("href", uri.href);
    }
  }
  function start(doc, loc) {
    const state = stateFor(loc.href);
    // An unavailable language never changes the language of visible Chinese text.
    const requested = LOCALES.some((entry) => entry.id === state.requested) ? state.requested : SOURCE;
    const style = doc.createElement("style");
    style.textContent = ".site-locale-bar{box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;padding:.6rem max(1rem,env(safe-area-inset-left));background:#f3f5f1;color:#20362c;font:14px/1.5 system-ui,sans-serif;border-bottom:1px solid #d0d9d1}.site-locale-bar label{font-weight:600}.site-locale-bar select{max-width:100%;font:inherit;padding:.3rem .6rem;border:1px solid #879f90;border-radius:.4rem;background:#fff;color:#173629}.site-locale-bar p{margin:0;flex:1 1 100%;max-width:78ch;color:#66451b}.site-locale-bar:focus-within{outline:2px solid #456d59;outline-offset:-2px}";
    doc.head.appendChild(style);
    const bar = doc.createElement("aside");
    bar.id = "site-locale-bar";
    bar.className = "site-locale-bar";
    bar.setAttribute("aria-label", "網站語言 / Site language");
    const label = doc.createElement("label");
    label.textContent = "網站語言 / Language";
    label.htmlFor = "site-locale-select";
    const select = doc.createElement("select");
    select.id = "site-locale-select";
    for (const entry of LOCALES) {
      const opt = doc.createElement("option");
      opt.value = entry.id;
      opt.textContent = entry.label + (entry.available ? "" : " · coming later");
      select.appendChild(opt);
    }
    select.value = requested;
    const message = doc.createElement("p");
    message.id = "site-locale-status";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    message.textContent = state.status === "source"
      ? "目前僅提供完整繁體中文網站；其他語言尚未通過全站內容與功能驗收。"
      : state.status === "unavailable"
        ? messages[state.requested] + " / 尚未提供完整版本，請勿將本頁視為該語言網站。"
        : "不支援此語言代碼。本頁仍為繁體中文，未進行任何語言轉換。";
    bar.append(label, select, message);
    doc.body.insertBefore(bar, doc.body.firstChild);
    preserveLocaleLinks(doc, loc.href, state.requested);
    select.addEventListener("change", () => {
      const next = routeFor(loc.href, select.value);
      if (next) loc.assign(next);
    });
    return state;
  }
  const api = Object.freeze({ SOURCE, LOCALES, stateFor, routeFor, localDocumentLink, preserveLocaleLinks });
  root.GoSiteLanguage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root.document && root.location) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", () => start(root.document, root.location), { once: true });
    } else {
      start(root.document, root.location);
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
