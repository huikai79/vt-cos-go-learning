"use strict";

(() => {
  const controls = Array.from(document.querySelectorAll(".back-to-top"));
  if (!controls.length) return;

  const desktopMedia = window.matchMedia("(min-width: 768px)");
  let framePending = false;

  function setVisible(control, visible) {
    control.classList.toggle("is-visible", visible);
    control.setAttribute("aria-hidden", visible ? "false" : "true");
    control.tabIndex = visible ? 0 : -1;
  }

  function update() {
    framePending = false;
    const baseBottom = desktopMedia.matches ? 24 : 16;
    const footer = Array.from(document.querySelectorAll("footer, .footer-note")).find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return getComputedStyle(candidate).display !== "none" && rect.height > 0;
    });
    const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
    const footerLift = Math.max(0, window.innerHeight - footerTop + 16 - baseBottom);
    const visible = window.scrollY > window.innerHeight * 2;

    controls.forEach((control) => {
      control.style.setProperty("--back-to-top-lift", `${footerLift}px`);
      setVisible(control, visible);
    });
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(update);
  }

  controls.forEach((control) => setVisible(control, false));
  document.documentElement.classList.add("back-to-top-ready");
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("load", scheduleUpdate, { once: true });
  scheduleUpdate();
})();
