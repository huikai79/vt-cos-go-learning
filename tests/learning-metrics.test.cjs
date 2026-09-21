const test = require("node:test");
const assert = require("node:assert/strict");
const Metrics = require("../learning-metrics.js");

const day = 24 * 60 * 60 * 1000;
const at = (offset) => new Date(Date.UTC(2026, 0, 1) + offset).toISOString();

function response(offset, correct, extra = {}) {
  return {
    occurredAt: at(offset),
    problemId: `p-${offset}`,
    skillId: "capture-last-liberty-v1",
    skillVersion: 1,
    firstAnswerCorrect: correct,
    unhinted: true,
    qualifiedOpportunity: true,
    transferLevel: "T0",
    pool: "practice",
    ...extra
  };
}

test("錯誤分類只描述可觀察的技能結果", () => {
  const type = Metrics.errorTypeForSkill("capture-last-liberty-v1");
  assert.equal(type.id, "capture-last-liberty-outcome-miss-v1");
  assert.match(type.interpretation, /不推定/);
  const summary = Metrics.summarize({ schedulerResponses: [response(0, false)] });
  assert.equal(summary.skills[0].observedErrors, 1);
  assert.match(summary.interpretationBoundary, /不代表已確認心理或認知根因/);
});

test("SCD 只在兩次延後、未提示、非 holdout 的 T2 首答後完成", () => {
  const schedulerResponses = [
    response(0, false),
    response(12 * 60 * 60 * 1000, true, { transferLevel: "T2", pool: "process_check" }),
    response(2 * day, true, { transferLevel: "T2", pool: "holdout" }),
    response(2 * day, true, { transferLevel: "T2", pool: "process_check" }),
    response(8 * day, true, { transferLevel: "T2", pool: "process_check" })
  ];
  const summary = Metrics.summarize({ schedulerResponses });
  const scd = summary.skills[0].scd;
  assert.equal(scd.status, "completed");
  assert.equal(scd.completed.length, 1);
  assert.equal(scd.completed[0].relevantOpportunityCount, 4);
  assert.equal(scd.completed[0].firstDelayedProbeAt, at(2 * day));
  assert.equal(scd.completed[0].secondDelayedProbeAt, at(8 * day));
});

test("尚未達到延後 T2 門檻時保留待驗與已練機會數", () => {
  const summary = Metrics.summarize({ schedulerResponses: [response(0, false), response(day, true)] });
  const scd = summary.skills[0].scd;
  assert.equal(scd.status, "awaiting_first_delayed_t2");
  assert.equal(scd.active.relevantOpportunityCount, 1);
  assert.match(scd.active.requirement, /非 holdout T2/);
});

test("再犯間隔以兩次同類技能錯誤之間的成功機會計數", () => {
  const summary = Metrics.summarize({ schedulerResponses: [response(0, false), response(day, true), response(2 * day, true), response(3 * day, false), response(4 * day, true)] });
  const recurrence = summary.skills[0].recurrence;
  assert.equal(recurrence.status, "recurrence_observed");
  assert.equal(recurrence.intervals.length, 1);
  assert.equal(recurrence.intervals[0].successfulOpportunitiesBetween, 2);
  assert.equal(recurrence.latestLowerBound.successfulOpportunitiesWithoutRecurrence, 1);
});

test("缺少提示資格欄位的舊排程紀錄不被猜測成合格機會", () => {
  const summary = Metrics.summarize({
    events: [{ type: "answer", occurredAt: at(0), skillId: "capture-last-liberty-v1", outcome: "incorrect" }],
    schedulerResponses: [{ occurredAt: at(0), skillId: "capture-last-liberty-v1", firstAnswerCorrect: false }]
  });
  assert.equal(summary.skills.length, 0);
  assert.equal(summary.excludedResponsesWithoutQualification, 2);
});
