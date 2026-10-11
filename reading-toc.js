"use strict";
(() => {
  const toc = document.querySelector(".reading-toc-panel");
  if (!toc) return;
  const links = Array.from(toc.querySelectorAll('a[href^="#"]')).filter(a => a.hash.length > 1);
  const mobile = window.matchMedia("(max-width: 1199px)");
  // The desktop rail is always open; narrow layouts use a user-controlled disclosure.
  function updateLayout() {
    // Desktop rail stays expanded. Every transition into the compact layout
    // starts closed, even when the page was first loaded at desktop width.
    toc.open = !mobile.matches;
  }
  updateLayout();
  if (mobile.addEventListener) mobile.addEventListener("change", updateLayout);
  const targets = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  function markCurrent() {
    let current = 0;
    const threshold = mobile.matches ? 100 : 170;
    for (let index = 0; index < targets.length; index++) {
      if (targets[index] && targets[index].getBoundingClientRect().top <= threshold) current = index;
    }
    links.forEach((link,index) => {
      if (index === current) link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    });
  }
  let scheduled = false;
  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => { scheduled = false; markCurrent(); });
  }, {passive:true});
  window.addEventListener("hashchange", markCurrent);
  links.forEach(link => link.addEventListener("click", () => {
    if (mobile.matches) toc.open = false;
  }));
  markCurrent();
})();
