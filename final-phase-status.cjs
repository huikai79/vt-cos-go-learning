"use strict";
const fs=require("node:fs");
const path=require("node:path");
const Gate=require("./teaching-gate-verify.cjs");
const Candidate=require("./formal-teaching-candidate.cjs");
const candidateManifest=require("./formal-teaching-candidate.json");
const gateDefinition=require("./teaching-gate.json");

function readOptional(filePath){if(!filePath)return null;return JSON.parse(fs.readFileSync(path.resolve(filePath),"utf8"));}
function nextAction(result,humanStatus){
 if(result.formalTeachingCandidate.valid!==true)return"REFREEZE_FORMAL_TEACHING_CANDIDATE";
 if(!result.r1Verification||result.r1Verification.r1IndependentReviewPassed!==true)return"COLLECT_R1A_EXTERNAL_REVIEW";
 if(!result.lessonContentReview||result.lessonContentReview.lessonContentReviewPassed!==true)return"COLLECT_19_LESSON_EXTERNAL_REVIEW";
 if(!humanStatus.usabilityPassed)return"COLLECT_THREE_TARGET_NOVICE_USABILITY";
 if(!humanStatus.accessibilityPassed)return"COLLECT_HUMAN_ACCESSIBILITY_SPOT_CHECK";
 if(result.formalTeachingUse.status!=="PASS")return"RESOLVE_FORMAL_TEACHING_BLOCKERS";
 if(result.formalEvaluation.status!=="PASS"){
  const reasons=result.formalEvaluation.blockingReasons.join(" ");
  if(/formal holdout/.test(reasons))return"ESTABLISH_PRIVATE_UNSEEN_POOL";
  if(/R1b/.test(reasons))return"ESTABLISH_R1B_COMPARABILITY";
  return"RESOLVE_FORMAL_EVALUATION_BLOCKERS";
 }
 if(result.learningEffect==="NOT_MEASURED")return"COLLECT_OUTCOME_DATA";
 return"NO_OPEN_GATE";
}
function evaluate({r1=null,lessonReview=null,human=null,privateManifest=null,privateRoot=null}={}){
 const candidate=Candidate.evaluateManifest(candidateManifest,__dirname);
 let privateVerification=null;
 if(privateManifest&&privateRoot)privateVerification=Gate.FormalEvaluationVerifier.verifyPrivateManifest(privateManifest,privateRoot);
 const result=Gate.evaluateGate({receipt:r1,lessonReceipt:lessonReview,humanEvidence:human,candidate,privateEvaluationVerification:privateVerification});
 const humanStatus=Gate.evaluateHumanEvidence(human,gateDefinition,candidate,privateVerification);
 return{
  protocolId:"go-final-phase-status-v1",
  candidate:{id:candidate.candidateId,fingerprint:candidate.computedFingerprint,valid:candidate.valid},
  formalTeaching:result.formalTeachingUse.status,
  formalEvaluation:result.formalEvaluation.status,
  learningEffect:result.learningEffect,
  nextAction:nextAction(result,humanStatus),
  blockingReasons:{formalTeaching:result.formalTeachingUse.blockingReasons,formalEvaluation:result.formalEvaluation.blockingReasons},
  evidenceStatus:{
   r1a:Boolean(result.r1Verification&&result.r1Verification.r1IndependentReviewPassed),
   lessonReview:Boolean(result.lessonContentReview&&result.lessonContentReview.lessonContentReviewPassed),
   usability:humanStatus.usabilityPassed,
   accessibility:humanStatus.accessibilityPassed,
   privateHoldout:humanStatus.privateHoldoutPassed,
   r1b:humanStatus.r1bPassed
  }
 };
}
module.exports={evaluate,nextAction};

if(require.main===module){
 const args=process.argv.slice(2),after=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
 try{
  const privateManifestPath=after("--private-manifest"),privateRoot=after("--private-root");
  if(Boolean(privateManifestPath)!==Boolean(privateRoot))throw new Error("--private-manifest 與 --private-root 必須一起提供");
  const report=evaluate({
   r1:readOptional(after("--r1")),
   lessonReview:readOptional(after("--lesson-review")),
   human:readOptional(after("--human")),
   privateManifest:privateManifestPath?readOptional(privateManifestPath):null,
   privateRoot
  });
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
 }catch(error){process.stderr.write("無法產生 final-phase status："+error.message+"\n");process.exitCode=2;}
}
