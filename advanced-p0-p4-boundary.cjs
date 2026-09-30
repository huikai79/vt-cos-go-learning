"use strict";
const Framework=require("./advanced-comparable-framework-v2.js");
const Enclosure=require("./advanced-enclosure-comparable-contract.js");
const Seven=require("./advanced-seven-day-comparable-contract.js");
const Cross=require("./advanced-cross-family-analysis.js");

const CONTRACT_VERSION="advanced-p0-p4-boundary-v1";
function evaluate(){
 const checks={
  p0ComparableFrameworkV2:Framework.validateAll(),
  p1EnclosureMultiStep:Enclosure.validateAll(),
  p2SevenDayFresh:{ok:Seven.validateItem(Seven.item)===null,error:Seven.validateItem(Seven.item)},
  p3CrossFamilyAnalysisPresent:Boolean(Cross&&Cross.VERSION==="advanced-cross-family-analysis-v1")
 };
 const engineeringReady=Object.values(checks).every(value=>value===true||(value&&value.ok===true));
 return{
  contractVersion:CONTRACT_VERSION,
  engineeringReady,
  stageStatus:engineeringReady?"ENGINEERING_EXPANSION_STOP":"ENGINEERING_INCOMPLETE",
  checks,
  nextPriority:engineeringReady?"HUMAN_EVIDENCE_AND_CONTENT_VALIDATION":"FIX_ENGINEERING_CONTRACT",
  allowedNext:engineeringReady?["R1a content review","target novice usability","human accessibility spot check","R1b comparability","private unseen evaluation preparation","bug/correctness fixes"]:["complete P0-P3 engineering"],
  blockedWithoutNewEvidence:engineeringReady?["new comparable family","additional spacing heuristic","adaptive scheduler escalation","mastery probability model","learning-effect claim"]:[],
  formalTeaching:"BLOCKED",
  formalEvaluation:"BLOCKED",
  learningEffect:"NOT_MEASURED"
 };
}
module.exports={CONTRACT_VERSION,evaluate};
