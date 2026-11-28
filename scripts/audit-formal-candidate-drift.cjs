"use strict";
// Read-only provenance audit. NEVER re-freezes a candidate or changes any
// teaching, exposure, scoring, holdout or release eligibility.
const fs = require("node:fs");
const path = require("node:path");
const {execFileSync} = require("node:child_process");
const Candidate = require("../formal-teaching-candidate.cjs");

function error(message) {
  const out = new Error("formal candidate drift audit: " + message);
  out.code = "CANDIDATE_DRIFT_AUDIT_ERROR";
  return out;
}
function fingerprintFor(assetPaths, entries) {
  if(!Array.isArray(assetPaths) || !assetPaths.length ||
     new Set(assetPaths).size !== assetPaths.length ||
     assetPaths.some(p=>typeof p!=="string" || !p || p.startsWith("/") ||
       p.includes("..") || p.includes("\\")))
    throw error("invalid protected asset path list");
  const mapping = entries instanceof Map ? entries : new Map(Object.entries(entries || {}));
  const material = assetPaths.map(p=>{
    const sha = mapping.get(p);
    if(typeof sha!=="string" || !/^[0-9a-f]{40}$/.test(sha))
      throw error("missing or invalid tracked blob SHA: " + p);
    return p + "\0" + sha + "\0";
  }).join("");
  return "fnv1a32-js16-" + Candidate.fnv1a32Js16(material).toString(16).padStart(8,"0");
}
function parseTree(raw,assetPaths) {
  if(typeof raw!=="string")throw error("git tree output is not text");
  const allowed = new Set(assetPaths), entries = new Map();
  for(const line of raw.split("\0").filter(Boolean)){
    const match=line.match(/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/);
    if(!match || !allowed.has(match[3]) || entries.has(match[3]))
      throw error("unexpected, unsafe or duplicate asset in git tree");
    entries.set(match[3],match[2]);
  }
  // Reject incomplete trees, not a pretend source match with a smaller scope.
  fingerprintFor(assetPaths,entries);
  return entries;
}
function compare({assetPaths,expectedFingerprint,referenceEntries,currentEntries,
                  referenceRef="reference",currentRef="current"}){
  if(typeof expectedFingerprint!=="string" ||
     !/^fnv1a32-js16-[0-9a-f]{8}$/.test(expectedFingerprint))
    throw error("invalid frozen manifest fingerprint");
  const referenceFingerprint=fingerprintFor(assetPaths,referenceEntries);
  const currentFingerprint=fingerprintFor(assetPaths,currentEntries);
  const before=referenceEntries instanceof Map?referenceEntries:new Map(Object.entries(referenceEntries));
  const after=currentEntries instanceof Map?currentEntries:new Map(Object.entries(currentEntries));
  const changedAssets=assetPaths.filter(p=>before.get(p)!==after.get(p))
    .map(p=>({path:p,referenceBlobSha:before.get(p),currentBlobSha:after.get(p)}));
  return Object.freeze({
    kind:"READ_ONLY_ASSET_IDENTITY_DIAGNOSTIC",
    status:referenceFingerprint!==expectedFingerprint?"REFERENCE_INVALID":
      currentFingerprint!==expectedFingerprint?"DRIFT_BLOCKED":"ASSET_IDENTITY_MATCH",
    expectedFingerprint,referenceRef,referenceFingerprint,currentRef,currentFingerprint,
    changedAssets,releaseEligible:false,formalTeachingResult:"NOT_EVALUATED",
    note:"A matching identity does not establish content quality, human usability, evaluation eligibility or learning effects."
  });
}
function treeFor(root,ref,assetPaths) {
  if(typeof ref!=="string" || !/^[a-zA-Z0-9._\/-]+$/.test(ref) ||
     ref.startsWith("-"))throw error("invalid git ref");
  const text=execFileSync("git",["ls-tree","-r","-z","--full-tree",ref,"--",...assetPaths],{
    cwd:root,encoding:"utf8",maxBuffer:1024*1024
  });
  return parseTree(text,assetPaths);
}
function inspect(root,referenceRef,currentRef="HEAD") {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,"formal-teaching-candidate.json"),"utf8"));
  if(JSON.stringify(manifest.assetPaths)!==JSON.stringify(Candidate.ASSET_PATHS))
    throw error("frozen asset list differs from contract");
  const referenceEntries=treeFor(root,referenceRef,manifest.assetPaths);
  const currentEntries=treeFor(root,currentRef,manifest.assetPaths);
  const result=compare({assetPaths:manifest.assetPaths,expectedFingerprint:manifest.assetFingerprint,
    referenceEntries,currentEntries,referenceRef,currentRef});
  // The runner may have a dirty checkout. Never describe the checked-out file
  // contents by a commit hash if source bytes and git's current tree disagree.
  if(currentRef==="HEAD" && Candidate.currentFingerprint(root)!==result.currentFingerprint)
    throw error("current working-tree bytes differ from HEAD asset identity");
  return result;
}
module.exports=Object.freeze({fingerprintFor,parseTree,compare,treeFor,inspect});
if(require.main===module){
  try {
    if(process.argv.length!==4)throw error("usage: node scripts/audit-formal-candidate-drift.cjs <frozen-reference> <candidate-ref>");
    const result=inspect(path.resolve(__dirname,".."),process.argv[2],process.argv[3]);
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    if(result.status==="REFERENCE_INVALID")process.exitCode=2;
  } catch (cause) {
    process.stderr.write("CANDIDATE_DRIFT_AUDIT_ERROR: "+cause.message+"\n");
    process.exitCode=2;
  }
}
