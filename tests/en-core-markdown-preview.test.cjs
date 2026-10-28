"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {previewReport}=require("../core-markdown-english-preview.cjs");
const base=()=>({exportedAt:"2026-10-24T00:00:00Z",uiVersion:"learner-workspace-v70",completed:0,total:106,pendingReview:0,items:[],skills:[],events:[],sgf:[],diagnostics:{state:"empty",excluded:0},practice:{state:"absent"},live:{state:"absent"}});
test("English Markdown preview is isolated, incomplete and preserves empty-state limits",()=>{
 assert.throws(()=>previewReport(base()),{code:"LOCALE_EXPORT_BLOCKED"});
 assert.throws(()=>previewReport(base(),{preview:true,runtime:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 assert.throws(()=>previewReport(base(),{preview:true,publishable:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 const result=previewReport(base(),{preview:true});
 assert.equal(result.status,"candidate-preview");assert.equal(result.complete,false);
 assert.match(result.content,/No comparable first responses without hints/);
 assert.match(result.content,/Core questions completed: 0 \/ 106/);
 assert.match(result.content,/## My Reflections/);
 assert.equal(require("../site-locales.json").locales.find(x=>x.id==="en").publishable,false);
 const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
 assert.doesNotMatch(app,/core-markdown-english-preview/);
 assert.match(app,/downloadFile\(lines.join\("\\n"\), "text\/markdown;charset=utf-8", "個人圍棋練習紀錄.md"\)/);
});
test("First response, retry, hinted and unknown outcomes remain distinct",()=>{
 const d=base();d.events=[
  {occurredAt:"t1",skill:"KC-1",item:"u1-01",type:"answer",firstAnswer:true,unhinted:true,outcome:"correct",elapsedMs:1000},
  {occurredAt:"t2",skill:"KC-1",item:"u1-01",type:"answer",firstAnswer:false,unhinted:false,outcome:"wrong",elapsedMs:2000},
  {occurredAt:"t3",skill:"KC-1",item:"u1-01",type:"answer",firstAnswer:null,unhinted:null,outcome:"UNKNOWN"},
  {occurredAt:"t4",skill:"KC-1",item:"u1-01",type:"presentation_end",outcome:"unanswered"}
 ];d.diagnostics={state:"partial",excluded:2};
 const s=previewReport(d,{preview:true}).content;
 for(const phrase of ["first response","retry response","no hint shown","after a hint","UNKNOWN (first-answer status)","UNKNOWN (answer outcome)","unanswered","eligibility-unknown"])assert.ok(s.includes(phrase),phrase);
 assert.doesNotMatch(s,/mastery \d+%/i);
});
test("Read errors, unknown provider state and absent data are not reported as success",()=>{
 const d=base();d.practice={state:"error",reason:"storage unavailable"};d.live={state:"unknown"};
 const s=previewReport(d,{preview:true}).content;
 assert.match(s,/ERROR: Practice event stream could not be read/);
 assert.match(s,/UNKNOWN: live data could not be verified/);
 assert.doesNotMatch(s,/Live data collection:.*eligible/);
 d.live={state:"ok",assessed:3,eligible:1,unscored:2,versions:{eligibility:"v1",scoring:"v2",progress:"v3"},boundary:"practice only",skills:[]};
 assert.match(previewReport(d,{preview:true}).content,/practice only/);
 d.live.skills=[{name:"Reading",eligible:1,first:1,satisfied:2,unsatisfied:0,unanswered:0,state:"completed"}];
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});
test("SGF user notes are preserved but cannot inject a Markdown heading or column",()=>{
 const d=base();
 d.sgf=[{source:"match.sgf",number:3,skill:"liberties",date:"2026-10-24",size:9,position:{black:"(4,4)",white:"none"},reflection:{candidate:"D4 | <script>",reason:"line 1\n# Fake heading",opponent:"unsure",timing:"before"},review:{status:"unconfirmed",evidence:"",next:""}}];
 const s=previewReport(d,{preview:true}).content;
 assert.match(s,/D4 \\\| &lt;script&gt;/);
 assert.match(s,/line 1 ⏎ # Fake heading/);
 assert.match(s,/not confirmed/);
 assert.doesNotMatch(s,/^# Fake heading/m);
 d.sgf[0].review.status="accepted_without_review";
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});
test("Unsupported trial/integrated schema cannot masquerade as a complete translation",()=>{
 for(const key of ["integrated","trial"]){const d=base();d[key]={};assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});}
});

test("Diagnostic cases retain observed errors, delayed checks, recurrence and unknown state",()=>{
 const d=base();d.diagnostics={state:"partial",excluded:1,skills:[
  {id:"kc-a",label:"Liberty task",opportunities:3,errors:1,scd:{state:"awaiting_second",opportunities:2},recurrence:{state:"lower_bound",opportunities:1}},
  {id:"kc-b",label:null,opportunities:1,errors:0,scd:{state:"no_sample"},recurrence:{state:"not_measured"}}
 ]};
 let content=previewReport(d,{preview:true}).content;
 for(const phrase of ["first-response errors observed: 1","awaiting the second eligible delayed review","Lower bound","Unclassified observable skill outcome","eligibility-unknown"])assert.ok(content.includes(phrase),phrase);
 d.diagnostics.skills[0].errors=4;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.diagnostics={state:"unknown",excluded:0};
 assert.match(previewReport(d,{preview:true}).content,/UNKNOWN: diagnostic/);
});
test("Combined evidence remains descriptive, versioned, count-checked and explicit on error",()=>{
 const d=base();d.integrated={state:"ok",policy:{version:"progress-v1"},boundary:"Practice is not proof of transfer",
  collection:{status:"collecting",inspected:4,eligible:2,first:2,unanswered:1,sessions:1,boundary:"incomplete data"},
  skills:[{name:"Liberties",practice:3,delayed:1,live:2,first:2,satisfied:1,next:"another independent check"}]};
 const result=previewReport(d,{preview:true});
 for(const phrase of ["progress-v1","Practice is not proof of transfer","collecting","another independent check","do not certify mastery"])assert.ok(result.content.includes(phrase),phrase);
 assert.equal(result.complete,false);
 d.integrated.skills[0].satisfied=3;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.integrated={state:"error",reason:"broken record"};
 assert.match(previewReport(d,{preview:true}).content,/ERROR: Combined practice evidence/);
});
test("Personal trial does not become formal unseen evaluation, even with two batches",()=>{
 const d=base();d.trial={state:"ok",status:"data_insufficient",formalEligible:false,
  protocolId:require("../trial.js").protocol.id,reviewGate:"personal_pilot_only",previouslyExposed:true,
  batches:[{role:"baseline",correct:1,total:2},{role:"followup",correct:2,total:2}],
  application:{correct:1,total:3,presented:4,unanswered:1,inappropriate:1,excluded:2},
  directions:[{skill:"Liberties",baselineCorrect:1,baselineTotal:2,followupCorrect:2,followupTotal:2}]};
 const result=previewReport(d,{preview:true});
 for(const phrase of ["previously exposed","remain insufficient","descriptive difference 1","hinted or repeated excluded 2","personal usability"])assert.ok(result.content.includes(phrase),phrase);
 assert.equal(result.complete,false);
 d.trial.formalEligible=true;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.trial.formalEligible=false;d.trial.protocolId="wrong-protocol";
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.trial.protocolId=require("../trial.js").protocol.id;
 d.trial.previouslyExposed=false;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.trial.previouslyExposed=true;d.trial.batches[0].correct=5;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.trial={state:"unknown"};
 assert.match(previewReport(d,{preview:true}).content,/UNKNOWN: personal pilot/);
});
test("Actual canonical incorrect answer is rendered as incorrect rather than UNKNOWN",()=>{
 const d=base();
 d.events=[{occurredAt:"t",type:"answer",firstAnswer:true,unhinted:true,outcome:"incorrect",skill:"kc",item:"u1"}];
 const report=previewReport(d,{preview:true}).content;
 assert.match(report,/incorrect for this task/);
 assert.doesNotMatch(report,/UNKNOWN \(answer outcome\)/);
});

test("Diagnostic policy and historical SCD samples survive an active later error",()=>{
 const d=base();d.diagnostics={state:"partial",policyVersion:require("../learning-metrics.js").metricPolicy.id,
  excluded:0,skills:[{id:"capture-last-liberty-v1",label:"Capture a named group",opportunities:4,errors:2,
  scd:{state:"awaiting_second",opportunities:1,completedSamples:1},
  recurrence:{state:"observed",intervals:1}}]};
 const preview=previewReport(d,{preview:true}).content;
 assert.match(preview,/Diagnostic metric policy:/);
 assert.match(preview,/Previously completed delayed correction-distance samples: 1/);
 assert.match(preview,/awaiting the second eligible delayed review/);
 assert.doesNotMatch(preview,/mastery [0-9]+%/i);
 d.diagnostics.skills[0].scd.completedSamples=-1;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});