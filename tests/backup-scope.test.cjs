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

test("目前 formal candidate 動態指紋有效且 gate/example 綁定一致",()=>{
  const verification=Candidate.evaluateManifest(candidate,root);
  assert.equal(verification.valid,true,verification.errors.join("\n"));
  assert.match(candidate.candidateId,/^formal-teaching-candidate-/);
  assert.match(candidate.assetFingerprint,/^fnv1a32-js16-[0-9a-f]{8}$/);
  assert.equal(verification.computedFingerprint,candidate.assetFingerprint);
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

const Drift=require("../scripts/audit-formal-candidate-drift.cjs");
test("唯讀 asset identity 診斷能區分受保護檔案改動、基準失效與不完整資料",()=>{
  const paths=["index.html","app.js"];
  const frozen={"index.html":"a".repeat(40),"app.js":"b".repeat(40)};
  const changed={...frozen,"app.js":"c".repeat(40)};
  const expected=Drift.fingerprintFor(paths,frozen);
  const current=Drift.compare({assetPaths:paths,expectedFingerprint:expected,
    referenceEntries:frozen,currentEntries:changed});
  assert.equal(current.status,"DRIFT_BLOCKED");
  assert.deepEqual(current.changedAssets.map(x=>x.path),["app.js"]);
  assert.equal(current.releaseEligible,false);
  assert.equal(current.formalTeachingResult,"NOT_EVALUATED");
  assert.equal(Drift.compare({assetPaths:paths,expectedFingerprint:expected,
    referenceEntries:frozen,currentEntries:frozen}).status,"ASSET_IDENTITY_MATCH");
  const wrongReference=Drift.compare({assetPaths:paths,expectedFingerprint:expected,
    referenceEntries:changed,currentEntries:changed});
  assert.equal(wrongReference.status,"REFERENCE_INVALID");
  assert.throws(()=>Drift.fingerprintFor(paths,{"index.html":"a".repeat(40)}),{code:"CANDIDATE_DRIFT_AUDIT_ERROR"});
  assert.throws(()=>Drift.parseTree("120000 blob "+"a".repeat(40)+"\tindex.html\0",paths),
    {code:"CANDIDATE_DRIFT_AUDIT_ERROR"});
  assert.throws(()=>Drift.fingerprintFor(["index.html","index.html"],frozen),
    {code:"CANDIDATE_DRIFT_AUDIT_ERROR"});
});
