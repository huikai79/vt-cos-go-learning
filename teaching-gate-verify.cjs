"use strict";

const fs = require("node:fs");
const path = require("node:path");
const gateDefinition = require("./teaching-gate.json");
const ReviewVerifier = require("./r1-review-verify.cjs");

function validTimestamp(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }

function evaluateHumanEvidence(evidence, definition = gateDefinition) {
  const errors = [];
  if (!evidence) return { usabilityPassed: false, accessibilityPassed: false, privateHoldoutPassed: false, r1bPassed: false, errors: ["尚未提供真人證據檔"] };
  if (evidence.schemaVersion !== 1 || evidence.protocolId !== "go-formal-teaching-evidence-v1") errors.push("真人證據 schema 或 protocol 不符");
  if (evidence.r1ContentFingerprint !== definition.r1ContentFingerprint) errors.push("真人證據未綁定目前 R1 內容指紋");

  const teachingCriteria = definition.criteria.formalTeachingUse;
  const usability = evidence.usability || {};
  const participants = Array.isArray(usability.participants) ? usability.participants : [];
  const participantCodes = participants.map((participant) => participant && participant.participantCode).filter(nonEmpty);
  const uniqueParticipantCodes = new Set(participantCodes);
  const perParticipantEvidencePassed = participants.length >= teachingCriteria.minimumNoviceParticipants
    && uniqueParticipantCodes.size === participants.length
    && participants.every((participant) =>
      participant
      && participant.targetNovice === true
      && teachingCriteria.requiredCriticalTasks.every((task) => participant.tasks && participant.tasks[task] === true)
      && Array.isArray(participant.blockingIssues)
      && participant.blockingIssues.length === 0
      && nonEmpty(participant.evidenceReference)
    );
  const usabilityPassed = validTimestamp(usability.completedAt)
    && Number.isInteger(usability.participantCount)
    && usability.participantCount === participants.length
    && usability.participantCount >= teachingCriteria.minimumNoviceParticipants
    && usability.participantsAreTargetNovices === true
    && teachingCriteria.requiredCriticalTasks.every((task) => usability.criticalTasks && usability.criticalTasks[task] === true)
    && usability.openBlockingIssues === teachingCriteria.maximumOpenBlockingIssues
    && nonEmpty(usability.evidenceReference)
    && perParticipantEvidencePassed;
  if (!usabilityPassed) errors.push("初學者關鍵任務觀察未達最低正式教學閘門（需逐位參與者完成全部關鍵任務並保留證據引用）");

  const accessibility = evidence.accessibility || {};
  const accessibilityPassed = validTimestamp(accessibility.completedAt)
    && teachingCriteria.requiredAccessibilityChecks.every((check) => accessibility.checks && accessibility.checks[check] === true)
    && accessibility.openBlockingIssues === teachingCriteria.maximumOpenBlockingIssues
    && nonEmpty(accessibility.evidenceReference);
  if (!accessibilityPassed) errors.push("真人無障礙 spot check 未達最低正式教學閘門");

  const formalEvaluation = evidence.formalEvaluation || {};
  const privateHoldoutPassed = formalEvaluation.privateUnexposedHoldoutEstablished === true && nonEmpty(formalEvaluation.evidenceReference);
  const r1bPassed = formalEvaluation.r1bComparabilityEstablished === true && nonEmpty(formalEvaluation.evidenceReference);
  return { usabilityPassed, accessibilityPassed, privateHoldoutPassed, r1bPassed, errors };
}

function evaluateGate({ definition = gateDefinition, receipt = null, humanEvidence = null } = {}) {
  const definitionErrors = [];
  if (definition.schemaVersion !== 1 || definition.protocolId !== "go-formal-teaching-gate-v1") definitionErrors.push("正式教學 gate schema 或 protocol 不符");
  if (definition.r1ProtocolId !== ReviewVerifier.PROTOCOL_ID) definitionErrors.push("R1 protocol 與 verifier 不一致");
  if (definition.r1ContentFingerprint !== ReviewVerifier.fingerprint(ReviewVerifier.reviewItems)) definitionErrors.push("R1 內容指紋與 gate 不一致");
  if (!definition.currentStatus || definition.currentStatus.engineeringRelease !== "pass") definitionErrors.push("工程發布尚未通過");

  const r1 = receipt ? ReviewVerifier.verifyReceipt(receipt) : null;
  const r1Passed = Boolean(r1 && r1.receiptValid && r1.r1IndependentReviewPassed);
  const human = evaluateHumanEvidence(humanEvidence, definition);
  const formalTeachingPassed = definitionErrors.length === 0 && r1Passed && human.usabilityPassed && human.accessibilityPassed;
  const formalEvaluationPassed = formalTeachingPassed && human.privateHoldoutPassed && human.r1bPassed;
  const blockingReasons = [...definitionErrors];
  if (!r1Passed) blockingReasons.push(receipt ? "R1a 外部回條未通過" : "尚未提供 R1a 外部回條");
  if (!human.usabilityPassed) blockingReasons.push("初學者真人關鍵任務尚未通過");
  if (!human.accessibilityPassed) blockingReasons.push("真人無障礙 spot check 尚未通過");

  return {
    protocolId: definition.protocolId,
    r1ContentFingerprint: definition.r1ContentFingerprint,
    formalTeachingUse: { status: formalTeachingPassed ? "PASS" : "BLOCKED", blockingReasons },
    formalEvaluation: {
      status: formalEvaluationPassed ? "PASS" : "BLOCKED",
      blockingReasons: [
        !formalTeachingPassed && "正式教學使用尚未通過",
        !human.privateHoldoutPassed && "尚未建立未公開的新 formal holdout",
        !human.r1bPassed && "R1b 實際難度可比性尚未建立"
      ].filter(Boolean)
    },
    learningEffect: "NOT_MEASURED",
    r1Verification: r1,
    humanEvidenceErrors: human.errors
  };
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8")); }

module.exports = { evaluateHumanEvidence, evaluateGate };

if (require.main === module) {
  const args = process.argv.slice(2);
  const valueAfter = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : null;
  };
  try {
    const receiptPath = valueAfter("--r1");
    const humanPath = valueAfter("--human");
    const result = evaluateGate({ receipt: receiptPath ? readJson(receiptPath) : null, humanEvidence: humanPath ? readJson(humanPath) : null });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!args.includes("--report-only") && result.formalTeachingUse.status !== "PASS") process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`無法驗證正式教學閘門：${error.message}\n`);
    process.exitCode = 2;
  }
}
