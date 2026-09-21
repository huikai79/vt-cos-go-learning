const test = require("node:test");
const assert = require("node:assert/strict");
const { phase2Problems } = require("../phase2-content.js");
const Scheduler = require("../scheduler.js");

const now = Date.UTC(2026, 8, 20, 9, 0, 0);

test("固定間隔只選練習／流程檢核題，並保存政策與到期時間", () => {
  const initial = Scheduler.chooseNext(phase2Problems, Scheduler.emptyState(), "fixed-spacing-v1", now);
  assert.equal(initial.problem.pool, "practice");
  assert.equal(initial.event.policyVersion, "fixed-spacing-v1");
  const state = Scheduler.recordResponse(initial.state, initial.problem, "fixed-spacing-v1", true, now);
  assert.equal(state.reviews[initial.problem.id].dueAt, now + 24 * 60 * 60 * 1000);
  assert.equal(state.responses[0].correct, true);
});

test("自適應候選只在答錯後優先同母題的未見變形，且不取用保留題", () => {
  const first = Scheduler.chooseNext(phase2Problems, Scheduler.emptyState(), "adaptive-candidate-v1", now);
  const answered = Scheduler.recordResponse(first.state, first.problem, "adaptive-candidate-v1", false, now);
  const second = Scheduler.chooseNext(phase2Problems, answered, "adaptive-candidate-v1", now + 1);
  assert.equal(second.problem.familyId, first.problem.familyId);
  assert.notEqual(second.problem.id, first.problem.id);
  assert.equal(second.problem.pool, "practice");
  assert.equal(second.event.selectionReason, "immediate_unseen_variant_after_error");
});

test("同一題先錯後對仍保留首答錯誤，並驅動下一題選同母題變形", () => {
  const first = Scheduler.chooseNext(phase2Problems, Scheduler.emptyState(), "adaptive-candidate-v1", now);
  let state = Scheduler.recordResponse(first.state, first.problem, "adaptive-candidate-v1", false, now);
  state = Scheduler.completeOpportunity(state, first.problem, 2, now + 1);
  assert.equal(state.responses.length, 1);
  assert.equal(state.responses[0].firstAnswerCorrect, false);
  assert.equal(state.responses[0].eventualCorrect, true);
  assert.equal(state.responses[0].attemptCount, 2);
  const second = Scheduler.chooseNext(phase2Problems, state, "adaptive-candidate-v1", now + 2);
  assert.equal(second.problem.familyId, first.problem.familyId);
  assert.equal(second.event.selectionReason, "immediate_unseen_variant_after_error");
  const fixed = Scheduler.chooseNext(phase2Problems, state, "fixed-spacing-v1", now + 2);
  assert.equal(fixed.event.selectionReason, "new_practice_item");
});

test("個人單機模式停用 scheduler 的正式 evaluation 入口", () => {
  const result = Scheduler.chooseNext(phase2Problems, Scheduler.emptyState(), "fixed-spacing-v1", now, "evaluation");
  assert.equal(result, null);
});
