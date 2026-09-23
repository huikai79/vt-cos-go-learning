const test = require("node:test");
const assert = require("node:assert/strict");
const gateDefinition = require("../teaching-gate.json");
const GateVerifier = require("../teaching-gate-verify.cjs");
const ReviewVerifier = require("../r1-review-verify.cjs");

function validReceipt() {
  return {
    schemaVersion: 1,
    protocolId: ReviewVerifier.PROTOCOL_ID,
    draft: false,
    contentFingerprint: ReviewVerifier.fingerprint(ReviewVerifier.reviewItems),
    reviewedAt: "2026-09-21T00:00:00.000Z",
    reviewer: {
      code: "reviewer-fixture",
      experience: "業餘三段，教學五年",
      independentOfContentAuthoring: true,
      separateFromLearner: true,
      answerBlindBeforeReview: true
    },
    reviewScope: { contentCorrectness: "single_reviewer_evidence", parallelFormComparability: "not_established", learningEffect: "not_measured" },
    population: ReviewVerifier.population,
    reviews: ReviewVerifier.reviewItems.map((problem) => ({ problemId: problem.id, status: "consistent", proposedMove: problem.answer, notes: "" }))
  };
}

function validHumanEvidence() {
  const criticalTasks = Object.fromEntries(gateDefinition.criteria.formalTeachingUse.requiredCriticalTasks.map((task) => [task, true]));
  const checks = Object.fromEntries(gateDefinition.criteria.formalTeachingUse.requiredAccessibilityChecks.map((check) => [check, true]));
  return {
    schemaVersion: 1,
    protocolId: "go-formal-teaching-evidence-v1",
    r1ContentFingerprint: gateDefinition.r1ContentFingerprint,
    usability: {
      completedAt: "2026-09-21T00:00:00.000Z",
      participantCount: 3,
      participantsAreTargetNovices: true,
      criticalTasks,
      openBlockingIssues: 0,
      evidenceReference: "local-usability-report",
      participants: ["novice-01", "novice-02", "novice-03"].map((participantCode) => ({
        participantCode,
        targetNovice: true,
        tasks: { ...criticalTasks },
        blockingIssues: [],
        evidenceReference: `local-usability-report#${participantCode}`
      }))
    },
    accessibility: { completedAt: "2026-09-21T00:00:00.000Z", checks, openBlockingIssues: 0, evidenceReference: "local-accessibility-report" },
    formalEvaluation: { privateUnexposedHoldoutEstablished: false, r1bComparabilityEstablished: false, evidenceReference: null }
  };
}

test("目前正式教學與正式評量保持阻擋，學習成效不由工程升格", () => {
  const result = GateVerifier.evaluateGate();
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.equal(result.formalEvaluation.status, "BLOCKED");
  assert.equal(result.learningEffect, "NOT_MEASURED");
});

test("R1a 回條通過仍不能取代真人 usability 與 accessibility", () => {
  const result = GateVerifier.evaluateGate({ receipt: validReceipt() });
  assert.equal(result.r1Verification.r1IndependentReviewPassed, true);
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.formalTeachingUse.blockingReasons.join(" "), /初學者真人|無障礙/);
});

test("R1a 與最低真人證據到位後只放行正式教學，不自動放行正式評量", () => {
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), humanEvidence: validHumanEvidence() });
  assert.equal(result.formalTeachingUse.status, "PASS");
  assert.equal(result.formalEvaluation.status, "BLOCKED");
  assert.equal(result.learningEffect, "NOT_MEASURED");
});

test("篡改或不完整 R1 回條不能通過 gate", () => {
  const receipt = validReceipt();
  receipt.reviewer.answerBlindBeforeReview = false;
  const result = GateVerifier.evaluateGate({ receipt, humanEvidence: validHumanEvidence() });
  assert.equal(result.r1Verification.receiptValid, false);
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});

test("彙總布林值不能掩蓋某位初學者未完成關鍵任務", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants[1].tasks.reload_and_resume = false;
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.humanEvidenceErrors.join(" "), /逐位參與者/);
});

test("participantCount 與逐位紀錄數量不一致時 fail closed", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants.pop();
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});

test("重複 participant code 不得冒充三位獨立初學者", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants[2].participantCode = "novice-02";
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});
