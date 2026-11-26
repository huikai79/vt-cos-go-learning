"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"..");
const SOURCE_FILE="formal-teaching-evidence.js",DRAFT_FILE="locales/en/formal-teaching-evidence-dynamic-draft.json";
const GROUPS=["taskLabels","accessibilityLabels","validationMessages","formLabels","statusMessages","fileNames"];
const REQUIRED=Object.freeze({
 taskLabels:["start_course","complete_board_answer","recover_after_wrong_answer","reload_and_resume","export_learning_data"],
 accessibilityLabels:["keyboard_only","screen_reader_spot_check","zoom_200","viewport_320"],
 validationMessages:["minimumParticipants","uniqueParticipantCode","unnamedParticipant","notTargetNovice","taskIncomplete","participantBlocking","participantReferenceMissing","accessibilityNotPassed","accessibilityBlocking","accessibilityReferenceMissing"],
 formLabels:["participantHeading","participantCode","participantCodePlaceholder","targetNoviceCheckbox","evidenceReference","evidenceReferencePlaceholder","blockingIssues"],
 statusMessages:["draftExported","finalExportBlocked","finalExported"],
 fileNames:["draftFilename","completedFilename"]
});
function blobSha(src){return crypto.createHash("sha1").update("blob "+Buffer.byteLength(src,"utf8")+"\0"+src).digest("hex");}
function check(source,draft){
 const errors=[],object=x=>Boolean(x)&&typeof x==="object"&&!Array.isArray(x);
 if(!object(draft))throw Error("Candidate must be an object");
 const statuses=object(draft.review)&&draft.review.nativeEnglish==="pending"&&
  draft.review.goAccuracy==="pending"&&draft.review.accessibility==="pending"&&
  draft.review.readerUsability==="not_measured";
 const identity=object(draft.binding)&&draft.binding.protocol==="go-formal-teaching-evidence-v2"&&
  draft.binding.candidateId==="formal-teaching-candidate-2026-10-08-i"&&
  draft.binding.candidateFingerprint==="fnv1a32-js16-b78d5876"&&
  draft.binding.r1ContentFingerprint==="fnv1a32-c34ef6a4"&&
  draft.binding.formalTeaching==="BLOCKED"&&draft.binding.formalEvaluation==="BLOCKED"&&
  draft.binding.learningEffect==="NOT_MEASURED";
 if(draft.schemaVersion!==1||draft.locale!=="en"||draft.sourceFile!==SOURCE_FILE||
   draft.status!=="candidate-not-runtime"||draft.publishable!==false||!statuses||!identity)
   errors.push("candidate-only authority or historical identity violated");
 if(draft.sourceGitBlobSha!==blobSha(source))
   errors.push("source Git blob changed: editorial recheck required");
 const entries=[];
 for(const group of GROUPS){
  if(!Array.isArray(draft[group])){errors.push("missing group "+group);continue;}
  if(JSON.stringify(draft[group].map(x=>x&&x.key))!==JSON.stringify(REQUIRED[group]))
   errors.push("missing/extra/reordered source keys: "+group);
  entries.push(...draft[group]);
 }
 if(entries.length!==new Set(entries.map(x=>x&&x.key)).size)
   errors.push("duplicate dynamic key");
 for(const entry of entries){
  if(!object(entry)||typeof entry.sourceFragment!=="string"||!entry.sourceFragment||
    !source.includes(entry.sourceFragment)||entry.review!=="candidate"||
    typeof entry.text!=="string"||!entry.text.trim()){
   errors.push("missing original source, translated copy or review candidate: "+(entry&&entry.key));continue;
  }
  const actual=[...entry.text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(x=>x[1]).sort();
  const expected=Array.isArray(entry.placeholders)?entry.placeholders.slice().sort():null;
  if(!expected||JSON.stringify(actual)!==JSON.stringify(expected))
    errors.push("placeholder mismatch: "+entry.key);
  if(["draftFilename","completedFilename"].includes(entry.key)&&entry.text!==entry.sourceFragment)
    errors.push("receipt filename modified: "+entry.key);
 }
 const cjk=source.split(/\r?\n/).map((line,n)=>({line,n:n+1})).filter(x=>/[\u3400-\u9fff]/u.test(x.line));
 const uncovered=cjk.filter(x=>!entries.some(e=>e&&typeof e.sourceFragment==="string"&&x.line.includes(e.sourceFragment))).map(x=>x.n);
 if(uncovered.length)errors.push("new uncovered Chinese source line: "+uncovered.join(","));
 for(const [group,label] of [["taskLabels","TASK_LABELS"],["accessibilityLabels","ACCESS_LABELS"]]){
  const m=source.match(new RegExp("const "+label+"=\\{([^;]+)\\};"));
  if(!m){errors.push("missing source label map "+label);continue;}
  const actual=[...m[1].matchAll(/([a-z0-9_]+):"([^"]+)"/g)].map(x=>[x[1],x[2]]);
  const expected=Array.isArray(draft[group])?draft[group].map(x=>[x.key,x.sourceFragment]):[];
  if(JSON.stringify(actual)!==JSON.stringify(expected))errors.push("source label map mismatch "+label);
 }
 return {status:"candidate-not-runtime",originalSource:SOURCE_FILE,
  sourceGitBlobSha:blobSha(source),dynamicSegments:entries.length,
  coveredChineseSourceLines:cjk.length-uncovered.length,uncoveredSourceLines:uncovered,
  errors,runtimeEligible:false,formalTeaching:"BLOCKED",formalEvaluation:"BLOCKED",
  humanReview:"PENDING",learningEffect:"NOT_MEASURED"};
}
function run(root=ROOT){
 const source=fs.readFileSync(path.join(root,SOURCE_FILE),"utf8");
 const draft=JSON.parse(fs.readFileSync(path.join(root,DRAFT_FILE),"utf8"));
 const report=check(source,draft);
 if(report.errors.length)throw Error("Dynamic English reviewer candidate blocked: "+JSON.stringify(report));
 return report;
}
module.exports={SOURCE_FILE,DRAFT_FILE,GROUPS,REQUIRED,blobSha,check,run};
if(require.main===module){
 try{process.stdout.write(JSON.stringify(run(),null,2)+"\n");}
 catch(error){process.stderr.write(error.message+"\n");process.exitCode=1;}
}
