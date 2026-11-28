"use strict";
// Authoring-only static-source audit for two external-review entrypoints.
// This must never produce runtime locale bundles, approvals, or evidence.
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const TARGETS=Object.freeze([
  ["r1-review-start.html","locales/en/r1-review-start-static-draft.json"],
  ["formal-teaching-evidence.html","locales/en/formal-teaching-evidence-static-draft.json"]
]);
function norm(s){return String(s).replace(/&amp;/g,"&").replace(/\s+/g," ").trim();}
function extract(html){
  const body=html.replace(/<script\b[\s\S]*?<\/script>/gi," ")
    .replace(/<style\b[\s\S]*?<\/style>/gi," ")
    .replace(/<!--[\s\S]*?-->/g," ").replace(/<[^>]+>/g,"\n");
  const segments=[...new Set(body.split("\n").map(norm).filter(x=>/[\u3400-\u9fff]/u.test(x)))];
  const attrs=[...html.matchAll(/\b(content|placeholder|aria-label|title|alt)=["']([^"']+)["']/gi)]
    .map(x=>({attribute:x[1].toLowerCase(),source:norm(x[2])}))
    .filter(x=>/[\u3400-\u9fff]/u.test(x.source));
  return {segments,attrs:[...new Map(attrs.map(x=>[x.attribute+"\u0000"+x.source,x])).values()]};
}
function audit(page,draft,html){
  const found=extract(html);
  const list=Array.isArray(draft.segments)?draft.segments:[];
  const attrs=Array.isArray(draft.attributes)?draft.attributes:[];
  const sourceTexts=new Set(found.segments);
  const candidateTexts=new Set(list.map(x=>x.source));
  const key=x=>x.attribute+"\u0000"+x.source;
  const sourceAttrs=new Set(found.attrs.map(key));
  const candidateAttrs=new Set(attrs.map(key));
  const missing=found.segments.filter(x=>!candidateTexts.has(x));
  const stale=list.map(x=>x.source).filter(x=>!sourceTexts.has(x));
  const missingAttrs=found.attrs.filter(x=>!candidateAttrs.has(key(x)));
  const staleAttrs=attrs.filter(x=>!sourceAttrs.has(key(x)));
  const invalid=[...list,...attrs].filter(x=>
    !x || x.review!=="candidate" || typeof x.text!=="string" || !x.text.trim() ||
    (x.text!=="R1_獨立審題回條.json" && /[\u3400-\u9fff]/u.test(x.text)));
  const badUnique=list.length!==candidateTexts.size || attrs.length!==candidateAttrs.size;
  const statusOkay=draft.schemaVersion===1 && draft.locale==="en" &&
    draft.status==="candidate-not-runtime" && draft.completeSiteEligible===false &&
    draft.sourceFile===page && draft.review &&
    draft.review.nativeEnglish==="pending" &&
    draft.review.goAccuracy==="pending" &&
    draft.review.accessibility==="pending" &&
    draft.review.readerUsability==="not_measured";
  const dynamicOkay=page==="formal-teaching-evidence.html"
    ? Array.isArray(draft.untranslatedDynamicSourceFiles) &&
      draft.untranslatedDynamicSourceFiles.includes("formal-teaching-evidence.js")
    : Array.isArray(draft.untranslatedDynamicSourceFiles) &&
      draft.untranslatedDynamicSourceFiles.length===0;
  const receiptName=list.find(x=>x.source==="R1_獨立審題回條.json");
  const contractOkay=page!=="r1-review-start.html" ||
    (receiptName && receiptName.text===receiptName.source &&
      html.includes("go-r1-independent-content-review-v5") &&
      html.includes("fnv1a32-c34ef6a4"));
  const errors=[];
  if(!statusOkay || !dynamicOkay)errors.push("draft status or unreviewed dynamic boundary invalid");
  if(!contractOkay)errors.push("review protocol, fingerprint or receipt filename changed");
  if(badUnique)errors.push("duplicate static source entry");
  if(missing.length || stale.length || missingAttrs.length || staleAttrs.length)
    errors.push("source-to-draft static coverage stale or incomplete");
  if(invalid.length)errors.push("draft has blank, Chinese-fallback or noncandidate target");
  return {page,status:"candidate-not-runtime",staticSourceSegments:found.segments.length,
    staticAttributeSources:found.attrs.length,missing,stale,missingAttrs,staleAttrs,
    invalidTargets:invalid.length,errors,goReview:"PENDING",
    humanLanguageReview:"PENDING",dynamicCoverage:dynamicOkay?"NOT_AUTHORED":"ERROR",
    readyForRuntime:false,formalReviewEvidence:"NOT_COLLECTED"};
}
function validate(report){if(report.errors.length)throw Error("Reviewer page English draft blocked: "+JSON.stringify(report));return report;}
function run(rootDir=root){
  return TARGETS.map(([page,loc])=>validate(audit(page,
    JSON.parse(fs.readFileSync(path.join(rootDir,loc),"utf8")),
    fs.readFileSync(path.join(rootDir,page),"utf8"))));
}
module.exports={TARGETS,extract,audit,validate,run};
if(require.main===module){
  try{const reports=run();process.stdout.write(JSON.stringify(reports,null,2)+"\n");}
  catch(e){process.stderr.write(e.message+"\n");process.exitCode=1;}
}
