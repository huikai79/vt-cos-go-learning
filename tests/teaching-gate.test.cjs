const test = require("node:test");
const assert = require("node:assert/strict");
const gateDefinition = require("../teaching-gate.json");
const GateVerifier = require("../teaching-gate-verify.cjs");
const ReviewVerifier = require("../r1-review-verify.cjs");
const CandidateVerifier = require("../formal-teaching-candidate.cjs");
const candidateManifest = require("../formal-teaching-candidate.json");

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

function validLessonReceipt() {
  const verifier = GateVerifier.LessonReviewVerifier;
  return {
    schemaVersion: 1,
    protocolId: verifier.PROTOCOL_ID,
    draft: false,
    contentFingerprint: verifier.fingerprint(),
    reviewedAt: "2026-09-29T00:00:00.000Z",
    reviewer: {
      code: "lesson-reviewer-fixture",
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
    population: { lessonCount: verifier.reviewLessons.length },
    reviews: verifier.reviewLessons.map((lesson) => ({
      lessonIndex: lesson.lessonIndex,
      title: lesson.title,
      status: "consistent",
      notes: ""
    }))
  };
}

function validHumanEvidence() {
  const criticalTasks = Object.fromEntries(gateDefinition.criteria.formalTeachingUse.requiredCriticalTasks.map((task) => [task, true]));
  const checks = Object.fromEntries(gateDefinition.criteria.formalTeachingUse.requiredAccessibilityChecks.map((check) => [check, true]));
  const candidateId = gateDefinition.formalTeachingCandidateId;
  const candidateFingerprint = gateDefinition.formalTeachingCandidateFingerprint;
  return {
    schemaVersion: 2,
    protocolId: "go-formal-teaching-evidence-v2",
    r1ContentFingerprint: gateDefinition.r1ContentFingerprint,
    candidateId,
    candidateFingerprint,
    usability: {
      candidateId,
      candidateFingerprint,
      completedAt: "2026-09-27T00:00:00.000Z",
      participantCount: 3,
      participantsAreTargetNovices: true,
      criticalTasks,
      openBlockingIssues: 0,
      evidenceReference: "local-usability-report",
      participants: ["novice-01", "novice-02", "novice-03"].map((participantCode) => ({
        participantCode,
        targetNovice: true,
        candidateId,
        candidateFingerprint,
        tasks: { ...criticalTasks },
        blockingIssues: [],
        evidenceReference: `local-usability-report#${participantCode}`
      }))
    },
    accessibility: {
      candidateId,
      candidateFingerprint,
      completedAt: "2026-09-27T00:00:00.000Z",
      checks,
      openBlockingIssues: 0,
      evidenceReference: "local-accessibility-report"
    },
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

test("題庫 R1a 與真人證據都通過時，缺少 19 課短講外部審查仍 fail closed", () => {
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), humanEvidence: validHumanEvidence() });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.formalTeachingUse.blockingReasons.join(" "), /19 課短講外部棋理回條/);
});

test("短講審查任一課有異議時正式教學保持 BLOCKED", () => {
  const lessonReceipt = validLessonReceipt();
  lessonReceipt.reviews[6].status = "ambiguous";
  lessonReceipt.reviews[6].notes = "簡單劫說明需要再核對適用規則口徑";
  const result = GateVerifier.evaluateGate({
    receipt: validReceipt(),
    lessonReceipt,
    humanEvidence: validHumanEvidence()
  });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.equal(result.lessonContentReview.lessonContentReviewPassed, false);
});

test("R1a 題庫、短講內容審查與最低真人證據到位後只放行正式教學，不自動放行正式評量", () => {
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: validHumanEvidence() });
  assert.equal(result.formalTeachingUse.status, "PASS");
  assert.equal(result.formalEvaluation.status, "BLOCKED");
  assert.equal(result.learningEffect, "NOT_MEASURED");
});

test("篡改或不完整 R1 回條不能通過 gate", () => {
  const receipt = validReceipt();
  receipt.reviewer.answerBlindBeforeReview = false;
  const result = GateVerifier.evaluateGate({ receipt, lessonReceipt: validLessonReceipt(), humanEvidence: validHumanEvidence() });
  assert.equal(result.r1Verification.receiptValid, false);
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});

test("彙總布林值不能掩蓋某位初學者未完成關鍵任務", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants[1].tasks.reload_and_resume = false;
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.humanEvidenceErrors.join(" "), /逐位參與者/);
});

test("participantCount 與逐位紀錄數量不一致時 fail closed", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants.pop();
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});

test("重複 participant code 不得冒充三位獨立初學者", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants[2].participantCode = "novice-02";
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});


