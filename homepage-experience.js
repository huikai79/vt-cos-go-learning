(() => {
  "use strict";

  const surface = document.querySelector("[data-home-preview]");
  const toggle = surface?.querySelector("[data-home-preview-toggle]");
  const label = surface?.querySelector("[data-home-preview-label]");
  const status = surface?.querySelector("[data-home-preview-status]");

  if (!surface || !toggle || !label || !status) return;

  toggle.addEventListener("click", () => {
    const showingResult = surface.dataset.previewState !== "after";
    surface.dataset.previewState = showingResult ? "after" : "before";
    toggle.setAttribute("aria-pressed", String(showingResult));
    label.textContent = showingResult ? "原選點已保留" : "尚未落子";
    status.textContent = showingResult
      ? "合成預覽已顯示可觀察後果；第一次選點仍留在棋盤上。"
      : "合成預覽已回到作答前；沒有寫入任何學習紀錄。";
  });
})();
