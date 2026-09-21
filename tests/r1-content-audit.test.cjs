const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { phase2Problems } = require("../phase2-content.js");
const Trial = require("../trial.js");
const ReviewVerifier = require("../r1-review-verify.cjs");
const ReviewBank = require("../r1-review-bank.js");
const ReviewBankBuilder = require("../scripts/build-r1-review-bank.cjs");

const SIZE = 9;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const coreSkills = new Set(["capture-last-liberty-v1", "direct-join-v1"]);
const coreProblems = phase2Problems.filter((problem) => coreSkills.has(problem.skillId));

function inside(x, y) { return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < SIZE && y >= 0 && y < SIZE; }
function adjacent(x, y) { return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([nx, ny]) => inside(nx, ny)); }
function setup(stones) {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  for (const [x, y, color] of stones) board[y][x] = color;
  return board;
}
function group(board, x, y) {
  const color = board[y][x];
  if (color === EMPTY) return null;
  const stones = [[x, y]];
  const seen = new Set([`${x},${y}`]);
  const liberties = new Set();
  for (let index = 0; index < stones.length; index += 1) {
    const [cx, cy] = stones[index];
    for (const [nx, ny] of adjacent(cx, cy)) {
      if (board[ny][nx] === EMPTY) liberties.add(`${nx},${ny}`);
      else if (board[ny][nx] === color && !seen.has(`${nx},${ny}`)) {
        seen.add(`${nx},${ny}`);
        stones.push([nx, ny]);
      }
    }
  }
  return { stones, liberties: [...liberties].map((value) => value.split(",").map(Number)) };
}
function play(board, x, y) {
  if (!inside(x, y) || board[y][x] !== EMPTY) return null;
  const next = board.map((row) => row.slice());
  next[y][x] = BLACK;
  const captured = [];
  const checked = new Set();
  for (const [nx, ny] of adjacent(x, y)) {
    if (next[ny][nx] !== WHITE || checked.has(`${nx},${ny}`)) continue;
    const target = group(next, nx, ny);
    target.stones.forEach(([gx, gy]) => checked.add(`${gx},${gy}`));
    if (target.liberties.length === 0) for (const [gx, gy] of target.stones) {
      next[gy][gx] = EMPTY;
      captured.push([gx, gy]);
    }
  }
  if (group(next, x, y).liberties.length === 0) return null;
  return { board: next, captured };
}
function contains(points, target) { return points.some(([x, y]) => x === target[0] && y === target[1]); }
function satisfies(problem, before, result) {
  if (problem.goal.type === "capture") return result.captured.length === problem.goal.count && contains(result.captured, problem.goal.target);
  if (problem.goal.type === "join") {
    const [first, second] = problem.goal.targets;
    const connected = group(result.board, first[0], first[1]);
    return connected && contains(connected.stones, second);
  }
  return false;
}
function successfulMoves(problem) {
  const board = setup(problem.stones);
  const moves = [];
  for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
    const result = play(board, x, y);
    if (result && satisfies(problem, board, result)) moves.push([x, y]);
  }
  return moves;
}
function samePoint(first, second) { return first[0] === second[0] && first[1] === second[1]; }
function structuralProfile(problem) {
  const features = problem.taskFeatures;
  return {
    targetGroupSize: features.targetGroupSize,
    targetLiberties: features.targetLiberties || null,
    sharedLiberties: features.sharedLiberties || null,
    readingDepth: features.readingDepth,
    branchCount: features.branchCount,
    responseType: features.responseType,
    ko: features.ko
  };
}
function completeBatch(state, batch, now) {
  for (const id of batch.problemIds) {
    const problem = phase2Problems.find((item) => item.id === id);
    state = Trial.recordAnswer(state, batch, problem, true, "audit", 0, now);
  }
  return state;
}

test("R1 獨立規則實作窮舉兩個核心技能的 70 題，指定答案皆為唯一成功手", () => {
  assert.equal(coreProblems.length, 70);
  for (const problem of coreProblems) {
    const successes = successfulMoves(problem);
    assert.equal(successes.length, 1, `${problem.id} successful moves: ${JSON.stringify(successes)}`);
    assert.ok(samePoint(successes[0], problem.answer), `${problem.id} expected ${problem.answer}, independent oracle found ${successes[0]}`);
  }
});

test("R1 審題母體涵蓋 43 個題庫家族及全部 48 題 holdout", () => {
  const families = new Set(phase2Problems.map((problem) => problem.familyId));
  const holdouts = phase2Problems.filter((problem) => problem.pool === "holdout");
  const representatives = [...families].map((familyId) => phase2Problems.find((problem) => problem.familyId === familyId));
  const reviewSet = new Map([...representatives, ...holdouts].map((problem) => [problem.id, problem]));
  assert.equal(families.size, 43);
  assert.equal(holdouts.length, 48);
  assert.equal(reviewSet.size, 77);
  assert.deepEqual(ReviewVerifier.reviewItems.map((problem) => problem.id), [...reviewSet.values()].map((problem) => problem.id));
});

