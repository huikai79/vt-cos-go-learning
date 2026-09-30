const test=require("node:test");
const assert=require("node:assert/strict");
const LessonBuilder=require("../lesson-content-review.js");
const LessonVerifier=require("../lesson-content-review-verify.cjs");
const HumanBuilder=require("../formal-teaching-evidence.js");
const Gate=require("../teaching-gate-verify.cjs");
const gateDefinition=require("../teaching-gate.json");
const Status=require("../final-phase-status.cjs");
const ReviewVerifier=require("../r1-review-verify.cjs");

function validR1(){
 return{
  schemaVersion:1,protocolId:ReviewVerifier.PROTOCOL_ID,draft:false,
  contentFingerprint:ReviewVerifier.fingerprint(ReviewVerifier.reviewItems),
  reviewedAt:"2026-09-30T00:00:00.000Z",
  reviewer:{code:"reviewer-01",experience:"業餘三段，教學五年",independentOfContentAuthoring:true,separateFromLearner:true,answerBlindBeforeReview:true},
  reviewScope:{contentCorrectness:"single_reviewer_evidence",parallelFormComparability:"not_established",learningEffect:"not_measured"},
  population:ReviewVerifier.population,
  reviews:ReviewVerifier.reviewItems.map(problem=>({problemId:problem.id,status:"consistent",proposedMove:problem.answer,notes:""}))
 };
}
function validLesson(){
 return LessonBuilder.buildReceipt({
  draft:false,reviewerCode:"lesson-reviewer-01",reviewerExperience:"業餘三段，教學五年",
  independentOfContentAuthoring:true,separateFromLearner:true,qualifiedForGoContentReview:true,
  reviewedAt:"2026-09-30T00:00:00.000Z",
  reviewEntries:LessonBuilder.reviewLessons.map(lesson=>({lessonIndex:lesson.lessonIndex,title:lesson.title,status:"consistent",notes:""}))
 });
}
function validHuman(){
 const tasks=Object.fromEntries(HumanBuilder.CRITICAL_TASKS.map(task=>[task,true]));
 const checks=Object.fromEntries(HumanBuilder.ACCESSIBILITY_CHECKS.map(check=>[check,true]));
 return HumanBuilder.buildEvidence({
  completedAt:"2026-09-30T00:00:00.000Z",
  participants:["novice-01","novice-02","novice-03"].map(code=>({participantCode:code,targetNovice:true,tasks:{...tasks},blockingIssues:[],evidenceReference:"local-report/"+code,candidateId:HumanBuilder.CANDIDATE_ID,candidateFingerprint:HumanBuilder.CANDIDATE_FINGERPRINT})),
  accessibilityChecks:checks,accessibilityReference:"local-report/accessibility",accessibilityBlockingIssues:[]
 });
}

test("19 課收集頁與既有 verifier 使用完全相同 fingerprint 與 protocol",()=>{
 assert.equal(LessonBuilder.PROTOCOL_ID,LessonVerifier.PROTOCOL_ID);
 assert.equal(LessonBuilder.fingerprint(),LessonVerifier.fingerprint());
 assert.equal(LessonBuilder.reviewLessons.length,LessonVerifier.reviewLessons.length);
 const receipt=validLesson(),result=LessonVerifier.verifyReceipt(receipt);
 assert.equal(result.receiptValid,true,result.errors.join("; "));
 assert.equal(result.lessonContentReviewPassed,true);
});

test("19 課有異議時 builder 可以保存，但 verifier 不得讓 gate 通過",()=>{
 const entries=LessonBuilder.reviewLessons.map(lesson=>({lessonIndex:lesson.lessonIndex,title:lesson.title,status:"consistent",notes:""}));
 entries[3].status="ambiguous";entries[3].notes="棋盤 caption 需要再核對";
 const receipt=LessonBuilder.buildReceipt({draft:false,reviewerCode:"reviewer-02",reviewerExperience:"業餘三段，教學五年",independentOfContentAuthoring:true,separateFromLearner:true,qualifiedForGoContentReview:true,reviewEntries:entries,reviewedAt:"2026-09-30T00:00:00.000Z"});
 const result=LessonVerifier.verifyReceipt(receipt);
 assert.equal(result.receiptValid,true);
 assert.equal(result.lessonContentReviewPassed,false);
 assert.equal(result.findings.length,1);
});

test("真人 evidence collector 必須綁目前 candidate、R1 fingerprint 與 gate task/check 清單",()=>{
 assert.equal(HumanBuilder.CANDIDATE_ID,gateDefinition.formalTeachingCandidateId);
 assert.equal(HumanBuilder.CANDIDATE_FINGERPRINT,gateDefinition.formalTeachingCandidateFingerprint);
 assert.equal(HumanBuilder.R1_CONTENT_FINGERPRINT,gateDefinition.r1ContentFingerprint);
 assert.deepEqual(HumanBuilder.CRITICAL_TASKS,gateDefinition.criteria.formalTeachingUse.requiredCriticalTasks);
 assert.deepEqual(HumanBuilder.ACCESSIBILITY_CHECKS,gateDefinition.criteria.formalTeachingUse.requiredAccessibilityChecks);
 const evidence=validHuman(),ready=HumanBuilder.validateReady(evidence);
 assert.equal(ready.ok,true,ready.errors.join("; "));
 const human=Gate.evaluateHumanEvidence(evidence);
 assert.equal(human.usabilityPassed,true,human.errors.join("; "));
 assert.equal(human.accessibilityPassed,true,human.errors.join("; "));
 assert.equal(human.privateHoldoutPassed,false);
 assert.equal(human.r1bPassed,false);
});

test("任一初學者漏任務／有 blocker 都不能匯出完成回條",()=>{
 const evidence=validHuman();
 evidence.usability.participants[1].tasks.reload_and_resume=false;
 evidence.usability.participants[2].blockingIssues.push("無法找到匯出入口");
 const ready=HumanBuilder.validateReady(evidence);
 assert.equal(ready.ok,false);
 assert.ok(ready.errors.some(e=>/reload|重新整理|匯出|blocking/.test(e)));
});

test("final-phase status 無真人證據時第一個 action 固定是 R1a",()=>{
 const result=Status.evaluate();
 assert.equal(result.formalTeaching,"BLOCKED");
 assert.equal(result.formalEvaluation,"BLOCKED");
 assert.equal(result.learningEffect,"NOT_MEASURED");
 assert.equal(result.nextAction,"COLLECT_R1A_EXTERNAL_REVIEW");
 assert.equal(result.evidenceStatus.r1a,false);
 assert.equal(result.evidenceStatus.usability,false);
 assert.equal(result.evidenceStatus.accessibility,false);
 assert.equal(result.evidenceStatus.privateHoldout,false);
 assert.equal(result.evidenceStatus.r1b,false);
});

test("R1a、19 課與真人 teaching evidence 到位後，status 只前進到 private unseen/R1b，不宣稱 learning effect",()=>{
 const result=Status.evaluate({r1:validR1(),lessonReview:validLesson(),human:validHuman()});
 assert.equal(result.formalTeaching,"PASS");
 assert.equal(result.formalEvaluation,"BLOCKED");
 assert.equal(result.learningEffect,"NOT_MEASURED");
 assert.equal(result.nextAction,"ESTABLISH_PRIVATE_UNSEEN_POOL");
 assert.equal(result.evidenceStatus.r1a,true);
 assert.equal(result.evidenceStatus.lessonReview,true);
 assert.equal(result.evidenceStatus.usability,true);
 assert.equal(result.evidenceStatus.accessibility,true);
});
