(() => {
  const tabs = [...document.querySelectorAll("[data-view]")];
  const views = [...document.querySelectorAll(".review-view")];

  function showView(id, focusView = false) {
    for (const tab of tabs) tab.setAttribute("aria-selected", String(tab.dataset.view === id));
    for (const view of views) {
      const active = view.id === id;
      view.hidden = !active;
      view.classList.toggle("active", active);
    }
    if (focusView) document.querySelector(`#${id} h2`)?.focus?.({ preventScroll: true });
    history.replaceState(null, "", `#${id}`);
  }

  for (const tab of tabs) tab.addEventListener("click", () => showView(tab.dataset.view));

  const initial = location.hash.slice(1);
  if (views.some((view) => view.id === initial)) showView(initial);

  document.querySelector("#motion-demo").addEventListener("click", () => {
    showView("w1");
    const prototype = document.querySelector("#w1 .prototype");
    prototype.classList.remove("motion-pulse");
    requestAnimationFrame(() => prototype.classList.add("motion-pulse"));
    window.setTimeout(() => {
      prototype.classList.remove("motion-pulse");
      showView("w2");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 780);
  });
})();