test("formal teaching candidate manifest 必須與目前 critical surface 動態指紋一致", () => {
  const result = CandidateVerifier.evaluateManifest(candidateManifest);
  assert.equal(result.valid, true, result.errors.join("; ") + `; computed=${result.computedFingerprint}`);
  assert.equal(result.candidateId, gateDefinition.formalTeachingCandidateId);
  assert.equal(result.computedFingerprint, gateDefinition.formalTeachingCandidateFingerprint);
  assert.equal(result.assetFingerprint, result.computedFingerprint);
});

test("舊 v1 真人證據不得在 v2 gate 被靜默接受", () => {
  const evidence = validHumanEvidence();
  evidence.schemaVersion = 1;
  evidence.protocolId = "go-formal-teaching-evidence-v1";
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.humanEvidenceErrors.join(" "), /schema|protocol/);
});

test("任一參與者使用不同 candidate fingerprint 時 fail closed", () => {
  const evidence = validHumanEvidence();
  evidence.usability.participants[1].candidateFingerprint = "fnv1a32-js16-deadbeef";
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.humanEvidenceErrors.join(" "), /逐位參與者/);
});

test("accessibility spot check 不得使用不同 candidate", () => {
  const evidence = validHumanEvidence();
  evidence.accessibility.candidateId = "other-candidate";
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.humanEvidenceErrors.join(" "), /無障礙/);
});

test("candidate manifest 動態指紋失配時 formal teaching 必須 BLOCKED", () => {
  const candidate = CandidateVerifier.evaluateManifest(candidateManifest);
  const stale = {
    ...candidate,
    valid: false,
    computedFingerprint: "fnv1a32-js16-00000000",
    errors: ["simulated stale critical surface"]
  };
  const result = GateVerifier.evaluateGate({
    receipt: validReceipt(),
    lessonReceipt: validLessonReceipt(),
    humanEvidence: validHumanEvidence(),
    candidate: stale
  });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
  assert.match(result.formalTeachingUse.blockingReasons.join(" "), /candidate|fingerprint|指紋/);
});

test("總表 usability candidate 與逐位 candidate 必須同時一致", () => {
  const evidence = validHumanEvidence();
  evidence.usability.candidateFingerprint = "fnv1a32-js16-aaaaaaaa";
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalTeachingUse.status, "BLOCKED");
});


test("formal teaching evidence example 必須綁定目前 frozen candidate", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const example = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "formal-teaching-evidence.example.json"), "utf8"));
  const candidateId = gateDefinition.formalTeachingCandidateId;
  const candidateFingerprint = gateDefinition.formalTeachingCandidateFingerprint;
  assert.equal(example.candidateId, candidateId);
  assert.equal(example.candidateFingerprint, candidateFingerprint);
  assert.equal(example.usability.candidateId, candidateId);
  assert.equal(example.usability.candidateFingerprint, candidateFingerprint);
  assert.ok(example.usability.participants.length >= gateDefinition.criteria.formalTeachingUse.minimumNoviceParticipants);
  for (const participant of example.usability.participants) {
    assert.equal(participant.candidateId, candidateId);
    assert.equal(participant.candidateFingerprint, candidateFingerprint);
  }
  assert.equal(example.accessibility.candidateId, candidateId);
  assert.equal(example.accessibility.candidateFingerprint, candidateFingerprint);
});


test("手填 private holdout established 不能繞過 private manifest verifier", () => {
  const evidence = validHumanEvidence();
  evidence.formalEvaluation = { privateUnexposedHoldoutEstablished: true, r1bComparabilityEstablished: true, evidenceReference: "claimed-only" };
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence });
  assert.equal(result.formalEvaluation.status, "BLOCKED");
  assert.match(result.formalEvaluation.blockingReasons.join(" "), /formal holdout/);
});

test("formal evaluation 只有在 verified private pool 與 R1b 都存在時才可通過該 machine gate", () => {
  const evidence = validHumanEvidence();
  evidence.formalEvaluation = { privateUnexposedHoldoutEstablished: true, r1bComparabilityEstablished: true, evidenceReference: "local-formal-evaluation-evidence" };
  const privateEvaluationVerification = {
    valid: true,
    protocolId: GateVerifier.FormalEvaluationVerifier.PROTOCOL_ID,
    itemCount: 3,
    manifestFingerprint: "a".repeat(64)
  };
  const result = GateVerifier.evaluateGate({ receipt: validReceipt(), lessonReceipt: validLessonReceipt(), humanEvidence: evidence, privateEvaluationVerification });
  assert.equal(result.formalTeachingUse.status, "PASS");
  assert.equal(result.formalEvaluation.status, "PASS");
  assert.equal(result.learningEffect, "NOT_MEASURED");
});
