"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const GoContent=require("../content.js");
const Trial=require("../trial.js");
const {problemTitle,skillTitle}=require("../core-markdown-display-names.cjs");
const {render}=require("../core-markdown-source-adapter.cjs");
const draft=require("../locales/en/core-item-drafts.json");
const problem=GoContent.problems.find(x=>x.id==="u1-06");
const skill=GoContent.skills.find(x=>x.id==="capture-last-liberty-v1");
test("English name candidates require exact canonical source and are never approved",()=>{
 assert.ok(problem&&skill);
 const p=problemTitle(problem),s=skillTitle(skill);
 assert.equal(p.text,draft.items["u1-06"].title);
 assert.equal(p.sourceStatus,"source-matched");
 assert.equal(s.text,"Capture a named group on its last liberty");
 assert.equal(s.sourceStatus,"source-matched");
 assert.equal(p.review,"candidate-unapproved");
 assert.equal(s.review,"candidate-unapproved");
 const stale=problemTitle({...problem,title:"changed upstream"});
 assert.equal(stale.text,problem.id);
 assert.equal(stale.resolved,false);
 assert.equal(stale.sourceStatus,"source-missing-or-changed");
 const unknown=skillTitle({...skill,name:"unreviewed source revision"});
 assert.equal(unknown.text,skill.id);
 assert.equal(unknown.resolved,false);
});
test("Offline Core report maps reader-facing names but retains original event IDs and versions",()=>{
 const snapshot={schemaVersion:1,exportedAt:"2026-10-27T00:00:00Z",uiVersion:"report-test",
  problems:[problem],skills:[skill],state:{completed:[problem.id],missed:[],attempts:{[problem.id]:1},
  scheduler:{responses:[]},events:[
    {type:"answer",occurredAt:"2026-10-27T01:00:00Z",skillId:skill.id,problemId:problem.id,
     firstAnswer:true,unhinted:true,qualifiedOpportunity:true,outcome:"incorrect",
     itemVersion:"item-7",scoringContractVersion:"score-2",elapsedMs:1000}
  ],trial:Trial.emptyState(),applicationResults:[],applicationEvents:[],localExercises:[]},
  livePractice:{ok:false,error:"read unavailable"},liveEvidence:{ok:false,error:"provider unavailable"},
  integrated:{state:"absent"}};
 const before=JSON.stringify(snapshot);
 const out=render(snapshot,{preview:true});
 assert.equal(JSON.stringify(snapshot),before);
 assert.match(out.preview.content,/Capture in the middle/);
 assert.match(out.preview.content,/Capture a named group on its last liberty/);
 assert.ok(!out.preview.content.includes("| capture-last-liberty-v1 | u1-06 |"));
 assert.deepEqual(out.converted.audit.eventIds,[problem.id]);
 assert.equal(out.converted.audit.eventVersions[0].scoringContractVersion,"score-2");
 assert.deepEqual(out.converted.audit.unresolvedDisplayNames,[]);
 assert.equal(out.converted.audit.displayNameReview,"PENDING");
 assert.equal(out.preview.complete,false);
 const altered={...snapshot,problems:[{...problem,title:"different source"}]};
 const blocked=render(altered,{preview:true});
 assert.ok(blocked.converted.audit.unresolvedDisplayNames.includes("problem:"+problem.id));
 assert.equal(blocked.preview.complete,false);
 const extra={...snapshot,state:{...snapshot.state,events:[...snapshot.state.events,
  {type:"presented",occurredAt:"2026-10-27T01:01:00Z",skillId:skill.id,problemId:"unknown-item"}]}};
 const unknown=render(extra,{preview:true});
 assert.ok(unknown.converted.audit.unresolvedDisplayNames.includes("problem:unknown-item"));
 assert.ok(unknown.preview.content.includes("unknown-item"));
 assert.equal(unknown.preview.complete,false);
});
