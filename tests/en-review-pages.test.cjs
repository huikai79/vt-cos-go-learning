"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const audit=require("../scripts/audit-en-review-pages.cjs");
const root=path.resolve(__dirname,"..");
test("R1a handoff and formal teaching evidence static English drafts track every original segment",()=>{
 const reports=audit.run(root);
 assert.equal(reports.length,2);
 assert.deepEqual(reports.map(x=>x.page),["r1-review-start.html","formal-teaching-evidence.html"]);
 assert.ok(reports.every(x=>x.staticSourceSegments>0 && x.errors.length===0 && !x.readyForRuntime));
 assert.deepEqual(reports.map(x=>x.formalReviewEvidence),["NOT_COLLECTED","NOT_COLLECTED"]);
 for(const [page,loc] of audit.TARGETS){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  const draft=JSON.parse(fs.readFileSync(path.join(root,loc),"utf8"));
  assert.equal(draft.completeSiteEligible,false);
  assert.equal(draft.status,"candidate-not-runtime");
  assert.match(html,/site-language\.js/);
  assert.doesNotMatch(html,/review-start-static-draft|evidence-static-draft/);
  assert.ok(!html.includes('lang="en"'));
 }
});
test("source changes, missing translation, unauthorized promotion and false receipt identity fail closed",()=>{
 const [page,loc]=audit.TARGETS[0];
 const html=fs.readFileSync(path.join(root,page),"utf8");
 const draft=JSON.parse(fs.readFileSync(path.join(root,loc),"utf8"));
 const extra=html.replace("</main>","<p>新的審查提醒</p></main>");
 assert.ok(audit.audit(page,draft,extra).errors.some(e=>/stale or incomplete/.test(e)));
 const missing=structuredClone(draft);missing.segments.pop();
 assert.ok(audit.audit(page,missing,html).errors.length);
 const blank=structuredClone(draft);blank.segments[3].text="";
 assert.ok(audit.audit(page,blank,html).invalidTargets>0);
 const promoted=structuredClone(draft);promoted.status="approved-for-runtime";
 assert.ok(audit.audit(page,promoted,html).errors.length);
 const invented=structuredClone(draft);
 invented.segments.find(x=>x.source==="R1_獨立審題回條.json").text="R1_complete.json";
 assert.ok(audit.audit(page,invented,html).errors.some(e=>/fingerprint or receipt/.test(e)));
});
test("formal evidence collector dynamic JS and real human receipts are still outside static authoring",()=>{
 const [page,loc]=audit.TARGETS[1];
 const html=fs.readFileSync(path.join(root,page),"utf8");
 const original=JSON.parse(fs.readFileSync(path.join(root,loc),"utf8"));
 assert.deepEqual(original.untranslatedDynamicSourceFiles,["formal-teaching-evidence.js"]);
 const falseClaim=structuredClone(original);falseClaim.untranslatedDynamicSourceFiles=[];
 assert.ok(audit.audit(page,falseClaim,html).errors.length);
 assert.equal(audit.audit(page,original,html).formalReviewEvidence,"NOT_COLLECTED");
});
