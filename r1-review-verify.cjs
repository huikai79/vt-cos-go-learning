"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { phase2Problems } = require("./phase2-content.js");

const PROTOCOL_ID = "go-r1-independent-content-review-v4";
const familyIds = [...new Set(phase2Problems.map((problem) => problem.familyId))];
const reviewItems = [...new Map([
  ...familyIds.map((familyId) => phase2Problems.find((problem) => problem.familyId === familyId)),
  ...phase2Problems.filter((problem) => problem.pool === "holdout")
].map((problem) => [problem.id, problem])).values()];
const population = Object.freeze({
  catalogCount: phase2Problems.length,
  familyCount: familyIds.length,
  publicReviewGroupCount: phase2Problems.filter((problem) => problem.pool === "holdout").length,
  reviewItemCount: reviewItems.length
});

function fingerprint(items) {
  const source = JSON.stringify(items.map((problem) => ({ id: problem.id, contentVersion: problem.contentVersion, itemVersion: problem.itemVersion, stones: problem.stones, answer: problem.answer, goal: problem.goal })));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function samePoint(first, second) { return Array.isArray(first) && first.length === 2 && first[0] === second[0] && first[1] === second[1]; }
function validPoint(point) { return Array.isArray(point) && point.length === 2 && point.every((value) => Number.isInteger(value) && value >= 0 && value < 9); }
function validTimestamp(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }

function verifyReceipt(receipt) {
  const errors = [];
  if (!receipt || typeof receipt !== "object") return { protocolId: null, contentFingerprint: fingerprint(reviewItems), reviewerCode: null, reviewItemCount: reviewItems.length, receiptValid: false, r1IndependentReviewPassed: false, errors: ["回條必須是物件"], findings: [] };
  if (receipt.schemaVersion !== 1) errors.push("schemaVersion 不符");
  if (receipt.protocolId !== PROTOCOL_ID) errors.push("protocolId 不符");
  if (receipt.draft !== false) errors.push("草稿不能作為 R1 正式審查回條");
  if (receipt.contentFingerprint !== fingerprint(reviewItems)) errors.push("內容指紋不符；題庫可能已在審查後變更");
  if (!validTimestamp(receipt.reviewedAt)) errors.push("reviewedAt 必須是有效時間");
  if (!receipt.reviewer || String(receipt.reviewer.code || "").trim().length < 3 || String(receipt.reviewer.experience || "").trim().length < 5) errors.push("審查者代碼或圍棋經驗不完整");
  if (!receipt.reviewer || receipt.reviewer.independentOfContentAuthoring !== true) errors.push("未確認審查者未參與編題");
  if (!receipt.reviewer || receipt.reviewer.separateFromLearner !== true) errors.push("未確認審查者不是目前學習者");
  if (!receipt.reviewer || receipt.reviewer.answerBlindBeforeReview !== true) errors.push("未確認審查前未查看答案或機器稽核結果");
  if (!receipt.reviewScope || receipt.reviewScope.contentCorrectness !== "single_reviewer_evidence" || receipt.reviewScope.parallelFormComparability !== "not_established" || receipt.reviewScope.learningEffect !== "not_measured") errors.push("R1a 內容審查的證據邊界不完整");
  if (!receipt.population || Object.entries(population).some(([key, value]) => receipt.population[key] !== value)) errors.push("審查母體統計不符");
  if (!Array.isArray(receipt.reviews) || receipt.reviews.length !== reviewItems.length) errors.push(`審查題數必須為 ${reviewItems.length}`);
  const suppliedReviews = Array.isArray(receipt.reviews) ? receipt.reviews : [];
  const safeReviews = suppliedReviews.filter((review) => review && typeof review === "object");
  if (safeReviews.length !== suppliedReviews.length) errors.push("審查回條含無效 review 項目");
  const reviewMap = new Map(safeReviews.map((review) => [review.problemId, review]));
  if (reviewMap.size !== safeReviews.length) errors.push("審查回條含重複 problemId");
  const knownIds = new Set(reviewItems.map((problem) => problem.id));
  for (const review of safeReviews) if (!knownIds.has(review.problemId)) errors.push(`未知題目 ${review.problemId}`);
  const findings = [];
  for (const problem of reviewItems) {
    const review = reviewMap.get(problem.id);
    if (!review) { errors.push(`${problem.id} 缺少審查`); continue; }
    if (!["consistent", "needs_fix", "ambiguous", "multiple_solutions"].includes(review.status)) errors.push(`${problem.id} 狀態無效`);
    if (["needs_fix", "ambiguous", "multiple_solutions"].includes(review.status) && !String(review.notes || "").trim()) errors.push(`${problem.id} 缺少理由`);
    const requiresMove = ["consistent", "needs_fix"].includes(review.status);
    if (requiresMove && !validPoint(review.proposedMove)) errors.push(`${problem.id} 缺少有效建議落子`);
    if (review.proposedMove != null && !validPoint(review.proposedMove)) errors.push(`${problem.id} 建議落子座標無效`);
    if (validPoint(review.proposedMove) && problem.stones.some(([x, y]) => x === review.proposedMove[0] && y === review.proposedMove[1])) errors.push(`${problem.id} 建議落子已被佔用`);
    const answerMatches = samePoint(review.proposedMove, problem.answer);
    if (review.status === "consistent" && !answerMatches) findings.push({ problemId: problem.id, finding: "consistent_but_move_differs", proposedMove: review.proposedMove, expectedMove: problem.answer });
    if (review.status !== "consistent") findings.push({ problemId: problem.id, finding: review.status, proposedMove: review.proposedMove, expectedMove: problem.answer, notes: review.notes });
  }
  return {
    protocolId: receipt.protocolId,
    contentFingerprint: fingerprint(reviewItems),
    reviewerCode: receipt.reviewer && receipt.reviewer.code,
    reviewItemCount: reviewItems.length,
    receiptValid: errors.length === 0,
    r1IndependentReviewPassed: errors.length === 0 && findings.length === 0,
    errors,
    findings
  };
}

module.exports = { PROTOCOL_ID, population, reviewItems, fingerprint, verifyReceipt };

if (require.main === module) {
  const receiptPath = process.argv[2];
  if (!receiptPath) {
    process.stderr.write("用法：node r1-review-verify.cjs <R1_獨立審題回條.json>\n");
    process.exitCode = 2;
  } else {
    try {
      const receipt = JSON.parse(fs.readFileSync(path.resolve(receiptPath), "utf8"));
      const result = verifyReceipt(receipt);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (!result.r1IndependentReviewPassed) process.exitCode = 1;
    } catch (error) {
      process.stderr.write(`無法讀取審查回條：${error.message}\n`);
      process.exitCode = 2;
    }
  }
}
