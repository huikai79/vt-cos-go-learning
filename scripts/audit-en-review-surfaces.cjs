"use strict";
// WP45: Authoring-only review-surface parity audit. Never releases a locale.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"..");
const PAGES=Object.freeze([
 ["r1-review","locales/en/r1-review-surface-draft.json"],
 ["lesson-content-review","locales/en/lesson-content-review-surface-draft.json"]
]);
function sha(content){return crypto.createHash("sha1").update("blob "+Buffer.byteLength(content,"utf8")+"\0"+content).digest("hex");}
const norm=s=>String(s).replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
function extract(html){
 const raw=html.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<!--[\s\S]*?-->/g," ").replace(/<[^>]+>/g,"\n");
 const text=[...new Set(raw.split("\n").map(norm).filter(s=>/[\u3400-\u9fff]/.test(s)))];
 const attrs=[...html.matchAll(/\b(content|placeholder|aria-label|title|alt)=["']([^"']+)["']/gi)]
  .map(x=>({attribute:x[1].toLowerCase(),source:norm(x[2])})).filter(x=>/[\u3400-\u9fff]/.test(x.source));
 return {text,attrs:[...new Map(attrs.map(x=>[x.attribute+"\0"+x.source,x])).values()]};
}
const signature=x=>x.attribute+"\0"+x.source;
const EXPECTED_DYNAMIC_IDS=Object.freeze({
  "r1-review": [
    "boardPointAria",
    "boardAria",
    "moveUnselected",
    "reviewFinding",
    "chooseFinding",
    "consistent",
    "needsFix",
    "ambiguous",
    "multipleSolutions",
    "reasonLabel",
    "reasonPlaceholder",
    "storageError",
    "progress",
    "pendingCount",
    "completedCount",
    "allReviewed",
    "proposedMove",
    "draftFilename",
    "draftExportNotice",
    "missingReviewerCode",
    "missingExperience",
    "missingDeclarations",
    "finalBlocked",
    "finalFilename",
    "finalExportNotice"
  ],
  "lesson-content-review": [
    "boardAriaFallback",
    "lessonNumber",
    "unitNumber",
    "demoNumber",
    "takeaway",
    "findingLabel",
    "findingUnset",
    "consistent",
    "needsFix",
    "ambiguous",
    "reason",
    "reasonPlaceholder",
    "progress",
    "draftFilename",
    "finalBlocked",
    "finalFilename",
    "finalExportNotice"
  ]
});

