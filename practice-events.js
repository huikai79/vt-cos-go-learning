(function (root) {
  "use strict";

  const STORAGE_KEY = "go-live-practice-events-v1";
  const SCHEMA_VERSION = 1;
  const EVENT_STREAM_VERSION = "live-practice-events-v1";
  const DESCRIPTOR = {
    id: EVENT_STREAM_VERSION,
    evidenceUse: "practice_observation_only",
    formalEligible: false,
    qualifiedOpportunity: false,
    scoringStatus: "unscored",
    interpretation: "只記錄自由／人機練習中實際發生的操作；不自動更新 KC、scheduler、T2/T3、mastery 或學習成效。"
  };

  function record(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : null; }
  function validEvent(event) {
    return Boolean(record(event)
      && event.schemaVersion === SCHEMA_VERSION
      && event.eventStreamVersion === EVENT_STREAM_VERSION
      && typeof event.eventId === "string"
      && typeof event.sessionId === "string"
      && typeof event.type === "string"
      && typeof event.occurredAt === "string"
      && [3, 5, 7, 9].includes(Number(event.boardSize))
      && event.formalEligible === false
      && event.qualifiedOpportunity === false);
  }
  function emptyStore() {
    return { schemaVersion: SCHEMA_VERSION, eventStreamVersion: EVENT_STREAM_VERSION, events: [] };
  }
  function read(storage) {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch (error) { return { ok: false, error: "practice_event_storage_unreadable", detail: error && error.message || "unknown", store: null }; }
    if (raw === null) return { ok: true, store: emptyStore(), error: null };
    try {
      const value = JSON.parse(raw);
      if (!record(value) || value.schemaVersion !== SCHEMA_VERSION || value.eventStreamVersion !== EVENT_STREAM_VERSION || !Array.isArray(value.events) || !value.events.every(validEvent)) {
        return { ok: false, error: "practice_event_store_invalid", store: null, raw };
      }
      return { ok: true, store: value, error: null };
    } catch (_) {
      return { ok: false, error: "practice_event_store_malformed", store: null, raw };
    }
  }
  function normalizeEvent(input) {
    const event = {
      schemaVersion: SCHEMA_VERSION,
      eventStreamVersion: EVENT_STREAM_VERSION,
      eventId: String(input.eventId || ""),
      sessionId: String(input.sessionId || ""),
      type: String(input.type || ""),
      occurredAt: String(input.occurredAt || ""),
      boardSize: Number(input.boardSize),
      opponentMode: input.opponentMode === "computer" ? "computer" : "local",
      humanColor: [1, 2].includes(Number(input.humanColor)) ? Number(input.humanColor) : null,
      actor: ["human", "computer", "local_player", "system"].includes(input.actor) ? input.actor : "system",
      moveCount: Number.isInteger(input.moveCount) ? input.moveCount : null,
      point: Array.isArray(input.point) && input.point.length === 2 && input.point.every(Number.isInteger) ? input.point.slice() : null,
      captured: Number.isInteger(input.captured) && input.captured >= 0 ? input.captured : null,
      actionColor: [1, 2].includes(Number(input.actionColor)) ? Number(input.actionColor) : null,
      botVersion: typeof input.botVersion === "string" ? input.botVersion : null,
      selectionReason: typeof input.selectionReason === "string" ? input.selectionReason : null,
      reason: typeof input.reason === "string" ? input.reason : null,
      gameStatus: typeof input.gameStatus === "string" ? input.gameStatus : null,
      formalEligible: false,
      qualifiedOpportunity: false,
      evidenceUse: "practice_observation_only",
      scoringStatus: "unscored",
      skillId: null,
      transferLevel: null,
      evaluationContext: "live_practice_unscored"
    };
    if (!validEvent(event)) throw new Error("practice event fields invalid");
    return event;
  }
  function append(storage, input) {
    const current = read(storage);
    if (!current.ok) return current;
    let event;
    try { event = normalizeEvent(input); }
    catch (error) { return { ok: false, error: "practice_event_invalid", detail: error.message, store: current.store }; }
    if (current.store.events.some((item) => item.eventId === event.eventId)) return { ok: true, store: current.store, event, duplicate: true };
    const next = { ...current.store, events: [...current.store.events, event] };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { ok: true, store: next, event, duplicate: false };
    } catch (error) {
      return { ok: false, error: "practice_event_storage_write_failed", detail: error && error.message || "unknown", store: current.store };
    }
  }
  function summarize(eventsOrStore) {
    const events = Array.isArray(eventsOrStore) ? eventsOrStore : record(eventsOrStore) && Array.isArray(eventsOrStore.events) ? eventsOrStore.events : [];
    const valid = events.filter(validEvent);
    const humanDecisions = valid.filter((event) => event.opponentMode === "computer" && event.actor === "human" && ["move", "pass", "resign"].includes(event.type));
    const computerActions = valid.filter((event) => event.opponentMode === "computer" && event.actor === "computer" && ["computer_move", "computer_pass"].includes(event.type));
    const sessionIds = new Set(valid.filter((event) => event.opponentMode === "computer").map((event) => event.sessionId));
    const lastEvent = valid.length ? valid[valid.length - 1] : null;
    return {
      totalEvents: valid.length,
      humanDecisions: humanDecisions.length,
      computerActions: computerActions.length,
      computerSessions: sessionIds.size,
      lastOccurredAt: lastEvent ? lastEvent.occurredAt : null,
      lastBoardSize: lastEvent ? lastEvent.boardSize : null,
      formalEligible: false,
      evidenceUse: "practice_observation_only"
    };
  }

  const api = { STORAGE_KEY, SCHEMA_VERSION, EVENT_STREAM_VERSION, DESCRIPTOR, read, append, summarize, normalizeEvent };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoPracticeEvents = api;
})(typeof window !== "undefined" ? window : globalThis);
