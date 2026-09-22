(function (root) {
  "use strict";

  const Go = typeof require === "function" && typeof module !== "undefined" ? require("./go.js") : root.GoCore;
  const Live = typeof require === "function" && typeof module !== "undefined" ? require("./live-game.js") : root.GoLiveGame;
  const STORAGE_KEY = "go-live-evidence-v1";
  const SCHEMA_VERSION = 1;
  const ELIGIBILITY_CONTRACT_VERSION = "live-eligibility-v1";
  const SCORING_CONTRACT_VERSION = "live-scoring-v1";
  const PROGRESS_POLICY_VERSION = "live-progress-v1";
  const { BLACK = 1, WHITE = 2, EMPTY = 0 } = Go || {};

  const CONTRACTS = Object.freeze({
    "capture-last-liberty-v1": Object.freeze({
      skillId: "capture-last-liberty-v1",
      skillVersion: 1,
      label: "自然局面的唯一一手提子",
      eligibility: "9×9 人機局、輪到學習者；整盤恰有一個本 contract 支援的局部機會，且對方指定棋串恰一氣，唯一氣上的合法落子立即且只提掉該串。",
      scoring: "首個使用者操作若為合法落子且座標等於預先凍結的唯一 successPoint，taskSuccess=true；Pass、認輸、其他合法手或非法點擊均不達成此局部任務。",
      exclusions: ["同回合有多個支援機會", "多串同時提取", "劫／倒撲／征子等非本單手 contract", "全局是否值得提子"],
      interpretation: "只判定預先指定的唯一打吃棋串是否在本回合被立即提掉；不表示這手是全局最佳手，也不推定未提子就是全局錯著。"
    }),
    "rescue-last-liberty-foundation-v1": Object.freeze({
      skillId: "rescue-last-liberty-foundation-v1",
      skillVersion: 1,
      label: "電腦剛打吃後的唯一直接延長救棋",
      eligibility: "9×9 人機局、輪到學習者；上一著 actor 必須是 computer；該著把既存己方棋串從至少兩氣降為一氣；整盤恰有一個支援機會；唯一氣上的直接延長合法、不靠提子，且落子後原串至少兩氣。",
      scoring: "首個使用者操作若為合法落子且座標等於預先凍結的唯一 successPoint，taskSuccess=true；其他操作不達成此局部任務。",
      exclusions: ["SGF 匯入或 actor 不明的上一著", "靠提子救棋", "棄子／轉身的全局補償", "同回合多個支援機會"],
      interpretation: "只判定電腦上一手新造成的唯一被打吃棋串，是否以唯一直接延長手脫離一氣；不評估棄子是否有全局補償。"
    })
  });

  function opposite(color) { return color === BLACK ? WHITE : BLACK; }
  function cloneBoard(board) { return board.map((row) => row.slice()); }
  function pointKey(point) { return point[0] + "," + point[1]; }
  function validPoint(point, size) { return Array.isArray(point) && point.length === 2 && point.every(Number.isInteger) && point[0] >= 0 && point[0] < size && point[1] >= 0 && point[1] < size; }
  function boardFingerprint(board) {
    let hash = 2166136261;
    for (const row of board || []) for (const value of row || []) { hash ^= Number(value) + 48; hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function groups(board, color) {
    if (!Go || typeof Go.groupAt !== "function" || !Array.isArray(board)) return [];
    const seen = new Set(), result = [];
    for (let y = 0; y < board.length; y += 1) for (let x = 0; x < board.length; x += 1) {
      if (board[y][x] !== color || seen.has(x + "," + y)) continue;
      const group = Go.groupAt(board, x, y);
      if (!group) continue;
      group.stones.forEach(([gx, gy]) => seen.add(gx + "," + gy));
      result.push({ stones: group.stones.map((p) => p.slice()), liberties: group.liberties.map((p) => p.slice()) });
    }
    return result;
  }
  function lastMove(game) { return game && Array.isArray(game.moves) && game.moves.length ? game.moves[game.moves.length - 1] : null; }

  function rescueCandidates(game, humanColor, computerColor, lastMoveActor) {
    if (!Live || typeof Live.play !== "function" || lastMoveActor !== "computer") return [];
    const last = lastMove(game);
    if (!last || last.type !== "play" || last.color !== computerColor || !Array.isArray(last.boardBefore)) return [];
    const candidates = [];
    for (const target of groups(game.board, humanColor).filter((group) => group.liberties.length === 1)) {
      const representative = target.stones[0];
      if (!representative || last.boardBefore[representative[1]]?.[representative[0]] !== humanColor) continue;
      const beforeGroup = Go.groupAt(last.boardBefore, representative[0], representative[1]);
      if (!beforeGroup || beforeGroup.liberties.length <= 1) continue;
      const successPoint = target.liberties[0];
      const played = Live.play(game, successPoint[0], successPoint[1]);
      if (!played.ok || played.captured.length !== 0) continue;
      if (played.game.board[representative[1]][representative[0]] !== humanColor) continue;
      const afterGroup = Go.groupAt(played.game.board, representative[0], representative[1]);
      if (!afterGroup || afterGroup.liberties.length < 2) continue;
      candidates.push({
        skillId: "rescue-last-liberty-foundation-v1",
        targetStones: target.stones,
        successPoint: successPoint.slice(),
        targetGroupSize: target.stones.length,
        triggerMoveNumber: last.number || game.moves.length
      });
    }
    return candidates;
  }

  function captureCandidates(game, humanColor) {
    if (!Live || typeof Live.play !== "function") return [];
    const targetColor = opposite(humanColor);
    const candidates = [];
    for (const target of groups(game.board, targetColor).filter((group) => group.liberties.length === 1)) {
      const successPoint = target.liberties[0];
      const played = Live.play(game, successPoint[0], successPoint[1]);
      if (!played.ok) continue;
      const captured = new Set(played.captured.map(pointKey));
      if (played.captured.length !== target.stones.length || !target.stones.every((point) => captured.has(pointKey(point)))) continue;
      candidates.push({
        skillId: "capture-last-liberty-v1",
        targetStones: target.stones,
        successPoint: successPoint.slice(),
        targetGroupSize: target.stones.length,
        triggerMoveNumber: game.moves.length
      });
    }
    return candidates;
  }

  function assessTurn(game, context = {}) {
    const humanColor = Number(context.humanColor);
    const computerColor = Number(context.computerColor) || opposite(humanColor);
    const base = {
      schemaVersion: SCHEMA_VERSION,
      eligibilityContractVersion: ELIGIBILITY_CONTRACT_VERSION,
      scoringContractVersion: SCORING_CONTRACT_VERSION,
      evidenceTaxonomyVersion: 2,
      boardSize: game && game.boardSize || null,
      moveCount: game && Array.isArray(game.moves) ? game.moves.length : null,
      toPlay: game && game.toPlay || null,
      humanColor,
      computerColor,
      opponentMode: context.opponentMode || null,
      boardFingerprint: game && game.board ? boardFingerprint(game.board) : null,
      boardBefore: game && game.board ? cloneBoard(game.board) : null,
      previousBoard: game && game.previousBoard ? cloneBoard(game.previousBoard) : null,
      formalEligible: false,
      evaluationContext: "live",
      transferLevel: null,
      qualifiedOpportunity: false,
      status: "not_eligible",
      reason: "unsupported_context",
      skillId: null,
      skillVersion: null,
      targetStones: [],
      successPoint: null,
      targetGroupSize: null,
      globalMoveQuality: "not_assessed"
    };
    if (!game || game.status !== "playing" || game.boardSize !== 9 || context.opponentMode !== "computer" || ![BLACK, WHITE].includes(humanColor) || game.toPlay !== humanColor) return base;

    const rescue = rescueCandidates(game, humanColor, computerColor, context.lastMoveActor || null);
    const capture = captureCandidates(game, humanColor);
    const all = [...rescue, ...capture];
    if (all.length === 0) return { ...base, reason: "no_supported_unique_local_contract" };
    if (all.length !== 1) return { ...base, reason: "multiple_supported_opportunities" };
    const candidate = all[0];
    return {
      ...base,
      ...candidate,
      skillVersion: CONTRACTS[candidate.skillId].skillVersion,
      status: "eligible",
      reason: "unique_rule_scored_local_contract",
      qualifiedOpportunity: true,
      transferLevel: "T3",
      contractLabel: CONTRACTS[candidate.skillId].label,
      interpretationBoundary: CONTRACTS[candidate.skillId].interpretation
    };
  }

  function emptyStore() { return { schemaVersion: SCHEMA_VERSION, events: [] }; }
  function validEvent(event) {
    return Boolean(event && typeof event === "object" && event.schemaVersion === SCHEMA_VERSION && typeof event.eventId === "string" && typeof event.type === "string" && typeof event.occurredAt === "string");
  }
  function read(storage) {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch (error) { return { ok: false, error: "live_evidence_storage_unreadable", detail: error.message || "unknown", store: null }; }
    if (raw === null) return { ok: true, error: null, store: emptyStore() };
    try {
      const value = JSON.parse(raw);
      if (!value || value.schemaVersion !== SCHEMA_VERSION || !Array.isArray(value.events) || !value.events.every(validEvent)) return { ok: false, error: "live_evidence_store_invalid", store: null, raw };
      return { ok: true, error: null, store: value };
    } catch (_) { return { ok: false, error: "live_evidence_store_malformed", store: null, raw }; }
  }
  function append(storage, event) {
    const current = read(storage);
    if (!current.ok) return current;
    if (!validEvent(event)) return { ok: false, error: "live_evidence_event_invalid", store: current.store };
    if (current.store.events.some((item) => item.eventId === event.eventId)) return { ok: true, duplicate: true, event, store: current.store };
    const next = { schemaVersion: SCHEMA_VERSION, events: [...current.store.events, event] };
    try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); return { ok: true, duplicate: false, event, store: next }; }
    catch (error) { return { ok: false, error: "live_evidence_storage_write_failed", detail: error.message || "unknown", store: current.store }; }
  }

  function assessmentEvent(input) {
    return {
      ...input,
      schemaVersion: SCHEMA_VERSION,
      type: "assessment",
      eventId: String(input.eventId || ""),
      assessmentId: String(input.assessmentId || ""),
      sessionId: String(input.sessionId || ""),
      occurredAt: String(input.occurredAt || ""),
      eligibilityContractVersion: ELIGIBILITY_CONTRACT_VERSION,
      scoringContractVersion: SCORING_CONTRACT_VERSION,
      evidenceTaxonomyVersion: 2,
      formalEligible: false,
      globalMoveQuality: "not_assessed"
    };
  }

  function evaluateResponse(assessment, response = {}, firstResponse = true) {
    if (!assessment || assessment.status !== "eligible" || !assessment.qualifiedOpportunity) throw new Error("assessment is not scoreable");
    const action = response.action || "unknown";
    const legal = response.legal === true;
    const point = validPoint(response.point, assessment.boardSize) ? response.point.slice() : null;
    const satisfied = action === "play" && legal && point && pointKey(point) === pointKey(assessment.successPoint);
    return {
      outcome: satisfied ? "satisfied" : (!legal && action === "play" ? "invalid_first_response" : "not_satisfied"),
      taskSuccess: satisfied,
      firstResponse: firstResponse === true,
      qualifiedOpportunity: firstResponse === true,
      transferLevel: firstResponse === true ? "T3" : null,
      evaluationContext: "live",
      formalEligible: false,
      globalMoveQuality: "not_assessed",
      action,
      legal,
      point,
      reason: typeof response.reason === "string" ? response.reason : null
    };
  }

  function responseEvent(assessment, response, options = {}) {
    const scored = evaluateResponse(assessment, response, options.firstResponse !== false);
    return {
      schemaVersion: SCHEMA_VERSION,
      type: options.firstResponse === false ? "retry_response" : "first_response",
      eventId: String(options.eventId || ""),
      assessmentId: assessment.assessmentId,
      sessionId: assessment.sessionId,
      occurredAt: String(options.occurredAt || ""),
      skillId: assessment.skillId,
      boardSize: assessment.boardSize,
      boardFingerprint: assessment.boardFingerprint,
      eligibilityContractVersion: assessment.eligibilityContractVersion,
      scoringContractVersion: assessment.scoringContractVersion,
      evidenceTaxonomyVersion: assessment.evidenceTaxonomyVersion,
      ...scored,
      eventualCorrection: options.firstResponse === false && scored.taskSuccess === true
    };
  }

  function isCurrentContractEvent(event) {
    return event && event.eligibilityContractVersion === ELIGIBILITY_CONTRACT_VERSION
      && event.scoringContractVersion === SCORING_CONTRACT_VERSION
      && Number(event.evidenceTaxonomyVersion) === 2;
  }

  function summarize(storeOrEvents) {
    const events = Array.isArray(storeOrEvents) ? storeOrEvents : storeOrEvents && Array.isArray(storeOrEvents.events) ? storeOrEvents.events : [];
    const currentEvents = events.filter(isCurrentContractEvent);
    const assessments = currentEvents.filter((event) => event.type === "assessment");
    const eligible = assessments.filter((event) => event.status === "eligible" && event.qualifiedOpportunity === true);
    const firstResponses = currentEvents.filter((event) => event.type === "first_response");
    const retries = currentEvents.filter((event) => event.type === "retry_response");
    const responseByAssessment = new Map(firstResponses.map((event) => [event.assessmentId, event]));
    const skills = Object.keys(CONTRACTS).map((skillId) => {
      const skillAssessments = eligible.filter((event) => event.skillId === skillId);
      const responses = skillAssessments.map((assessment) => responseByAssessment.get(assessment.assessmentId)).filter(Boolean);
      const recent = responses.slice(-5);
      const sessionMap = new Map();
      for (const response of responses) {
        if (!sessionMap.has(response.sessionId)) sessionMap.set(response.sessionId, []);
        sessionMap.get(response.sessionId).push(response);
      }
      const sessionOutcomes = [...sessionMap.entries()].map(([sessionId, sessionResponses]) => ({
        sessionId,
        responseCount: sessionResponses.length,
        allSatisfied: sessionResponses.every((item) => item.taskSuccess === true),
        anyNotSatisfied: sessionResponses.some((item) => item.taskSuccess !== true)
      }));
      const recentSessions = sessionOutcomes.slice(-3);
      let evidenceState = "no_live_opportunity";
      if (skillAssessments.length > 0 && responses.length === 0) evidenceState = "awaiting_response";
      else if (sessionOutcomes.length > 0 && sessionOutcomes.length < 3) evidenceState = "accumulating";
      else if (sessionOutcomes.length >= 3 && sessionOutcomes.at(-1).anyNotSatisfied) evidenceState = "needs_review";
      else if (sessionOutcomes.length >= 3 && recentSessions.every((item) => item.allSatisfied)) evidenceState = "recent_consistent";
      else if (sessionOutcomes.length >= 3) evidenceState = "mixed";
      return {
        skillId,
        label: CONTRACTS[skillId].label,
        interpretationBoundary: CONTRACTS[skillId].interpretation,
        eligibleOpportunities: skillAssessments.length,
        firstResponses: responses.length,
        satisfiedFirstResponses: responses.filter((item) => item.taskSuccess === true).length,
        notSatisfiedFirstResponses: responses.filter((item) => item.taskSuccess !== true).length,
        unansweredOpportunities: skillAssessments.length - responses.length,
        eventualCorrections: retries.filter((item) => item.skillId === skillId && item.eventualCorrection === true).length,
        distinctSessionsWithFirstResponse: sessionOutcomes.length,
        sessionOutcomes,
        recentOutcomes: recent.map((item) => item.outcome),
        evidenceState
      };
    });
    const reasonCounts = {};
    for (const item of assessments.filter((event) => event.status !== "eligible")) reasonCounts[item.reason || "unknown"] = (reasonCounts[item.reason || "unknown"] || 0) + 1;
    return {
      schemaVersion: 1,
      eligibilityContractVersion: ELIGIBILITY_CONTRACT_VERSION,
      scoringContractVersion: SCORING_CONTRACT_VERSION,
      progressPolicyVersion: PROGRESS_POLICY_VERSION,
      assessedHumanTurns: assessments.length,
      excludedContractVersionEvents: events.length - currentEvents.length,
      eligibleOpportunities: eligible.length,
      unscoredHumanTurns: assessments.length - eligible.length,
      unscoredReasons: reasonCounts,
      firstResponses: firstResponses.length,
      interpretationBoundary: "只把 9×9 人機局中預先判定、唯一且可由規則引擎客觀核對的局部任務列為 live T3。任務達成不代表全局最佳手；未達成也不等於全局錯著。決策機會照實計數，但進度狀態的跨局一致性以不同 session 為單位，不把同局連續手冒充獨立樣本；這仍不是 mastery 百分比。",
      skills
    };
  }

  const api = {
    STORAGE_KEY, SCHEMA_VERSION, ELIGIBILITY_CONTRACT_VERSION, SCORING_CONTRACT_VERSION, PROGRESS_POLICY_VERSION, CONTRACTS,
    boardFingerprint, assessTurn, evaluateResponse, assessmentEvent, responseEvent, read, append, isCurrentContractEvent, summarize
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoLiveEvidence = api;
})(typeof window !== "undefined" ? window : globalThis);
