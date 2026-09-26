(function () {
  "use strict";

  const Content = window.GoAdvancedContent;
  const Events = window.GoAdvancedEvents;
  if (!Content || !Events) throw new Error("Advanced training dependencies missing.");

  const $ = (id) => document.getElementById(id);
  const activeTracks = Content.tracks.filter((track) => track.status === "active");
  let trackId = activeTracks[0] && activeTracks[0].id;
  let experienceIndex = 0;
  let demoIndex = 0;
  let answersThisPresentation = 0;
  let hintShown = false;
  let solved = false;
  let eventCounter = 0;
  const sessionId = "adv-session-" + Date.now().toString(36);
  let presentationId = "";

  function now() { return new Date().toISOString(); }
  function uid(prefix) { eventCounter += 1; return prefix + "-" + Date.now().toString(36) + "-" + eventCounter; }
  function currentList() { return Content.experiences.filter((item) => item.trackId === trackId); }
  function current() { return currentList()[experienceIndex]; }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
  }

  function record(type, extra) {
    const item = current();
    if (!item) return;
    const result = Events.append(localStorage, {
      eventId: uid(type),
      sessionId,
      presentationId,
      experienceId: item.id,
      trackId: item.trackId,
      type,
      occurredAt: now(),
      selectedIndex: extra && Number.isInteger(extra.selectedIndex) ? extra.selectedIndex : null,
      correct: extra && typeof extra.correct === "boolean" ? extra.correct : null,
      hintShown
    });
    if (!result.ok) {
      $("advanced-feedback").className = "feedback error";
      $("advanced-feedback").textContent = "進階練習紀錄無法寫入；本頁不會把失敗假裝成已保存。";
    }
  }

  function renderTracks() {
    $("advanced-track-list").innerHTML = Content.tracks.map((track) => {
      const count = Content.experiences.filter((item) => item.trackId === track.id).length;
      const active = track.id === trackId;
      const disabled = track.status !== "active";
      return '<button class="advanced-track-button' + (active ? ' active' : '') + '" type="button" data-track="' + escapeHtml(track.id) + '"' + (disabled ? ' disabled' : '') + '><strong>' + escapeHtml(track.title) + '</strong><span>' + escapeHtml(track.summary) + '</span><small>' + (disabled ? '下一階段' : count + ' 題 · 可自由切換') + '</small></button>';
    }).join("");
  }

  function renderSummary() {
    const result = Events.read(localStorage);
    if (!result.ok) {
      $("advanced-progress-summary").textContent = "本機進階練習紀錄不可讀；不顯示推測進度。";
      return;
    }
    const summary = Events.summarize(result.store);
    $("advanced-progress-summary").textContent = summary.firstAnswers
      ? "已保存 " + summary.firstAnswers + " 次首答；完成 " + summary.completedExperiences + " / " + Content.experiences.length + " 個練習。"
      : "尚未有本頁練習紀錄。";
  }

  function renderDiagram(step) {
    const size = step.boardSize || 7;
    const width = 300;
    const pad = 24;
    const pitch = (width - pad * 2) / (size - 1);
    const stoneMap = new Map((step.stones || []).map(([x,y,color]) => [x + "," + y, color]));
    const highlight = new Set((step.highlights || []).map(([x,y]) => x + "," + y));
    const emphasis = new Set((step.emphasis || []).map(([x,y]) => x + "," + y));
    const blocked = new Set((step.blocked || []).map(([x,y]) => x + "," + y));
    const reference = new Set((step.reference || []).map(([x,y]) => x + "," + y));
    const lines = [];
    const points = [];
    const stones = [];
    const rings = [];
    const crosses = [];
    const references = [];

    for (let i = 0; i < size; i += 1) {
      const p = pad + i * pitch;
      lines.push('<line class="demo-grid-line" x1="' + pad + '" y1="' + p + '" x2="' + (width-pad) + '" y2="' + p + '"/>');
      lines.push('<line class="demo-grid-line" x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (width-pad) + '"/>');
    }
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = pad + x * pitch;
      const cy = pad + y * pitch;
      points.push('<circle class="demo-point" cx="' + cx + '" cy="' + cy + '" r="1.8"/>');
      const key = x + "," + y;
      const color = stoneMap.get(key);
      if (color) stones.push('<circle class="' + (color === 1 ? 'demo-black' : 'demo-white') + '" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(8,pitch*.34) + '"/>');
      if (highlight.has(key)) rings.push('<circle class="demo-liberty" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(7,pitch*.22) + '"/>');
      if (emphasis.has(key)) rings.push('<circle class="demo-emphasis" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(11,pitch*.40) + '"/>');
      if (blocked.has(key)) crosses.push('<path class="demo-blocked" d="M ' + (cx-8) + ' ' + (cy-8) + ' L ' + (cx+8) + ' ' + (cy+8) + ' M ' + (cx+8) + ' ' + (cy-8) + ' L ' + (cx-8) + ' ' + (cy+8) + '"/>');
      if (reference.has(key)) references.push('<rect class="demo-reference" x="' + (cx-11) + '" y="' + (cy-11) + '" width="22" height="22" rx="3"/>');
    }
    $("advanced-demo-board").innerHTML = '<svg viewBox="0 0 ' + width + ' ' + width + '" role="img" aria-label="' + escapeHtml(step.label) + '"><rect width="' + width + '" height="' + width + '" rx="12" class="demo-board-background"/>' + lines.join("") + points.join("") + stones.join("") + rings.join("") + crosses.join("") + references.join("") + '</svg>';
    $("advanced-demo-caption").textContent = step.caption;
    $("advanced-demo-count").textContent = "第 " + (demoIndex + 1) + " / " + current().demoSteps.length + " 步";
    $("advanced-demo-previous").disabled = demoIndex === 0;
    $("advanced-demo-next").disabled = demoIndex === current().demoSteps.length - 1;
  }

  function renderExperience() {
    const item = current();
    if (!item) return;
    answersThisPresentation = 0;
    hintShown = false;
    solved = false;
    demoIndex = 0;
    presentationId = uid("presentation");

    const track = Content.tracks.find((entry) => entry.id === trackId);
    $("advanced-track-label").textContent = track.title;
    $("advanced-count").textContent = "第 " + (experienceIndex + 1) + " / " + currentList().length + " 題";
    $("advanced-title").textContent = item.title;
    $("advanced-target").textContent = item.target;
    $("advanced-prompt").textContent = item.prompt;
    $("advanced-choices").innerHTML = item.choices.map((choice, index) => '<button type="button" class="advanced-choice" data-choice="' + index + '">' + escapeHtml(choice) + '</button>').join("");
    $("advanced-feedback").className = "feedback";
    $("advanced-feedback").textContent = "";
    $("advanced-hint").disabled = false;
    $("advanced-hint").textContent = "給我觀察提示";
    $("advanced-next").disabled = true;
    $("advanced-next").textContent = experienceIndex === currentList().length - 1 ? "完成這條訓練線" : "下一題 →";
    $("advanced-takeaway").hidden = true;
    $("advanced-takeaway-text").textContent = item.takeaway;
    $("advanced-term-count").textContent = "（" + item.terms.length + " 個）";
    $("advanced-term-list").innerHTML = item.terms.map(([term, definition]) => '<div><dt>' + escapeHtml(term) + '</dt><dd>' + escapeHtml(definition) + '</dd></div>').join("");
    $("advanced-terms").open = false;
    renderDiagram(item.demoSteps[0]);
    renderTracks();
    renderSummary();
    record("presented");
    $("advanced-title").focus();
  }

  function answer(index) {
    if (solved) return;
    const item = current();
    const correct = index === item.answer;
    const type = answersThisPresentation === 0 ? "answer_first" : "answer_retry";
    answersThisPresentation += 1;
    record(type, { selectedIndex: index, correct });

    if (correct) {
      solved = true;
      $("advanced-feedback").className = "feedback answer-result success";
      $("advanced-feedback").innerHTML = '<span class="feedback-badge" aria-hidden="true">✓</span><strong class="feedback-title">答對了</strong><span class="answer-explanation">' + escapeHtml(item.explanation) + '</span>';
      $("advanced-next").disabled = false;
      $("advanced-hint").disabled = true;
      $("advanced-takeaway").hidden = false;
      record("completed", { selectedIndex: index, correct: true });
      renderSummary();
      return;
    }

    $("advanced-feedback").className = "feedback answer-result error";
    $("advanced-feedback").innerHTML = '<span class="feedback-badge" aria-hidden="true">×</span><strong class="feedback-title">還沒抓到判斷重點</strong><span class="answer-explanation">先回到 Target 與逐步圖，換一個候選再試。首答已保留，不會被重試覆寫。</span>';
  }

  $("advanced-track-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-track]");
    if (!button || button.disabled || button.dataset.track === trackId) return;
    trackId = button.dataset.track;
    experienceIndex = 0;
    renderExperience();
  });

  $("advanced-choices").addEventListener("click", (event) => {
    const button = event.target.closest("[data-choice]");
    if (!button) return;
    answer(Number(button.dataset.choice));
  });

  $("advanced-hint").addEventListener("click", () => {
    if (solved || hintShown) return;
    hintShown = true;
    record("hint");
    $("advanced-feedback").className = "feedback";
    $("advanced-feedback").textContent = current().hint;
    $("advanced-hint").disabled = true;
    $("advanced-hint").textContent = "提示已顯示";
  });

  $("advanced-next").addEventListener("click", () => {
    if (!solved) return;
    if (experienceIndex < currentList().length - 1) {
      experienceIndex += 1;
      renderExperience();
      return;
    }
    $("advanced-feedback").className = "feedback success";
    $("advanced-feedback").textContent = "這條訓練線已完成一次。這只代表完成本輪 practice，不代表掌握；可切到另一條線，或稍後回來做新局面。";
    $("advanced-next").disabled = true;
  });

  $("advanced-demo-previous").addEventListener("click", () => {
    if (demoIndex === 0) return;
    demoIndex -= 1;
    renderDiagram(current().demoSteps[demoIndex]);
  });

  $("advanced-demo-next").addEventListener("click", () => {
    if (demoIndex >= current().demoSteps.length - 1) return;
    demoIndex += 1;
    renderDiagram(current().demoSteps[demoIndex]);
  });

  renderTracks();
  renderExperience();
})();
