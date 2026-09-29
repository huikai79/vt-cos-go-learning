(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  choice:require("./advanced-events.js"),
  sequence:require("./advanced-sequence-events.js"),
  review:require("./advanced-decision-review-events.js"),
  comparison:require("./advanced-decision-comparison-events.js"),
  replay:require("./advanced-decision-replay-events.js"),
  comparable:require("./advanced-comparable-position-events.js"),
  comparableAnalysis:require("./advanced-comparable-analysis.js")
 }:{
  choice:root.GoAdvancedEvents,
  sequence:root.GoAdvancedSequenceEvents,
  review:root.GoAdvancedDecisionReviewEvents,
  comparison:root.GoAdvancedDecisionComparisonEvents,
  replay:root.GoAdvancedDecisionReplayEvents,
  comparable:root.GoAdvancedComparablePositionEvents,
  comparableAnalysis:root.GoAdvancedComparableAnalysis
 };
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedEvidenceExport=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

 const BUNDLE_VERSION="advanced-evidence-bundle-v1";

 function errorEntry(name,storageKey,error){
  return{name,storageKey,status:"error",error:String(error||"unknown_error"),store:null};
 }
 function okEntry(name,storageKey,store){
  return{
   name,storageKey,status:"ok",error:null,
   schemaVersion:store.schemaVersion,
   eventStreamVersion:store.eventStreamVersion,
   events:store.events
  };
 }
 function safeRead(name,storageKey,read,storage,validateEvent=null){
  try{
   const result=read(storage);
   if(!result||result.ok!==true||!result.store)return errorEntry(name,storageKey,result&&result.error||"store_read_failed");
   if(validateEvent){
    for(const event of result.store.events){
     const error=validateEvent(event);
     if(error)return errorEntry(name,storageKey,"event_invalid:"+error);
    }
   }
   return okEntry(name,storageKey,result.store);
  }catch(error){
   return errorEntry(name,storageKey,"store_read_exception:"+(error&&error.message||"unknown"));
  }
 }
 function buildBundle(storage,{exportedAt}={}){
  if(!storage||typeof storage.getItem!=="function")throw new Error("storage with getItem is required");
  const streams={
   choicePractice:safeRead("choicePractice",D.choice.STORAGE_KEY,D.choice.read,storage),
   sequenceV3:safeRead("sequenceV3",D.sequence.STORAGE_KEY,D.sequence.read,storage),
   sequenceV2:safeRead("sequenceV2",D.sequence.LEGACY_STORAGE_KEY,D.sequence.readLegacy,storage),
   sequenceV1:safeRead("sequenceV1",D.sequence.V1_STORAGE_KEY,D.sequence.readV1,storage),
   decisionReview:safeRead("decisionReview",D.review.STORAGE_KEY,D.review.read,storage,D.review.validate),
   decisionComparison:safeRead("decisionComparison",D.comparison.STORAGE_KEY,D.comparison.read,storage,D.comparison.validate),
   decisionReplay:safeRead("decisionReplay",D.replay.STORAGE_KEY,D.replay.read,storage,D.replay.validate),
   comparablePosition:safeRead("comparablePosition",D.comparable.STORAGE_KEY,D.comparable.read,storage,D.comparable.validate)
  };
  const errors=Object.values(streams).filter(entry=>entry.status==="error").map(entry=>({stream:entry.name,error:entry.error}));
  let comparableAnalysis=null;
  if(streams.comparablePosition.status==="ok"){
   try{
    const result=D.comparableAnalysis.summarizeStore({
     schemaVersion:streams.comparablePosition.schemaVersion,
     eventStreamVersion:streams.comparablePosition.eventStreamVersion,
     events:streams.comparablePosition.events
    });
    if(result&&result.ok===true)comparableAnalysis=result;
    else errors.push({stream:"comparableAnalysis",error:result&&result.error||"analysis_failed"});
   }catch(error){
    errors.push({stream:"comparableAnalysis",error:"analysis_exception:"+(error&&error.message||"unknown")});
   }
  }
  return{
   schemaVersion:1,
   bundleVersion:BUNDLE_VERSION,
   exportedAt:exportedAt||new Date().toISOString(),
   scope:"advanced_local_evidence_backup",
   authority:"advanced_practice_backup_only",
   complete:errors.length===0,
   errors,
   formalEligible:false,
   skillUpdateEligible:false,
   schedulerEligible:false,
   independentEvaluation:false,
   mastery:null,
   learningEffect:null,
   streams,
   comparableAnalysis
  };
 }

 return Object.freeze({BUNDLE_VERSION,buildBundle});
});