(function () {
  "use strict";
  const reviewBank = window.GoR1ReviewBank;
  const reviewItems = reviewBank.reviewItems;
  const reviews = new Map();
  const draftStorageKey = "go-r1-independent-review-draft-v4";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  }
  function board(problem) {
    const focus = new Set(problem.focus.map(([x, y]) => `${x},${y}`));
    const occupied = new Map(problem.stones.map(([x, y, color]) => [`${x},${y}`, color]));
    const lines = [];
    const marks = [];
    const hits = [];
    for (let index = 0; index < 9; index += 1) {
      const position = 30 + index * 45;
      lines.push(`<line x1="30" y1="${position}" x2="390" y2="${position}" stroke="#5d503a"/>`, `<line x1="${position}" y1="30" x2="${position}" y2="390" stroke="#5d503a"/>`);
    }
    for (let y = 0; y < 9; y += 1) for (let x = 0; x < 9; x += 1) {
      const px = 30 + x * 45;
      const py = 30 + y * 45;
      const color = occupied.get(`${x},${y}`);
      if (focus.has(`${x},${y}`)) marks.push(`<circle class="focus" cx="${px}" cy="${py}" r="23"/>`);
      if (color) marks.push(`<circle cx="${px}" cy="${py}" r="18" fill="${color === 1 ? "#181818" : "#f8f8f5"}" stroke="#222"/>`);
      else hits.push(`<circle class="hit" tabindex="0" role="button" aria-label="第 ${y + 1} 行第 ${x + 1} 列" data-x="${x}" data-y="${y}" cx="${px}" cy="${py}" r="20"/>`);
    }
    return `<svg viewBox="0 0 420 420" aria-label="${escapeHtml(problem.id)} 棋盤"><rect width="420" height="420" rx="8" fill="#e7ba78"/>${lines.join("")}${marks.join("")}${hits.join("")}<g class="selection"></g></svg>`;
  }
  function card(problem) {
    return `<article class="card" data-id="${problem.id}"><h2>${escapeHtml(problem.id)}</h2><p class="prompt">${escapeHtml(problem.prompt)}</p><div class="board">${board(problem)}</div><div class="fields"><div class="move">尚未選擇建議落子</div><label>審查結果<select class="status"><option value="">請選擇</option><option value="consistent">一致</option><option value="needs_fix">需修</option><option value="ambiguous">歧義</option><option value="multiple_solutions">多解</option></select></label><label>判斷理由<textarea class="notes" placeholder="請寫氣數、連接關係、多解位置或修正理由"></textarea></label></div></article>`;
  }
  function reviewFor(id) {
    if (!reviews.has(id)) reviews.set(id, { problemId: id, status: "", proposedMove: null, notes: "" });
    return reviews.get(id);
  }
  function setMessage(text, success = false) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.className = success ? "success" : "";
  }
  function saveDraft() {
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify({
        protocolId: reviewBank.protocolId,
        contentFingerprint: reviewBank.contentFingerprint,
        reviewerCode: document.getElementById("reviewer-code").value,
        reviewerExperience: document.getElementById("reviewer-experience").value,
        independentOfContentAuthoring: document.getElementById("independent-authoring").checked,
        separateFromLearner: document.getElementById("separate-learner").checked,
        answerBlindBeforeReview: document.getElementById("answer-blind").checked,
        reviews: reviewItems.map((problem) => reviewFor(problem.id))
      }));
      return true;
    } catch (_) {
      return false;
    }
  }
  function persistDraft() {
    if (saveDraft()) return;
    setMessage("無法把審查草稿寫入瀏覽器儲存空間；請立即使用「匯出草稿」保留目前內容。");
  }
  function restoreDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(draftStorageKey) || "null");
      if (!saved || saved.protocolId !== reviewBank.protocolId || saved.contentFingerprint !== reviewBank.contentFingerprint) return;
      document.getElementById("reviewer-code").value = saved.reviewerCode || "";
      document.getElementById("reviewer-experience").value = saved.reviewerExperience || "";
      document.getElementById("independent-authoring").checked = saved.independentOfContentAuthoring === true;
      document.getElementById("separate-learner").checked = saved.separateFromLearner === true;
      document.getElementById("answer-blind").checked = saved.answerBlindBeforeReview === true;
      for (const item of Array.isArray(saved.reviews) ? saved.reviews : []) {
        if (!reviewItems.some((problem) => problem.id === item.problemId)) continue;
        reviews.set(item.problemId, { problemId: item.problemId, status: item.status || "", proposedMove: item.proposedMove || null, notes: item.notes || "" });
      }
    } catch (_) { /* Ignore malformed local drafts. */ }
  }
  function isComplete(problem) {
    const review = reviewFor(problem.id);
    const requiresMove = ["consistent", "needs_fix"].includes(review.status);
    const requiresReason = ["needs_fix", "ambiguous", "multiple_solutions"].includes(review.status);
    return Boolean(review.status) && (!requiresMove || Boolean(review.proposedMove)) && (!requiresReason || Boolean(review.notes.trim()));
  }
  function incompleteItems() {
    return reviewItems.filter((problem) => !isComplete(problem));
  }
  function applyFilter() {
    const mode = document.getElementById("review-filter").value;
    for (const cardElement of document.querySelectorAll(".card")) {
      const problem = reviewItems.find((item) => item.id === cardElement.dataset.id);
      const completed = isComplete(problem);
      cardElement.hidden = mode === "pending" ? completed : mode === "completed" ? !completed : false;
    }
  }
  function progress() {
    const incomplete = incompleteItems().length;
    const completed = reviewItems.length - incomplete;
    document.getElementById("progress").textContent = `已完成 ${completed} / ${reviewItems.length} · 待審 ${incomplete}`;
    document.querySelector('#review-filter option[value="pending"]').textContent = `待審（${incomplete}）`;
    document.querySelector('#review-filter option[value="completed"]').textContent = `已完成（${completed}）`;
    document.getElementById("next-incomplete").disabled = incomplete === 0;
    applyFilter();
  }
  function jumpToNextIncomplete() {
    const incomplete = incompleteItems();
    if (!incomplete.length) {
      setMessage(`${reviewItems.length} 題皆已完成，可補齊審查者資料與獨立聲明後匯出回條。`, true);
      return;
    }
    document.getElementById("review-filter").value = "pending";
    applyFilter();
    const activeCard = document.activeElement && document.activeElement.closest ? document.activeElement.closest(".card") : null;
    const currentIndex = activeCard ? incomplete.findIndex((problem) => problem.id === activeCard.dataset.id) : -1;
    const targetProblem = incomplete[(currentIndex + 1) % incomplete.length];
    const target = document.querySelector(`.card[data-id="${targetProblem.id}"]`);
    target.scrollIntoView({ block: "start", behavior: "smooth" });
    setTimeout(() => target.querySelector(".status").focus({ preventScroll: true }), 0);
  }
  function choosePoint(cardElement, x, y) {
    const review = reviewFor(cardElement.dataset.id);
    review.proposedMove = [x, y];
    cardElement.querySelector(".move").textContent = `建議落子：第 ${y + 1} 行、第 ${x + 1} 列（座標 ${x},${y}）`;
    cardElement.querySelector(".selection").innerHTML = `<circle class="selected" cx="${30 + x * 45}" cy="${30 + y * 45}" r="11"/>`;
    progress();
  }
  function payload(draft) {
    const reviewerCode = document.getElementById("reviewer-code").value.trim();
    const reviewerExperience = document.getElementById("reviewer-experience").value.trim();
    const independentOfContentAuthoring = document.getElementById("independent-authoring").checked;
    const separateFromLearner = document.getElementById("separate-learner").checked;
    const answerBlindBeforeReview = document.getElementById("answer-blind").checked;
    return {
      schemaVersion: 1,
      protocolId: reviewBank.protocolId,
      draft: Boolean(draft),
      contentFingerprint: reviewBank.contentFingerprint,
      reviewedAt: new Date().toISOString(),
      reviewer: { code: reviewerCode || null, experience: reviewerExperience || null, independentOfContentAuthoring, separateFromLearner, answerBlindBeforeReview },
      reviewScope: { contentCorrectness: "single_reviewer_evidence", parallelFormComparability: "not_established", learningEffect: "not_measured" },
      population: reviewBank.population,
      reviews: reviewItems.map((problem) => reviewFor(problem.id))
    };
  }
  function download(contents, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(contents, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportDraft() {
    saveDraft();
    download(payload(true), "R1_獨立審題草稿.json");
    setMessage(`草稿已匯出；目前完成 ${reviewItems.length - incompleteItems().length} / ${reviewItems.length} 題。草稿不能作為 R1 通過依據。`, true);
  }
  function exportFinalReceipt() {
    const reviewerCode = document.getElementById("reviewer-code").value.trim();
    const reviewerExperience = document.getElementById("reviewer-experience").value.trim();
    const declarations = ["independent-authoring", "separate-learner", "answer-blind"];
    const declarationsComplete = declarations.every((id) => document.getElementById(id).checked);
    const incomplete = incompleteItems();
    if (reviewerCode.length < 3 || reviewerExperience.length < 5 || !declarationsComplete || incomplete.length) {
      const missingProfile = [reviewerCode.length < 3 && "審查者代碼", reviewerExperience.length < 5 && "圍棋經驗", !declarationsComplete && "三項獨立聲明"].filter(Boolean);
      setMessage(`尚不能匯出完成回條：${missingProfile.length ? `還缺${missingProfile.join("、")}；` : ""}尚有 ${incomplete.length} 題未完成。選「一致」只需落子；其餘結果需補理由。可先按「匯出草稿」保存。`);
      return;
    }
    saveDraft();
    download(payload(false), "R1_獨立審題回條.json");
    setMessage("完成回條已匯出；尚須由驗證程序核對內容指紋與既定答案。", true);
  }

  document.getElementById("cards").innerHTML = reviewItems.map(card).join("");
  restoreDraft();
  for (const cardElement of document.querySelectorAll(".card")) {
    const review = reviewFor(cardElement.dataset.id);
    cardElement.querySelector(".status").value = review.status;
    cardElement.querySelector(".notes").value = review.notes;
    if (review.proposedMove) choosePoint(cardElement, ...review.proposedMove);
  }
  document.getElementById("cards").addEventListener("click", (event) => {
    const hit = event.target.closest(".hit");
    if (hit) { choosePoint(hit.closest(".card"), Number(hit.dataset.x), Number(hit.dataset.y)); persistDraft(); }
  });
  document.getElementById("cards").addEventListener("keydown", (event) => {
    if (!event.target.matches(".hit") || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    choosePoint(event.target.closest(".card"), Number(event.target.dataset.x), Number(event.target.dataset.y));
    persistDraft();
  });
  document.getElementById("cards").addEventListener("change", (event) => {
    if (!event.target.matches(".status")) return;
    reviewFor(event.target.closest(".card").dataset.id).status = event.target.value;
    progress();
    persistDraft();
  });
  document.getElementById("cards").addEventListener("input", (event) => {
    if (event.target.matches(".notes")) { reviewFor(event.target.closest(".card").dataset.id).notes = event.target.value; progress(); persistDraft(); }
  });
  for (const id of ["reviewer-code", "reviewer-experience", "independent-authoring", "separate-learner", "answer-blind"]) document.getElementById(id).addEventListener("input", persistDraft);
  document.getElementById("export-draft").addEventListener("click", exportDraft);
  document.getElementById("export-final").addEventListener("click", exportFinalReceipt);
  document.getElementById("review-filter").addEventListener("change", applyFilter);
  document.getElementById("next-incomplete").addEventListener("click", jumpToNextIncomplete);
  progress();
  window.GoR1Review = { reviewItems, fingerprint: reviewBank.contentFingerprint, incompleteItems };
})();
