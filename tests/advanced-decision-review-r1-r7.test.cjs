const test = require("node:test");
const assert = require("node:assert/strict");

const Sgf = require("../sgf.js");
const Tools = require("../advanced-decision-review-tools.js");
const ReviewPackage = require("../advanced-decision-review-package.js");

function fakeGame() {
  return {
    boardSize: 19,
    moves: [
      { number: 1, nodeIndex: 1, color: 1, point: [3, 3], result: { captured: [] } },
      { number: 2, nodeIndex: 2, color: 2, point: [15, 15], result: { captured: [] } },
      { number: 3, nodeIndex: 3, color: 1, point: [4, 3], result: { captured: [[5, 5], [5, 6], [6, 5]] } },
      { number: 4, nodeIndex: 4, color: 2, point: [10, 10], result: { captured: [] } },
      { number: 5, nodeIndex: 5, color: 1, point: [3, 3], result: { captured: [] } },
      { number: 6, nodeIndex: 6, color: 2, point: [11, 10], result: { captured: [[9, 9]] } },
      { number: 7, nodeIndex: 7, color: 1, point: [6, 6], result: { captured: [] } }
    ]
  };
}

test("R1：未知執棋方保持 neutral，不由棋譜推測 learner side", () => {
  const game = fakeGame();
  assert.equal(Tools.normalizePerspective("unknown"), "neutral");
  assert.deepEqual(Tools.movesForPerspective(game, "neutral").map((move) => move.number), [1,2,3,4,5,6,7]);
  assert.deepEqual(Tools.movesForPerspective(game, "black").map((move) => move.number), [1,3,5,7]);
  assert.deepEqual(Tools.movesForPerspective(game, "white").map((move) => move.number), [2,4,6]);
  assert.equal(Tools.actorLabel(1, "neutral"), "黑棋");
  assert.equal(Tools.actorLabel(1, "black"), "你的黑棋");
});

test("R3：deterministic event 只描述棋盤事實，不產生錯手、KC 或 ko 推論", () => {
  const events = Tools.buildFactualEvents(fakeGame());
  const capture = events.find((event) => event.type === "capture" && event.moveNumber === 3);
  assert.ok(capture);
  assert.equal(capture.capturedCount, 3);
  assert.equal(capture.claimScope, "board_event_only");
  assert.equal("correct" in capture, false);
  assert.equal("skillId" in capture, false);
  assert.equal("kcId" in capture, false);

  const repeated = events.find((event) => event.type === "point_reoccupied");
  assert.ok(repeated);
  assert.equal(repeated.moveNumber, 5);
  assert.equal(repeated.priorMoveNumber, 1);
  assert.equal(repeated.occurrence, 2);
  assert.equal("ko" in repeated, false);
  assert.doesNotMatch(Tools.describeEvent(repeated, "neutral"), /劫|錯/);
});

test("R4：結果事件往前回看時依 learner perspective 找到先前可落子手，不把 outcome move 當 causal move", () => {
  const game = fakeGame();
  assert.equal(Tools.findReviewTarget(game, 7, 3, "neutral").number, 4);
  assert.equal(Tools.findReviewTarget(game, 7, 3, "black").number, 3);
  assert.equal(Tools.findReviewTarget(game, 7, 3, "white").number, 4);
  assert.equal(Tools.findReviewTarget(game, 3, 5, "neutral"), null);
});

test("R3：事件導航排序以 capture count 作定位 heuristic，但不改 evidence authority", () => {
  const selected = Tools.selectNavigationEvents(Tools.buildFactualEvents(fakeGame()), 3);
  assert.equal(selected.length, 3);
  assert.equal(selected[0].type, "capture");
  assert.equal(selected[0].capturedCount, 3);
  assert.ok(selected.every((event) => event.claimScope === "board_event_only"));
});

const simple19 = "(;GM[1]FF[4]SZ[19]RU[Chinese]KM[7.5];B[dd];W[pp];B[qq])";

test("R2：既有 19 路 parser 仍是任意決策點重建的唯一來源", () => {
  const game = Sgf.parseDecisionReviewSgf(simple19);
  assert.equal(game.boardSize, 19);
  assert.deepEqual(game.moves.map((move) => move.number), [1,2,3]);
  const exp = Sgf.makeDecisionReviewExperience(simple19, 2, "synthetic.sgf");
  assert.equal(exp.source.moveNumber, 2);
  assert.equal(exp.boardSize, 19);
  assert.equal(exp.formalEligible, false);
  assert.equal(exp.transferLevel, null);
});

test("R7：複盤包 round-trip 只保存 review context，不保存 evidence event", () => {
  const text = ReviewPackage.stringifyPackage({
    sgfText: simple19,
    sourceName: "synthetic.sgf",
    perspective: "black",
    selectedMoveNumber: 3,
    exportedAt: "2026-10-01T00:00:00.000Z"
  });
  const restored = ReviewPackage.parsePackage(text);
  assert.equal(restored.authority, "review_artifact_only");
  assert.equal(restored.formalEligible, false);
  assert.equal(restored.evidenceImport, false);
  assert.equal(restored.perspective, "black");
  assert.equal(restored.selectedMoveNumber, 3);
  assert.equal("events" in restored, false);
  assert.equal(restored.source.sourceId, Sgf.sourceFingerprint(simple19));
});

test("R7 反證：偽造 evidence/event 欄位的複盤包 fail closed", () => {
  const value = ReviewPackage.buildPackage({
    sgfText: simple19,
    sourceName: "synthetic.sgf",
    perspective: "neutral"
  });
  value.events = [{ type: "candidate_first", correct: true }];
  assert.throws(() => ReviewPackage.parsePackage(JSON.stringify(value)), /review_package_evidence_not_allowed/);
});

test("R7 反證：SGF bytes 與 source fingerprint 不一致時拒絕載入", () => {
  const value = ReviewPackage.buildPackage({
    sgfText: simple19,
    sourceName: "synthetic.sgf",
    perspective: "neutral"
  });
  value.source.sourceId = "sgf-tampered";
  assert.throws(() => ReviewPackage.parsePackage(JSON.stringify(value)), /review_package_source_mismatch/);
});

test("R7 反證：9 路與含分支 SGF 不能冒充 19 路複盤包", () => {
  assert.throws(() => ReviewPackage.buildPackage({
    sgfText: "(;SZ[9];B[dd])",
    perspective: "neutral"
  }), /決策點複盤目前只支援 19 路棋譜/);
  assert.throws(() => ReviewPackage.buildPackage({
    sgfText: "(;SZ[19];B[dd](;W[pp])(;W[qq]))",
    perspective: "neutral"
  }), /目前不支援含分支變化的棋譜/);
});
