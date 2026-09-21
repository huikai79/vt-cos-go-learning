const test = require("node:test");
const assert = require("node:assert/strict");
const Trial = require("../trial.js");
const { phase2Problems } = require("../phase2-content.js");

function answerBatch(state, batch, correctValues, startAt) {
  for (let index = 0; index < batch.problemIds.length; index += 1) {
    const problem = phase2Problems.find((item) => item.id === batch.problemIds[index]);
    state = Trial.markPresented(state, batch, problem, startAt + index);
    state = Trial.recordAnswer(state, batch, problem, correctValues[index], "test", 1000, startAt + index);
  }
  return state;
}

test("基線與追蹤使用不同已曝光 pilot 題，追蹤至少七天後才開放", () => {
  let decision = Trial.startOrResume(null, phase2Problems, 0);
  assert.equal(decision.batch.role, "baseline");
  assert.equal(decision.batch.problemIds.length, 4);
  assert.equal(decision.batch.useMode, "pilot_disposable");
  assert.equal(decision.batch.formalEligible, false);
  assert.ok(decision.batch.problemIds.every((id) => Trial.protocol.knownLearnerExposure.problemIds.includes(id)));
  let state = answerBatch(decision.state, decision.batch, [true, false, false, false], 1000);
  const early = Trial.startOrResume(state, phase2Problems, Trial.DAY * 6);
  assert.equal(early.batch, null);
  assert.equal(early.reason, "followup_not_due");
  decision = Trial.startOrResume(state, phase2Problems, Trial.DAY * 8);
  assert.equal(decision.batch.role, "followup");
  assert.equal(new Set([...state.batches[0].problemIds, ...decision.batch.problemIds]).size, 8);
  const baselineFamilies = new Set(state.batches[0].problemIds.map((id) => phase2Problems.find((problem) => problem.id === id).familyId));
  const followupFamilies = new Set(decision.batch.problemIds.map((id) => phase2Problems.find((problem) => problem.id === id).familyId));
  assert.equal([...baselineFamilies].some((familyId) => followupFamilies.has(familyId)), false);
});

test("個人 pilot 狀態與摘要明示已曝光及正式證據限制", () => {
  const decision = Trial.startOrResume(null, phase2Problems, 0, { reviewGate: "personal_pilot_only" });
  assert.equal(decision.state.reviewGate, "personal_pilot_only");
  assert.equal(decision.state.claimMode, "personal_descriptive");
  assert.equal(decision.state.formalEligible, false);
  const summary = Trial.summarize(decision.state);
  assert.equal(summary.reviewGate, "personal_pilot_only");
  assert.match(summary.reviewNotice, /個人 pilot/);
  assert.match(summary.reason, /不能作正式未見、題目效度、保留、遷移或學習成效證據/);
});

test("已知自我審查曝光共 22 題，兩批八題全部包含在其中且呈現不冒充首次曝光", () => {
  assert.equal(Trial.protocol.knownLearnerExposure.problemIds.length, 22);
  const pilotIds = Object.values(Trial.protocol.pilotProblemIds).flat();
  assert.equal(new Set(pilotIds).size, 8);
  assert.ok(pilotIds.every((id) => Trial.protocol.knownLearnerExposure.problemIds.includes(id)));
  const decision = Trial.startOrResume(null, phase2Problems, 0);
  const problem = phase2Problems.find((item) => item.id === decision.batch.problemIds[0]);
  const state = Trial.markPresented(decision.state, decision.batch, problem, 1);
  assert.equal(state.presentations[0].firstExposure, false);
  assert.equal(state.presentations[0].formalEligible, false);
  assert.equal(state.presentations[0].priorExposureSource, Trial.protocol.knownLearnerExposure.id);
});

test("兩批完成後只描述按技能方向，並分開摘要固定應用探測", () => {
  let baseline = Trial.startOrResume(null, phase2Problems, 0);
  let state = answerBatch(baseline.state, baseline.batch, [true, false, false, false], 1000);
  let followup = Trial.startOrResume(state, phase2Problems, Trial.DAY * 8);
  state = answerBatch(followup.state, followup.batch, [true, true, true, false], Trial.DAY * 8 + 1000);
  const summary = Trial.summarize(state, [
    { problemId: "app-1", correct: true, applicability: "applicable", unhinted: true },
    { problemId: "app-2", correct: false, applicability: "not_applicable", unhinted: true }
  ]);
  assert.equal(summary.status, "data_insufficient");
  assert.equal(summary.delta, 2);
  assert.deepEqual(summary.bySkillDirection["capture-last-liberty-v1"], {
    baseline: { correct: 1, total: 2 }, followup: { correct: 2, total: 2 }, delta: 1, direction: "較高"
  });
  assert.deepEqual(summary.application, { correct: 1, total: 1, inappropriateUseErrors: 1, excludedHintedOrRepeated: 0, presented: 0, unansweredOrInterrupted: 0 });
});

