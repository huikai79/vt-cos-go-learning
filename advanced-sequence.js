(function () {
  "use strict";

  const Content = window.GoAdvancedContent;
  const Events = window.GoAdvancedSequenceEvents;
  const Contract = window.GoAdvancedSequenceContract;
  const Go = window.GoCore;
  if (!Content || !Events || !Contract || !Go) throw new Error("Advanced sequence dependencies missing.");

  const $ = (id) => document.getElementById(id);
  const experiences = Array.isArray(Content.sequenceExperiences) ? Content.sequenceExperiences : [];
  const validation = Contract.validateAll(experiences, Go);
  let experienceIndex = 0;
  let decisionIndex = 0;
  let attemptsThisDecision = 0;
  let hintShown = false;
  let board = null;
  let previousBoard = null;
  let cursor = [0, 0];
  let presentationId = "";
  let eventCounter = 0;
  let blocked = false;
  const sessionId = "adv-seq-session-" + Date.now().toString(36);

  function now() { return new Date().toISOString(); }
  function uid(prefix) { eventCounter += 1; return prefix + "-" + Date.now().toString(36) + "-" + eventCounter; }
  function current() { return experiences[experienceIndex]; }
  function decision() { return current().decisions[decisionIndex]; }
  function pointKey(x, y) { return x + "," + y; }
  function cloneBoard(source) { return source.map((row) => row.slice()); }
  function acceptedMove(x, y) { return decision().acceptedMoves.some(([ax, ay]) => ax === x && ay === y); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
  }

  function firstEmptyNearCenter(source) {
    const size = source.length;
    const center = (size - 1) / 2;
    const empties = [];
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      if (source[y][x] === Go.EMPTY) empties.push([x, y]);
    }
    empties.sort((a, b) => (Math.abs(a[0] - center) + Math.abs(a[1] - center)) - (Math.abs(b[0] - center) + Math.abs(b[1] - center)) || a[1] - b[1] || a[0] - b[0]);
    return empties[0] || [0, 0];
  }

  function setBlocked(message) {
    blocked = true;
    $("advanced-sequence-feedback").className = "feedback error";
    $("advanced-sequence-feedback").textContent = message;
    $("advanced-sequence-hint").disabled = true;
    $("advanced-sequence-reset").disabled = true;
    $("advanced-sequence-next").disabled = true;
  }

  function record(type, extra = {}) {
    const item = current();
    const activeDecision = ["decision_presented", "hint", "move_first", "move_retry", "opponent_move"].includes(type) ? decision() : null;
    const result = Events.append(localStorage, {
      eventId: uid(type),
      sessionId,
      presentationId,
      experienceId: item.id,
      experienceVersion: item.version,
      trackId: item.trackId,
      type,
      occurredAt: now(),
      decisionId: activeDecision ? activeDecision.id : null,
      stepIndex: activeDecision ? decisionIndex : null,
      point: extra.point || null,
      correct: typeof extra.correct === "boolean" ? extra.correct : null,
      legal: typeof extra.legal === "boolean" ? extra.legal : null,
      capturedCount: Number.isInteger(extra.capturedCount) ? extra.capturedCount : null,
      hintShown
    });
    if (!result.ok) {
      setBlocked("多手讀棋紀錄無法寫入；本題已停止，不會把未保存的作答假裝成成功。");
      return false;
    }
    return true;
  }

  function renderSequenceList() {
    $("advanced-sequence-list").innerHTML = experiences.map((item, index) =>
      '<button type="button" class="advanced-sequence-tab' + (index === experienceIndex ? ' active' : '') + '" data-sequence-index="' + index + '">' +
      '<strong>' + escapeHtml(item.title) + '</strong><small>' + item.decisions.length + ' 段實走 · 規則驗證</small></button>'
    ).join("");
  }

  function renderSummary() {
    const result = Events.read(localStorage);
    if (!result.ok) {
      $("advanced-sequence-summary").textContent = "多手讀棋紀錄不可讀；不顯示推測進度。";
      return;
    }
    const summary = Events.summarize(result.store);
    $("advanced-sequence-summary").textContent = "棋盤題 " + (experienceIndex + 1) + " / " + experiences.length +
      " · 已保存 " + summary.firstMoves + " 次分段首答 · 完成 " + summary.completedExperiences + " 題";
  }

  function renderBoard() {
    const item = current();
    const size = item.boardSize;
    const width = 320;
    const pad = 25;
    const pitch = (width - pad * 2) / (size - 1);
    const elements = [];
    const stoneMap = new Map();

    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const color = board[y][x];
      if (color) stoneMap.set(pointKey(x, y), color);
    }

    for (let i = 0; i < size; i += 1) {
      const p = pad + i * pitch;
      elements.push('<line class="seq-grid-line" x1="' + pad + '" y1="' + p + '" x2="' + (width-pad) + '" y2="' + p + '"/>');
      elements.push('<line class="seq-grid-line" x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (width-pad) + '"/>');
    }

    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = pad + x * pitch;
      const cy = pad + y * pitch;
      const key = pointKey(x, y);
      elements.push('<circle class="seq-point" cx="' + cx + '" cy="' + cy + '" r="2"/>');
      const color = stoneMap.get(key);
      if (color) {
        elements.push('<circle class="' + (color === Go.BLACK ? 'seq-black' : 'seq-white') + '" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(11,pitch*.34) + '"/>');
      } else {
        elements.push('<circle class="seq-hit" data-seq-x="' + x + '" data-seq-y="' + y + '" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(13,pitch*.38) + '"/>');
      }
    }

    const [cursorX, cursorY] = cursor;
    const cursorCx = pad + cursorX * pitch;
    const cursorCy = pad + cursorY * pitch;
    elements.push('<circle class="seq-cursor" cx="' + cursorCx + '" cy="' + cursorCy + '" r="' + Math.max(15,pitch*.43) + '"/>');

    $("advanced-sequence-board").innerHTML = '<svg viewBox="0 0 ' + width + ' ' + width + '" aria-hidden="true"><rect class="seq-board-bg" width="' + width + '" height="' + width + '" rx="12"/>' + elements.join("") + '</svg>';

    $("advanced-sequence-cursor").textContent = "游標：第 " + (cursorY + 1) + " 行，第 " + (cursorX + 1) + " 列";
  }

  function renderDecision() {
    const item = current();
    const active = decision();
    $("advanced-sequence-name").textContent = item.title;
    $("advanced-sequence-target").textContent = item.target;
    $("advanced-sequence-prompt").textContent = active.prompt;
    $("advanced-sequence-step").textContent = "第 " + (decisionIndex + 1) + " / " + item.decisions.length + " 步";
    $("advanced-sequence-side").textContent = item.playerColor === Go.BLACK ? "● 黑棋" : "○ 白棋";
    $("advanced-sequence-hint").disabled = blocked;
    $("advanced-sequence-hint").textContent = "給我觀察提示";
    $("advanced-sequence-takeaway").hidden = true;
    $("advanced-sequence-next").disabled = true;
    renderBoard();
    renderSequenceList();
    renderSummary();
  }

  function beginPresentation() {
    const item = current();
    decisionIndex = 0;
    attemptsThisDecision = 0;
    hintShown = false;
    blocked = false;
    board = Go.boardFromStones(item.setupStones, item.boardSize);
    previousBoard = null;
    cursor = firstEmptyNearCenter(board);
    presentationId = uid("presentation");
    $("advanced-sequence-feedback").className = "feedback";
    $("advanced-sequence-feedback").textContent = "";
    $("advanced-sequence-reset").disabled = false;
    $("advanced-sequence-takeaway-text").textContent = item.takeaway;
    $("advanced-sequence-term-count").textContent = "（" + item.terms.length + " 個）";
    $("advanced-sequence-term-list").innerHTML = item.terms.map(([term, definition]) => '<div><dt>' + escapeHtml(term) + '</dt><dd>' + escapeHtml(definition) + '</dd></div>').join("");
    $("advanced-sequence-terms").open = false;
    renderDecision();
    if (!record("presented")) return;
    record("decision_presented");
  }

  function attemptMove(x, y) {
    if (blocked) return;
    const item = current();
    const active = decision();
    const before = cloneBoard(board);
    const result = Go.playMove(board, x, y, item.playerColor, previousBoard ? { previousBoard } : {});
    const correct = Boolean(result.legal && acceptedMove(x, y));
    const type = attemptsThisDecision === 0 ? "move_first" : "move_retry";
    attemptsThisDecision += 1;

    if (!record(type, {
      point: [x, y],
      correct,
      legal: result.legal,
      capturedCount: result.legal ? result.captured.length : 0
    })) return;

    if (!result.legal) {
      $("advanced-sequence-feedback").className = "feedback error";
      $("advanced-sequence-feedback").textContent = result.reason + " 這一步已保存為本輪作答；盤面不推進，請重新讀目前局面。";
      return;
    }

    if (!correct) {
      $("advanced-sequence-feedback").className = "feedback answer-result error";
      $("advanced-sequence-feedback").innerHTML = '<span class="feedback-badge" aria-hidden="true">×</span><strong class="feedback-title">這手合法，但不是本題 contract 的下一手</strong><span class="answer-explanation">盤面維持在作答前局面。請重新比較氣、出口與對手應手；首答已保存。</span>';
      return;
    }

    previousBoard = before;
    board = result.board;
    $("advanced-sequence-feedback").className = "feedback success";
    $("advanced-sequence-feedback").textContent = active.success;
    cursor = firstEmptyNearCenter(board);
    renderBoard();

    if (active.opponentMove) {
      const responseBefore = cloneBoard(board);
      const opponentColor = item.playerColor === Go.BLACK ? Go.WHITE : Go.BLACK;
      const response = Go.playMove(board, active.opponentMove[0], active.opponentMove[1], opponentColor, { previousBoard });
      if (!response.legal) {
        setBlocked("題目內建對手應手與規則引擎衝突；本題停止並標記為工程錯誤。");
        return;
      }
      if (!record("opponent_move", { point: active.opponentMove, capturedCount: response.captured.length })) return;
      previousBoard = responseBefore;
      board = response.board;
      decisionIndex += 1;
      attemptsThisDecision = 0;
      hintShown = false;
      cursor = firstEmptyNearCenter(board);
      renderDecision();
      $("advanced-sequence-feedback").className = "feedback";
      $("advanced-sequence-feedback").textContent = active.opponentText + " " + decision().prompt;
      record("decision_presented");
      return;
    }

    if (!record("completed")) return;
    $("advanced-sequence-feedback").className = "feedback answer-result success";
    $("advanced-sequence-feedback").innerHTML = '<span class="feedback-badge" aria-hidden="true">✓</span><strong class="feedback-title">這條多手變化已走完</strong><span class="answer-explanation">' + escapeHtml(active.success) + '</span>';
    $("advanced-sequence-takeaway").hidden = false;
    $("advanced-sequence-hint").disabled = true;
    $("advanced-sequence-next").disabled = experiences.length < 2;
    $("advanced-sequence-next").textContent = experienceIndex === experiences.length - 1 ? "回到第一個棋盤題 →" : "下一個棋盤題 →";
    renderSummary();
  }

  $("advanced-sequence-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-sequence-index]");
    if (!button || blocked) return;
    const index = Number(button.dataset.sequenceIndex);
    if (!Number.isInteger(index) || index < 0 || index >= experiences.length || index === experienceIndex) return;
    experienceIndex = index;
    beginPresentation();
  });

  $("advanced-sequence-board").addEventListener("click", (event) => {
    const hit = event.target.closest("[data-seq-x][data-seq-y]");
    if (!hit) return;
    cursor = [Number(hit.dataset.seqX), Number(hit.dataset.seqY)];
    renderBoard();
    attemptMove(cursor[0], cursor[1]);
  });

  $("advanced-sequence-board").addEventListener("keydown", (event) => {
    let [x, y] = cursor;
    const size = current().boardSize;
    if (event.key === "ArrowLeft") x = Math.max(0, x - 1);
    else if (event.key === "ArrowRight") x = Math.min(size - 1, x + 1);
    else if (event.key === "ArrowUp") y = Math.max(0, y - 1);
    else if (event.key === "ArrowDown") y = Math.min(size - 1, y + 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      attemptMove(x, y);
      return;
    } else return;
    event.preventDefault();
    cursor = [x, y];
    renderBoard();
  });

  $("advanced-sequence-hint").addEventListener("click", () => {
    if (blocked || hintShown) return;
    hintShown = true;
    if (!record("hint")) return;
    $("advanced-sequence-feedback").className = "feedback";
    $("advanced-sequence-feedback").textContent = decision().hint;
    $("advanced-sequence-hint").disabled = true;
    $("advanced-sequence-hint").textContent = "提示已顯示";
  });

  $("advanced-sequence-reset").addEventListener("click", () => {
    if (!blocked) beginPresentation();
  });

  $("advanced-sequence-next").addEventListener("click", () => {
    if (blocked || $("advanced-sequence-next").disabled) return;
    experienceIndex = (experienceIndex + 1) % experiences.length;
    beginPresentation();
  });

  if (!validation.ok) {
    $("advanced-sequence-list").innerHTML = "";
    $("advanced-sequence-name").textContent = "多手讀棋暫停";
    $("advanced-sequence-target").textContent = "內容 contract 未通過規則驗證。";
    $("advanced-sequence-prompt").textContent = "";
    $("advanced-sequence-board").innerHTML = "";
    setBlocked("進階多手題內容與 rules-backed contract 不一致；已 fail closed。");
    console.error("Advanced sequence validation failed", validation.errors);
    return;
  }

  renderSequenceList();
  beginPresentation();
})();