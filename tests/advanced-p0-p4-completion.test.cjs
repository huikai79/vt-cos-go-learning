const test=require("node:test");
const assert=require("node:assert/strict");
const LegacyEvents=require("../advanced-comparable-position-events.js");
const LegacyDelayed=require("../advanced-delayed-comparable-events.js");
const V2Events=require("../advanced-comparable-events-v2.js");
const V2Delayed=require("../advanced-delayed-comparable-events-v2.js");
const SevenEvents=require("../advanced-seven-day-comparable-events.js");
const EnclosureEvents=require("../advanced-enclosure-comparable-events.js");
const Cross=require("../advanced-cross-family-analysis.js");
const Boundary=require("../advanced-p0-p4-boundary.cjs");

function emptyStores(){
 return{
  legacyImmediate:LegacyEvents.read({getItem:()=>null}).store,
  legacyDelayed:LegacyDelayed.read({getItem:()=>null}).store,
  doubleImmediate:V2Events.read({getItem:()=>null}).store,
  doubleDelayed:V2Delayed.read({getItem:()=>null}).store,
  doubleSeven:SevenEvents.read({getItem:()=>null}).store,
  enclosure:EnclosureEvents.read({getItem:()=>null}).store
 };
}

test("cross-family analysis 保留三個 family 且缺資料為 null，不合成總分",()=>{
 const result=Cross.summarize(emptyStores(),{nowMs:Date.parse("2026-10-10T00:00:00Z")});
 assert.equal(result.ok,true,JSON.stringify(result.errors));
 assert.deepEqual(result.rows.map(row=>row.familyId),["urgent_atari_rescue","double_atari","enclosure_capture"]);
 for(const row of result.rows){
  assert.equal(row.immediateFirst,null);
  assert.equal(row.delayed24hFirst,null);
  assert.equal(row.delayed7dFirst,null);
  assert.equal(row.mastery,null);
  assert.equal(row.retentionConclusion,null);
  assert.equal(row.transferConclusion,null);
 }
 assert.equal(result.aggregation,"no_combined_score");
 assert.equal(result.authority,"descriptive_cross_family_process_check_only");
 assert.equal(result.schedulerEligible,false);
 assert.equal(result.formalEligible,false);
 assert.equal(result.learningEffect,null);
});

test("cross-family source 分析失敗時不得 fallback 成看似成功結果",()=>{
 const stores=emptyStores();
 stores.doubleImmediate={schemaVersion:999,eventStreamVersion:"bad",events:[]};
 const result=Cross.summarize(stores,{nowMs:Date.parse("2026-10-10T00:00:00Z")});
 assert.equal(result.ok,false);
 assert.ok(result.errors.some(entry=>entry.source==="double_atari"||entry.source==="double_immediate"));
 assert.equal(result.retentionConclusion,null);
 assert.equal(result.transferConclusion,null);
});

test("P0-P4 boundary 只宣告工程停止擴張，不升格 formal 或 learning effect",()=>{
 const result=Boundary.evaluate();
 assert.equal(result.engineeringReady,true,JSON.stringify(result.checks));
 assert.equal(result.stageStatus,"ENGINEERING_EXPANSION_STOP");
 assert.equal(result.nextPriority,"HUMAN_EVIDENCE_AND_CONTENT_VALIDATION");
 assert.ok(result.blockedWithoutNewEvidence.includes("new comparable family"));
 assert.ok(result.blockedWithoutNewEvidence.includes("additional spacing heuristic"));
 assert.ok(result.blockedWithoutNewEvidence.includes("adaptive scheduler escalation"));
 assert.ok(result.blockedWithoutNewEvidence.includes("mastery probability model"));
 assert.equal(result.formalTeaching,"BLOCKED");
 assert.equal(result.formalEvaluation,"BLOCKED");
 assert.equal(result.learningEffect,"NOT_MEASURED");
});
