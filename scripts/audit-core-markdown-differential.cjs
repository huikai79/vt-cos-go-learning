"use strict";
// Differential inventory only. Never used by the learner runtime or release path.
function fail(why){const e=new Error("Core export parity audit invalid: "+why);e.code="EXPORT_PARITY_AUDIT_INVALID";throw e;}
function record(v){return v!==null&&typeof v==="object"&&!Array.isArray(v);}
function auditComparison({snapshot,canonical,english}={}){
 if(!record(snapshot)||!record(canonical)||typeof canonical.body!=="string"||
    !record(english)||!record(english.converted)||!record(english.preview)) fail("both executed exports and snapshot required");
 const report=english.converted.report,audit=english.converted.audit;
 if(!record(report)||!record(audit)||typeof english.preview.content!=="string")fail("English preview shape");
 const zh=canonical.body,en=english.preview.content;
 const checks=[];
 const check=(id,status,details)=>checks.push(Object.freeze({id,status,details}));
 const invariant=(id,okay,details)=>check(id,okay?"MATCHED":"BLOCKED",details);
 const zComp=zh.match(/已完成：(\d+) \/ (\d+)/),eComp=en.match(/Core questions completed: (\d+) \/ (\d+)/);
 invariant("core.completed-total",Boolean(zComp&&eComp&&zComp[1]===eComp[1]&&zComp[2]===eComp[2]&&
  +eComp[1]===report.completed&&+eComp[2]===report.total),"Compare rendered completed/total numerators and canonical snapshot");
 const zDue=zh.match(/待複習：(\d+) 題/),eDue=en.match(/Questions marked for review: (\d+)/);
 invariant("core.review",Boolean(zDue&&eDue&&zDue[1]===eDue[1]&&+eDue[1]===report.pendingReview),"Same marked-for-review count");
 const zSkills=zh.matchAll(/可比較機會 (\d+) 次；第一次作答正確 (\d+) 次/g);
 const zCount=[...zSkills].map(m=>[+m[1],+m[2]]);
 const eCount=[...en.matchAll(/(\d+) eligible first unhinted opportunities; (\d+) correct first responses/g)]
  .map(m=>[+m[1],+m[2]]);
 invariant("skills.first-unhinted-counts",zCount.length===report.skills.length&&
  JSON.stringify(zCount)===JSON.stringify(eCount)&&JSON.stringify(eCount)===
  JSON.stringify(report.skills.map(s=>[s.eligible,s.correct])),"Counts must match, not only headings");
 const events=(snapshot.state?.events||[]).filter(x=>x&&x.skillId);
 const canonicalRows=zh.split("\n").filter(line=>line.startsWith("| ")&&events.some(e=>line.startsWith("| "+e.occurredAt+" |")));
 const englishRows=en.split("\n").filter(line=>line.startsWith("| ")&&events.some(e=>line.startsWith("| "+e.occurredAt+" |")));
 const expected=events.map(e=>e.occurredAt);
 const timestamps=rows=>rows.map(row=>row.split(" | ")[0].slice(2));
 invariant("events.count-order",canonicalRows.length===events.length&&englishRows.length===events.length&&
   JSON.stringify(timestamps(canonicalRows))===JSON.stringify(expected)&&
   JSON.stringify(timestamps(englishRows))===JSON.stringify(expected),
   "All skill events, including failed/UNKNOWN rows, in original order");
 invariant("events.first-retry-hints",events.every((e,i)=>{
   const row=englishRows[i]||"";
   if(e.type!=="answer")return true;
   return (e.firstAnswer===true?row.includes("first response"):e.firstAnswer===false?row.includes("retry response"):row.includes("UNKNOWN (first-answer status)"))&&
     (e.unhinted===true?row.includes("no hint shown"):e.unhinted===false?row.includes("after a hint"):row.includes("UNKNOWN (hint status)"));
 }),"English must not collapse first/retry or missing eligibility into success");
 invariant("events.version-audit",Array.isArray(audit.eventVersions)&&audit.eventVersions.length===events.length&&
  events.every((e,i)=>["itemVersion","skillVersion","evidenceTaxonomyVersion","scoringContractVersion"]
   .every(k=>(audit.eventVersions[i][k]??null)===(e[k]??null))),
   "Raw event versions must be preserved unchanged in audit metadata");
 const sgfSource=snapshot.state?.localExercises||[];
 invariant("sgf.count-review",audit.sgfSourceCount===sgfSource.length&&
  audit.sgfReviewStates?.length===sgfSource.length&&
  sgfSource.every((e,i)=>audit.sgfReviewStates[i]===(e.review?.status||"unconfirmed")),
  "No SGF record or manual verification state may vanish");
 invariant("source-unchanged",english.converted.complete===false&&english.preview.complete===false,
   "Neither preview may claim release completion");
 // These are explicit blocking gaps. Canonical text uses localized titles;
 // the preview uses stable IDs, which are not a fluent English translation.
 invariant("names.source-coverage",Array.isArray(audit.unresolvedDisplayNames)&&audit.unresolvedDisplayNames.length===0,
   "Only names with matching canonical IDs and titles may use English candidates; unresolved entries remain traceable");
 check("names.reader-facing","REVIEW_REQUIRED","Source-matched candidate names are not approved. Native-English and Go terminology review is required before release");
 check("timestamp.format","REVIEW_REQUIRED","Chinese exportNotes reads current Date in zh-TW; English adapter uses snapshot.exportedAt. Same-instant display has not been verified");
 check("diagnostic.prose","REVIEW_REQUIRED","Chinese diagnosticSummaryText and English candidate diagnostic sentences have not passed Go/evidence semantic review");
 check("integrated-and-trial.prose","REVIEW_REQUIRED","Trial/combined record sentences and explanatory boundaries are not proven semantically equivalent");
 check("event-versions.readable-export","REVIEW_REQUIRED","Event versions are in JSON/audit metadata, not yet in both readable Markdown reports");
 check("browser-download","REVIEW_REQUIRED","Controlled source execution is not a real browser two-language download");
 check("independent-review","REVIEW_REQUIRED","Native-English/Go/evidence/accessibility reviews not completed");
 const blockers=checks.filter(c=>c.status!=="MATCHED");
 return Object.freeze({status:blockers.length?"BLOCKED":"MATCHED",releaseEligible:false,checks:Object.freeze(checks),blockers:Object.freeze(blockers)});
}
module.exports=Object.freeze({auditComparison});