(function (root) {
  "use strict";

  const STORAGE_KEY = "go-advanced-practice-events-v1";
  const SCHEMA_VERSION = 1;
  const EVENT_STREAM_VERSION = "advanced-practice-events-v1";

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  }

  function emptyStore() {
    return { schemaVersion: SCHEMA_VERSION, eventStreamVersion: EVENT_STREAM_VERSION, events: [] };
  }

  function validEvent(event) {
    return Boolean(record(event)
      && event.schemaVersion === SCHEMA_VERSION
      && event.eventStreamVersion === EVENT_STREAM_VERSION
      && typeof event.eventId === "string"
      && typeof event.sessionId === "string"
      && typeof event.presentationId === "string"
      && typeof event.experienceId === "string"
      && typeof event.trackId === "string"
      && ["presented", "hint", "answer_first", "answer_retry", "completed"].includes(event.type)
      && typeof event.occurredAt === "string"
      && event.formalEligible === false
      && event.qualifiedOpportunity === false
      && event.evidenceUse === "advanced_practice_only"
      && event.evaluationContext === "advanced_practice"
      && event.scoringContractVersion === "advanced-choice-v1");
  }

  function normalizeEvent(input) {
    const selectedIndex = Number.isInteger(input.selectedIndex) ? input.selectedIndex : null;
    const correct = typeof input.correct === "boolean" ? input.correct : null;
    const event = {
      schemaVersion: SCHEMA_VERSION,
      eventStreamVersion: EVENT_STREAM_VERSION,
      eventId: String(input.eventId || ""),
      sessionId: String(input.sessionId || ""),
      presentationId: String(input.presentationId || ""),
      experienceId: String(input.experienceId || ""),
      trackId: String(input.trackId || ""),
      type: String(input.type || ""),
      occurredAt: String(input.occurredAt || ""),
      selectedIndex,
      correct,
      hintShown: Boolean(input.hintShown),
      firstResponse: input.type === "answer_first",
      formalEligible: false,
      qualifiedOpportunity: false,
      evidenceUse: "advanced_practice_only",
      evaluationContext: "advanced_practice",
      scoringContractVersion: "advanced-choice-v1",
      transferLevel: null,
      skillId: null
    };
    if (!validEvent(event)) throw new Error("advanced practice event invalid");
    return event;
  }

  function read(storage) {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch (error) { return { ok: false, error: "advanced_event_storage_unreadable", detail: error && error.message || "unknown", store: null }; }
    if (raw === null) return { ok: true, error: null, store: emptyStore() };
    try {
      const value = JSON.parse(raw);
      if (!record(value)
        || value.schemaVersion !== SCHEMA_VERSION
        || value.eventStreamVersion !== EVENT_STREAM_VERSION
        || !Array.isArray(value.events)
        || !value.events.every(validEvent)) {
        return { ok: false, error: "advanced_event_store_invalid", raw, store: null };
      }
      return { ok: true, error: null, store: value };
    } catch (_) {
      return { ok: false, error: "advanced_event_store_malformed", raw, store: null };
    }
  }

  function append(storage, input) {
    const current = read(storage);
    if (!current.ok) return current;
    let event;
    try { event = normalizeEvent(input); }
    catch (error) { return { ok: false, error: "advanced_event_invalid", detail: error.message, store: current.store }; }
    if (current.store.events.some((item) => item.eventId === event.eventId)) {
      return { ok: true, duplicate: true, event, store: current.store };
    }
    const next = { ...current.store, events: [...current.store.events, event] };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { ok: true, duplicate: false, event, store: next };
    } catch (error) {
      return { ok: false, error: "advanced_event_storage_write_failed", detail: error && error.message || "unknown", store: current.store };
    }
  }

  function summarize(eventsOrStore) {
    const events = Array.isArray(eventsOrStore)
      ? eventsOrStore
      : record(eventsOrStore) && Array.isArray(eventsOrStore.events) ? eventsOrStore.events : [];
    const valid = events.filter(validEvent);
    const firstAnswers = valid.filter((event) => event.type === "answer_first");
    const retries = valid.filter((event) => event.type === "answer_retry");
    const completed = new Set(valid.filter((event) => event.type === "completed").map((event) => event.experienceId));
    return {
      totalEvents: valid.length,
      firstAnswers: firstAnswers.length,
      firstCorrect: firstAnswers.filter((event) => event.correct === true).length,
      retries: retries.length,
      completedExperiences: completed.size,
      formalEligible: false,
      evidenceUse: "advanced_practice_only"
    };
  }

  const api = { STORAGE_KEY, SCHEMA_VERSION, EVENT_STREAM_VERSION, emptyStore, validEvent, normalizeEvent, read, append, summarize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedEvents = api;
})(typeof window !== "undefined" ? window : globalThis);
