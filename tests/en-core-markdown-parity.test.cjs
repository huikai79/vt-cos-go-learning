"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {previewReport}=require("../core-markdown-english-preview.cjs");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
const begin=app.indexOf("  function exportNotes() {");
const end=app.indexOf("  function exportRawEvents() {",begin);
if(begin<0||end<begin)throw Error("canonical exportNotes boundary missing");
const canonical=app.slice(begin,end);
const base=()=>({exportedAt:"2026-10-25T08:00:00Z",uiVersion:"workspace-v1",completed:1,total:2,pendingReview:1,
 items:[{title:"Liberty check",attempts:2,completed:true,needsReview:true},{title:"Connection",attempts:0,completed:false,needsReview:false}],
 skills:[{name:"Liberties",eligible:1,correct:0}],diagnostics:{state:"partial",excluded:1,skills:[
  {id:"kc",label:"Liberties",opportunities:1,errors:1,scd:{state:"no_sample"},recurrence:{state:"lower_bound",opportunities:0}}]},
 events:[
 {occurredAt:"t1",skill:"kc",item:"u1",type:"presented"},
 {occurredAt:"t2",skill:"kc",item:"u1",type:"answer",firstAnswer:true,unhinted:true,outcome:"incorrect",elapsedMs:1000},
 {occurredAt:"t3",skill:"kc",item:"u1",type:"hint"},
 {occurredAt:"t4",skill:"kc",item:"u1",type:"answer",firstAnswer:false,unhinted:false,outcome:"correct",elapsedMs:2000},
 {occurredAt:"t5",skill:"kc",item:"u1",type:"presentation_end",outcome:"solved"}],
 practice:{state:"error",reason:"storage failure"},live:{state:"unknown"},sgf:[]});
test("Source-preserving event fixture: canonical export guards the same event fields and order",()=>{
 for(const key of ["event.occurredAt","event.skillId","event.problemId","event.type","event.firstAnswer","event.unhinted","event.outcome","event.elapsedMs"])
   assert.ok(canonical.includes(key),key);
 const events=base().events;
 const report=previewReport(base(),{preview:true}).content;
 const rows=report.split("\n").filter(x=>x.startsWith("| t"));
 assert.equal(rows.length,events.length);
 for(let i=0;i<events.length;i++)assert.ok(rows[i].includes(events[i].occurredAt),"event order "+i);
 assert.match(rows[1],/first response.*no hint shown.*incorrect for this task/);
 assert.match(rows[3],/retry response.*after a hint.*correct for this task/);
 assert.match(report,/ERROR: Practice event stream/);
 assert.match(report,/UNKNOWN: live data/);
});
test("Canonical and English sections preserve descriptive counts but do not claim equivalent full export",()=>{
 for(const source of ["state.completed.size","state.missed.size","state.attempts[problem.id]","qualifiedOpportunity",
  "excludedResponsesWithoutQualification","Trial.summarize","computeIntegratedProgress","liveEvidence.summary"])
  assert.ok(canonical.includes(source),source);
 const english=previewReport(base(),{preview:true});
 assert.match(english.content,/Core questions completed: 1 \/ 2/);
 assert.match(english.content,/Questions marked for review: 1/);
 assert.match(english.content,/1 eligible first unhinted opportunities; 0 correct first responses/);
 assert.match(english.content,/Hinted or eligibility-unknown responses excluded from this diagnostic: 1/);
 assert.equal(english.complete,false);
 assert.ok(english.unreviewed.includes("full export review"));
});
test("English preview does not trust unsupported canonical fields or inflate denominators",()=>{
 const d=base();d.items[0].attempts=-1;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.items[0].attempts=2;d.skills[0].correct=2;
 assert.throws(()=>previewReport(d,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 d.skills[0].correct=0;d.events[2].outcome="UNKNOWN";d.integrated={state:"unknown"};
 assert.match(previewReport(d,{preview:true}).content,/UNKNOWN: Combined practice evidence/);
});
test("Markdown user input is escaped only once and remains readable",()=>{
 const d=base();d.sgf=[{source:"sample.sgf",number:1,skill:"cuts",date:"2026-10-25",size:9,position:{black:"(4,4)",white:"none"},
  reflection:{candidate:"D4 | <note>",reason:"reason \\ observation",opponent:"uncertain",timing:"before"},
  review:{status:"unconfirmed",evidence:"",next:""}}];
 const s=previewReport(d,{preview:true}).content;
 assert.match(s,/D4 \\\| &lt;note&gt;/);
 assert.doesNotMatch(s,/&amp;lt;note&amp;gt;/);
 assert.match(s,/not confirmed/);
});
