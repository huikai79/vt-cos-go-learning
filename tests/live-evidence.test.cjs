const test = require("node:test");
const assert = require("node:assert/strict");
const Go = require("../go.js");
const Live = require("../live-game.js");
const LiveEvidence = require("../live-evidence.js");

const B = Go.BLACK;
const W = Go.WHITE;

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    values
  };
}

test("9 路人機回合會在看答案前辨認唯一一手提子機會", () => {
  const board = Go.boardFromStones([[4,4,W],[3,4,B],[4,3,B],[5,4,B]], 9);
  const game = Live.createGame({ boardSize: 9, initialBoard: board, toPlay: B });
  const assessment = LiveEvidence.assessTurn(game, { opponentMode: "computer", humanColor: B, computerColor: W });
  assert.equal(assessment.status, "eligible");
  assert.equal(assessment.qualifiedOpportunity, true);
  assert.equal(assessment.transferLevel, "T3");
  assert.equal(assessment.evaluationContext, "live");
  assert.equal(assessment.skillId, "capture-last-liberty-v1");
  assert.deepEqual(assessment.successPoint, [4,5]);
  assert.equal(assessment.globalMoveQuality, "not_assessed");
  assert.deepEqual(assessment.boardBefore, game.board);
});

test("多個支援中的局部機會整回合排除，不事後挑一個當分母", () => {
  const board = Go.boardFromStones([
    [2,2,W],[1,2,B],[2,1,B],[3,2,B],
    [6,6,W],[5,6,B],[6,5,B],[7,6,B]
  ], 9);
  const game = Live.createGame({ boardSize: 9, initialBoard: board, toPlay: B });
  const assessment = LiveEvidence.assessTurn(game, { opponentMode: "computer", humanColor: B, computerColor: W });
  assert.equal(assessment.status, "not_eligible");
  assert.equal(assessment.reason, "multiple_supported_opportunities");
  assert.equal(assessment.qualifiedOpportunity, false);
  assert.equal(assessment.transferLevel, null);
});

test("5 路與 7 路目前不升格為 live T3", () => {
  for (const size of [5,7]) {
    const game = Live.createGame({ boardSize: size });
    const assessment = LiveEvidence.assessTurn(game, { opponentMode: "computer", humanColor: B, computerColor: W });
    assert.equal(assessment.status, "not_eligible");
    assert.equal(assessment.reason, "unsupported_context");
    assert.equal(assessment.qualifiedOpportunity, false);
  }
});

test("只接受電腦上一手新造成打吃的唯一直接延長救棋", () => {
  let game = Live.createGame({
    boardSize: 9,
    initialBoard: Go.boardFromStones([[4,4,B],[3,4,W],[4,3,W]], 9),
    toPlay: W
  });
  game = Live.play(game, 5, 4).game;
  const assessment = LiveEvidence.assessTurn(game, { opponentMode: "computer", humanColor: B, computerColor: W });
  assert.equal(assessment.status, "eligible");
  assert.equal(assessment.skillId, "rescue-last-liberty-foundation-v1");
  assert.deepEqual(assessment.successPoint, [4,5]);
  assert.equal(assessment.triggerMoveNumber, 1);
});

test("首答與 retry 分開，retry 不改寫 qualified opportunity", () => {
  const board = Go.boardFromStones([[4,4,W],[3,4,B],[4,3,B],[5,4,B]], 9);
  const game = Live.createGame({ boardSize: 9, initialBoard: board, toPlay: B });
  const assessment = {
    ...LiveEvidence.assessTurn(game, { opponentMode: "computer", humanColor: B, computerColor: W }),
    assessmentId: "a1",
    sessionId: "s1"
  };
  const first = LiveEvidence.responseEvent(assessment, { action: "play", point: [3,4], legal: false, reason: "occupied_point" }, { firstResponse: true, eventId: "r1", occurredAt: "2026-09-22T12:00:00.000Z" });
  const retry = LiveEvidence.responseEvent(assessment, { action: "play", point: [4,5], legal: true }, { firstResponse: false, eventId: "r2", occurredAt: "2026-09-22T12:00:01.000Z" });
  assert.equal(first.type, "first_response");
  assert.equal(first.outcome, "invalid_first_response");
  assert.equal(first.qualifiedOpportunity, true);
  assert.equal(retry.type, "retry_response");
  assert.equal(retry.eventualCorrection, true);
  assert.equal(retry.qualifiedOpportunity, false);
  assert.equal(retry.transferLevel, null);
});

