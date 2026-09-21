const test = require("node:test");
const assert = require("node:assert/strict");
const Go = require("../go.js");
const { phase2Problems, applicationProbes, publicationPolicy } = require("../phase2-content.js");

function sameGroup(board, first, second) {
  return Go.groupAt(board, first[0], first[1]).stones.some(([x, y]) => x === second[0] && y === second[1]);
}

function assertGoal(problem) {
  const board = Go.boardFromStones(problem.stones);
  const result = Go.playMove(board, problem.answer[0], problem.answer[1], Go.BLACK);
  assert.equal(result.legal, true, `${problem.id} answer must be legal`);
  if (problem.goal.type === "capture") {
    assert.equal(result.captured.length, problem.goal.count, `${problem.id} capture count`);
    assert.ok(result.captured.some(([x, y]) => x === problem.goal.target[0] && y === problem.goal.target[1]), `${problem.id} target must be captured`);
  } else if (problem.goal.type === "join") {
    assert.equal(sameGroup(board, ...problem.goal.targets), false, `${problem.id} must start separated`);
    assert.equal(sameGroup(result.board, ...problem.goal.targets), true, `${problem.id} must join`);
  } else if (problem.goal.type === "rescue") {
    const [x, y] = problem.goal.target;
    assert.equal(Go.groupAt(board, x, y).liberties.length, 1, `${problem.id} must start in atari`);
    assert.ok(Go.groupAt(result.board, x, y).liberties.length > 1, `${problem.id} must gain liberties`);
  } else if (problem.goal.type === "exact") {
    assert.deepEqual(problem.answer, problem.goal.answer, `${problem.id} exact vital point`);
  } else {
    assert.fail(`${problem.id} has an unknown goal`);
  }
}

test("Phase 2 題庫保留 100 題基礎技巧並加入 48 題兩類死活", () => {
  assert.equal(phase2Problems.length, 148);
  assert.equal(new Set(phase2Problems.map((problem) => problem.id)).size, 148);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "capture-last-liberty-v1").length, 30);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "direct-join-v1").length, 40);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "rescue-last-liberty-foundation-v1").length, 30);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "make-two-eyes-straight-three-v1").length, 12);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "kill-straight-three-v1").length, 12);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "complete-second-eye-v1").length, 12);
  assert.equal(phase2Problems.filter((problem) => problem.skillId === "block-second-eye-v1").length, 12);
  for (const problem of phase2Problems) {
    assert.ok(problem.familyId && problem.variantFamily === problem.familyId && problem.itemVersion === 1 && problem.pool && problem.transferLevel && problem.feedbackPolicy, problem.id);
    assert.ok(["practice", "process_check", "holdout"].includes(problem.pool), problem.id);
    assert.ok(problem.stones.every(([x, y]) => x >= 0 && x < 9 && y >= 0 && y < 9), `${problem.id} stones in bounds`);
    assert.ok(problem.answer[0] >= 0 && problem.answer[0] < 9 && problem.answer[1] >= 0 && problem.answer[1] < 9, `${problem.id} answer in bounds`);
    assert.equal(new Set(problem.stones.map(([x, y]) => `${x},${y}`)).size, problem.stones.length, `${problem.id} no overlaps`);
  }
});

test("公開發布不把相容用 holdout 欄位誤作保密盲測資格", () => {
  assert.equal(publicationPolicy.sourceVisibility, "public");
  assert.equal(publicationPolicy.confidential, false);
  assert.equal(publicationPolicy.blindAssessmentEligible, false);
  assert.equal(publicationPolicy.formalHoldoutPoolStatus, "retired_due_to_publication");
  assert.equal(publicationPolicy.replacementRequiredForFormalEvaluation, true);
  assert.equal(publicationPolicy.decision, "accepted_public");
  const publishedHoldouts = phase2Problems.filter((problem) => problem.pool === "holdout");
  assert.equal(publishedHoldouts.length, 48);
  assert.ok(publishedHoldouts.every((problem) => problem.exposureStatus === "public_source"));
  assert.ok(publishedHoldouts.every((problem) => problem.exposedAt === "2026-09-21"));
  assert.ok(publishedHoldouts.every((problem) => problem.formalHoldoutEligible === false));
});

