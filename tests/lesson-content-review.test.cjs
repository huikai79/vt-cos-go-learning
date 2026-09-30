const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Verifier = require("../lesson-content-review-verify.cjs");

function validReceipt() {
  return {
    schemaVersion: 1,
    protocolId: Verifier.PROTOCOL_ID,
    draft: false,
    contentFingerprint: Verifier.fingerprint(),
    reviewedAt: "2026-09-29T00:00:00.000Z",
    reviewer: {
      code: "reviewer-fixture",
      experience: "業餘三段，教學五年",
      independentOfContentAuthoring: true,
      separateFromLearner: true,
      qualifiedForGoContentReview: true
    },
    reviewScope: {
      lessonContentCorrectness: "single_reviewer_evidence",
      learnerComprehension: "not_tested",
      learningEffect: "not_measured"
    },
    population: { lessonCount: Verifier.reviewLessons.length },
    reviews: Verifier.reviewLessons.map((lesson) => ({
      lessonIndex: lesson.lessonIndex,
      title: lesson.title,
      status: "consistent",
      notes: ""
    }))
  };
}

test("短講內容審查指紋涵蓋十九課 learner-facing 教學表面", () => {
  assert.equal(Verifier.reviewLessons.length, 19);
  assert.match(Verifier.fingerprint(), /^fnv1a32-[a-f0-9]{8}$/);
  for (const lesson of Verifier.reviewLessons) {
    assert.match(lesson.title, /\S/);
    assert.match(lesson.text, /\S/);
    assert.match(lesson.takeaway, /\S/);
    assert.ok(lesson.demoSteps.length >= 1);
    assert.ok(lesson.demoSteps.every((step) => /\S/.test(step.caption)));
  }
});

test("十九課全部一致時只支持單一外部內容審查通過", () => {
  const result = Verifier.verifyReceipt(validReceipt());
  assert.equal(result.receiptValid, true, result.errors.join("; "));
  assert.equal(result.lessonContentReviewPassed, true);
  assert.equal(result.findings.length, 0);
});

test("任何短講異議都 fail closed，不能被其他課平均掉", () => {
  const receipt = validReceipt();
  receipt.reviews[7].status = "needs_fix";
  receipt.reviews[7].notes = "兩眼說法需要人工核對";
  const result = Verifier.verifyReceipt(receipt);
  assert.equal(result.receiptValid, true);
  assert.equal(result.lessonContentReviewPassed, false);
  assert.equal(result.findings.length, 1);
});

test("範例回條保持草稿與 pending，不會誤通過正式教學", () => {
  const example = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "lesson-content-review.example.json"), "utf8"));
  assert.equal(example.contentFingerprint, Verifier.fingerprint());
  assert.equal(example.population.lessonCount, 19);
  assert.equal(example.reviews.length, 19);
  const result = Verifier.verifyReceipt(example);
  assert.equal(result.lessonContentReviewPassed, false);
  assert.ok(result.errors.some((error) => /草稿|狀態無效|reviewedAt/.test(error)));
});
