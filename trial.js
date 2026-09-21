(function (root) {
  "use strict";
  const DAY = 24 * 60 * 60 * 1000;
  const knownLearnerExposure = {
    id: "r1-self-review-v1-draft-2026-09-20",
    scope: "current_personal_profile",
    status: "seen",
    source: "R1_獨立審題草稿.json",
    problemIds: [
      "p2-c-4-1", "p2-c-4-2", "p2-c-4-3", "p2-c-4-4", "p2-c-4-5", "p2-c-4-6",
      "p2-c-5-1", "p2-c-5-2", "p2-c-5-3", "p2-c-5-4", "p2-c-5-5", "p2-c-5-6",
      "p2-j-7-1", "p2-j-7-2", "p2-j-7-3", "p2-j-7-4", "p2-j-7-5",
      "p2-j-8-1", "p2-j-8-2", "p2-j-8-3", "p2-j-8-4", "p2-j-8-5"
    ]
  };
  const pilotProblemIds = {
    "rotation-a": ["p2-c-4-1", "p2-c-4-3", "p2-j-7-1", "p2-j-7-3"],
    "rotation-b": ["p2-c-5-2", "p2-c-5-4", "p2-j-8-2", "p2-j-8-4"]
  };
  const protocol = {
    id: "personal-pilot-v3",
    version: 3,
    claimMode: "personal_descriptive",
    useMode: "pilot_disposable",
    formalEligible: false,
    formalEvaluationAvailable: false,
    skills: ["capture-last-liberty-v1", "direct-join-v1"],
    batches: ["rotation-a", "rotation-b"],
    itemsPerSkill: 2,
    followupDelayMs: 7 * DAY,
    primaryOutcome: "已知曝光 pilot 題的無提示首答描述",
    secondaryOutcome: "固定應用探測的無提示首答描述",
    interpretation: "兩批只作資料管線、返回流程與操作負擔試行；題目已在舊 R1 自我審查中曝光，不是正式未見題，不推論改善、保留、遷移、因果、跨人效果或永久精熟。",
    knownLearnerExposure,
    pilotProblemIds
  };

  function emptyState() {
    return { schemaVersion: 3, protocolId: protocol.id, claimMode: protocol.claimMode, useMode: protocol.useMode, formalEligible: false, reviewGate: "personal_pilot_only", startedAt: null, batches: [], presentations: [], answers: [], legacyTrials: [] };
  }

  function stateFrom(value) {
    if (!value) return emptyState();
    if (value.schemaVersion !== 3 || value.protocolId !== protocol.id) {
      const knownLegacy = ["personal-longitudinal-v1", "personal-longitudinal-v2"].includes(value.protocolId);
      const invalidReason = knownLegacy
        ? "舊 trial 使用未分離的保留題；對目前學習者已在 R1 自我審查曝光，保留原值但不得升格為正式未見或學習成效證據。"
        : "未知 trial schema；保留原值但不納入現行摘要。";
      return { ...emptyState(), legacyTrials: [...(Array.isArray(value.legacyTrials) ? value.legacyTrials : []), { ...value, invalidForEvidence: true, invalidReason }], migratedAt: new Date().toISOString() };
    }
    return {
      ...emptyState(),
      ...value,
      schemaVersion: 3,
      protocolId: protocol.id,
      claimMode: protocol.claimMode,
      useMode: protocol.useMode,
      formalEligible: false,
      reviewGate: "personal_pilot_only",
      batches: (value.batches || []).map((batch) => ({ ...batch, useMode: protocol.useMode, formalEligible: false })),
      presentations: (value.presentations || []).map((presentation) => ({ ...presentation, useMode: protocol.useMode, formalEligible: false, firstExposure: false, priorExposureSource: knownLearnerExposure.id })),
      answers: (value.answers || []).map((answer) => ({ ...answer, useMode: protocol.useMode, formalEligible: false })),
      legacyTrials: value.legacyTrials || []
    };
  }

  function answersFor(state, batchId) { return state.answers.filter((answer) => answer.batchId === batchId); }
  function batchProblems(allProblems, label) {
    const byId = new Map(allProblems.map((problem) => [problem.id, problem]));
    return (protocol.pilotProblemIds[label] || []).map((problemId) => byId.get(problemId)).filter(Boolean);
  }

  function startOrResume(storedState, allProblems, now = Date.now()) {
    let state = stateFrom(storedState);
    if (!state.startedAt) state = { ...state, reviewGate: "personal_pilot_only", reviewGateSetAt: new Date(now).toISOString() };
    const active = state.batches.find((batch) => !batch.completedAt);
    if (active) return { state, batch: active, reason: "resume_active_batch" };
    const completed = state.batches.filter((batch) => batch.completedAt);
    const label = protocol.batches[completed.length];
    if (!label) return { state, batch: null, reason: "all_batches_complete" };
    if (completed.length) {
      const dueAt = new Date(completed.at(-1).completedAt).getTime() + protocol.followupDelayMs;
      if (now < dueAt) return { state, batch: null, reason: "followup_not_due", dueAt };
    }
    const problems = batchProblems(allProblems, label);
    const expected = protocol.skills.length * protocol.itemsPerSkill;
    if (problems.length !== expected) throw new Error(`驗收批次 ${label} 題數不足：需要 ${expected} 題`);
    const knownExposureIds = new Set(knownLearnerExposure.problemIds);
    if (problems.some((problem) => !knownExposureIds.has(problem.id))) throw new Error(`pilot 批次 ${label} 含有未列入已知曝光清單的題目`);
    const batch = { id: `${protocol.id}-${label}`, label, role: completed.length ? "followup" : "baseline", useMode: protocol.useMode, formalEligible: false, problemIds: problems.map((problem) => problem.id), createdAt: new Date(now).toISOString(), completedAt: null };
    state = { ...state, startedAt: state.startedAt || batch.createdAt, batches: [...state.batches, batch] };
    return { state, batch, reason: "new_batch" };
  }

  function nextProblem(storedState, batch, allProblems) {
    const state = stateFrom(storedState);
    const answered = new Set(answersFor(state, batch.id).map((answer) => answer.problemId));
    const problemId = batch.problemIds.find((id) => !answered.has(id));
    return problemId ? allProblems.find((problem) => problem.id === problemId) || null : null;
  }

  function markPresented(storedState, batch, problem, now = Date.now(), metadata = {}) {
    const state = stateFrom(storedState);
    if (state.presentations.some((item) => item.batchId === batch.id && item.problemId === problem.id)) return state;
    return { ...state, presentations: [...state.presentations, { ...metadata, occurredAt: new Date(now).toISOString(), batchId: batch.id, batchRole: batch.role, problemId: problem.id, skillId: problem.skillId, familyId: problem.familyId, transferLevel: problem.transferLevel, hintAllowed: false, useMode: protocol.useMode, formalEligible: false, firstExposure: false, priorExposureSource: knownLearnerExposure.id }] };
  }

  function recordAnswer(storedState, batch, problem, correct, answerValue, elapsedMs, now = Date.now(), metadata = {}) {
    let state = stateFrom(storedState);
    if (state.answers.some((item) => item.batchId === batch.id && item.problemId === problem.id)) return state;
    const answer = { ...metadata, occurredAt: new Date(now).toISOString(), batchId: batch.id, batchRole: batch.role, problemId: problem.id, skillId: problem.skillId, familyId: problem.familyId, transferLevel: problem.transferLevel, correct: Boolean(correct), answerValue, firstAnswer: true, unhinted: true, elapsedMs, useMode: protocol.useMode, formalEligible: false };
    state = { ...state, answers: [...state.answers, answer] };
    if (answersFor(state, batch.id).length === batch.problemIds.length) {
      state = { ...state, batches: state.batches.map((item) => item.id === batch.id ? { ...item, completedAt: new Date(now).toISOString() } : item) };
    }
    return state;
  }

  function summarize(storedState, applicationResults = [], applicationEvents = []) {
    const state = stateFrom(storedState);
    const reviewNotice = "這是個人 pilot 操作與負擔試行；題目已在舊 R1 自我審查中曝光，不能作正式未見、題目效度、保留、遷移或學習成效證據。";
    const completed = state.batches.filter((batch) => batch.completedAt);
    const batchResults = completed.map((batch) => {
      const answers = answersFor(state, batch.id);
      const bySkill = Object.fromEntries(protocol.skills.map((skillId) => {
        const skillAnswers = answers.filter((answer) => answer.skillId === skillId);
        return [skillId, { correct: skillAnswers.filter((answer) => answer.correct).length, total: skillAnswers.length }];
      }));
      return { id: batch.id, role: batch.role, label: batch.label, correct: answers.filter((answer) => answer.correct).length, total: answers.length, bySkill, completedAt: batch.completedAt };
    });
    const firstResultMap = new Map();
    for (const result of applicationResults) if (result.problemId && !firstResultMap.has(result.problemId)) firstResultMap.set(result.problemId, result);
    const firstByProblem = [...firstResultMap.values()];
    const eligibleApplication = firstByProblem.filter((result) => result.unhinted);
    const applicable = eligibleApplication.filter((result) => result.applicability !== "not_applicable");
    const application = {
      correct: applicable.filter((result) => result.correct).length,
      total: applicable.length,
      inappropriateUseErrors: eligibleApplication.filter((result) => result.applicability === "not_applicable" && !result.correct).length,
      excludedHintedOrRepeated: applicationResults.length - eligibleApplication.length,
      presented: new Set(applicationEvents.filter((event) => event.type === "presented").map((event) => event.presentationId)).size,
      unansweredOrInterrupted: applicationEvents.filter((event) => event.type === "presentation_end" && ["unanswered", "interrupted", "unfinished_after_attempt"].includes(event.outcome)).length
    };
    if (batchResults.length < 2) return { status: "data_insufficient", label: "資料不足", reviewGate: state.reviewGate, reviewNotice, batchResults, application, reason: `${reviewNotice} 尚未完成基線與七天後追蹤批次。` };
    const bySkillDirection = Object.fromEntries(protocol.skills.map((skillId) => {
      const baseline = batchResults[0].bySkill[skillId];
      const followup = batchResults[1].bySkill[skillId];
      const delta = followup.correct - baseline.correct;
      return [skillId, { baseline, followup, delta, direction: delta > 0 ? "較高" : delta < 0 ? "較低" : "相同" }];
    }));
    return { status: "data_insufficient", label: "兩批描述完成，仍屬資料不足", reviewGate: state.reviewGate, reviewNotice, delta: batchResults[1].correct - batchResults[0].correct, bySkillDirection, batchResults, application, reason: `${reviewNotice} ${protocol.interpretation}` };
  }

  const api = { DAY, protocol, emptyState, stateFrom, startOrResume, nextProblem, markPresented, recordAnswer, summarize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoTrial = api;
})(typeof window !== "undefined" ? window : globalThis);
