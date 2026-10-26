"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {adapt,render}=require("../core-markdown-source-adapter.cjs");
const Trial=require("../trial.js");
const fixture=()=>({
 schemaVersion:1,exportedAt:"2026-10-25T00:00:00Z",uiVersion:"workspace-test",
 problems:[{id:"q1"},{id:"q2"}],skills:[{id:"capture-last-liberty-v1"}],
 state:{completed:["q1"],missed:["q2"],attempts:{q1:2,q2:0},
  scheduler:{responses:[]},events:[
   {type:"presented",occurredAt:"2026-10-25T01:00:00Z",skillId:"capture-last-liberty-v1",problemId:"q1",itemVersion:"v1"},
   {type:"answer",occurredAt:"2026-10-25T01:01:00Z",skillId:"capture-last-liberty-v1",problemId:"q1",outcome:"incorrect",firstAnswer:true,unhinted:true,qualifiedOpportunity:true,elapsedMs:1000,itemVersion:"v1",evidenceTaxonomyVersion:"tax-v1"},
   {type:"hint",occurredAt:"2026-10-25T01:02:00Z",skillId:"capture-last-liberty-v1",problemId:"q1"},
   {type:"answer",occurredAt:"2026-10-25T01:03:00Z",skillId:"capture-last-liberty-v1",problemId:"q1",outcome:"correct",firstAnswer:false,unhinted:false,qualifiedOpportunity:false,elapsedMs:2000}
  ],applicationResults:[],applicationEvents:[],trial:Trial.emptyState(),localExercises:[]},
 livePractice:{ok:false,error:"read failure"},liveEvidence:{ok:false,error:"engine unavailable"},integrated:{state:"absent"}
});
test("Adapter is never a publishable/regular runtime entry",()=>{
 assert.throws(()=>adapt(fixture()),{code:"LOCALE_EXPORT_BLOCKED"});
 assert.throws(()=>adapt(fixture(),{preview:true,publishable:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 assert.throws(()=>adapt({...fixture(),schemaVersion:999},{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});
test("Actual source events are adapted in order without upgrading eligibility",()=>{
 const snapshot=fixture();
 const before=JSON.stringify(snapshot);
 const {converted,preview}=render(snapshot,{preview:true});
 assert.equal(JSON.stringify(snapshot),before,"source mutated");
 assert.equal(converted.complete,false);
 assert.equal(preview.complete,false);
 assert.deepEqual(converted.audit.eventIds,["q1","q1","q1","q1"]);
 assert.equal(converted.audit.eventVersions[1].itemVersion,"v1");
 assert.equal(converted.audit.eventVersions[1].evidenceTaxonomyVersion,"tax-v1");
 assert.equal(converted.report.skills[0].eligible,1);
 assert.equal(converted.report.skills[0].correct,0);
 assert.equal(converted.report.diagnostics.excluded,1);
 assert.match(preview.content,/first response.*no hint shown.*incorrect for this task/);
 assert.match(preview.content,/retry response.*after a hint.*correct for this task/);
 assert.match(preview.content,/ERROR: Practice event stream/);
 assert.match(preview.content,/ERROR: Live evidence/);
 assert.match(preview.content,/previously exposed/);
 assert.doesNotMatch(preview.content,/mastery \d+%/i);
});
test("Unknown and malformed source data fail closed, SGF is not silently dropped",()=>{
 const x=fixture();x.state.localExercises=[{id:"sgf-1"}];
 assert.throws(()=>adapt(x,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 x.state.localExercises=[{source:{sourceName:"sample.sgf",moveNumber:12,boardSize:9,originalStones:[[3,3,1],[4,4,2]]},linkedSkill:"capture-last-liberty-v1",completedAt:"2026-10-25",reflection:{candidate:"D4",reason:"Maybe | later",expectedOpponentResponse:"E5",savedBeforeAnswer:true},review:{status:"unconfirmed",acceptableAnswer:"",nextCue:""}}];
 const sgf=render(x,{preview:true});
 assert.match(sgf.preview.content,/Position \(9×9\): Black \(4,4\); White \(5,5\)/);
 assert.match(sgf.preview.content,/not confirmed/);
 assert.equal(sgf.converted.audit.sgfSourceCount,1);
 assert.deepEqual(sgf.converted.audit.sgfPositionStoneCounts,[2]);
 x.state.localExercises[0].source.originalStones.push([3,3,2]);
 assert.throws(()=>render(x,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 x.state.localExercises=[];x.liveEvidence={ok:false,error:""};
 assert.throws(()=>adapt(x,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
 x.liveEvidence={ok:false,error:"read failed"};x.integrated={state:"ok",summary:{progressPolicyVersion:"p",interpretationBoundary:"practice only",skills:[{skillId:"kc",practiceQualifiedOpportunities:2,completedDelayedT2Cycles:0,liveEligibleOpportunities:1,liveFirstResponses:1,liveSatisfiedFirstResponses:2,nextEvidenceNeed:"another observation"}]}};
 assert.throws(()=>render(x,{preview:true}),{code:"LOCALE_EXPORT_BLOCKED"});
});