test("未作答的 eligible assessment 留在分母，進度不製造 mastery 百分比", () => {
  const storage = memoryStorage();
  const baseAssessment = {
    schemaVersion: 1,
    status: "eligible",
    qualifiedOpportunity: true,
    skillId: "capture-last-liberty-v1",
    boardSize: 9,
    boardFingerprint: "abc",
    moveCount: 4,
    targetStones: [[4,4]],
    successPoint: [4,5],
    targetGroupSize: 1,
    reason: "unique_rule_scored_local_contract",
    transferLevel: "T3",
    evaluationContext: "live",
    humanColor: B,
    computerColor: W,
    opponentMode: "computer",
    boardBefore: Go.emptyBoard(9),
    previousBoard: null,
    assessmentId: "a1",
    sessionId: "s1",
    eventId: "assessment:a1",
    occurredAt: "2026-09-22T12:00:00.000Z"
  };
  const assessmentEvent = LiveEvidence.assessmentEvent(baseAssessment);
  assert.equal(LiveEvidence.append(storage, assessmentEvent).ok, true);
  const summary = LiveEvidence.summarize(LiveEvidence.read(storage).store);
  const skill = summary.skills.find((item) => item.skillId === "capture-last-liberty-v1");
  assert.equal(summary.eligibleOpportunities, 1);
  assert.equal(skill.eligibleOpportunities, 1);
  assert.equal(skill.firstResponses, 0);
  assert.equal(skill.unansweredOpportunities, 1);
  assert.equal("masteryPercent" in skill, false);
});

test("assessment、first response、retry 與 contract 版本可完整匯出重算", () => {
  const storage = memoryStorage();
  const board = Go.boardFromStones([[4,4,W],[3,4,B],[4,3,B],[5,4,B]], 9);
  const game = Live.createGame({ boardSize: 9, initialBoard: board, toPlay: B });
  const assessed = LiveEvidence.assessTurn(game, { opponentMode: "computer", humanColor: B, computerColor: W });
  const assessment = { ...assessed, assessmentId: "a2", sessionId: "s2" };
  const ae = LiveEvidence.assessmentEvent({ ...assessment, eventId: "assessment:a2", occurredAt: "2026-09-22T12:00:00.000Z" });
  const re = LiveEvidence.responseEvent(assessment, { action: "play", point: [4,5], legal: true }, { firstResponse: true, eventId: "first:a2:1", occurredAt: "2026-09-22T12:00:01.000Z" });
  assert.equal(LiveEvidence.append(storage, ae).ok, true);
  assert.equal(LiveEvidence.append(storage, re).ok, true);
  const stored = LiveEvidence.read(storage).store;
  assert.equal(stored.events.length, 2);
  assert.equal(stored.events[0].eligibilityContractVersion, LiveEvidence.ELIGIBILITY_CONTRACT_VERSION);
  assert.equal(stored.events[1].scoringContractVersion, LiveEvidence.SCORING_CONTRACT_VERSION);
  const summary = LiveEvidence.summarize(stored);
  const skill = summary.skills.find((item) => item.skillId === "capture-last-liberty-v1");
  assert.equal(skill.satisfiedFirstResponses, 1);
  assert.equal(skill.evidenceState, "accumulating");
});

test("損壞 live evidence store fail-closed，不回退成零進度", () => {
  const storage = { getItem() { return "{broken"; }, setItem() {} };
  const result = LiveEvidence.read(storage);
  assert.equal(result.ok, false);
  assert.equal(result.error, "live_evidence_store_malformed");
  assert.equal(result.store, null);
});
