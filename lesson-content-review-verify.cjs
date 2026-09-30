"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { lessons } = require("./content.js");

const PROTOCOL_ID = "go-independent-lesson-content-review-v1";

function reviewSurface(lesson, lessonIndex) {
  return {
    lessonIndex,
    unit: lesson.unit,
    title: lesson.title,
    subtitle: lesson.subtitle,
    text: lesson.text,
    takeaway: lesson.takeaway,
    badge: lesson.badge || null,
    terms: Array.isArray(lesson.terms) ? lesson.terms : [],
    demoSteps: (lesson.demoSteps || []).map((step) => ({
      stones: step.stones || [],
      highlights: step.highlights || [],
      emphasis: step.emphasis || [],
      blocked: step.blocked || [],
      reference: step.reference || [],
      label: step.label || "",
      caption: step.caption || ""
    }))
  };
}

const reviewLessons = lessons.map(reviewSurface);
const population = Object.freeze({ lessonCount: reviewLessons.length });

function fingerprint(items = reviewLessons) {
  const source = JSON.stringify(items);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function verifyReceipt(receipt) {
  const errors = [];
  const currentFingerprint = fingerprint();
  if (!receipt || typeof receipt !== "object") {
    return {
      protocolId: null,
      contentFingerprint: currentFingerprint,
      reviewerCode: null,
      lessonCount: reviewLessons.length,
      receiptValid: false,
      lessonContentReviewPassed: false,
      errors: ["短講內容審查回條必須是物件"],
      findings: []
    };
  }

  if (receipt.schemaVersion !== 1) errors.push("schemaVersion 不符");
  if (receipt.protocolId !== PROTOCOL_ID) errors.push("protocolId 不符");
  if (receipt.draft !== false) errors.push("草稿不能作為正式短講內容審查回條");
  if (receipt.contentFingerprint !== currentFingerprint) errors.push("短講內容指紋不符；learner-facing 教學內容可能已在審查後變更");
  if (!validTimestamp(receipt.reviewedAt)) errors.push("reviewedAt 必須是有效時間");

  const reviewer = receipt.reviewer || {};
  if (!nonEmpty(reviewer.code) || reviewer.code.trim().length < 3 || !nonEmpty(reviewer.experience) || reviewer.experience.trim().length < 5) {
    errors.push("審查者代碼或圍棋經驗不完整");
  }
  if (reviewer.independentOfContentAuthoring !== true) errors.push("未確認審查者未參與本批短講內容編寫");
  if (reviewer.separateFromLearner !== true) errors.push("未確認審查者不是目前學習者");
  if (reviewer.qualifiedForGoContentReview !== true) errors.push("未確認審查者具備核對基礎圍棋教學內容的能力");

  const scope = receipt.reviewScope || {};
  if (scope.lessonContentCorrectness !== "single_reviewer_evidence"
    || scope.learnerComprehension !== "not_tested"
    || scope.learningEffect !== "not_measured") {
    errors.push("短講內容審查的證據邊界不完整");
  }

  if (!receipt.population || receipt.population.lessonCount !== reviewLessons.length) {
    errors.push(`審查母體必須包含 ${reviewLessons.length} 課`);
  }

  const supplied = Array.isArray(receipt.reviews) ? receipt.reviews : [];
  if (supplied.length !== reviewLessons.length) errors.push(`審查課數必須為 ${reviewLessons.length}`);
  const safeReviews = supplied.filter((review) => review && typeof review === "object");
  if (safeReviews.length !== supplied.length) errors.push("回條含無效 lesson review 項目");
  const reviewMap = new Map(safeReviews.map((review) => [review.lessonIndex, review]));
  if (reviewMap.size !== safeReviews.length) errors.push("回條含重複 lessonIndex");

  const findings = [];
  for (const lesson of reviewLessons) {
    const review = reviewMap.get(lesson.lessonIndex);
    if (!review) {
      errors.push(`第 ${lesson.lessonIndex + 1} 課缺少審查`);
      continue;
    }
    if (review.title !== lesson.title) errors.push(`第 ${lesson.lessonIndex + 1} 課標題與目前內容不一致`);
    if (!["consistent", "needs_fix", "ambiguous"].includes(review.status)) {
      errors.push(`第 ${lesson.lessonIndex + 1} 課狀態無效`);
      continue;
    }
    if (review.status !== "consistent" && !nonEmpty(review.notes)) {
      errors.push(`第 ${lesson.lessonIndex + 1} 課有異議但缺少理由`);
    }
    if (review.status !== "consistent") {
      findings.push({
        lessonIndex: lesson.lessonIndex,
        title: lesson.title,
        finding: review.status,
        notes: String(review.notes || "")
      });
    }
  }

  return {
    protocolId: receipt.protocolId,
    contentFingerprint: currentFingerprint,
    reviewerCode: reviewer.code || null,
    lessonCount: reviewLessons.length,
    receiptValid: errors.length === 0,
    lessonContentReviewPassed: errors.length === 0 && findings.length === 0,
    errors,
    findings
  };
}

module.exports = { PROTOCOL_ID, reviewLessons, population, fingerprint, verifyReceipt };

if (require.main === module) {
  const receiptPath = process.argv[2];
  if (!receiptPath) {
    process.stderr.write("用法：node lesson-content-review-verify.cjs <LESSON_CONTENT_REVIEW_RECEIPT.json>\n");
    process.exitCode = 2;
  } else {
    try {
      const receipt = JSON.parse(fs.readFileSync(path.resolve(receiptPath), "utf8"));
      const result = verifyReceipt(receipt);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (!result.lessonContentReviewPassed) process.exitCode = 1;
    } catch (error) {
      process.stderr.write(`無法讀取短講內容審查回條：${error.message}\n`);
      process.exitCode = 2;
    }
  }
}
