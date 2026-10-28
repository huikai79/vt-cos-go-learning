"use strict";
// Execute the actual Chinese summary functions: test data and fixtures are not
// a replacement for their authority, and translation text is not an evaluator.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Metrics=require("../learning-metrics.js");
const Trial=require("../trial.js");
const {render}=require("../core-markdown-source-adapter.cjs");
const {previewReport}=require("../core-markdown-english-preview.cjs");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
function actualFunction(name,dependencies={}) {
 const start=app.indexOf("  function "+name+"("),next=app.indexOf("\n  function ",start+12);
 assert.ok(start>=0 && next>start,"canonical "+name+" source changed");
 const body=app.slice(start,next);
 const params=Object.keys(dependencies);
 return new Function(...params,body+"\nreturn "+name+";")(...Object.values(dependencies));
}
const chineseDiagnostic=actualFunction("diagnosticSummaryText");
const chineseTrial=actualFunction("trialSummaryText",{skills:[
 {id:"capture-last-liberty-v1",name:"指定一手提子"},
 {id:"direct-join-v1",name:"一手直接連接"}
]});
const base=()=>({
 schemaVersion:1,exportedAt:"2026-10-28T00:00:00Z",uiVersion:"parity-diagnostic-v1",
 problems:[{id:"q1",title:"指定棋形"}],
 skills:[{id:"capture-last-liberty-v1",name:"指定棋串的一手提子"},
         {id:"direct-join-v1",name:"指定兩串的一手直接連接"}],
 state:{completed:[],missed:[],attempts:{q1:0},scheduler:{responses:[]},
 events:[],applicationResults:[],applicationEvents:[],trial:Trial.emptyState(),localExercises:[]},
 livePractice:{ok:false,error:"read unavailable"},liveEvidence:{ok:false,error:"engine unavailable"},
 integrated:{state:"absent"}
});
const day=24*60*60*1000,origin=Date.parse("2026-09-01T00:00:00Z");
function answer(offset,correct,skill="capture-last-liberty-v1",pool="practice") {
 return {type:"answer",occurredAt:new Date(origin+offset*day).toISOString(),
  problemId:"q1",skillId:skill,qualifiedOpportunity:true,unhinted:true,
  firstAnswer:true,transferLevel:"T2",pool,
  outcome:correct?"correct":"incorrect",elapsedMs:1500};
}
test("Actual Chinese diagnostic function and English report retain active and historical SCD meaning",()=>{
 const x=base();
 // Error, qualifying T2 checks after 1d and 7d, then another error at 8d.
 x.state.events=[answer(0,false),answer(1,true),answer(7,true),answer(8,false)];
 const canonical=Metrics.summarize({events:x.state.events,schedulerResponses:[]});
 const chinese=chineseDiagnostic(canonical);
 const rendered=render(x,{preview:true});
 const english=rendered.preview.content;
 assert.match(chinese,/2 次首答錯誤/);
 assert.match(chinese,/等待第一次延後複習/);
 assert.match(chinese,/1 段再犯間隔/);
 assert.match(english,/first-response errors observed: 2/);
 assert.match(english,/awaiting the first eligible delayed review/);
 assert.match(english,/Observed recurrence intervals: 1/);
 assert.match(english,/Previously completed delayed correction-distance samples: 1/);
 assert.equal(rendered.converted.report.diagnostics.policyVersion,Metrics.metricPolicy.id);
 assert.equal(canonical.skills[0].scd.completed.length,1);
 assert.equal(rendered.converted.report.diagnostics.skills[0].scd.completedSamples,1);
 assert.equal(rendered.converted.report.diagnostics.skills[0].errors,canonical.skills[0].observedErrors);
 assert.equal(rendered.converted.report.diagnostics.excluded,canonical.excludedResponsesWithoutQualification);
 assert.equal(rendered.preview.complete,false);
 assert.doesNotMatch(english,/mastery\s*\d+%/i);
});
test("Observed recurrence intervals preserve the latest censored lower bound from real Metrics.summarize",()=>{
 const x=base();
 // The first recurrence ends at the second error. A later correct opportunity
 // belongs to the CURRENT non-recurrence lower bound, not to that past interval.
 x.state.events=[answer(0,false),answer(1,true),answer(2,false),answer(3,true)];
 const canonical=Metrics.summarize({events:x.state.events,schedulerResponses:[]});
 const skill=canonical.skills.find(s=>s.skillId==="capture-last-liberty-v1");
 assert.equal(skill.recurrence.intervals.length,1);
 assert.equal(skill.recurrence.intervals[0].successfulOpportunitiesBetween,1);
 assert.equal(skill.recurrence.latestLowerBound.successfulOpportunitiesWithoutRecurrence,1);
 assert.match(chineseDiagnostic(canonical),/最近已觀察 1 段再犯間隔/);
 const result=render(x,{preview:true});
 const english=result.preview.content;
 assert.equal(result.converted.report.diagnostics.skills[0].recurrence.latestLowerBound,1);
 assert.match(english,/Observed recurrence intervals: 1/);
 assert.match(english,/Lower bound since the most recent observed error.*: 1/);
 assert.match(english,/first-response errors observed: 2; comparable opportunities: 4/);
 assert.equal(result.preview.complete,false);
 // Missing source lower-bound data is NOT evidence of zero recurrences.
 const corrupted=structuredClone(result.converted.report);
 delete corrupted.diagnostics.skills[0].recurrence.latestLowerBound;
 assert.throws(()=>previewReport(corrupted,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 corrupted.diagnostics.skills[0].recurrence.latestLowerBound=-1;
 assert.throws(()=>previewReport(corrupted,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 corrupted.diagnostics.skills[0].recurrence={state:"observed",intervals:0,latestLowerBound:1};
 assert.throws(()=>previewReport(corrupted,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});
test("Actual Chinese and English diagnostics retain empty, hinted and no-error distinctions",()=>{
 const x=base();
 const empty=Metrics.summarize({events:[],schedulerResponses:[]});
 assert.match(chineseDiagnostic(empty),/尚無可比較的未提示首答/);
 assert.match(render(x,{preview:true}).preview.content,/No comparable first responses/);
 x.state.events=[{...answer(0,true),qualifiedOpportunity:false,unhinted:false}];
 const hinted=Metrics.summarize({events:x.state.events,schedulerResponses:[]});
 assert.equal(hinted.excludedResponsesWithoutQualification,1);
 assert.match(chineseDiagnostic(hinted),/另有 1 筆/);
 assert.match(render(x,{preview:true}).preview.content,/otherwise ineligible lesson\/scheduler responses\): 1/);
 x.state.events=[answer(0,true)];
 const noError=Metrics.summarize({events:x.state.events,schedulerResponses:[]});
 assert.match(chineseDiagnostic(noError),/尚無首答錯誤/);
 assert.match(render(x,{preview:true}).preview.content,/no observed first-response errors/);
});
test("Actual trial summary remains descriptive in both languages with two previously exposed batches",()=>{
 const x=base(),skill=Trial.protocol.skills[0];
 x.state.trial={...Trial.emptyState(),batches:[
  {id:"b1",label:"A",role:"baseline",completedAt:"2026-09-01T00:00:00Z",problemIds:["p1"]},
  {id:"b2",label:"B",role:"followup",completedAt:"2026-09-08T00:00:00Z",problemIds:["p2"]}
 ],answers:[
  {batchId:"b1",problemId:"p1",skillId:skill,correct:false},
  {batchId:"b2",problemId:"p2",skillId:skill,correct:true}
 ]};
 const canonical=Trial.summarize(x.state.trial,[],[]);
 const chinese=chineseTrial(canonical);
 const result=render(x,{preview:true});
 const english=result.preview.content;
 assert.equal(canonical.status,"data_insufficient");
 assert.match(chinese,/兩批描述完成，仍屬資料不足/);
 assert.match(chinese,/基線 0\/1/);
 assert.match(chinese,/追蹤 1\/1/);
 assert.match(chinese,/較高/);
 assert.match(chinese,/已在舊 R1 自我審查中曝光/);
 assert.match(english,/baseline batch: 0\/1/);
 assert.match(english,/follow-up batch: 1\/1/);
 assert.match(english,/descriptive difference 1/);
 assert.match(english,/previously seen in the R1 self-review/);
 assert.match(english,/evidence remains insufficient/);
 assert.equal(result.converted.report.trial.formalEligible,false);
 assert.equal(result.converted.report.trial.reviewGate,"personal_pilot_only");
 assert.equal(result.converted.report.trial.protocolId,Trial.protocol.id);
 assert.equal(result.preview.complete,false);
});
test("Incomplete, misordered and excess pilot batches fail closed, not 'two batches complete'",()=>{
 const minimal={exportedAt:"date",uiVersion:"v",completed:0,total:0,pendingReview:0,
  items:[],skills:[],events:[],sgf:[],diagnostics:{state:"empty",excluded:0},
  practice:{state:"absent"},live:{state:"absent"}};
 const pilot={state:"ok",status:"data_insufficient",formalEligible:false,protocolId:Trial.protocol.id,
  reviewGate:"personal_pilot_only",previouslyExposed:true,
  batches:[],application:{correct:0,total:0,presented:0,unanswered:0,inappropriate:0,excluded:0}};
 const p={...minimal,trial:pilot};
 assert.match(previewReport(p,{preview:true}).content,/baseline and seven-day follow-up are not both complete/);
 for(const bad of [
  [{role:"followup",correct:0,total:1}],
  [{role:"baseline",correct:0,total:1},{role:"baseline",correct:0,total:1}],
  [{role:"baseline",correct:0,total:1},{role:"followup",correct:1,total:1},{role:"followup",correct:0,total:1}]
 ])assert.throws(()=>previewReport({...p,trial:{...pilot,batches:bad}},{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 assert.throws(()=>previewReport({...p,trial:{...pilot,batches:[{role:"baseline",correct:0,total:1}],directions:[]}},{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});