test("第二眼缺口題在落子後形成兩個真眼或只保留一眼", () => {
  const items = phase2Problems.filter((problem) => problem.taskFeatures.eyeSpace === "two-chambers-one-gap");
  assert.equal(items.length, 24);
  const neighbors = ([x, y]) => [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
  for (const problem of items) {
    const before = Go.boardFromStones(problem.stones);
    const result = Go.playMove(before, problem.answer[0], problem.answer[1], Go.BLACK);
    assert.equal(result.legal, true, problem.id);
    const eyes = problem.taskFeatures.cavities;
    if (problem.taskFeatures.objective === "complete_second_eye") {
      assert.ok(eyes.every((eye) => neighbors(eye).every(([nx, ny]) => result.board[ny][nx] === Go.BLACK)), `${problem.id} forms two black eyes`);
      assert.ok(eyes.every(([x, y]) => !Go.playMove(result.board, x, y, Go.WHITE).legal), `${problem.id} both eye points reject white invasion`);
    } else {
      const whiteEyes = eyes.filter((eye) => neighbors(eye).every(([nx, ny]) => result.board[ny][nx] === Go.WHITE));
      assert.equal(whiteEyes.length, 1, `${problem.id} leaves only the existing white eye`);
      assert.ok(eyes.some((eye) => neighbors(eye).some(([nx, ny]) => result.board[ny][nx] === Go.BLACK)), `${problem.id} blocks the second eye`);
    }
  }
});

test("直三題的中央急所能做成兩眼或阻止對方立即做成兩眼", () => {
  const lifeAndDeath = phase2Problems.filter((problem) => problem.taskFeatures.eyeSpace === "straight-three");
  assert.equal(lifeAndDeath.length, 24);
  assert.ok(lifeAndDeath.some((problem) => problem.pool === "process_check" && problem.transferLevel === "T2"));
  for (const problem of lifeAndDeath) {
    const before = Go.boardFromStones(problem.stones);
    const [x, y] = problem.answer;
    const result = Go.playMove(before, x, y, Go.BLACK);
    assert.equal(result.legal, true, problem.id);
    const horizontal = problem.taskFeatures.orientation === "horizontal";
    const ends = horizontal ? [[x - 1, y], [x + 1, y]] : [[x, y - 1], [x, y + 1]];
    const neighbors = ([px, py]) => [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]];
    if (problem.taskFeatures.objective === "make_two_eyes") {
      assert.ok(ends.every((eye) => neighbors(eye).every(([nx, ny]) => result.board[ny][nx] === Go.BLACK)), `${problem.id} makes two enclosed eyes`);
    } else {
      const defender = Go.playMove(result.board, ends[0][0], ends[0][1], Go.WHITE);
      assert.equal(defender.legal, true, `${problem.id} defender can resist at one end`);
      const finish = Go.playMove(defender.board, ends[1][0], ends[1][1], Go.BLACK);
      assert.equal(finish.legal, true, `${problem.id} attacker can take the other end`);
      assert.ok(finish.captured.length >= 1, `${problem.id} three-ply line captures the surrounded white group`);
    }
  }
});

test("每個可診斷技能都有練習、非保留 T2 流程題與隔離的 holdout", () => {
  for (const skillId of ["capture-last-liberty-v1", "direct-join-v1", "make-two-eyes-straight-three-v1", "kill-straight-three-v1", "complete-second-eye-v1", "block-second-eye-v1"]) {
    const items = phase2Problems.filter((problem) => problem.skillId === skillId);
    assert.ok(items.some((problem) => problem.pool === "practice"), `${skillId} practice`);
    assert.ok(items.filter((problem) => problem.pool === "process_check" && problem.transferLevel === "T2").length >= 2, `${skillId} process T2`);
    assert.ok(items.some((problem) => problem.pool === "holdout" && problem.transferLevel === "T2"), `${skillId} holdout T2`);
    const tuningFamilies = new Set(items.filter((problem) => problem.pool !== "holdout").map((problem) => problem.familyId));
    assert.ok(items.filter((problem) => problem.pool === "holdout").every((problem) => !tuningFamilies.has(problem.familyId)), `${skillId} holdout family isolation`);
  }
});

test("Phase 2 所有指定落子均由規則引擎驗證", () => {
  for (const problem of phase2Problems) assertGoal(problem);
});

test("保留驗收題的母題家族不與練習題重疊，且應用題不提示技能", () => {
  const practiceFamilies = new Set(phase2Problems.filter((problem) => problem.pool === "practice").map((problem) => problem.familyId));
  const holdoutFamilies = new Set(phase2Problems.filter((problem) => problem.pool === "holdout").map((problem) => problem.familyId));
  assert.ok(holdoutFamilies.size > 0);
  assert.ok([...holdoutFamilies].every((familyId) => !practiceFamilies.has(familyId)));
  assert.equal(applicationProbes.length, 4);
  assert.deepEqual(applicationProbes.reduce((counts, probe) => ({ ...counts, [probe.skillId]: (counts[probe.skillId] || 0) + 1 }), {}), {
    "capture-last-liberty-v1": 2,
    "direct-join-v1": 2
  });
  for (const probe of applicationProbes) {
    assert.equal(probe.purpose, "legacy_holdout_copy_not_for_application");
    assert.equal(probe.skillCue, false);
    assert.equal(probe.feedbackPolicy, "after_batch");
    assertGoal(probe);
  }
});
