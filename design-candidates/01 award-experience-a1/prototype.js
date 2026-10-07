"use strict";

const tabs = Array.from(document.querySelectorAll("[data-view]"));
const views = Array.from(document.querySelectorAll(".review-view"));
const motionButton = document.querySelector("#motion-demo");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function selectView(viewId, options = {}) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.view === viewId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  views.forEach((view) => {
    const selected = view.id === viewId;
    view.hidden = !selected;
    view.classList.toggle("is-active", selected);
  });
  if (options.focusHeading) {
    document.querySelector(`#${viewId} [data-view-title]`)?.focus({ preventScroll: true });
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectView(tab.dataset.view));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let targetIndex = index;
    if (event.key === 'ArrowRight') targetIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') targetIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = tabs.length - 1;
    tabs[targetIndex].focus();
    selectView(tabs[targetIndex].dataset.view);
  });
});

function playTransition(fromId, toId) {
  selectView(fromId);
  const source = document.querySelector(`#${fromId} .experience-frame`);
  source?.classList.remove("is-playing");
  void source?.offsetWidth;
  source?.classList.add("is-playing");
  const delay = prefersReducedMotion.matches ? 0 : 640;
  window.setTimeout(() => {
    selectView(toId);
    document.querySelector(`#${toId} .experience-frame`)?.classList.add("is-revealed");
  }, delay);
}

motionButton?.addEventListener("click", () => playTransition("w1", "w2"));
document.querySelector("#home-preview-action")?.addEventListener("click", () => playTransition("w1", "w2"));
document.querySelector("#lesson-answer-action")?.addEventListener("click", () => playTransition("w3", "w4"));

document.querySelectorAll("[data-mobile-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const demo = document.querySelector("#mobile-demo");
    const revealed = demo?.classList.toggle("show-result");
    button.textContent = revealed ? "回到作答前" : "模擬落下第一手";
    button.setAttribute("aria-pressed", String(Boolean(revealed)));
  });
});

selectView("w1");
