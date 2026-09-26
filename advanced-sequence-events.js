(function (root) {
  "use strict";

  const STORAGE_KEY = "go-advanced-sequence-events-v1";
  const SCHEMA_VERSION = 1;
  const EVENT_STREAM_VERSION = "advanced-sequence-events-v1";
  const SCORING_CONTRACT_VERSION = "advanced-sequence-v1";
  const EVENT_TYPES = ["presented", "decision_presented", "hint", "move_first", "move_retry", "opponent_move", "completed"];

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  }

  function point(value) {
    return Array.isArray(value) && value.length === 2 && value.every(Number.isInteger) ? value.slice() : null;
  }

  function emptyStore() {
    return { schemaVersion: SCHEMA_VERSION, eventStreamVersion: EVENT_STREAM_VERSION, events: [] };
  }

  function validEvent(event) {
    if (!record(event)
      || event.schemaVersion !== SCHEMA_VERSION
      || event.eventStreamVersion !== EVENT_STREAM_VERSION
      || !EVENT_TYPES.includes(event.type)
      || typeof event.eventId !== "string"
      || typeof event.sessionId !== "string"
      || typeof event.presentationId !== "string"
      || typeof event.experienceId !== "string"
      || typeof event.trackId !== "string"
      || typeof event.occurredAt !== "string"
      || !Number.isInteger(event.experienceVersion)
      || event.experienceVersion < 1
      || event.formalEligible !== false
      || event.qualifiedOpportunity !== false
      || event.evidenceUse !== "advanced_practice_only"
      || event.evaluationContext !== "advanced_sequence_practice"
      || event.scoringContractVersion !== SCORING_CONTRACT_VERSION
      || event.transferLevel !== null
      || event.skillId !== null) return false;

    const decisionType = ["decision_presented", "hint", "move_first", "move_retry", "opponent_move"].includes(event.type);
    if (decisionType && (!Number.isInteger(event.stepIndex) || event.stepIndex < 0 || typeof event.decisionId !== "string" || !event.decisionId)) return false;
    if (!decisionType && event.stepIndex !== null) return false;

    const moveType = ["move_first", "move_retry", "opponent_move"].includes(event.type);
    if (moveType && !point(event.point)) return false;
    if (!moveType && event.point !== null) return false;

    if (["move_first", "move_retry"].includes(event.type)) {
      if (typeof event.correct !== "boolean" || typeof event.legal !== "boolean") return false;
    } else if (event.correct !== null || event.legal !== null) return false;

    if (moveType && (!Number.isInteger(event.capturedCount) || event.capturedCount < 0)) return false;
    if (!moveType && event.capturedCount !== null) return false;

    return event.firstResponse === (event.type === "move_first");
  }

  function normalizeEvent(input) {
    const type = String(input.type || "");
    const decisionType = ["decision_presented", "hint", "move_first", "move_retry", "opponent_move"].includes(type);
    const moveType = ["move_first", "move_retry", "opponent_move"].includes(type);
    const learnerMove = ["move_first", "move_retry"].includes(type);
    const event = {
      schemaVersion: SCHEMA_VERSION,
      eventStreamVersion: EVENT_STREAM_VERSION,
      eventId: String(input.eventId || ""),
      sessionId: String(input.sessionId || ""),
      presentationId: String(input.presentationId || ""),
      experienceId: String(input.experienceId || ""),
      experienceVersion: Number.isInteger(input.experienceVersion) ? input.experienceVersion : 1,
      trackId: String(input.trackId || ""),
      type,
      occurredAt: String(input.occurredAt || ""),
      decisionId: decisionType ? String(input.decisionId || "") : null,
      stepIndex: decisionType && Number.isInteger(input.stepIndex) ? input.stepIndex : null,
      point: moveType ? point(input.point) : null,
      correct: learnerMove && typeof input.correct === "boolean" ? input.correct : null,
      legal: learnerMove && typeof input.legal === "boolean" ? input.legal : null,
      capturedCount: moveType && Number.isInteger(input.capturedCount) && input.capturedCount >= 0 ? input.capturedCount : moveType ? 0 : null,
      hintShown: Boolean(input.hintShown),
      firstResponse: type === "move_first",
      formalEligible: false,
      qualifiedOpportunity: false,
      evidenceUse: "advanced_practice_only",
      evaluationContext: "advanced_sequence_practice",
      scoringContractVersion: SCORING_CONTRACT_VERSION,
      transferLevel: null,
      skillId: null
    };
    if (!validEvent(event)) throw new Error("advanced sequence event invalid");
    return event;
  }

  function read(storage) {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch (error) { return { ok: false, error: "advanced_sequence_storage_unreadable", detail: error && error.message || "unknown", store: null }; }
    if (raw === null) return { ok: true, error: null, store: emptyStore() };
    try {
      const value = JSON.parse(raw);
      if (!record(value)
        || value.schemaVersion !== SCHEMA_VERSION
        || value.eventStreamVersion !== EVENT_STREAM_VERSION
        || !Array.isArray(value.events)
        || !value.events.every(validEvent)) {
        return { ok: false, error: "advanced_sequence_store_invalid", raw, store: null };
      }
      return { ok: true, error: null, store: value };
    } catch (_) {
      return { ok: false, error: "advanced_sequence_store_malformed", raw, store: null };
    }
  }

  function append(storage, input) {
    const current = read(storage);
    if (!current.ok) return current;
    let event;
    try { event = normalizeEvent(input); }
    catch (error) { return { ok: false, error: "advanced_sequence_event_invalid", detail: error.message, store: current.store }; }
    if (current.store.events.some((item) => item.eventId === event.eventId)) {
      return { ok: true, duplicate: true, event, store: current.store };
    }
    const next = { ...current.store, events: [...current.store.events, event] };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { ok: true, duplicate: false, event, store: next };
    } catch (error) {
      return { ok: false, error: "advanced_sequence_storage_write_failed", detail: error && error.message || "unknown", store: current.store };
    }
  }

  function summarize(eventsOrStore) {
    const events = Array.isArray(eventsOrStore)
      ? eventsOrStore
      : record(eventsOrStore) && Array.isArray(eventsOrStore.events) ? eventsOrStore.events : [];
    const valid = events.filter(validEvent);
    const firstMoves = valid.filter((event) => event.type === "move_first");
    const retries = valid.filter((event) => event.type === "move_retry");
    const completed = new Set(valid.filter((event) => event.type === "completed").map((event) => event.experienceId));
    return {
      totalEvents: valid.length,
      firstMoves: firstMoves.length,
      firstCorrect: firstMoves.filter((event) => event.correct === true).length,
      retries: retries.length,
      completedExperiences: completed.size,
      formalEligible: false,
      evidenceUse: "advanced_practice_only"
    };
  }

  const api = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    EVENT_STREAM_VERSION,
    SCORING_CONTRACT_VERSION,
    emptyStore,
    validEvent,
    normalizeEvent,
    read,
    append,
    summarize
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedSequenceEvents = api;
})(typeof window !== "undefined" ? window : globalThis);
