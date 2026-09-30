const test=require("node:test");
const assert=require("node:assert/strict");
const Go=require("../go.js");
const ThrowIn=require("../throw-in-transfer-fixtures.cjs");
const Advanced=require("../advanced-content.js");

test("throw-in transfer contract 連結既有倒撲與新 semeai 對照，不建立新 KC",()=>{
  assert.equal(ThrowIn.CONTRACT_ID,"throw-in-transfer-v1");
  assert.equal(ThrowIn.STATUS,"teaching_candidate");
  const result=ThrowIn.validateAll();
  assert.equal(result.ok,true,result.errors.join("\n"));
  assert.equal(result.snapback.sourceExperienceId,"adv-seq-snapback-01");
  assert.ok(result.snapback.recaptureCount>1);
});

test("送子正例必須在被提後改變目標棋串氣數，反例則保持不變",()=>{
  const positive=ThrowIn.semeaiFixtures.find(item=>item.role==="positive_liberty_change");
  const negative=ThrowIn.semeaiFixtures.find(item=>item.role==="negative_no_change");
  const p=ThrowIn.validateSemeaiFixture(positive),n=ThrowIn.validateSemeaiFixture(negative);
  assert.equal(p.ok,true,p.errors.join("\n"));
  assert.equal(n.ok,true,n.errors.join("\n"));
  assert.ok(p.after<p.before);
  assert.equal(n.after,n.before);
});

test("learner-facing throw-in candidate 明示機制與反例，假眼用途仍保持未升格",()=>{
  const item=Advanced.experiences.find(entry=>entry.id==="adv-r15");
  assert.ok(item);
  assert.equal(item.candidateId,"throw-in-transfer-v1");
  assert.equal(item.candidateStatus,"teaching_candidate");
  assert.equal(item.kcStatus,"not_promoted");
  assert.equal(item.taskFeatures.negativeCaseRequired,true);
  assert.equal(item.taskFeatures.falseEyeContextStatus,"research_candidate_not_promoted");
  assert.match(item.explanation,/犧牲本身不是價值/);
  assert.match(item.explanation,/反例/);
  assert.equal(ThrowIn.deferredContexts[0].context,"false_eye_destruction");
  assert.equal(ThrowIn.deferredContexts[0].status,"research_candidate_not_promoted");
});

test("送子 fixture 不取得 scheduler/formal authority",()=>{
  assert.equal("schedulerEligible" in ThrowIn,false);
  assert.equal("formalEligible" in ThrowIn,false);
  assert.equal("mastery" in ThrowIn,false);
});
