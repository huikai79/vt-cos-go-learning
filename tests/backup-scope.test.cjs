const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Candidate=require("../formal-teaching-candidate.cjs");
const candidate=require("../formal-teaching-candidate.json");
const gate=require("../teaching-gate.json");
const example=require("../formal-teaching-evidence.example.json");

const root=path.resolve(__dirname,"..");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const advanced=fs.readFileSync(path.join(root,"advanced.html"),"utf8");

test("Core 備份入口明確限定 Core/實戰，並指向獨立 Advanced 備份",()=>{
  assert.match(index,/備份核心與實戰資料/);
  assert.match(index,/獨立進階訓練請到「進階訓練」頁另行匯出/);
  assert.match(index,/獨立進階訓練則在進階頁另行匯出/);
  assert.doesNotMatch(index,/>備份完整資料</);
  assert.match(advanced,/匯出進階練習原始事件/);
});

test("backup-scope 文案變更後 formal candidate 重新凍結且 gate/example 綁定一致",()=>{
  const verification=Candidate.evaluateManifest(candidate,root);
  assert.equal(verification.valid,true,verification.errors.join("\n"));
  assert.equal(candidate.candidateId,"formal-teaching-candidate-2026-09-29-v");
  assert.equal(candidate.assetFingerprint,"fnv1a32-js16-45fb67e5");
  assert.equal(gate.formalTeachingCandidateId,candidate.candidateId);
  assert.equal(gate.formalTeachingCandidateFingerprint,candidate.assetFingerprint);
  assert.equal(example.candidateId,candidate.candidateId);
  assert.equal(example.candidateFingerprint,candidate.assetFingerprint);
  assert.equal(example.usability.candidateId,candidate.candidateId);
  assert.equal(example.usability.candidateFingerprint,candidate.assetFingerprint);
  assert.equal(example.accessibility.candidateId,candidate.candidateId);
  assert.equal(example.accessibility.candidateFingerprint,candidate.assetFingerprint);
});

test("重新凍結只代表資產身分，不把 example evidence 偽造成真人 PASS",()=>{
  assert.equal(example.usability.participantCount,0);
  assert.equal(example.usability.participantsAreTargetNovices,false);
  assert.equal(Object.values(example.usability.criticalTasks).every(value=>value===false),true);
  assert.equal(Object.values(example.accessibility.checks).every(value=>value===false),true);
  assert.equal(example.formalEvaluation.privateUnexposedHoldoutEstablished,false);
  assert.equal(example.formalEvaluation.r1bComparabilityEstablished,false);
  assert.equal(gate.formalTeachingCandidateId,candidate.candidateId);
});
