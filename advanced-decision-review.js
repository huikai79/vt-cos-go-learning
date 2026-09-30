(function () {
  "use strict";

  const Go = window.GoCore;
  const Sgf = window.GoSgf;
  const Events = window.GoAdvancedDecisionReviewEvents;
  const ReviewTools = window.GoAdvancedDecisionReviewTools;
  const ReviewPackage = window.GoAdvancedDecisionReviewPackage;
  const Comparison = window.GoDecisionComparison;
  const ComparisonProvider = window.GoDecisionComparisonProvider;
  const ComparisonEvents = window.GoAdvancedDecisionComparisonEvents;
  const Replay = window.GoAdvancedDecisionReplay;
  if (!Go || !Sgf || !Events || !ReviewTools || !ReviewPackage) return;

  const $ = (id) => document.getElementById(id);
  const sessionId = "sgf-review-session-" + Date.now().toString(36);
  let counter = 0;
  let sgfText = "";
  let sourceName = "";
  let game = null;
  let exp = null;
  let answers = 0;
  let revealed = false;
  let firstPoint = null;
  let firstLegal = null;
  let comparisonPosition = null;
  let reviewPerspective = "neutral";
  let factualEvents = [];
  let activeFactualEvent = null;

  function uid(prefix) {
    counter += 1;
    return prefix + "-" + Date.now().toString(36) + "-" + counter;
  }
  function now() { return new Date().toISOString(); }

  function downloadText(filename, text, type = "application/json") {
    const blob = new Blob([text], { type: type + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function perspectiveMoveLabel(move) {
    const actor = ReviewTools.actorLabel(move.color, reviewPerspective);
    return "第 " + move.number + " 手 · " + actor;
  }

  function refreshMoveOptions(preferredMoveNumber = null) {
    const select = $("decision-review-move");
    if (!game) {
      select.innerHTML = '<option value="">先匯入棋譜</option>';
      select.disabled = true;
      return;
    }
    const moves = ReviewTools.movesForPerspective(game, reviewPerspective);
    select.innerHTML = '<option value="">選擇一手</option>' + moves.map((move) =>
      '<option value="' + move.number + '">' + perspectiveMoveLabel(move) + "</option>"
    ).join("");
    select.disabled = false;
    if (Number.isInteger(preferredMoveNumber) && moves.some((move) => move.number === preferredMoveNumber)) {
      select.value = String(preferredMoveNumber);
    }
  }

  function renderFactualEvents() {
    const box = $("decision-review-events");
    const lookback = $("decision-review-lookback");
    activeFactualEvent = null;
    lookback.hidden = true;
    if (!game) {
      box.textContent = "匯入棋譜後顯示。";
      return;
    }
    factualEvents = ReviewTools.buildFactualEvents(game);
    const navigation = ReviewTools.selectNavigationEvents(factualEvents, 8);
    if (!navigation.length) {
      box.textContent = "這盤棋目前沒有偵測到可列出的提子或重複佔點事件；仍可直接按手數複盤。";
      return;
    }
    box.innerHTML = navigation.map((event, index) =>
      '<button class="decision-review-event-item" type="button" data-review-event-index="' + index + '">' +
      ReviewTools.describeEvent(event, reviewPerspective, game.boardSize) +
      "</button>"
    ).join("");
    box._navigationEvents = navigation;
  }

  function resetReviewWorkspace(message) {
    exp = null;
    answers = 0;
    revealed = false;
    firstPoint = null;
    firstLegal = null;
    comparisonPosition = null;
    $("decision-review-reveal").disabled = true;
    $("decision-review-reflection").disabled = true;
    $("decision-review-save-reflection").disabled = true;
    $("decision-replay-queue").disabled = true;
    $("decision-comparison-result").textContent = "";
    $("decision-comparison-panel").open = false;
    $("decision-review-board").innerHTML = "";
    $("decision-review-meta").textContent = "原棋譜著手在你提出第一候選前保持隱藏。";
    $("decision-review-feedback").textContent = message || "選一手，在看原棋譜著手之前先提出自己的候選。";
  }

  function loadReviewSource(text, name, options = {}) {
    const parsed = Sgf.parseDecisionReviewSgf(text);
    sgfText = text;
    sourceName = name || "匯入的 19 路棋譜";
    game = parsed;
    reviewPerspective = ReviewTools.normalizePerspective(options.perspective);
    $("decision-review-perspective").disabled = false;
    $("decision-review-perspective").value = reviewPerspective;
    $("decision-review-package-export").disabled = false;
    refreshMoveOptions(options.selectedMoveNumber);
    renderFactualEvents();
    $("decision-review-source").textContent = sourceName + " · " + game.moves.length + " 個可回看的落子點";
    resetReviewWorkspace("已匯入。選一手，在看原棋譜著手之前先提出自己的候選。");
    if (Number.isInteger(options.selectedMoveNumber) &&
        ReviewTools.movesForPerspective(game, reviewPerspective).some((move) => move.number === options.selectedMoveNumber)) {
      $("decision-review-move").value = String(options.selectedMoveNumber);
      selectMove();
    }
  }

  function reviewCommon() {
    return {
      eventId: "",
      sessionId,
      reviewId: exp.id,
      experienceId: exp.id,
      experienceVersion: exp.version,
      sourceId: exp.source.sourceId,
      sourcePositionVersion: exp.sourcePositionVersion,
      positionFingerprint: exp.source.positionFingerprint,
      candidateSetVersion: exp.candidateSetVersion,
      scoringContractVersion: exp.scoringContractVersion,
      evidenceTaxonomyVersion: exp.evidenceTaxonomyVersion,
      rulesContractVersion: exp.rulesContractVersion,
      boardSize: 19,
      occurredAt: now()
    };
  }

  function record(type, extra = {}) {
    const base = reviewCommon();
    base.eventId = uid(type);
    const result = Events.append(localStorage, { ...base, type, ...extra });
    if (!result.ok) $("decision-review-feedback").textContent = "複盤紀錄無法保存；這次操作不會被當成已保存。";
    return result;
  }

  function comparisonCommon(requestId) {
    return {
      eventId: uid("comparison"),
      sessionId,
      reviewId: exp.id,
      requestId,
      sourceId: exp.source.sourceId,
      positionFingerprint: exp.source.positionFingerprint,
      comparisonContractVersion: Comparison.COMPARISON_CONTRACT_VERSION,
      providerContractVersion: Comparison.REQUEST_VERSION,
      occurredAt: now()
    };
  }

  function recordComparison(type, requestId, extra = {}) {
    if (!ComparisonEvents) return { ok: false, error: "comparison_event_module_unavailable" };
    return ComparisonEvents.append(localStorage, { ...comparisonCommon(requestId), type, ...extra });
  }

  function stonesMap() {
    return new Map(exp.stones.map(([x, y, color]) => [x + "," + y, color]));
  }

  function renderBoard(candidate = null, original = null) {
    const size = 19, width = 570, pad = 22, pitch = (width - pad * 2) / (size - 1);
    const stoneMap = stonesMap();
    const parts = ['<svg viewBox="0 0 ' + width + ' ' + width + '" role="img" aria-label="19 路決策點盤面">', '<rect class="decision-bg" width="' + width + '" height="' + width + '" rx="10"/>'];
    for (let i = 0; i < size; i += 1) {
      const q = pad + i * pitch;
      parts.push('<line class="decision-grid" x1="' + pad + '" y1="' + q + '" x2="' + (width - pad) + '" y2="' + q + '"/>');
      parts.push('<line class="decision-grid" x1="' + q + '" y1="' + pad + '" x2="' + q + '" y2="' + (width - pad) + '"/>');
    }
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = pad + x * pitch, cy = pad + y * pitch, key = x + "," + y, color = stoneMap.get(key);
      if (color) parts.push('<circle class="' + (color === 1 ? "decision-black" : "decision-white") + '" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(7, pitch * .38) + '"/>');
      else if (!revealed) parts.push('<circle class="decision-hit" data-review-x="' + x + '" data-review-y="' + y + '" cx="' + cx + '" cy="' + cy + '" r="' + Math.max(7, pitch * .42) + '"/>');
      if (candidate && candidate[0] === x && candidate[1] === y) parts.push('<circle class="decision-candidate" cx="' + cx + '" cy="' + cy + '" r="9"/>');
      if (original && original[0] === x && original[1] === y) parts.push('<rect class="decision-original" x="' + (cx - 9) + '" y="' + (cy - 9) + '" width="18" height="18" rx="2"/>');
    }
    parts.push("</svg>");
    $("decision-review-board").innerHTML = parts.join("");
  }

  function samePoint(a, b) {
    return Boolean(a && b && a[0] === b[0] && a[1] === b[1]);
  }

  function setupComparisonInputs() {
    if (!Comparison || !sgfText || !exp) return;
    try {
      comparisonPosition = Comparison.extractAnalysisPosition(sgfText, exp.source.moveNumber);
      if (comparisonPosition.rules) $("decision-comparison-rules").value = comparisonPosition.rules;
      else $("decision-comparison-rules").value = "";
      $("decision-comparison-komi").value = comparisonPosition.komi === null ? "" : String(comparisonPosition.komi);
      if (!comparisonPosition.historySupported) {
        $("decision-comparison-setup").textContent = "這份棋譜含目前分析介面不支援的中途佈子；可以繼續人工複盤，但不能送出 KataGo 比較。";
      } else if (comparisonPosition.ready) {
        $("decision-comparison-setup").textContent = "已從棋譜讀到規則與貼目；分析時會沿用原局手順。";
      } else {
        $("decision-comparison-setup").textContent = "棋譜沒有留下可直接使用的規則或貼目；若要分析，請先補上這兩項。";
      }
    } catch (_) {
      comparisonPosition = null;
      $("decision-comparison-setup").textContent = "目前無法建立這個局面的分析資料；人工複盤仍可繼續。";
    }
    updateComparisonButton();
  }

  function updateComparisonButton() {
    const button = $("decision-comparison-run");
    if (!button) return;
    const rules = $("decision-comparison-rules").value;
    const komi = Comparison ? Comparison.parseKomi($("decision-comparison-komi").value) : null;
    const canCompare = Boolean(
      revealed && firstPoint && firstLegal === true && exp &&
      !samePoint(firstPoint, exp.originalMove) &&
      comparisonPosition && comparisonPosition.historySupported &&
      rules && komi !== null
    );
    button.disabled = !canCompare;
  }

  function selectMove() {
    const moveNumber = Number($("decision-review-move").value);
    if (!moveNumber) return;
    exp = Sgf.makeDecisionReviewExperience(sgfText, moveNumber, sourceName);
    answers = 0;
    revealed = false;
    firstPoint = null;
    firstLegal = null;
    comparisonPosition = null;
    $("decision-review-reveal").disabled = true;
    $("decision-review-reflection").disabled = true;
    $("decision-review-save-reflection").disabled = true;
    $("decision-replay-queue").disabled = true;
    $("decision-replay-queue").textContent = "加入稍後重做";
    $("decision-comparison-result").textContent = "";
    $("decision-comparison-panel").open = false;
    $("decision-review-feedback").textContent = "先在全盤提出你的第一候選；原棋譜著手現在還看不到。";
    $("decision-review-meta").textContent = "第 " + moveNumber + " 手 · " + ReviewTools.actorLabel(exp.playerColor, reviewPerspective) + "下 · 原棋譜著手尚未顯示";
    renderBoard();
    setupComparisonInputs();
    record("review_presented", {
      originalMove: null,
      matchesOriginal: null,
      originalExposed: false,
      positionStones: exp.stones,
      moveNumber,
      nodeIndex: exp.source.nodeIndex
    });
  }

  function comparisonErrorMessage(code) {
    const messages = {
      comparison_rules_required: "請先選擇這盤棋採用的規則。",
      comparison_komi_required: "請先填入這盤棋的貼目。",
      comparison_endpoint_missing: "請填入分析服務網址。",
      comparison_endpoint_invalid: "分析服務網址格式不正確。",
      comparison_network_error: "目前連不上分析服務。你的複盤紀錄仍然保留。",
      comparison_timeout: "分析服務這次沒有在時間內回應。可以稍後再試，不影響原本複盤。",
      katago_bridge_not_configured: "分析服務尚未設定 KataGo、設定檔或模型。",
      comparison_candidate_missing_from_engine: "KataGo 沒有回傳完整的兩手比較；這次結果不會被當成成功。"
    };
    if (messages[code]) return messages[code];
    if (/^comparison_http_/.test(code)) return "分析服務目前無法完成請求。你的複盤紀錄仍然保留。";
    return "這次無法完成 KataGo 比較；不會用推測結果代替。";
  }

  function comparisonResultText(result) {
    const learner = result.candidates.find((item) => item.role === "learner_first");
    const original = result.candidates.find((item) => item.role === "original_game");
    if (!learner || !original) return "這次分析缺少完整候選資料。";
    const preferred = learner.order < original.order ? "你的第一候選" : original.order < learner.order ? "原棋譜著手" : "兩手";
    const pv = learner.order <= original.order ? learner.pv : original.pv;
    let text = "在這次固定搜尋量下，KataGo 的排序較偏向" + preferred + "。";
    text += " 這只是目前模型、規則、貼目與搜尋量下的估計，不代表另一手一定錯。";
    if (pv.length) text += " 較前候選的參考後續：" + pv.join(" → ") + "。";
    return text;
  }

  $("decision-review-file").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      loadReviewSource(await file.text(), file.name, { perspective: "neutral" });
      $("decision-review-package-status").textContent = "已載入 SGF；可視需要匯出只含複盤脈絡的複盤包。";
    } catch (error) {
      $("decision-review-feedback").textContent = error.message;
      $("decision-review-move").disabled = true;
      $("decision-review-perspective").disabled = true;
      $("decision-review-package-export").disabled = true;
    }
  });

  $("decision-review-perspective").addEventListener("change", () => {
    reviewPerspective = ReviewTools.normalizePerspective($("decision-review-perspective").value);
    const selected = Number($("decision-review-move").value) || null;
    refreshMoveOptions(selected);
    renderFactualEvents();
    resetReviewWorkspace("複盤視角已更新。請選擇一手重新開始；系統只依你選的執棋方篩選手數，不會推定能力或錯誤。");
  });

  $("decision-review-events").addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-event-index]");
    if (!button || !game) return;
    const navigation = $("decision-review-events")._navigationEvents || [];
    activeFactualEvent = navigation[Number(button.dataset.reviewEventIndex)] || null;
    if (!activeFactualEvent) return;
    $("decision-review-lookback").hidden = false;
    $("decision-review-lookback-note").textContent =
      ReviewTools.describeEvent(activeFactualEvent, reviewPerspective, game.boardSize) +
      "。這是結果事件，不代表造成結果的關鍵決策就在這一手；可往前回看。";
  });

  $("decision-review-lookback").addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-lookback]");
    if (!button || !activeFactualEvent || !game) return;
    const lookbackMoves = Number(button.dataset.reviewLookback);
    const target = ReviewTools.findReviewTarget(game, activeFactualEvent.moveNumber, lookbackMoves, reviewPerspective);
    if (!target) {
      $("decision-review-lookback-note").textContent = "這個範圍內找不到符合目前複盤視角的可落子手數；請直接從手數清單選擇。";
      return;
    }
    $("decision-review-move").value = String(target.number);
    selectMove();
    $("decision-review-lookback-note").textContent =
      "已移到第 " + target.number + " 手，距離事件至少 " + lookbackMoves + " 手；請先自己判斷，再決定是否顯示原棋譜著手。";
  });

  $("decision-review-package-export").addEventListener("click", () => {
    if (!game || !sgfText) return;
    try {
      const selectedMoveNumber = Number($("decision-review-move").value) || null;
      const text = ReviewPackage.stringifyPackage({
        sgfText,
        sourceName,
        perspective: reviewPerspective,
        selectedMoveNumber
      });
      downloadText("悟之一手_棋譜複盤包.json", text);
      $("decision-review-package-status").textContent = "已匯出複盤包。它不含歷史作答、KataGo 結果或能力資料。";
    } catch (_) {
      $("decision-review-package-status").textContent = "複盤包無法匯出；既有複盤紀錄不受影響。";
    }
  });

  $("decision-review-package-file").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const restored = ReviewPackage.parsePackage(await file.text());
      loadReviewSource(restored.sgfText, restored.source.sourceName, {
        perspective: restored.perspective,
        selectedMoveNumber: restored.selectedMoveNumber
      });
      $("decision-review-package-status").textContent =
        "已載入複盤包。只恢復棋譜、複盤視角與選定手數；沒有匯入任何歷史證據事件。";
    } catch (_) {
      $("decision-review-package-status").textContent =
        "複盤包無法載入；沒有寫入或覆蓋任何歷史複盤事件。";
    }
  });

  $("decision-review-move").addEventListener("change", selectMove);

  $("decision-review-board").addEventListener("click", (event) => {
    const hit = event.target.closest("[data-review-x]");
    if (!hit || !exp || revealed) return;
    const point = [Number(hit.dataset.reviewX), Number(hit.dataset.reviewY)];
    const board = Go.boardFromStones(exp.stones, 19);
    const result = Go.playMove(board, point[0], point[1], exp.playerColor, { previousBoard: exp.koPreviousBoard });
    const type = answers++ === 0 ? "candidate_first" : "candidate_retry";
    if (type === "candidate_first") {
      firstPoint = point.slice();
      firstLegal = result.legal;
    }
    record(type, {
      point,
      legal: result.legal,
      originalMove: null,
      matchesOriginal: null,
      originalExposed: false,
      moveNumber: exp.source.moveNumber,
      nodeIndex: exp.source.nodeIndex
    });
    renderBoard(point, null);
    $("decision-review-reveal").disabled = !firstPoint;
    $("decision-review-feedback").textContent = result.legal
      ? "候選已保存。你可以顯示原棋譜著手，也可以先再想一手。"
      : "這個位置依目前規則不能下；第一次選擇仍已保留，你可以再試另一手。";
  });

  $("decision-review-reveal").addEventListener("click", () => {
    if (!exp || !firstPoint || revealed) return;
    revealed = true;
    const same = samePoint(firstPoint, exp.originalMove);
    record("original_revealed", {
      originalMove: exp.originalMove,
      firstCandidateMatchesOriginal: same,
      originalExposed: true,
      moveNumber: exp.source.moveNumber,
      nodeIndex: exp.source.nodeIndex
    });
    renderBoard(firstPoint, exp.originalMove);
    if (same) {
      $("decision-review-feedback").textContent = "你的第一候選和原棋譜著手相同。這只表示兩者下在同一點，不代表這是唯一好手。";
      $("decision-comparison-result").textContent = "兩手是同一手，不需要再用 KataGo 比較。";
    } else if (firstLegal === false) {
      $("decision-review-feedback").textContent = "你的第一個位置依規則不能下；原棋譜著手已顯示。可以從這裡回看自己當時漏掉了什麼。";
      $("decision-comparison-result").textContent = "第一次選擇不是合法落子，因此不送入候選品質比較。";
    } else {
      $("decision-review-feedback").textContent = "你的第一候選和原棋譜著手不同。這不是錯手判定；你可以先自己比較理由，再選擇是否請 KataGo 做有限搜尋。";
    }
    $("decision-review-meta").textContent = "第 " + exp.source.moveNumber + " 手 · 原棋譜著手已顯示 · 僅作複盤";
    $("decision-review-reveal").disabled = true;
    $("decision-review-reflection").disabled = false;
    $("decision-review-save-reflection").disabled = false;
    $("decision-replay-queue").disabled = !Replay;
    setupComparisonInputs();
  });

  $("decision-replay-queue").addEventListener("click", () => {
    if (!revealed || !exp || !Replay) return;
    const result = Replay.queueFromExperience(exp);
    if (result.ok) {
      $("decision-replay-queue").disabled = true;
      $("decision-replay-queue").textContent = result.existing ? "已在重做清單" : "已加入重做清單";
      $("decision-replay-queue-note").textContent = "已保存同一個、已曝光的局面；之後重做仍只算 T0 練習。";
    } else {
      $("decision-replay-queue-note").textContent = "目前無法加入重做清單；原本複盤紀錄仍保留。";
    }
  });

  $("decision-review-save-reflection").addEventListener("click", () => {
    if (!revealed) return;
    const note = $("decision-review-reflection").value.trim();
    if (!note) return;
    record("reflection_saved", {
      originalMove: null,
      matchesOriginal: null,
      originalExposed: true,
      note,
      moveNumber: exp.source.moveNumber,
      nodeIndex: exp.source.nodeIndex
    });
    $("decision-review-save-reflection").textContent = "已保存";
  });

  $("decision-comparison-rules").addEventListener("change", updateComparisonButton);
  $("decision-comparison-komi").addEventListener("input", updateComparisonButton);

  $("decision-comparison-run").addEventListener("click", async () => {
    if (!Comparison || !ComparisonProvider || !ComparisonEvents || !exp || !firstPoint) return;
    const button = $("decision-comparison-run");
    const resultBox = $("decision-comparison-result");
    const requestId = uid("compare-request");
    let request;
    try {
      request = Comparison.buildRequest(sgfText, exp.source.moveNumber, firstPoint, {
        requestId,
        rules: $("decision-comparison-rules").value,
        komi: $("decision-comparison-komi").value,
        maxVisits: 100,
        analysisPVLen: 8
      });
    } catch (error) {
      resultBox.textContent = comparisonErrorMessage(error.message);
      return;
    }

    const requested = recordComparison("comparison_requested", requestId, {
      rules: request.rules,
      komi: request.komi,
      maxVisits: request.maxVisits,
      candidates: request.candidates
    });
    if (!requested.ok) {
      resultBox.textContent = "分析請求無法記錄，因此這次不送出分析。";
      return;
    }

    button.disabled = true;
    button.textContent = "正在比較…";
    resultBox.textContent = "正在用固定搜尋量比較兩手；原本的複盤紀錄不會因此改分。";
    try {
      const result = await ComparisonProvider.requestComparison(request, {
        endpoint: $("decision-comparison-endpoint").value,
        timeoutMs: 30000
      });
      const storedResult = {
        resultVersion: result.resultVersion,
        providerVersion: result.providerVersion,
        engineVersion: result.engineVersion,
        model: result.model,
        rules: result.rules,
        komi: result.komi,
        maxVisits: result.maxVisits,
        searchScope: result.searchScope,
        authority: result.authority,
        candidates: result.candidates
      };
      const saved = recordComparison("comparison_completed", requestId, { result: storedResult });
      resultBox.textContent = saved.ok ? comparisonResultText(result) : "分析完成，但結果無法保存；不會把它當成已記錄的比較。";
    } catch (error) {
      recordComparison("comparison_failed", requestId, { errorCode: error.message || "comparison_unknown_error" });
      resultBox.textContent = comparisonErrorMessage(error.message);
    } finally {
      button.textContent = "重新比較這兩手";
      updateComparisonButton();
    }
  });
})();
