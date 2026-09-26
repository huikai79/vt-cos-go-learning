(function (root) {
  "use strict";

  const STORAGE_KEY = "go-advanced-sequence-events-v2";
  const SCHEMA_VERSION = 2;
  const EVENT_STREAM_VERSION = "advanced-sequence-events-v2";
  const LEGACY_STORAGE_KEY = "go-advanced-sequence-events-v1";
  const LEGACY_SCHEMA_VERSION = 1;
  const LEGACY_EVENT_STREAM_VERSION = "advanced-sequence-events-v1";
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

  function validLegacyEvent(event) {
    if (!record(event)
      || event.schemaVersion !== LEGACY_SCHEMA_VERSION
      || event.eventStreamVersion !== LEGACY_EVENT_STREAM_VERSION
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
      || event.skillId !== null
      || typeof event.familyId !== "string"
      || !event.familyId
      || typeof event.variantId !== "string"
      || !event.variantId
      || !Array.isArray(event.variationAxes)
      || !event.variationAxes.length
      || event.variationAxes.some((axis) => typeof axis !== "string" || !axis)) return false;

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
      skillId: null,
      familyId: String(input.familyId || ""),
      variantId: String(input.variantId || ""),
      variationAxes: Array.isArray(input.variationAxes) ? input.variationAxes.map(String) : []
    };
    if (!validEvent(event)) throw new Error("advanced sequence event invalid");
    return event;
  }

  function readLegacy(storage) {
    let raw;
    try { raw = storage.getItem(LEGACY_STORAGE_KEY); }
    catch (error) { return { ok: false, error: "advanced_sequence_legacy_storage_unreadable", detail: error && error.message || "unknown", store: null }; }
    if (raw === null) return { ok: true, error: null, store: { schemaVersion: LEGACY_SCHEMA_VERSION, eventStreamVersion: LEGACY_EVENT_STREAM_VERSION, events: [] } };
    try {
      const value = JSON.parse(raw);
      if (!record(value)
        || value.schemaVersion !== LEGACY_SCHEMA_VERSION
        || value.eventStreamVersion !== LEGACY_EVENT_STREAM_VERSION
        || !Array.isArray(value.events)
        || !value.events.every(validLegacyEvent)) {
        return { ok: false, error: "advanced_sequence_legacy_store_invalid", raw, store: null };
      }
      return { ok: true, error: null, store: value };
    } catch (_) {
      return { ok: false, error: "advanced_sequence_legacy_store_malformed", raw, store: null };
    }
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
    const valid = events.filter((event) => validEvent(event) || validLegacyEvent(event));
    const firstMoves = valid.filter((event) => event.type === "move_first");
    const retries = valid.filter((event) => event.type === "move_retry");
    const completed = new Set(valid.filter((event) => event.type === "completed").map((event) => event.experienceId));
    return {
      totalEvents: valid.length,
      firstMoves: firstMoves.length,
      firstCorrect: firstMoves.filter((event) => event.correct === true).length,
      retries: retries.length,
      completedExperiences: completed.size,
      families: summarizeFamilies(valid),
      formalEligible: false,
      evidenceUse: "advanced_practice_only"
    };
  }

  function summarizeFamilies(eventsOrStore) {
    const events = Array.isArray(eventsOrStore)
      ? eventsOrStore
      : record(eventsOrStore) && Array.isArray(eventsOrStore.events) ? eventsOrStore.events : [];
    const valid = events.filter(validEvent);
    const presentations = new Map();
    for (const event of valid) {
      if (!presentations.has(event.presentationId)) {
        presentations.set(event.presentationId, {
          presentationId: event.presentationId,
          familyId: event.familyId,
          variantId: event.variantId,
          experienceId: event.experienceId,
          firstMoves: [],
          hintShown: false,
          completed: false
        });
      }
      const row = presentations.get(event.presentationId);
      if (event.type === "move_first") row.firstMoves.push(event);
      if (event.type === "hint") row.hintShown = true;
      if (event.type === "completed") row.completed = true;
    }
    const familyMap = new Map();
    for (const row of presentations.values()) {
      if (!familyMap.has(row.familyId)) familyMap.set(row.familyId, new Map());
      const variants = familyMap.get(row.familyId);
      if (!variants.has(row.variantId)) variants.set(row.variantId, []);
      variants.get(row.variantId).push(row);
    }
    return Array.from(familyMap.entries()).map(([familyId, variants]) => ({
      familyId,
      variants: Array.from(variants.entries()).map(([variantId, rows]) => ({
        variantId,
        presentations: rows.length,
        firstMoveCount: rows.reduce((sum, row) => sum + row.firstMoves.length, 0),
        firstCorrectCount: rows.reduce((sum, row) => sum + row.firstMoves.filter((event) => event.correct).length, 0),
        hintPresentations: rows.filter((row) => row.hintShown).length,
        completedPresentations: rows.filter((row) => row.completed).length
      }))
    }));
  }

  function classifyFamilyTransition(eventsOrStore, familyId) {
    const families = summarizeFamilies(eventsOrStore);
    const family = families.find((entry) => entry.familyId === familyId);
    if (!family) return { status: "INSUFFICIENT_DATA", familyId, reason: "family_not_observed" };
    const seed = family.variants.find((variant) => variant.variantId === "seed");
    const variants = family.variants.filter((variant) => variant.variantId !== "seed");
    if (!seed || seed.firstMoveCount === 0 || variants.length === 0 || variants.every((variant) => variant.firstMoveCount === 0)) {
      return { status: "INSUFFICIENT_DATA", familyId, reason: "seed_or_variant_first_response_missing" };
    }
    const seedLabel = seed.firstCorrectCount === seed.firstMoveCount ? "seed_first_all_correct" : seed.firstCorrectCount === 0 ? "seed_first_all_wrong" : "seed_first_mixed";
    const variantFirst = variants.reduce((sum, variant) => sum + variant.firstMoveCount, 0);
    const variantCorrect = variants.reduce((sum, variant) => sum + variant.firstCorrectCount, 0);
    const variantLabel = variantCorrect === variantFirst ? "variant_first_all_correct" : variantCorrect === 0 ? "variant_first_all_wrong" : "variant_first_mixed";
    return { status: "DESCRIPTIVE_ONLY", familyId, seed: seedLabel, variant: variantLabel, mastery: null, transferClaim: false };
  }

  const api = {
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    SCHEMA_VERSION,
    EVENT_STREAM_VERSION,
    SCORING_CONTRACT_VERSION,
    emptyStore,
    validLegacyEvent,
    validEvent,
    normalizeEvent,
    readLegacy,
    read,
    append,
    summarize,
    summarizeFamilies,
    classifyFamilyTransition
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedSequenceEvents = api;
})(typeof window !== "undefined" ? window : globalThis);