test("固定應用探測只計每個局面的第一次未提示首答，並保留呈現分母", () => {
  const summary = Trial.summarize(null, [
    { problemId: "app-1", correct: false, applicability: "applicable", unhinted: false },
    { problemId: "app-1", correct: true, applicability: "applicable", unhinted: true },
    { problemId: "app-2", correct: true, applicability: "applicable", unhinted: true }
  ], [
    { type: "presented", presentationId: "p-1" },
    { type: "presentation_end", presentationId: "p-1", outcome: "unanswered" },
    { type: "presented", presentationId: "p-2" }
  ]);
  assert.deepEqual(summary.application, { correct: 1, total: 1, inappropriateUseErrors: 0, excludedHintedOrRepeated: 2, presented: 2, unansweredOrInterrupted: 1 });
});

test("v1 驗收資料遷移後保留為不可用舊資料，不混入 v3 摘要", () => {
  const migrated = Trial.stateFrom({ schemaVersion: 1, protocolId: "personal-longitudinal-v1", batches: [{ id: "old" }], answers: [{ correct: true }] });
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.protocolId, "personal-pilot-v3");
  assert.deepEqual(migrated.batches, []);
  assert.deepEqual(migrated.answers, []);
  assert.equal(migrated.legacyTrials.length, 1);
  assert.equal(migrated.legacyTrials[0].invalidForEvidence, true);
  assert.match(migrated.legacyTrials[0].invalidReason, /R1 自我審查曝光/);
});

test("v2 個人試行也保留為 legacy，不回溯升格", () => {
  const migrated = Trial.stateFrom({ schemaVersion: 2, protocolId: "personal-longitudinal-v2", batches: [{ id: "old-v2" }], presentations: [], answers: [] });
  assert.equal(migrated.protocolId, "personal-pilot-v3");
  assert.deepEqual(migrated.batches, []);
  assert.equal(migrated.legacyTrials.length, 1);
  assert.equal(migrated.legacyTrials[0].invalidForEvidence, true);
});

test("現行狀態與呼叫端 metadata 不能把 pilot 升格成正式或首次曝光證據", () => {
  const normalized = Trial.stateFrom({
    ...Trial.emptyState(),
    formalEligible: true,
    reviewGate: "formal_ready",
    batches: [{ id: "tampered", formalEligible: true }],
    presentations: [{ problemId: "p2-c-4-1", formalEligible: true, firstExposure: true }],
    answers: [{ problemId: "p2-c-4-1", formalEligible: true }]
  });
  assert.equal(normalized.formalEligible, false);
  assert.equal(normalized.reviewGate, "personal_pilot_only");
  assert.equal(normalized.batches[0].formalEligible, false);
  assert.equal(normalized.presentations[0].formalEligible, false);
  assert.equal(normalized.presentations[0].firstExposure, false);
  assert.equal(normalized.answers[0].formalEligible, false);

  const decision = Trial.startOrResume(null, phase2Problems, 0, { reviewGate: "formal_ready" });
  const problem = phase2Problems.find((item) => item.id === decision.batch.problemIds[0]);
  let state = Trial.markPresented(decision.state, decision.batch, problem, 1, { formalEligible: true, firstExposure: true, hintAllowed: true });
  state = Trial.recordAnswer(state, decision.batch, problem, true, "test", 1000, 2, { formalEligible: true, firstAnswer: false, unhinted: false, correct: false });
  assert.equal(state.reviewGate, "personal_pilot_only");
  assert.equal(state.presentations[0].formalEligible, false);
  assert.equal(state.presentations[0].firstExposure, false);
  assert.equal(state.presentations[0].hintAllowed, false);
  assert.equal(state.answers[0].formalEligible, false);
  assert.equal(state.answers[0].firstAnswer, true);
  assert.equal(state.answers[0].unhinted, true);
  assert.equal(state.answers[0].correct, true);
});
