"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Metrics=require("../learning-metrics.js");
const Trial=require("../trial.js");
const {render}=require("../core-markdown-source-adapter.cjs");
const {auditComparison}=require("../scripts/audit-core-markdown-differential.cjs");

const source=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
function canonicalExport(snapshot) {
  const start=source.indexOf("  function exportNotes() {");
  const end=source.indexOf("  function exportRawEvents() {",start);
  assert.ok(start>=0 && end>start,"cannot extract actual canonical exportNotes()");
  let captured=null;
  const state={...snapshot.state,completed:new Set(snapshot.state.completed),missed:new Set(snapshot.state.missed)};
  const deps={
    state,problems:snapshot.problems,skills:snapshot.skills,uiVersion:snapshot.uiVersion,
    Metrics,Trial,BLACK:1,
    readLivePractice:()=>snapshot.livePractice,
    readLiveEvidence:()=>snapshot.liveEvidence,
    computeIntegratedProgress:()=>snapshot.integrated?.state==="ok"?snapshot.integrated.summary:null,
    diagnosticSummaryText:()=>"[canonical diagnostic text]",trialSummaryText:()=>"[canonical personal-pilot text]",
    reviewStatusLabel:s=>s==="original_confirmed"?"已確認原棋譜著手可接受":
      s==="alternative_confirmed"?"已確認另一候選可接受":"尚未確認",
    liveEvidenceStateLabel:s=>s,
    downloadFile:(body,mime,filename)=>{captured={body,mime,filename};}
  };
  const code='"use strict"; const {state,problems,skills,uiVersion,Metrics,Trial,BLACK,'+
    'readLivePractice,readLiveEvidence,computeIntegratedProgress,diagnosticSummaryText,'+
    'trialSummaryText,reviewStatusLabel,liveEvidenceStateLabel,downloadFile}=deps;\n'+
    source.slice(start,end)+'\nreturn exportNotes;';
  const exportNotes=new Function("deps",code)(deps);
  exportNotes();
  assert.ok(captured?.body,"actual exportNotes() did not produce Markdown");
  return captured;
}
const snapshot=()=>({
 schemaVersion:1,exportedAt:"2026-10-26T00:00:00Z",uiVersion:"parity-contract-v1",
 problems:[{id:"u1",title:"氣與提子"},{id:"u2",title:"連接與切斷"}],
 skills:[{id:"capture-last-liberty-v1",name:"提掉最後一口氣"}],
 state:{
   completed:["u1"],missed:["u2"],attempts:{u1:2,u2:0},
   scheduler:{responses:[]},events:[
    {type:"presented",occurredAt:"T1",skillId:"capture-last-liberty-v1",problemId:"u1",itemVersion:"item-v1"},
    {type:"answer",occurredAt:"T2",skillId:"capture-last-liberty-v1",problemId:"u1",firstAnswer:true,
      unhinted:true,qualifiedOpportunity:true,outcome:"incorrect",elapsedMs:1000,itemVersion:"item-v1",scoringContractVersion:"score-v2"},
    {type:"hint",occurredAt:"T3",skillId:"capture-last-liberty-v1",problemId:"u1"},
    {type:"answer",occurredAt:"T4",skillId:"capture-last-liberty-v1",problemId:"u1",firstAnswer:false,
      unhinted:false,qualifiedOpportunity:false,outcome:"correct",elapsedMs:2000,itemVersion:"item-v1"},
    {type:"presentation_end",occurredAt:"T5",skillId:"capture-last-liberty-v1",problemId:"u1",outcome:"solved"}
   ],
   trial:Trial.emptyState(),applicationResults:[],applicationEvents:[],
   localExercises:[{
    id:"local-1",source:{sourceName:"review.sgf",moveNumber:12,boardSize:9,originalStones:[[3,3,1],[4,4,2]]},
    linkedSkill:"capture-last-liberty-v1",completedAt:"2026-10-26",
    reflection:{candidate:"D4",reason:"What if White enters?",expectedOpponentResponse:"E5",savedBeforeAnswer:true},
    review:{status:"unconfirmed",acceptableAnswer:"",nextCue:"Check liberties"}
   }]
 },
 livePractice:{ok:false,error:"event store unavailable"},
 liveEvidence:{ok:false,error:"provider result UNKNOWN"},
 integrated:{state:"absent"}
});

