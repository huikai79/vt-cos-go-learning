"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const draft=require("../locales/en/core-markdown-export-draft.json");
test("Core readable Markdown English candidate traces real export sources",()=>{
 const source=fs.readFileSync(path.join(root,"app.js"),"utf8");
 const start=source.indexOf("  function exportNotes() {");
 const end=source.indexOf("  function exportRawEvents() {",start);
 assert.ok(start>=0 && end>start);
 const exportSource=source.slice(start,end);
 assert.equal(draft.status,"candidate-not-runtime");
 assert.equal(draft.locale,"en");
 assert.ok(Object.keys(draft.messages).length>=70);
 for(const [key,row] of Object.entries(draft.messages)){
  const sourceFile=row.sourceFile||"app.js";
  assert.ok(["app.js","learning-metrics.js","trial.js"].includes(sourceFile),"untrusted source: "+key);
  const scope=sourceFile==="app.js"
    ?(row.sourceFile?source:exportSource)
    :fs.readFileSync(path.join(root,sourceFile),"utf8");
  assert.ok(scope.includes(row.sourceFragment),"source drift "+sourceFile+":"+key);
  assert.ok(row.text.trim(),"empty English "+key);
  assert.doesNotMatch(row.text,/[\u3400-\u9fff]/u,"untranslated "+key);
  assert.equal(row.review,"candidate");
 }
 assert.equal(require("../site-locales.json").locales.find(x=>x.id==="en").publishable,false);
 assert.ok(!exportSource.includes("core-markdown-export-draft"));
});
test("Markdown candidate distinguishes first answer, retry, hinted, unknown and error",()=>{
 const copy=k=>draft.messages[k].text;
 assert.notEqual(copy("eventFirst"),copy("eventRetry"));
 assert.notEqual(copy("eventUnhinted"),copy("eventHinted"));
 assert.notEqual(copy("eventUnanswered"),copy("eventCorrect"));
 assert.match(copy("practiceReadError"),/ERROR/);
 assert.match(copy("liveReadError"),/ERROR/);
 assert.match(copy("sgfUnconfirmed"),/not confirmed/);
 assert.match(copy("skillsBoundary"),/not independent retention/);
 assert.match(copy("trialBoundary"),/Interpretation boundary/);
 assert.doesNotMatch(copy("liveReadError"),/successfully|verified gain/i);
 assert.equal(draft.review.evidenceSemantics,"pending");
});

test("Diagnostic and pilot candidate messages use authoritative metrics/trial source anchors",()=>{
 const d=draft.messages;
 for(const key of ["diagnosticPolicy","diagnosticHistorical"])
  assert.equal(d[key].sourceFile,"learning-metrics.js");
 for(const key of ["trialProtocol","trialExposure"])
  assert.equal(d[key].sourceFile,"trial.js");
 assert.match(d.diagnosticsExcluded.text,/otherwise ineligible lesson\/scheduler responses/);
 assert.match(d.trialExposure.text,/previously seen/);
 assert.equal(draft.review.evidenceSemantics,"pending");
});