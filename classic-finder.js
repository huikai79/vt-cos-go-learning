/* Classic task/Atlas finder: presentation only. Existing scorers and ontology own truth. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const Catalog = window.GoClassicShapeCatalog;
  if (!Catalog || !Array.isArray(Catalog.entries)) return;

  // G2: derive task choices from the existing, tested deep links.
  const taskLinks = [...document.querySelectorAll(".classic-practice-jumps a[data-task-type]")];
  const taskSelect = $("classic-task-select");
  const taskGo = $("classic-task-go");
  if (taskSelect && taskGo && taskLinks.length) {
    const groups = new Map();
    taskLinks.forEach((link) => {
      const type = link.dataset.taskType;
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(link);
    });
    for (const [type, links] of groups) {
      const group = document.createElement("optgroup");
      group.label = type;
      links.forEach((link) => {
        const option = document.createElement("option");
        option.value = link.hash.slice(1);
        option.textContent = link.textContent.trim();
        group.append(option);
      });
      taskSelect.append(group);
    }
    const navigateTask = () => {
      const id = taskSelect.value;
      const target = id && document.getElementById(id);
      if (!target || !taskLinks.some((a) => a.hash === "#" + id)) return;
      const practiceNav = $("practice");
      if (!practiceNav || practiceNav.hidden) return;
      if (window.location.hash !== "#" + id) window.location.hash = id;
      else target.scrollIntoView({block: "start"});
      target.setAttribute("tabindex", "-1");
      target.focus({preventScroll: true});
    };
    taskGo.addEventListener("click", navigateTask);
    taskSelect.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        navigateTask();
      }
    });
    const syncChoice = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (taskLinks.some((link) => link.hash === "#" + id)) taskSelect.value = id;
    };
    window.addEventListener("hashchange", syncChoice);
    syncChoice();
  }

  // G1: project the existing catalog records into a compact result list.
  // All original ontology-derived cards remain in the DOM for provenance audit.
  const atlas = $("classic-atlas-lookup");
  const grid = $("classic-atlas-grid");
  const list = $("classic-atlas-result-list");
  const queryInput = $("classic-atlas-search");
  const reviewInput = $("classic-atlas-review");
  const filters = $("classic-filter-row");
  const status = $("classic-filter-result");
  const back = $("classic-atlas-back");
  if (!atlas || !grid || !list || !queryInput || !reviewInput || !filters || !status || !back) return;

  let selectedId = null;
  const norm = (value) => String(value || "").normalize("NFKC").trim().toLocaleLowerCase();
  const label = (entry) => entry.displayName || entry.preferredZhTW || entry.teachingTranslation || entry.teachingLabel;
  const searchNames = (entry) => [
    label(entry), entry.teachingLabel, entry.teachingTranslation, entry.literalTranslation,
    ...entry.zhAliases.map((a) => a.name),
    ...entry.aliases.map((a) => a.name)
  ];
  const reviewLabel = (value) => ({
    verified:"已核對", partial:"部分核對", needs_review:"待核對"
  })[value] || "查核狀態未知";
  const category = () => filters.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter || "all";

  function renderResults() {
    const q = norm(queryInput.value);
    const review = reviewInput.value;
    const cat = category();
    const cards = new Map([...grid.querySelectorAll(".classic-catalog-card[data-concept-id]")]
      .map((card) => [card.dataset.conceptId, card]));
    const entries = Catalog.entries.filter((entry) =>
      (cat === "all" || entry.category === cat)
      && (review === "all" || entry.reviewStatus === review)
      && (!q || searchNames(entry).some((value) => norm(value).includes(q)))
      && cards.has(entry.id)
    );
    if (!entries.some((entry) => entry.id === selectedId)) selectedId = entries[0]?.id || null;
    list.replaceChildren();
    for (const entry of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "classic-atlas-result-choice";
      button.dataset.conceptId = entry.id;
      button.setAttribute("aria-pressed", String(selectedId === entry.id));
      const title = document.createElement("strong");
      title.textContent = label(entry);
      const sub = document.createElement("small");
      sub.textContent = Catalog.categories[entry.category] + " · 項目查核：" + reviewLabel(entry.reviewStatus);
      button.append(title, sub);
      button.addEventListener("click", () => {
        selectedId = entry.id;
        updateSelection();
        atlas.dataset.mobileView = "detail";
        if (window.matchMedia("(max-width: 760px)").matches) {
          atlas.scrollIntoView({block:"start"});
          back.focus({preventScroll:true});
        }
      });
      list.append(button);
    }
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "classic-atlas-empty";
      empty.textContent = "沒有符合條件的名型。可以清除搜尋文字或更換篩選條件。";
      list.append(empty);
    }
    status.textContent = "目前找到 " + entries.length + " 筆名型資料。請選擇一筆查看名稱、棋形核對與來源。";
    if (!entries.length) atlas.dataset.mobileView = "list";
    updateSelection();
  }

  function updateSelection() {
    for (const card of grid.querySelectorAll(".classic-catalog-card")) {
      card.hidden = card.dataset.conceptId !== selectedId;
    }
    for (const button of list.querySelectorAll("button[data-concept-id]")) {
      button.setAttribute("aria-pressed", String(button.dataset.conceptId === selectedId));
    }
  }
  // The original category buttons update card markup first; this listener is
  // registered afterwards and applies the independent search/status projection.
  filters.addEventListener("click", (event) => {
    if (event.target.closest("button[data-filter]")) {
      atlas.dataset.mobileView = "list";
      renderResults();
    }
  });
  queryInput.addEventListener("input", () => {
    atlas.dataset.mobileView = "list";
    renderResults();
  });
  reviewInput.addEventListener("change", () => {
    atlas.dataset.mobileView = "list";
    renderResults();
  });
  back.addEventListener("click", () => {
    atlas.dataset.mobileView = "list";
    const selected = [...list.querySelectorAll("button[data-concept-id]")]
      .find((button) => button.dataset.conceptId === selectedId);
    (selected || queryInput).focus({preventScroll:true});
    atlas.scrollIntoView({block:"start"});
  });
  renderResults();
})();