test("瀏覽器 R1 審查資料可重建且不含答案、目標或評分欄位", () => {
  const generatedPath = path.resolve(__dirname, "..", "r1-review-bank.js");
  const generated = fs.readFileSync(generatedPath, "utf8").replace(/\r\n/g, "\n");
  assert.equal(generated, ReviewBankBuilder.serializeBank().replace(/\r\n/g, "\n"));
  assert.equal(ReviewBank.protocolId, ReviewVerifier.PROTOCOL_ID);
  assert.equal(ReviewBank.contentFingerprint, ReviewVerifier.fingerprint(ReviewVerifier.reviewItems));
  assert.deepEqual(ReviewBank.population, ReviewVerifier.population);
  assert.deepEqual(ReviewBank.reviewItems.map((problem) => problem.id), ReviewVerifier.reviewItems.map((problem) => problem.id));
  for (const problem of ReviewBank.reviewItems) {
    assert.deepEqual(Object.keys(problem).sort(), ["focus", "id", "prompt", "stones"]);
  }
});

test("pilot 基線與追蹤使用不同家族，已知結構特徵相同；R1b 難度仍未知", () => {
  const baseline = Trial.startOrResume(null, phase2Problems, 0);
  const completed = completeBatch(baseline.state, baseline.batch, 1);
  const followup = Trial.startOrResume(completed, phase2Problems, Trial.DAY * 8);
  assert.equal(baseline.batch.problemIds.length, 4);
  assert.equal(followup.batch.problemIds.length, 4);
  const baselineProblems = baseline.batch.problemIds.map((id) => phase2Problems.find((problem) => problem.id === id));
  const followupProblems = followup.batch.problemIds.map((id) => phase2Problems.find((problem) => problem.id === id));
  const baselineFamilies = new Set(baselineProblems.map((problem) => problem.familyId));
  const followupFamilies = new Set(followupProblems.map((problem) => problem.familyId));
  assert.ok([...baselineFamilies].every((familyId) => !followupFamilies.has(familyId)));
  for (const skillId of coreSkills) {
    const first = baselineProblems.filter((problem) => problem.skillId === skillId).map(structuralProfile);
    const second = followupProblems.filter((problem) => problem.skillId === skillId).map(structuralProfile);
    assert.deepEqual(new Set(first.map(JSON.stringify)), new Set(second.map(JSON.stringify)));
  }
});

test("R1 審查回條綁定目前內容，任何異議或答案不一致都不會誤判通過", () => {
  const receipt = {
    schemaVersion: 1,
    protocolId: ReviewVerifier.PROTOCOL_ID,
    draft: false,
    contentFingerprint: ReviewVerifier.fingerprint(ReviewVerifier.reviewItems),
    reviewedAt: "2026-09-21T00:00:00.000Z",
    reviewer: { code: "fixture", experience: "fixture", independentOfContentAuthoring: true, separateFromLearner: true, answerBlindBeforeReview: true },
    reviewScope: { contentCorrectness: "single_reviewer_evidence", parallelFormComparability: "not_established", learningEffect: "not_measured" },
    population: ReviewVerifier.population,
    reviews: ReviewVerifier.reviewItems.map((problem) => ({ problemId: problem.id, status: "consistent", proposedMove: problem.answer, notes: "" }))
  };
  const accepted = ReviewVerifier.verifyReceipt(receipt);
  assert.equal(accepted.receiptValid, true);
  assert.equal(accepted.r1IndependentReviewPassed, true);
  const disputed = structuredClone(receipt);
  disputed.reviews[0].status = "ambiguous";
  disputed.reviews[0].notes = "fixture ambiguity reason";
  const rejected = ReviewVerifier.verifyReceipt(disputed);
  assert.equal(rejected.receiptValid, true);
  assert.equal(rejected.r1IndependentReviewPassed, false);
  assert.equal(rejected.findings[0].finding, "ambiguous");
  const unreasoned = structuredClone(disputed);
  unreasoned.reviews[0].notes = "";
  assert.ok(ReviewVerifier.verifyReceipt(unreasoned).errors.some((error) => error.includes("缺少理由")));
  const draft = structuredClone(receipt);
  draft.draft = true;
  assert.ok(ReviewVerifier.verifyReceipt(draft).errors.some((error) => error.includes("草稿不能")));
  const oldProtocol = structuredClone(receipt);
  oldProtocol.protocolId = "go-r1-independent-content-review-v3";
  assert.ok(ReviewVerifier.verifyReceipt(oldProtocol).errors.some((error) => error.includes("protocolId")));
  const notBlind = structuredClone(receipt);
  notBlind.reviewer.answerBlindBeforeReview = false;
  assert.ok(ReviewVerifier.verifyReceipt(notBlind).errors.some((error) => error.includes("未查看答案")));
  const duplicate = structuredClone(receipt);
  duplicate.reviews[1].problemId = duplicate.reviews[0].problemId;
  assert.ok(ReviewVerifier.verifyReceipt(duplicate).errors.some((error) => error.includes("重複 problemId")));
  const malformed = structuredClone(receipt);
  malformed.reviews[0] = null;
  assert.ok(ReviewVerifier.verifyReceipt(malformed).errors.some((error) => error.includes("無效 review")));
});
