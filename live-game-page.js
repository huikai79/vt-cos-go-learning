(function () {
  "use strict";
  const Go = window.GoCore, Live = window.GoLiveGame, Sgf = window.GoSgf, Bot = window.GoPracticeBot, MoveProvider = window.GoMoveProvider, PracticeEvents = window.GoPracticeEvents, LiveEvidence = window.GoLiveEvidence;
  const { BLACK, WHITE, EMPTY } = Go;
  const requestedSizeParam = new URLSearchParams(window.location.search).get("size");
  const retiredThreeByThreeRequested = Number(requestedSizeParam) === 3;
  const requestedSize = (() => {
    try {
      const size = Live.normalizeBoardSize(requestedSizeParam, Live.DEFAULT_SIZE);
      return (Live.ACTIVE_PRACTICE_SIZES || [5, 7, 9]).includes(size) ? size : 5;
    }
    catch (_) { return Live.DEFAULT_SIZE; }
  })();
  const STORAGE_KEY = requestedSize === 9 ? "go-live-game-v1" : `go-live-game-v1-size-${requestedSize}`;
  const RECOVERY_KEY = requestedSize === 9 ? "go-live-game-recovery-v1" : `go-live-game-recovery-v1-size-${requestedSize}`;
  const UI_VERSION = "live-game-ui-v10";
  const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
  const boardProfiles = {
    5: { title: "5×5 基礎練習棋盤", heading: "氣、提子、連斷與規則練習", description: "作為第一個可自由操作的練習棋盤，適合練氣、提子、連接、切斷、禁著、簡單劫與基礎眼形，同時維持較低的全局負擔。", purpose: "氣、提子、連斷、禁著、眼形" },
    7: { title: "7×7 過渡練習棋盤", heading: "局部攻防與小局過渡", description: "用來把局部手筋、死活與攻防放進較完整的局面，再銜接 9×9。它仍是過渡練習盤，不作正式棋力評量。", purpose: "局部攻防、死活、過渡" },
    9: { title: "9×9 完整實戰練習", heading: "完整 9×9 實戰棋盤", description: "兩人輪流操作同一棋盤；支援 Pass、認輸、終局人工死子確認、中國式面積計分、SGF 匯入／匯出與本機續局。", purpose: "完整小棋盤對局" }
  };
  const $ = (id) => document.getElementById(id);
  let game, auditEvents = [], cursor = centerCursor(requestedSize), loadNotice = "", opponentMode = "computer", humanColor = BLACK, providerEndpoint = "http://127.0.0.1:8765/v1/move", botPending = false, practiceSessionId = newPracticeSessionId(), practiceEventFailure = "", liveEvidenceFailure = "", activeAssessment = null, activeAssessmentResponseCount = 0;

  function newPracticeSessionId() { return `live-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
  function centerCursor(size) { const middle = Math.floor(size / 2); return [middle, middle]; }
  function currentProfile() { return boardProfiles[game ? game.boardSize : requestedSize] || boardProfiles[9]; }
  function isComputerMode() { return ["computer", "katago", "remote"].includes(opponentMode); }
  function computerColor() { return humanColor === BLACK ? WHITE : BLACK; }
  function isComputerTurn() { return isComputerMode() && game && game.status === "playing" && game.toPlay === computerColor(); }
  function isHumanTurn() { return !isComputerMode() || (game && game.status === "playing" && game.toPlay === humanColor); }
  function saveOpponentSettings() {
    try { localStorage.setItem(`go-live-opponent-v1-size-${requestedSize}`, JSON.stringify({ opponentMode, humanColor, providerEndpoint })); } catch (_) {}
  }
  function loadOpponentSettings() {
    try {
      const raw = localStorage.getItem(`go-live-opponent-v1-size-${requestedSize}`);
      if (!raw) { opponentMode = "computer"; return; }
      const value = JSON.parse(raw);
      if (value && ["local", "computer", "katago", "remote"].includes(value.opponentMode)) opponentMode = value.opponentMode;
      if (value && typeof value.providerEndpoint === "string" && value.providerEndpoint) providerEndpoint = value.providerEndpoint;
      if (value && [BLACK, WHITE].includes(Number(value.humanColor))) humanColor = Number(value.humanColor);
    } catch (_) {}
  }

  function currentAssessmentId(assessment) {
    return `${practiceSessionId}:${assessment.moveCount}:${assessment.boardFingerprint}`;
  }
  function lastMoveActorForEvidence() {
    if (!game || !Array.isArray(auditEvents) || !game.moves.length) return null;
    for (let index = auditEvents.length - 1; index >= 0; index -= 1) {
      const item = auditEvents[index];
      if (!item || typeof item !== "object") continue;
      if (["undo", "sgf_import", "new_game", "recovery_after_invalid_save"].includes(item.type)) return null;
      if (item.moveCount !== game.moves.length) continue;
      if (item.type === "computer_move" || item.type === "computer_pass") return "computer";
      if (item.type === "move" || item.type === "pass") return item.actor || "human";
    }
    return null;
  }
  function appendLiveEvidence(event) {
    if (!LiveEvidence || typeof LiveEvidence.append !== "function") {
      liveEvidenceFailure = "live_evidence_module_unavailable";
      return false;
    }
    const result = LiveEvidence.append(localStorage, event);
    if (!result.ok) {
      liveEvidenceFailure = result.error || "live_evidence_unknown_error";
      return false;
    }
    return true;
  }
  function existingResponseCount(assessmentId) {
    if (!LiveEvidence || typeof LiveEvidence.read !== "function") return 0;
    const current = LiveEvidence.read(localStorage);
    if (!current.ok || !current.store || !Array.isArray(current.store.events)) return 0;
    return current.store.events.filter((item) => item.assessmentId === assessmentId && (item.type === "first_response" || item.type === "retry_response")).length;
  }
  function ensureLiveAssessment() {
    if (!isComputerMode() || !game || game.status !== "playing" || game.toPlay !== humanColor) {
      activeAssessment = null;
      activeAssessmentResponseCount = 0;
      return null;
    }
    if (!LiveEvidence || typeof LiveEvidence.assessTurn !== "function") {
      liveEvidenceFailure = "live_evidence_module_unavailable";
      return null;
    }
    const candidate = LiveEvidence.assessTurn(game, { opponentMode, humanColor, computerColor: computerColor(), lastMoveActor: lastMoveActorForEvidence() });
    const assessmentId = currentAssessmentId(candidate);
    if (activeAssessment && activeAssessment.assessmentId === assessmentId) return activeAssessment;
    activeAssessment = { ...candidate, assessmentId, sessionId: practiceSessionId };
    activeAssessmentResponseCount = existingResponseCount(assessmentId);
    const event = LiveEvidence.assessmentEvent({
      ...activeAssessment,
      eventId: `assessment:${assessmentId}`,
      occurredAt: new Date().toISOString()
    });
    appendLiveEvidence(event);
    return activeAssessment;
  }
  function recordLiveResponse(response) {
    const assessment = ensureLiveAssessment();
    if (!assessment || assessment.status !== "eligible" || assessment.qualifiedOpportunity !== true) return null;
    const firstResponse = activeAssessmentResponseCount === 0;
    activeAssessmentResponseCount += 1;
    const responseEvent = LiveEvidence.responseEvent(assessment, response, {
      firstResponse,
      eventId: `${firstResponse ? "first" : "retry"}:${assessment.assessmentId}:${activeAssessmentResponseCount}`,
      occurredAt: new Date().toISOString()
    });
    appendLiveEvidence(responseEvent);
    return responseEvent;
  }
  function closeAssessmentAfterTurn() {
    activeAssessment = null;
    activeAssessmentResponseCount = 0;
  }

  function event(type, details = {}) {
    const occurredAt = new Date().toISOString();
    const audit = {
      type, occurredAt, uiVersion: UI_VERSION,
      evaluationRole: "practice", evaluationContext: "live", formalEligible: false, evidenceUse: "practice_only",
      boardSize: game ? game.boardSize : requestedSize,
      moveCount: game ? game.moves.length : 0, ...details
    };
    auditEvents.push(audit);
    if (auditEvents.length > 1000) auditEvents = auditEvents.slice(-1000);
    if (PracticeEvents && typeof PracticeEvents.append === "function") {
      const actor = details.actor || (type.startsWith("computer_") ? "computer" : ["move", "pass", "resign", "undo", "dead_group_toggle", "score_confirmed", "resume_after_scoring_dispute"].includes(type) ? (isComputerMode() ? "human" : "local_player") : "system");
      const result = PracticeEvents.append(localStorage, {
        eventId: `${practiceSessionId}-${auditEvents.length}-${occurredAt}`,
        sessionId: practiceSessionId,
        type,
        occurredAt,
        boardSize: audit.boardSize,
        opponentMode,
        humanColor: isComputerMode() ? humanColor : null,
        actor,
        moveCount: audit.moveCount,
        point: details.point || null,
        captured: Number.isInteger(details.captured) ? details.captured : null,
        actionColor: details.color || details.loser || null,
        botVersion: details.botVersion || null,
        selectionReason: details.selectionReason || null,
        reason: details.reason || null,
        gameStatus: game ? game.status : null
      });
      if (!result.ok) practiceEventFailure = result.error || "practice_event_unknown_error";
    }
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
    if (!raw) { game = Live.createGame({ boardSize: requestedSize }); event("new_game", { reason: "first_open" }); return; }
    try {
      const payload = JSON.parse(raw);
      if (!payload || payload.schemaVersion !== 1 || !payload.game) throw new Error("envelope_invalid");
      game = Live.hydrate(payload.game);
      if (game.boardSize !== requestedSize) throw new Error("saved_board_size_mismatch");
      if (typeof payload.practiceSessionId === "string" && payload.practiceSessionId) practiceSessionId = payload.practiceSessionId;
      auditEvents = Array.isArray(payload.auditEvents) ? payload.auditEvents.filter((entry) => entry && typeof entry === "object") : [];
      if (["local", "computer", "katago", "remote"].includes(payload.opponentMode)) opponentMode = payload.opponentMode;
      if (typeof payload.providerEndpoint === "string" && payload.providerEndpoint) providerEndpoint = payload.providerEndpoint;
      if ([BLACK, WHITE].includes(Number(payload.humanColor))) humanColor = Number(payload.humanColor);
      loadNotice = game.status === "playing" ? `已從這台電腦續接上次未完成的 ${game.boardSize}×${game.boardSize} 棋局。` : `已載入這台電腦保存的 ${game.boardSize}×${game.boardSize} 棋局。`;
      event("session_loaded", { status: game.status });
    } catch (error) {
      preserveBrokenSave(raw, error && error.message || "unknown_error");
      game = Live.createGame({ boardSize: requestedSize }); auditEvents = []; event("new_game", { reason: "recovery_after_invalid_save" });
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, uiVersion: UI_VERSION, savedAt: new Date().toISOString(), game, auditEvents, opponentMode, humanColor, providerEndpoint, practiceSessionId }));
      $("save-state").textContent = "已保存於這台電腦";
      return true;
    } catch (_) {
      $("save-state").textContent = "未能保存";
      showFeedback("無法寫入瀏覽器儲存空間；離開前請先匯出 SGF。", "error");
      return false;
    }
  }
  function coordName(x, y) { return `${columns[x]}${game.boardSize - y}`; }
  function colorLabel(color) { return color === BLACK ? "黑" : "白"; }
  function lastPlayedMove() { return [...game.moves].reverse().find((move) => move.type === "play") || null; }
  function pointAria(x, y) {
    const stone = game.board[y][x], state = stone === BLACK ? "黑棋" : stone === WHITE ? "白棋" : "空點";
    if (game.status === "playing") return `${coordName(x, y)}，${state}${stone === EMPTY ? "，可落子" : ""}`;
    if (game.status === "scoring") return `${coordName(x, y)}，${state}${stone === EMPTY ? "" : "，可切換死子標記"}`;
    return `${coordName(x, y)}，${state}`;
  }
  function starPoints(size) {
    if (size === 9) return [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]];
    const middle = Math.floor(size / 2);
    return [[middle, middle]];
  }
  function renderBoard() {
    const size = game.boardSize, offset = 60, end = 460, pitch = (end - offset) / (size - 1);
    const stoneRadius = Math.max(18, Math.min(25, pitch * 0.38));
    const hitRadius = stoneRadius + 7;
    const dead = new Set(game.deadStones || []), last = lastPlayedMove();
    const parts = [`<svg viewBox="0 0 520 520" role="group" aria-label="${size} 路棋盤；${game.status === "playing" ? `輪到${colorLabel(game.toPlay)}棋` : game.status === "scoring" ? "終局死子確認" : "棋局已結束"}">`];
    for (let i = 0; i < size; i += 1) {
      const p = offset + i * pitch;
      parts.push(`<line class="grid-line" x1="${offset}" y1="${p}" x2="${end}" y2="${p}"/>`);
      parts.push(`<line class="grid-line" x1="${p}" y1="${offset}" x2="${p}" y2="${end}"/>`);
      parts.push(`<text class="coord" x="${p}" y="30">${columns[i]}</text><text class="coord" x="28" y="${p}">${size - i}</text>`);
    }
    for (const [x, y] of starPoints(size)) parts.push(`<circle class="star" cx="${offset + x * pitch}" cy="${offset + y * pitch}" r="4"/>`);
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = offset + x * pitch, cy = offset + y * pitch, stone = game.board[y][x], isDead = dead.has(`${x},${y}`);
      const current = cursor[0] === x && cursor[1] === y;
      parts.push(`<g class="live-point" data-x="${x}" data-y="${y}" role="button" tabindex="${current ? 0 : -1}" aria-label="${pointAria(x, y)}"><circle class="point-hit" cx="${cx}" cy="${cy}" r="${hitRadius}"/><circle class="point-focus" cx="${cx}" cy="${cy}" r="${hitRadius - 1}"/>`);
      if (stone === BLACK) parts.push(`<circle class="stone-black${isDead ? " dead-stone" : ""}" cx="${cx}" cy="${cy}" r="${stoneRadius}"/>`);
      if (stone === WHITE) parts.push(`<circle class="stone-white${isDead ? " dead-stone" : ""}" cx="${cx}" cy="${cy}" r="${stoneRadius}"/>`);
      if (last && last.point && last.point[0] === x && last.point[1] === y) parts.push(`<circle class="last-move" cx="${cx}" cy="${cy}" r="${Math.max(7, stoneRadius * 0.42)}"/>`);
      if (isDead && stone !== EMPTY) parts.push(`<line class="dead-cross" x1="${cx - stoneRadius * 0.45}" y1="${cy - stoneRadius * 0.45}" x2="${cx + stoneRadius * 0.45}" y2="${cy + stoneRadius * 0.45}"/><line class="dead-cross" x1="${cx + stoneRadius * 0.45}" y1="${cy - stoneRadius * 0.45}" x2="${cx - stoneRadius * 0.45}" y2="${cy + stoneRadius * 0.45}"/>`);
      parts.push("</g>");
    }
    parts.push("</svg>");
    $("live-board").innerHTML = parts.join("");
    $("live-board").setAttribute("aria-label", `${size} 路${size === 9 ? "實戰" : "微型練習"}棋盤`);
    $("live-board").setAttribute("aria-disabled", game.status === "finished" ? "true" : "false");
  }
  function scoreLineHtml(score) {
    if (!score) return "";
    const winner = score.winner === null ? "目前同分" : `目前${colorLabel(score.winner)}領先 ${score.difference} 目`;
    const komiText = score.komi ? ` ＋ 貼目 ${score.komi}` : "";
    return `<div><strong>黑</strong>：棋子 ${score.blackStones} ＋ 地 ${score.blackTerritory} ＝ ${score.blackTotal}</div><div><strong>白</strong>：棋子 ${score.whiteStones} ＋ 地 ${score.whiteTerritory}${komiText} ＝ ${score.whiteTotal}</div><div><strong>中立空點</strong>：${score.neutral}</div><div><strong>${winner}</strong></div>`;
  }
  function moveLabel(move) {
    const prefix = `${move.number}. ${colorLabel(move.color)}`;
    return move.type === "pass" ? `${prefix} Pass` : `${prefix} ${coordName(move.point[0], move.point[1])}${move.captured && move.captured.length ? ` · 提 ${move.captured.length}` : ""}`;
  }
  function renderChrome() {
    const size = game.boardSize, profile = currentProfile();
    document.title = `VT-COS｜${profile.title}`;
    $("live-brand-mode").textContent = `VT-COS · ${size}×${size} 棋盤練習`;
    $("live-title").textContent = profile.title;
    $("live-description").textContent = profile.description;
    $("board-size-label").textContent = `${size} × ${size}`;
    $("board-heading").textContent = profile.heading;
    $("practice-purpose").textContent = profile.purpose;
    $("rules-summary").textContent = size === 9 ? `中國式面積 · 貼 ${game.komi} · 簡單劫` : `微型練習盤 · ${game.komi ? `貼 ${game.komi}` : "無貼目"} · 簡單劫`;
    $("import-label").textContent = `匯入 ${size} 路 SGF`;
    $("opponent-mode").value = opponentMode === "local" ? "local" : "computer";
    $("advanced-provider-mode").value = isComputerMode() ? opponentMode : "computer";
    $("human-color").value = String(humanColor);
    $("human-color-field").hidden = !isComputerMode();
    $("provider-endpoint-field").hidden = !["katago", "remote"].includes(opponentMode);
    $("provider-test-row").hidden = !["katago", "remote"].includes(opponentMode);
    $("katago-help").hidden = opponentMode !== "katago";
    $("remote-help").hidden = opponentMode !== "remote";
    $("provider-endpoint").value = providerEndpoint;
    $("provider-endpoint").placeholder = opponentMode === "katago" ? "http://127.0.0.1:8765/v1/move" : "https://your-katago-service.example/v1/move";
    $("opponent-summary").textContent = isComputerMode() ? "練習電腦" : "雙人同機";
    $("opponent-detail").textContent = opponentMode === "katago" ? `進階 · KataGo · 你執${colorLabel(humanColor)}` : opponentMode === "remote" ? `進階 · 自訂 API · 你執${colorLabel(humanColor)}` : isComputerMode() ? `內建對手 · 你執${colorLabel(humanColor)}` : "兩人輪流操作這台裝置";
    $("footer-boundary").textContent = size === 9
      ? "9×9 提供目前已支援的完整小棋盤對局流程；使用 simple ko，不宣稱涵蓋各棋規的 superko、終局爭議或裁判規則。"
      : `${size}×${size} 定位為規則與局部技能的微型練習盤；雖可走完整 Pass／計分流程，但不把其勝負當正式棋力、T3 或完整對局能力證據。`;
    for (const link of document.querySelectorAll("[data-board-size-choice]")) {
      const active = Number(link.dataset.boardSizeChoice) === size;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    }
  }
  function render() {
    renderChrome();
    renderBoard();
    $("move-count").textContent = String(game.moves.length);
    $("capture-count").textContent = `黑 ${game.captures.black} · 白 ${game.captures.white}`;
    $("turn-status").textContent = game.status === "playing" ? (isComputerTurn() ? `電腦（${colorLabel(game.toPlay)}）思考中` : `${colorLabel(game.toPlay)}棋落子`) : game.status === "scoring" ? "終局確認" : Live.resultText(game);
    const playerLocked = botPending || isComputerTurn();
    $("live-board").classList.toggle("computer-turn", playerLocked);
    $("pass-button").disabled = game.status !== "playing" || playerLocked; $("resign-button").disabled = game.status !== "playing" || playerLocked;
    $("undo-button").disabled = game.status === "finished" || !game.moves.length;
    $("scoring-panel").hidden = game.status !== "scoring"; $("result-panel").hidden = game.status !== "finished";
    $("score-lines").innerHTML = game.status === "scoring" ? scoreLineHtml(Live.currentScore(game)) : "";
    $("result-text").textContent = game.status === "finished" ? Live.resultText(game) : "";
    $("board-help").textContent = game.status === "playing" ? (isComputerTurn() ? "電腦正在選擇合法練習手；完成後會自動輪到你。" : `輪到${colorLabel(game.toPlay)}棋。點空點落子；方向鍵移動，Enter／Space 落子。`) : game.status === "scoring" ? "兩次 Pass 後進入終局確認。點棋串切換死子標記；系統不自動判死活。" : game.boardSize === 9 ? "棋局已結束。可匯出 SGF 回課程做局部複盤，或開始新局。" : "棋局已結束。可匯出 SGF 保存，或開始同尺寸新局。";
    const recentMoves = game.moves.slice(-30);
    $("move-log").innerHTML = recentMoves.length ? recentMoves.map((move) => `<li class="${move.type === "pass" ? "pass" : ""}">${moveLabel(move)}</li>`).join("") : "<li>尚未落子。</li>";
  }
  async function requestComputerAction() {
    if (opponentMode === "computer") {
      if (!Bot || typeof Bot.chooseAction !== "function") throw new Error("heuristic_provider_unavailable");
      return Bot.chooseAction(game);
    }
    if (!MoveProvider || typeof MoveProvider.requestAction !== "function") throw new Error("move_provider_module_unavailable");
    return MoveProvider.requestAction(game, { kind: opponentMode, endpoint: providerEndpoint, timeoutMs: 20000 });
  }
  function runComputerTurn() {
    if (!isComputerTurn() || botPending) return;
    botPending = true; render();
    setTimeout(async () => {
      try {
        const action = await requestComputerAction();
        const color = game.toPlay;
        const providerVersion = action.providerVersion || action.botVersion || (opponentMode === "computer" && Bot ? Bot.BOT_VERSION : "unknown");
        if (action.type === "play" && Array.isArray(action.point)) {
          const result = Live.play(game, action.point[0], action.point[1]);
          if (!result.ok) throw new Error("provider_illegal_move:" + (result.error || "unknown"));
          game = result.game; closeAssessmentAfterTurn();
          event("computer_move", { actor: "computer", color, point: action.point.slice(), captured: result.captured.length, botVersion: providerVersion, selectionReason: opponentMode, model: action.model || null });
          showFeedback(`${opponentMode === "katago" ? "KataGo" : opponentMode === "remote" ? "API 對手" : "電腦"}${colorLabel(color)}棋下在 ${coordName(action.point[0], action.point[1])}。`, "success");
        } else if (action.type === "pass") {
          const result = Live.pass(game); if (!result.ok) throw new Error(result.error || "provider_pass_failed");
          game = result.game; closeAssessmentAfterTurn();
          event("computer_pass", { actor: "computer", color, botVersion: providerVersion, selectionReason: opponentMode, model: action.model || null });
          showFeedback(result.game.status === "scoring" ? "對手 Pass；雙方已連續 Pass，請確認終局。" : "對手 Pass。", "success");
        } else if (action.type === "resign") {
          const result = Live.resign(game); if (!result.ok) throw new Error(result.error || "provider_resign_failed");
          game = result.game; closeAssessmentAfterTurn();
          event("computer_resign", { actor: "computer", loser: color, botVersion: providerVersion, selectionReason: opponentMode, model: action.model || null });
          showFeedback("對手認輸，棋局結束。", "success");
        } else throw new Error("provider_action_invalid");
        save(); ensureLiveAssessment();
      } catch (error) {
        event("computer_provider_error", { actor: "computer", providerKind: opponentMode, reason: error.message || "unknown" });
        showFeedback(`對手 provider 失敗：${error.message}。本回合已停止，不會 fallback 成猜測落子。`, "error");
      } finally { botPending = false; render(); }
    }, 180);
  }
  function scheduleComputerTurn() {
    if (isComputerTurn()) setTimeout(runComputerTurn, 0);
  }
  function startNewGame(reason) {
    game = Live.createGame({ boardSize: requestedSize });
    auditEvents = [];
    cursor = centerCursor(requestedSize);
    practiceSessionId = newPracticeSessionId();
    closeAssessmentAfterTurn();
    event("new_game", { actor: "system", reason, opponentMode, humanColor: isComputerMode() ? humanColor : null, botVersion: isComputerMode() && Bot ? Bot.BOT_VERSION : null });
    saveOpponentSettings();
    save();
    render();
    showFeedback(`已開始新的 ${requestedSize}×${requestedSize} ${isComputerMode() ? "人機練習" : "棋局"}。`, "success");
    ensureLiveAssessment();
    scheduleComputerTurn();
  }

  function applyResult(result, auditType, details = {}) {
    if (!result.ok) { showFeedback(result.error || "操作失敗。", "error"); return false; }
    game = result.game; event(auditType, details); const saved = save(); render();
    if (liveEvidenceFailure) {
    showFeedback(`棋局可以繼續，但 live evidence 儲存失敗（${liveEvidenceFailure}）；本次不會假裝已更新實戰進度。`, "error");
    liveEvidenceFailure = "";
  } else if (practiceEventFailure) {
      showFeedback(`${details.successMessage || "操作完成。"} 但練習事件未保存（${practiceEventFailure}）；本次不會假裝已回流學習紀錄。`, "error");
      practiceEventFailure = "";
    } else if (saved) showFeedback(details.successMessage || "已保存。", details.tone || "success");
    return true;
  }
  function actAt(x, y, refocus = false) {
    cursor = [x, y];
    if (game.status === "playing") {
      if (!isHumanTurn() || botPending) { showFeedback("現在是電腦回合。", "error"); return; }
      ensureLiveAssessment();
      if (game.board[y][x] !== EMPTY) {
        recordLiveResponse({ action: "play", point: [x, y], legal: false, reason: "occupied_point" });
        showFeedback(`${coordName(x, y)} 已有棋子。`, "error");
        return;
      }
      const color = game.toPlay, result = Live.play(game, x, y);
      recordLiveResponse({ action: "play", point: [x, y], legal: result.ok === true, reason: result.ok ? null : result.error || "illegal_move" });
      if (applyResult(result, "move", { actor: isComputerMode() ? "human" : "local_player", color, point: [x, y], captured: result.ok ? result.captured.length : 0, successMessage: `${colorLabel(color)}棋下在 ${coordName(x, y)}。` })) {
        closeAssessmentAfterTurn();
        if (refocus) setTimeout(focusCursor, 0);
        scheduleComputerTurn();
      }
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
    const max = game.boardSize - 1;
    cursor = [Math.max(0, Math.min(max, x + delta[0])), Math.max(0, Math.min(max, y + delta[1]))];
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
    return `${game.boardSize}x${game.boardSize}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.sgf`;
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
    if (!isHumanTurn() || botPending) return;
    ensureLiveAssessment();
    const color = game.toPlay, result = Live.pass(game);
    recordLiveResponse({ action: "pass", point: null, legal: result.ok === true, reason: result.ok ? null : result.error || "pass_failed" });
    if (applyResult(result, "pass", { actor: isComputerMode() ? "human" : "local_player", color, successMessage: result.ok && result.game.status === "scoring" ? "雙方連續 Pass，請確認死子與終局分數。" : `${colorLabel(color)}棋 Pass。` })) { closeAssessmentAfterTurn(); scheduleComputerTurn(); }
  });
  $("undo-button").addEventListener("click", () => {
    if (botPending) return;
    let first = Live.undo(game);
    if (!first.ok) { applyResult(first, "undo", {}); return; }
    game = first.game;
    let undone = 1;
    if (isComputerMode() && game.moves.length && game.toPlay === computerColor()) {
      const second = Live.undo(game);
      if (second.ok) { game = second.game; undone += 1; }
    }
    closeAssessmentAfterTurn();
    event("undo", { actor: isComputerMode() ? "human" : "local_player", movesUndone: undone, opponentMode });
    save(); render(); ensureLiveAssessment(); showFeedback(isComputerMode() ? "已回到你上一個決策前。" : "已悔一手；棋局依剩餘手順重新重建。", "success");
  });
  $("resign-button").addEventListener("click", () => {
    if (!confirm(`${colorLabel(game.toPlay)}棋確定認輸？`)) return;
    ensureLiveAssessment();
    const loser = game.toPlay, result = Live.resign(game);
    recordLiveResponse({ action: "resign", point: null, legal: result.ok === true, reason: result.ok ? null : result.error || "resign_failed" });
    if (applyResult(result, "resign", { actor: isComputerMode() ? "human" : "local_player", loser, successMessage: `${colorLabel(loser)}棋認輸，棋局結束。` })) closeAssessmentAfterTurn();
  });
  $("resume-play-button").addEventListener("click", () => {
    const result = Live.resumeFromScoring(game);
    if (applyResult(result, "resume_after_scoring_dispute", { successMessage: result.ok ? `恢復下棋，輪到${colorLabel(result.game.toPlay)}棋。` : "" })) scheduleComputerTurn();
  });
  $("confirm-score-button").addEventListener("click", () => {
    const preview = Live.currentScore(game);
    const previewText = preview && preview.winner ? `${colorLabel(preview.winner)}棋領先 ${preview.difference} 目` : "目前同分";
    if (!confirm(`確認目前死子標記與分數？
${previewText}
確認後這局將標示為結束。`)) return;
    applyResult(Live.finalizeScore(game), "score_confirmed", { deadStones: [...(game.deadStones || [])], successMessage: "終局結果已確認並保存。" });
  });
  $("new-game-button").addEventListener("click", () => {
    if (game.moves.length && !confirm("開始新局會取代目前這個尺寸的本機續局狀態。若要保留這盤，請先匯出 SGF。確定開始新局？")) return;
    startNewGame("user_started");
  });
  $("opponent-mode").addEventListener("change", (event) => {
    const nextMode = event.target.value === "local" ? "local" : "computer";
    if (nextMode === opponentMode || (nextMode === "computer" && isComputerMode())) {
      if (nextMode === "computer" && opponentMode !== "computer") opponentMode = "computer";
      saveOpponentSettings(); render(); scheduleComputerTurn(); return;
    }
    opponentMode = nextMode;
    if (opponentMode === "computer") $("advanced-provider-mode").value = "computer";
    saveOpponentSettings();
    event("opponent_mode_change", { actor: "system", opponentMode });
    save(); render(); scheduleComputerTurn();
  });
  $("advanced-provider-mode").addEventListener("change", (event) => {
    opponentMode = ["computer", "katago", "remote"].includes(event.target.value) ? event.target.value : "computer";
    $("opponent-mode").value = "computer";
    saveOpponentSettings();
    event("opponent_provider_change", { actor: "system", opponentMode });
    save(); render(); scheduleComputerTurn();
  });
  $("test-provider-button").addEventListener("click", async () => {
    const status = $("provider-status");
    providerEndpoint = String($("provider-endpoint").value || "").trim();
    saveOpponentSettings();
    status.textContent = "測試中…";
    try {
      if (!MoveProvider || typeof MoveProvider.requestAction !== "function") throw new Error("move_provider_module_unavailable");
      const action = await MoveProvider.requestAction(game, { kind: opponentMode, endpoint: providerEndpoint, timeoutMs: 8000 });
      status.textContent = `連線成功 · 回傳 ${action.type}`;
      status.className = "success";
    } catch (error) {
      const hint = opponentMode === "katago" ? "；本機 KataGo 需要先啟動 localhost bridge" : "；遠端模式需要可由此網頁存取的 HTTPS API";
      status.textContent = `連線失敗 · ${error.message || "unknown"}${hint}`;
      status.className = "error";
    }
  });
  $("provider-endpoint").addEventListener("change", (event) => {
    providerEndpoint = String(event.target.value || "").trim(); saveOpponentSettings(); save();
    showFeedback("Provider API 位址已保存；下一個電腦回合會使用此端點。", "success");
  });
  $("human-color").addEventListener("change", (event) => {
    const nextColor = Number(event.target.value) === WHITE ? WHITE : BLACK;
    if (game.moves.length && !confirm("更換執棋顏色需要開始同尺寸新局。若要保留這盤，請先匯出 SGF。確定更換？")) { event.target.value = String(humanColor); return; }
    humanColor = nextColor;
    opponentMode = "computer";
    startNewGame("human_color_changed");
  });
  $("export-sgf-button").addEventListener("click", () => {
    try {
      download(Live.toSgf(game), timestampFilename()); event("sgf_export", { status: game.status }); save();
      showFeedback("SGF 已建立；可用 KaTrain／其他棋譜工具開啟。9×9 棋譜也可回課程匯入做局部複盤。", "success");
    } catch (error) { showFeedback(error.message, "error"); }
  });
  $("import-sgf-input").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > Sgf.MAX_SGF_FILE_BYTES) { showFeedback(`SGF 無法匯入：檔案過大（上限 ${Sgf.MAX_SGF_FILE_BYTES} bytes）。`, "error"); e.target.value = ""; return; }
    if (game.moves.length && !confirm("匯入棋譜會取代目前這個尺寸的本機續局狀態。若要保留這盤，請先匯出 SGF。確定匯入？")) { e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = Live.fromSgf(String(reader.result || ""));
        if (imported.boardSize !== requestedSize) throw new Error(`這是 ${imported.boardSize}×${imported.boardSize} 棋譜；請先切換到相同尺寸的練習棋盤再匯入。`);
        game = imported; auditEvents = []; closeAssessmentAfterTurn();
        event("sgf_import", { sourceName: file.name, importedStatus: game.status }); cursor = centerCursor(game.boardSize);
        save(); render(); ensureLiveAssessment(); showFeedback(`已匯入 ${file.name}${game.status === "playing" ? "，可繼續下棋" : ""}。`, "success"); scheduleComputerTurn();
      } catch (error) { showFeedback(error.message, "error"); }
      e.target.value = "";
    };
    reader.onerror = () => { showFeedback("無法讀取這個 SGF 檔案。", "error"); e.target.value = ""; };
    reader.readAsText(file, "UTF-8");
  });

  loadOpponentSettings(); load(); save(); render(); ensureLiveAssessment(); scheduleComputerTurn();
  if (practiceEventFailure) {
    showFeedback(`棋局可以繼續，但練習事件流目前失敗（${practiceEventFailure}）；本次不會假裝已回流學習紀錄。`, "error");
    practiceEventFailure = "";
  } else if (retiredThreeByThreeRequested) showFeedback("3×3 已退出學習者練習階段；已改開 5×5 基礎練習棋盤。舊 3×3 紀錄仍保留，不會被覆寫。", "success");
  else if (loadNotice) showFeedback(loadNotice, loadNotice.includes("損壞") || loadNotice.includes("無法") ? "error" : "success");
})();