function audit(stem,draft,html,js){
 const errors=[],array=Array.isArray,rec=x=>x&&typeof x==="object"&&!array(x);
 if(!rec(draft))throw Error("review locale draft must be an object");
 const status=draft.schemaVersion===1&&draft.locale==="en"&&draft.publishable===false&&
  draft.status==="candidate-not-runtime"&&rec(draft.review)&&
  draft.review.nativeEnglish==="pending"&&draft.review.goContent==="pending"&&
  draft.review.accessibility==="pending"&&draft.review.readerUsability==="not_measured"&&
  rec(draft.gate)&&draft.gate.formalTeaching==="BLOCKED"&&draft.gate.formalEvaluation==="BLOCKED"&&
  draft.gate.learningEffect==="NOT_MEASURED";
 if(!status)errors.push("candidate-only scope, pending reviews or gate status violated");
 if(!rec(draft.source)||draft.source.html!==stem+".html"||
  draft.source.dynamicScript!==stem+".js"||draft.source.htmlBlobSha!==sha(html)||
  draft.source.dynamicScriptBlobSha!==sha(js))errors.push("source Git blob changed or misbound");
 const inventory=extract(html),text=array(draft.staticText)?draft.staticText:[],attrs=array(draft.staticAttributes)?draft.staticAttributes:[],dynamic=array(draft.dynamic)?draft.dynamic:[];
 if(inventory.text.length!==text.length||
  JSON.stringify(inventory.text)!==JSON.stringify(text.map(x=>x&&x.source)))errors.push("missing, stale or reordered static text");
 if(inventory.attrs.length!==attrs.length||
  JSON.stringify(inventory.attrs)!==JSON.stringify(attrs.map(x=>x&&({attribute:x.attribute,source:x.source}))))errors.push("missing, stale or reordered static attributes");
 if(!dynamic.length||new Set(dynamic.map(x=>x&&x.id)).size!==dynamic.length)errors.push("empty/duplicate dynamic review IDs");
 const identifiers=dynamic.map(x=>x&&x.id);
 if(JSON.stringify(identifiers)!==JSON.stringify(EXPECTED_DYNAMIC_IDS[stem]||[]))
  errors.push("missing, reordered or unexpected dynamic source IDs");
 const entries=[...text,...attrs,...dynamic];
 for(const r of entries){
  if(!rec(r)||typeof r.text!=="string"||!r.text.trim()||r.review!=="candidate"||
   typeof r.source!=="string"||!r.source.trim()){
   errors.push("invalid, blank or promoted text");continue;
  }
  if(r.text!==r.source&&/[\u3400-\u9fff]/.test(r.text))errors.push("unmarked untranslated Chinese fallback");
  if(dynamic.includes(r)){
   if(!js.includes(r.source))errors.push("missing dynamic source fragment: "+r.id);
   const p=[...r.text.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(x=>x[1]).sort();
   if(!array(r.placeholders)||JSON.stringify(p)!==JSON.stringify([...r.placeholders].sort()))
    errors.push("dynamic placeholder mismatch: "+r.id);
  }
 }
 const cjk=js.split(/\r?\n/).map((line,i)=>({line,n:i+1})).filter(x=>/[\u3400-\u9fff]/.test(x.line));
 const uncovered=cjk.filter(x=>!dynamic.some(d=>d&&typeof d.source==="string"&&x.line.includes(d.source))).map(x=>x.n);
 if(uncovered.length)errors.push("uncovered Chinese-bearing JS lines: "+uncovered.join(","));
 const expectedFiles=stem==="r1-review"?["R1_獨立審題草稿.json","R1_獨立審題回條.json"]:
  ["19課短講外部審查草稿.json","19課短講外部棋理回條.json"];
 if(JSON.stringify(draft.immutableReceiptFilenames)!==JSON.stringify(expectedFiles)||
   expectedFiles.some(file=>!js.includes('"'+file+'"')||
    !dynamic.some(x=>x&&x.source===file&&x.text===file)))errors.push("immutable receipt filename mismatch");
 if(!array(draft.notAuthored)||!draft.notAuthored.length)errors.push("untranslated canonical problem/lesson content not declared");
 return {page:stem+".html",status:"candidate-not-runtime",staticText:inventory.text.length,
  attributes:inventory.attrs.length,dynamic:dynamic.length,uncovered,errors,runtimeEligible:false,
  nativeReview:"PENDING",goReview:"PENDING",readerUsability:"NOT_MEASURED",
  formalTeaching:"BLOCKED",formalEvaluation:"BLOCKED",learningEffect:"NOT_MEASURED"};
}
function run(base=root){
 return PAGES.map(([stem,p])=>{
  const draft=JSON.parse(fs.readFileSync(path.join(base,p),"utf8"));
  const html=fs.readFileSync(path.join(base,stem+".html"),"utf8");
  const js=fs.readFileSync(path.join(base,stem+".js"),"utf8");
  const report=audit(stem,draft,html,js);
  if(report.errors.length)throw Error("Review English draft BLOCKED: "+JSON.stringify(report));
  return report;
 });
}
module.exports={PAGES,EXPECTED_DYNAMIC_IDS,extract,sha,audit,run};
if(require.main===module){
 try{process.stdout.write(JSON.stringify(run(),null,2)+"\n");}
 catch(e){process.stderr.write(e.message+"\n");process.exitCode=1;}
}