test("Execute ACTUAL Chinese exportNotes and English offline renderer on the SAME snapshot",()=>{
 const snap=snapshot(),original=JSON.stringify(snap);
 const zh=canonicalExport(snap),en=render(snap,{preview:true});
 assert.equal(JSON.stringify(snap),original,"snapshot was mutated");
 const comparison=auditComparison({snapshot:snap,canonical:zh,english:en});
 assert.equal(comparison.releaseEligible,false);
 assert.equal(comparison.status,"BLOCKED");
 for(const id of ["core.completed-total","core.review","skills.first-unhinted-counts",
   "events.count-order","events.first-retry-hints","events.version-audit","sgf.count-review","source-unchanged"]){
   assert.equal(comparison.checks.find(x=>x.id===id)?.status,"MATCHED",id);
 }
 for(const id of ["names.reader-facing","timestamp.format","diagnostic.prose",
   "integrated-and-trial.prose","event-versions.readable-export","browser-download","independent-review"]){
   assert.equal(comparison.checks.find(x=>x.id===id)?.status,"REVIEW_REQUIRED",id);
 }
 assert.equal(zh.mime,"text/markdown;charset=utf-8");
 assert.equal(en.converted.complete,false);
 assert.equal(en.preview.complete,false);
 assert.match(zh.body,/已完成：1 \/ 2/);
 assert.match(en.preview.content,/Core questions completed: 1 \/ 2/);
 assert.match(zh.body,/待複習：1 題/);
 assert.match(en.preview.content,/Questions marked for review: 1/);
 assert.match(zh.body,/可比較機會 1 次；第一次作答正確 0 次/);
 assert.match(en.preview.content,/1 eligible first unhinted opportunities; 0 correct first responses/);
 const zhOrder=[...zh.body.matchAll(/\| (T\d) \|/g)].map(m=>m[1]);
 const enOrder=[...en.preview.content.matchAll(/\| (T\d) \|/g)].map(m=>m[1]);
 assert.deepEqual(zhOrder,["T1","T2","T3","T4","T5"]);
 assert.deepEqual(enOrder,zhOrder);
 assert.match(zh.body,/T2 \|.*首次作答.*未提示.*錯誤/);
 assert.match(en.preview.content,/T2 \|.*first response.*no hint shown.*incorrect for this task/);
 assert.match(zh.body,/T4 \|.*重試作答.*提示後.*正確/);
 assert.match(en.preview.content,/T4 \|.*retry response.*after a hint.*correct for this task/);
 assert.match(zh.body,/事件流讀取失敗：event store unavailable/);
 assert.match(en.preview.content,/ERROR: Practice event stream could not be read/);
 assert.match(zh.body,/實戰紀錄讀取失敗：provider result UNKNOWN/);
 assert.match(en.preview.content,/ERROR: Live evidence could not be read/);
 assert.match(zh.body,/原局面（9 路）：黑 \(4,4\)；白 \(5,5\)/);
 assert.match(en.preview.content,/Position \(9×9\): Black \(4,4\); White \(5,5\)/);
 assert.match(zh.body,/可接受答案確認：尚未確認/);
 assert.match(en.preview.content,/Acceptable answer verification: not confirmed/);
 assert.match(zh.body,/我先考慮的候選手：D4/);
 assert.match(en.preview.content,/My initial candidate: D4/);
 assert.equal(en.converted.audit.sgfSourceCount,1);
 assert.deepEqual(en.converted.audit.sgfPositionStoneCounts,[2]);
 assert.equal(en.converted.audit.eventVersions[1].scoringContractVersion,"score-v2");
});

test("Unknown or malformed SGF cannot silently disappear from the English report",()=>{
 const snap=snapshot();
 snap.state.localExercises[0].source.originalStones=null;
 const zh=canonicalExport(snap);
 assert.match(zh.body,/原局面（9 路）：黑 無；白 無/);
 assert.throws(()=>render(snap,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 // Reject rather than fabricating the real board: this is an intentional
 // incompatibility, not a false claim of complete multilingual equivalence.
});
test("Preserve all original events including unknown eligibility without shrinking denominator",()=>{
 const snap=snapshot();
 snap.state.events.push({type:"answer",occurredAt:"T6",skillId:"capture-last-liberty-v1",
   problemId:"u2",outcome:"UNKNOWN",firstAnswer:null,unhinted:null,qualifiedOpportunity:false});
 const zh=canonicalExport(snap),en=render(snap,{preview:true});
 const zhRows=[...zh.body.matchAll(/\| (T\d) \|/g)].map(m=>m[1]);
 const enRows=[...en.preview.content.matchAll(/\| (T\d) \|/g)].map(m=>m[1]);
 assert.deepEqual(enRows,zhRows);
 assert.equal(en.converted.report.skills[0].eligible,1);
 assert.equal(en.converted.audit.sourceEvents,snap.state.events.length);
 assert.match(en.preview.content,/UNKNOWN \(first-answer status\)/);
});

test("Differential audit detects dropped events and numerical drift, not only renamed headings",()=>{
 const snap=snapshot(),zh=canonicalExport(snap),en=render(snap,{preview:true});
 const altered={...en,preview:{...en.preview,content:en.preview.content.replace("Core questions completed: 1 / 2","Core questions completed: 2 / 2")}};
 const mismatch=auditComparison({snapshot:snap,canonical:zh,english:altered});
 assert.equal(mismatch.checks.find(x=>x.id==="core.completed-total").status,"BLOCKED");
 const dropped={...en,preview:{...en.preview,content:en.preview.content.split("\n").filter(x=>!x.startsWith("| T4 |")).join("\n")}};
 assert.equal(auditComparison({snapshot:snap,canonical:zh,english:dropped}).checks.find(x=>x.id==="events.count-order").status,"BLOCKED");
 const badVersion={...en,converted:{...en.converted,audit:{...en.converted.audit,eventVersions:[]}}};
 assert.equal(auditComparison({snapshot:snap,canonical:zh,english:badVersion}).checks.find(x=>x.id==="events.version-audit").status,"BLOCKED");
});
test("Unknown first-answer events still count and do not clear readable export blockers",()=>{
 const snap=snapshot();
 snap.state.events.push({type:"answer",occurredAt:"T6",skillId:"capture-last-liberty-v1",
   problemId:"u2",outcome:"UNKNOWN",firstAnswer:null,unhinted:null,qualifiedOpportunity:false});
 const zh=canonicalExport(snap),en=render(snap,{preview:true});
 const audit=auditComparison({snapshot:snap,canonical:zh,english:en});
 assert.equal(audit.checks.find(x=>x.id==="events.count-order").status,"MATCHED");
 assert.equal(audit.checks.find(x=>x.id==="events.first-retry-hints").status,"MATCHED");
 assert.equal(audit.releaseEligible,false);
});