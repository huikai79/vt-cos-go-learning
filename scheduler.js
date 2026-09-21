(function (root) {
  "use strict";
  const DAY = 24 * 60 * 60 * 1000;
  const policies = {
    "fixed-spacing-v1": { id: "fixed-spacing-v1", label: "固定間隔", intervals: [1, 3, 7, 14].map((days) => days * DAY) },
    "adaptive-candidate-v1": { id: "adaptive-candidate-v1", label: "自適應候選", intervals: [1, 3, 7, 14].map((days) => days * DAY) }
  };

  function emptyState() { return { schemaVersion: 1, selections: [], responses: [], reviews: {} }; }
  function stateFrom(value) { return value && value.schemaVersion === 1 ? { ...emptyState(), ...value, selections: value.selections || [], responses: value.responses || [], reviews: value.reviews || {} } : emptyState(); }
  function presentedIds(state) { return new Set(state.selections.map((event) => event.problemId)); }
  function isCandidate(problem, mode) { return mode === "evaluation" ? false : problem.pool !== "holdout"; }
  function selectionEvent(problem, policy, reason, mode, now) {
    return { id: `${now}-${problem.id}`, occurredAt: new Date(now).toISOString(), type: "selection", problemId: problem.id, familyId: problem.familyId, skillId: problem.skillId, pool: problem.pool, transferLevel: problem.transferLevel, policyVersion: policy.id, selectionReason: reason, mode };
  }

  function chooseNext(allProblems, storedState, policyId, now = Date.now(), mode = "practice") {
    const state = stateFrom(storedState);
    const policy = policies[policyId] || policies["fixed-spacing-v1"];
    const presented = presentedIds(state);
    const eligible = allProblems.filter((problem) => isCandidate(problem, mode));
    const due = eligible.filter((problem) => state.reviews[problem.id] && state.reviews[problem.id].dueAt <= now).sort((a, b) => state.reviews[a.id].dueAt - state.reviews[b.id].dueAt);
    let problem = due[0];
    let reason = problem ? "scheduled_review_due" : "";
    if (!problem && mode === "practice" && policy.id === "adaptive-candidate-v1") {
      const last = state.responses.at(-1);
      const firstAnswerIncorrect = last && (last.firstAnswerCorrect === false || (last.firstAnswerCorrect === undefined && !last.correct));
      if (firstAnswerIncorrect) {
        problem = eligible.find((item) => item.familyId === last.familyId && !presented.has(item.id));
        if (problem) reason = "immediate_unseen_variant_after_error";
      }
    }
    if (!problem) {
      problem = eligible.find((item) => !presented.has(item.id));
      reason = "new_practice_item";
    }
    if (!problem) return null;
    const event = selectionEvent(problem, policy, reason, mode, now);
    return { problem, event, state: { ...state, selections: [...state.selections, event] } };
  }

  function recordResponse(storedState, problem, policyId, correct, now = Date.now(), metadata = {}) {
    const state = stateFrom(storedState);
    const policy = policies[policyId] || policies["fixed-spacing-v1"];
    const prior = state.reviews[problem.id] || { stage: -1 };
    const nextStage = correct ? Math.min(prior.stage + 1, policy.intervals.length - 1) : 0;
    const unhinted = metadata.unhinted !== false;
    const response = {
      id: `${now}-${problem.id}-response`,
      occurredAt: new Date(now).toISOString(),
      type: "response",
      problemId: problem.id,
      familyId: problem.familyId,
      skillId: problem.skillId || null,
      skillVersion: problem.skillVersion || 1,
      contentVersion: problem.contentVersion || 1,
      itemVersion: problem.itemVersion || 1,
      pool: problem.pool,
      transferLevel: problem.transferLevel || null,
      policyVersion: policy.id,
      correct: Boolean(correct),
      firstAnswerCorrect: Boolean(correct),
      eventualCorrect: Boolean(correct),
      attemptCount: 1,
      unhinted,
      qualifiedOpportunity: unhinted,
      errorTypeId: correct ? null : metadata.errorTypeId || null,
      completedAt: correct ? new Date(now).toISOString() : null
    };
    const reviews = { ...state.reviews, [problem.id]: { stage: nextStage, dueAt: now + policy.intervals[nextStage], scheduledBy: policy.id } };
    return { ...state, responses: [...state.responses, response], reviews };
  }

  function completeOpportunity(storedState, problem, attemptCount, now = Date.now()) {
    const state = stateFrom(storedState);
    let target = -1;
    for (let index = state.responses.length - 1; index >= 0; index -= 1) {
      if (state.responses[index].problemId === problem.id && !state.responses[index].completedAt) { target = index; break; }
    }
    if (target < 0) return state;
    const responses = state.responses.map((response, index) => index === target ? { ...response, eventualCorrect: true, attemptCount, completedAt: new Date(now).toISOString() } : response);
    return { ...state, responses };
  }

  const api = { policies, emptyState, stateFrom, chooseNext, recordResponse, completeOpportunity };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoScheduler = api;
})(typeof window !== "undefined" ? window : globalThis);
