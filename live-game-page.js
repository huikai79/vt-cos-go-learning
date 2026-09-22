(function () {
  "use strict";
  const Go = window.GoCore, Live = window.GoLiveGame, Sgf = window.GoSgf;
  const { BLACK, WHITE, EMPTY } = Go;
  const STORAGE_KEY = "go-live-game-v1", RECOVERY_KEY = "go-live-game-recovery-v1", UI_VERSION = "live-game-ui-v1";
  const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
  const $ = (id) => document.getElementById(id);
  let game, auditEvents = [], cursor = [4, 4], loadNotice = "";

  function event(type, details = {}) {
    auditEvents.push({
      type, occurredAt: new Date().toISOString(), uiVersion: UI_VERSION,
      evaluationRole: "practice", evaluationContext: "live", formalEligible: false, evidenceUse: "practice_only",
      moveCount: game ? game.moves.length : 0, ...details
    });
    if (auditEvents.length > 1000) auditEvents = auditEvents.slice(-1000);
  }
  function showFeedback(message, tone = "") {
    $("live-feedback").className = `live-feedback${tone ? ` ${tone}` : ""}`;
    $("live-feedback").textContent = message || "";
  }
  function preserveBrokenSave(raw, reason) {
    try {
      localStorage.setItem(RECOVERY_KEY, JSON.stringify({ schemaVersion: 1, preservedAt: new Date().toISOString(), sourceKey: STORAGE_KEY, reason, rawValue: raw }));
      loadNotice = "偵測到無法安全續載的棋局；原始內容已保存在本機 recovery 副本，這裡先開啟新局。";
    } catch (_) {
      loadNotice = "偵測到損壞的棋局資料，而且無法建立 recovery 副本；本頁先以新局開啟。";
    }
  }
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { game = Live.createGame(); event("new_game", { reason: "first_open" }); return; }
    try {
      const payload = JSON.parse(raw);
      if (!payload || payload.schemaVersion !== 1 || !payload.game) throw new Error("envelope_invalid");
      game = Live.hydrate(payload.game);
      auditEvents = Array.isArray(payload.auditEvents) ? payload.auditEvents.filter((entry) => entry && typeof entry === "object") : [];
      loadNotice = game.status === "playing" ? "已從這台電腦續接上次未完成的棋局。" : "已載入這台電腦保存的棋局。";
      event("session_loaded", { status: game.status });
    } catch (error) {
      preserveBrokenSave(raw, error && error.message || "unknown_error");
      game = Live.createGame(); auditEvents = []; event("new_game", { reason: "recovery_after_invalid_save" });
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, uiVersion: UI_VERSION, savedAt: new Date().toISOString(), game, auditEvents }));
      $("save-state").textContent = "已保存於這台電腦";
      return true;
    } catch (_) {
      $("save-state").textContent = "未能保存";
      showFeedback("無法寫入瀏覽器儲存空間；離開前請先匯出 SGF。", "error");
      return false;
    }
  }
  function coordName(x, y) { return `${columns[x]}${9 - y}`; }
  function colorLabel(color) { return color === BLACK ? "黑" : "白"; }
  function lastPlayedMove() { return [...game.moves].reverse().find((move) => move.type === "play") || null; }
  function pointAria(x, y) {
    const stone = game.board[y][x], state = stone === BLACK ? "黑棋" : stone === WHITE ? "白棋" : "空點";
    if (game.status === "playing") return `${coordName(x, y)}，${state}${stone === EMPTY ? "，可落子" : ""}`;
    if (game.status === "scoring") return `${coordName(x, y)}，${state}${stone === EMPTY ? "" : "，可切換死子標記"}`;
    return `${coordName(x, y)}，${state}`;
  }
  function renderBoard() {
    const size = 9, offset = 60, pitch = 50, end = offset + pitch * (size - 1);
    const dead = new Set(game.deadStones || []), last = lastPlayedMove();
    const parts = [`<svg viewBox="0 0 520 520" role="group" aria-label="9 路棋盤；${game.status === "playing" ? `輪到${colorLabel(game.toPlay)}棋` : game.status === "scoring" ? "終局死子確認" : "棋局已結束"}">`];
    for (let i = 0; i < size; i += 1) {
      const p = offset + i * pitch;
      parts.push(`<line class="grid-line" x1="${offset}" y1="${p}" x2="${end}" y2="${p}"/>`);
      parts.push(`<line class="grid-line" x1="${p}" y1="${offset}" x2="${p}" y2="${end}"/>`);
      parts.push(`<text class="coord" x="${p}" y="30">${columns[i]}</text><text class="coord" x="28" y="${p}">${9 - i}</text>`);
    }
    for (const [x, y] of [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]]) parts.push(`<circle class="star" cx="${offset + x * pitch}" cy="${offset + y * pitch}" r="4"/>`);
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = offset + x * pitch, cy = offset + y * pitch, stone = game.board[y][x], isDead = dead.has(`${x},${y}`);
      const current = cursor[0] === x && cursor[1] === y;
      parts.push(`<g class="live-point" data-x="${x}" data-y="${y}" role="button" tabindex="${current ? 0 : -1}" aria-label="${pointAria(x, y)}"><circle class="point-hit" cx="${cx}" cy="${cy}" r="22"/><circle class="point-focus" cx="${cx}" cy="${cy}" r="21"/>`);
      if (stone === BLACK) parts.push(`<circle class="stone-black${isDead ? " dead-stone" : ""}" cx="${cx}" cy="${cy}" r="20"/>`);
      if (stone === WHITE) parts.push(`<circle class="stone-white${isDead ? " dead-stone" : ""}" cx="${cx}" cy="${cy}" r="20"/>`);
      if (last && last.point && last.point[0] === x && last.point[1] === y) parts.push(`<circle class="last-move" cx="${cx}" cy="${cy}" r="9"/>`);
      if (isDead && stone !== EMPTY) parts.push(`<line class="dead-cross" x1="${cx - 9}" y1="${cy - 9}" x2="${cx + 9}" y2="${cy + 9}"/><line class="dead-cross" x1="${cx + 9}" y1="${cy - 9}" x2="${cx - 9}" y2="${cy + 9}"/>`);
      parts.push("</g>");
    }
    parts.push("</svg>");
    $("live-board").innerHTML = parts.join("");
    $("live-board").setAttribute("aria-disabled", game.status === "finished" ? "true" : "false");
  }
  function scoreLineHtml(score) {
    if (!score) return "";
    const winner = score.winner === null ? "目前同分" : `目前${colorLabel(score.winner)}領先 ${score.difference} 目`;
    return `<div><strong>黑</strong>：棋子 ${score.blackStones} ＋ 地 ${score.blackTerritory} ＝ ${score.blackTotal}</div><div><strong>白</strong>：棋子 ${score.whiteStones} ＋ 地 ${score.whiteTerritory} ＋ 貼目 ${score.komi} ＝ ${score.whiteTotal}</div><div><strong>中立空點</strong>：${score.neutral}</div><div><strong>${winner}</strong></div>`;
  }
  function moveLabel(move) {
    const prefix = `${move.number}. ${colorLabel(move.color)}`;
    return move.type === "pass" ? `${prefix} Pass` : `${prefix} ${coordName(move.point[0], move.point[1])}${move.captured && move.captured.length ? ` · 提 ${move.captured.length}` : ""}`;
  }
  function render() {
    renderBoard();
    $("move-count").textContent = String(game.moves.length);
    $("capture-count").textContent = `黑 ${game.captures.black} · 白 ${game.captures.white}`;
    $("turn-status").textContent = game.status === "playing" ? `${colorLabel(game.toPlay)}棋落子` : game.status === "scoring" ? "終局確認" : Live.resultText(game);
    $("pass-button").disabled = game.status !== "playing"; $("resign-button").disabled = game.status !== "playing";
    $("undo-button").disabled = game.status === "finished" || !game.moves.length;
    $("scoring-panel").hidden = game.status !== "scoring"; $("result-panel").hidden = game.status !== "finished";
    $("score-lines").innerHTML = game.status === "scoring" ? scoreLineHtml(Live.currentScore(game)) : "";
    $("result-text").textContent = game.status === "finished" ? Live.resultText(game) : "";
    $("board-help").textContent = game.status === "playing" ? `輪到${colorLabel(game.toPlay)}棋。點空點落子；方向鍵移動，Enter／Space 落子。` : game.status === "scoring" ? "兩次 Pass 後進入終局確認。點棋串切換死子標記；系統不自動判死活。" : "棋局已結束。可匯出 SGF 回課程做局部複盤，或開始新局。";
    const recentMoves = game.moves.slice(-30);
    $("move-log").innerHTML = recentMoves.length ? recentMoves.map((move) => `<li class="${move.type === "pass" ? "pass" : ""}">${moveLabel(move)}</li>`).join("") : "<li>尚未落子。</li>";
  }
  function applyResult(result, auditType, details = {}) {
    if (!result.ok) { showFeedback(result.error || "操作失敗。", "error"); return false; }
    game = result.game; event(auditType, details); const saved = save(); render();
    if (saved) showFeedback(details.successMessage || "已保存。", details.tone || "success");
    return true;
  }
  function actAt(x, y, refocus = false) {
    cursor = [x, y];
    if (game.status === "playing") {
      if (game.board[y][x] !== EMPTY) { showFeedback(`${coordName(x, y)} 已有棋子。`, "error"); return; }
      const color = game.toPlay, result = Live.play(game, x, y);
      if (applyResult(result, "move", { color, point: [x, y], successMessage: `${colorLabel(color)}棋下在 ${coordName(x, y)}。` }) && refocus) setTimeout(focusCursor, 0);
      return;
    }
    if (game.status === "scoring") {
      if (game.board[y][x] === EMPTY) { showFeedback("請點選要標記的棋串；空點不需要標記。", "error"); return; }
      const result = Live.toggleDeadGroup(game, x, y);
      if (applyResult(result, "dead_group_toggle", { point: [x, y], markedDead: result.markedDead, successMessage: result.markedDead ? "已標記這串為死子；請核對預覽分數。" : "已取消這串死子標記。" }) && refocus) setTimeout(focusCursor, 0);
      return;
    }
    showFeedback("棋局已結束；請開始新局或匯出 SGF。", "error");
  }
  function focusCursor() {
    const point = $("live-board").querySelector(`[data-x="${cursor[0]}"][data-y="${cursor[1]}"]`);
    if (point) point.focus();
  }
  function moveCursor(key) {
    const delta = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
    if (!delta) return;
    const [x, y] = cursor;
    cursor = [Math.max(0, Math.min(8, x + delta[0])), Math.max(0, Math.min(8, y + delta[1]))];
    for (const point of $("live-board").querySelectorAll(".live-point")) point.setAttribute("tabindex", Number(point.dataset.x) === cursor[0] && Number(point.dataset.y) === cursor[1] ? "0" : "-1");
    focusCursor();
  }
  function download(contents, filename) {
    const url = URL.createObjectURL(new Blob([contents], { type: "application/x-go-sgf;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function timestampFilename() {
    const d = new Date(), pad = (n) => String(n).padStart(2, "0");
    return `9x9_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.sgf`;
  }

  $("live-board").addEventListener("click", (e) => {
    const point = e.target.closest(".live-point"); if (!point) return;
    actAt(Number(point.dataset.x), Number(point.dataset.y));
  });
  $("live-board").addEventListener("keydown", (e) => {
    const point = e.target.closest(".live-point"); if (!point) return;
    cursor = [Number(point.dataset.x), Number(point.dataset.y)];
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); moveCursor(e.key); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); actAt(cursor[0], cursor[1], true); }
  });
  $("pass-button").addEventListener("click", () => {
    const color = game.toPlay, result = Live.pass(game);
    applyResult(result, "pass", { color, successMessage: result.ok && result.game.status === "scoring" ? "雙方連續 Pass，請確認死子與終局分數。" : `${colorLabel(color)}棋 Pass。` });
  });
  $("undo-button").addEventListener("click", () => applyResult(Live.undo(game), "undo", { successMessage: "已悔一手；棋局依剩餘手順重新重建。" }));
  $("resign-button").addEventListener("click", () => {
    if (!confirm(`${colorLabel(game.toPlay)}棋確定認輸？`)) return;
    const loser = game.toPlay;
    applyResult(Live.resign(game), "resign", { loser, successMessage: `${colorLabel(loser)}棋認輸，棋局結束。` });
  });
  $("resume-play-button").addEventListener("click", () => {
    const result = Live.resumeFromScoring(game);
    applyResult(result, "resume_after_scoring_dispute", { successMessage: result.ok ? `恢復下棋，輪到${colorLabel(result.game.toPlay)}棋。` : "" });
  });
  $("confirm-score-button").addEventListener("click", () => {
    const preview = Live.currentScore(game);
    const previewText = preview && preview.winner ? `${colorLabel(preview.winner)}棋領先 ${preview.difference} 目` : "目前同分";
    if (!confirm(`確認目前死子標記與分數？\n${previewText}\n確認後這局將標示為結束。`)) return;
    applyResult(Live.finalizeScore(game), "score_confirmed", { deadStones: [...(game.deadStones || [])], successMessage: "終局結果已確認並保存。" });
  });
  $("new-game-button").addEventListener("click", () => {
    if (game.moves.length && !confirm("開始新局會取代目前本機續局狀態。若要保留這盤，請先匯出 SGF。確定開始新局？")) return;
    game = Live.createGame(); auditEvents = []; event("new_game", { reason: "user_started" }); cursor = [4, 4];
    save(); render(); showFeedback("已開始新的 9×9 棋局。", "success");
  });
  $("export-sgf-button").addEventListener("click", () => {
    try {
      download(Live.toSgf(game), timestampFilename()); event("sgf_export", { status: game.status }); save();
      showFeedback("SGF 已建立；可用 KaTrain／其他棋譜工具開啟，或回課程匯入複盤。", "success");
    } catch (error) { showFeedback(error.message, "error"); }
  });
  $("import-sgf-input").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > Sgf.MAX_SGF_FILE_BYTES) { showFeedback(`SGF 無法匯入：檔案過大（上限 ${Sgf.MAX_SGF_FILE_BYTES} bytes）。`, "error"); e.target.value = ""; return; }
    if (game.moves.length && !confirm("匯入棋譜會取代目前本機續局狀態。若要保留這盤，請先匯出 SGF。確定匯入？")) { e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        game = Live.fromSgf(String(reader.result || "")); auditEvents = [];
        event("sgf_import", { sourceName: file.name, importedStatus: game.status }); cursor = [4, 4];
        save(); render(); showFeedback(`已匯入 ${file.name}${game.status === "playing" ? "，可繼續下棋" : ""}。`, "success");
      } catch (error) { showFeedback(error.message, "error"); }
      e.target.value = "";
    };
    reader.onerror = () => { showFeedback("無法讀取這個 SGF 檔案。", "error"); e.target.value = ""; };
    reader.readAsText(file, "UTF-8");
  });

  load(); save(); render();
  if (loadNotice) showFeedback(loadNotice, loadNotice.includes("損壞") || loadNotice.includes("無法") ? "error" : "success");
})();