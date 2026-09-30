(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  choice:require("./advanced-events.js"),
  sequence:require("./advanced-sequence-events.js"),
  review:require("./advanced-decision-review-events.js"),
  comparison:require("./advanced-decision-comparison-events.js"),
  replay:require("./advanced-decision-replay-events.js"),
  comparable:require("./advanced-comparable-position-events.js"),
  comparableAnalysis:require("./advanced-comparable-analysis.js"),
  delayedComparable:require("./advanced-delayed-comparable-events.js"),
  delayedComparableAnalysis:require("./advanced-delayed-comparable-analysis.js"),
  comparableV2:require("./advanced-comparable-events-v2.js"),
  comparableAnalysisV2:require("./advanced-comparable-analysis-v2.js"),
  delayedComparableV2:require("./advanced-delayed-comparable-events-v2.js"),
  delayedComparableAnalysisV2:require("./advanced-delayed-comparable-analysis-v2.js")
 }:{
  choice:root.GoAdvancedEvents,
  sequence:root.GoAdvancedSequenceEvents,
  review:root.GoAdvancedDecisionReviewEvents,
  comparison:root.GoAdvancedDecisionComparisonEvents,
  replay:root.GoAdvancedDecisionReplayEvents,
  comparable:root.GoAdvancedComparablePositionEvents,
  comparableAnalysis:root.GoAdvancedComparableAnalysis,
  delayedComparable:root.GoAdvancedDelayedComparableEvents,
  delayedComparableAnalysis:root.GoAdvancedDelayedComparableAnalysis,
  comparableV2:root.GoAdvancedComparableEventsV2,
  comparableAnalysisV2:root.GoAdvancedComparableAnalysisV2,
  delayedComparableV2:root.GoAdvancedDelayedComparableEventsV2,
  delayedComparableAnalysisV2:root.GoAdvancedDelayedComparableAnalysisV2
 };
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedEvidenceExport=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

 const BUNDLE_VERSION="advanced-evidence-bundle-v3";

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
 function safeRead(name,storageKey,read,storage,validateEvent=null,validateStore=null){
  try{
   const result=read(storage);
   if(!result||result.ok!==true||!result.store)return errorEntry(name,storageKey,result&&result.error||"store_read_failed");
   if(validateEvent){
    for(const event of result.store.events){
     const error=validateEvent(event);
     if(error)return errorEntry(name,storageKey,"event_invalid:"+error);
    }
   }
   if(validateStore){
    const checked=validateStore(result.store);
    if(!checked||checked.ok!==true)return errorEntry(name,storageKey,"store_invalid:"+(checked&&checked.error||"unknown"));
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
   comparablePosition:safeRead("comparablePosition",D.comparable.STORAGE_KEY,D.comparable.read,storage,D.comparable.validate),
   delayedComparable:safeRead("delayedComparable",D.delayedComparable.STORAGE_KEY,D.delayedComparable.read,storage,D.delayedComparable.validate,D.delayedComparable.validateStore),
   comparableV2:safeRead("comparableV2",D.comparableV2.STORAGE_KEY,D.comparableV2.read,storage,D.comparableV2.validate,D.comparableV2.validateStore),
   delayedComparableV2:safeRead("delayedComparableV2",D.delayedComparableV2.STORAGE_KEY,D.delayedComparableV2.read,storage,D.delayedComparableV2.validate,D.delayedComparableV2.validateStore)
  };
  const errors=Object.values(streams).filter(entry=>entry.status==="error").map(entry=>({stream:entry.name,error:entry.error}));
  let comparableAnalysis=null;
  let delayedComparableAnalysis=null;
  let comparableAnalysisV2=null;
  let delayedComparableAnalysisV2=null;
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
  if(streams.comparablePosition.status==="ok"&&streams.delayedComparable.status==="ok"){
   try{
    const result=D.delayedComparableAnalysis.summarizeStore(
     {
      schemaVersion:streams.comparablePosition.schemaVersion,
      eventStreamVersion:streams.comparablePosition.eventStreamVersion,
      events:streams.comparablePosition.events
     },
     {
      schemaVersion:streams.delayedComparable.schemaVersion,
      eventStreamVersion:streams.delayedComparable.eventStreamVersion,
      events:streams.delayedComparable.events
     }
    );
    if(result&&result.ok===true)delayedComparableAnalysis=result;
    else errors.push({stream:"delayedComparableAnalysis",error:result&&result.error||"analysis_failed"});
   }catch(error){
    errors.push({stream:"delayedComparableAnalysis",error:"analysis_exception:"+(error&&error.message||"unknown")});
   }
  }
  if(streams.comparableV2.status==="ok"){
   try{
    const result=D.comparableAnalysisV2.summarizeStore({
     schemaVersion:streams.comparableV2.schemaVersion,
     eventStreamVersion:streams.comparableV2.eventStreamVersion,
     events:streams.comparableV2.events
    });
    if(result&&result.ok===true)comparableAnalysisV2=result;
    else errors.push({stream:"comparableAnalysisV2",error:result&&result.error||"analysis_failed"});
   }catch(error){
    errors.push({stream:"comparableAnalysisV2",error:"analysis_exception:"+(error&&error.message||"unknown")});
   }
  }
  if(streams.comparableV2.status==="ok"&&streams.delayedComparableV2.status==="ok"){
   try{
    const result=D.delayedComparableAnalysisV2.summarize(
     {
      schemaVersion:streams.comparableV2.schemaVersion,
      eventStreamVersion:streams.comparableV2.eventStreamVersion,
      events:streams.comparableV2.events
     },
     {
      schemaVersion:streams.delayedComparableV2.schemaVersion,
      eventStreamVersion:streams.delayedComparableV2.eventStreamVersion,
      events:streams.delayedComparableV2.events
     }
    );
    if(result&&result.ok===true)delayedComparableAnalysisV2=result;
    else errors.push({stream:"delayedComparableAnalysisV2",error:result&&result.error||"analysis_failed"});
   }catch(error){
    errors.push({stream:"delayedComparableAnalysisV2",error:"analysis_exception:"+(error&&error.message||"unknown")});
   }
  }
  return{
   schemaVersion:3,
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
   comparableAnalysis,
   delayedComparableAnalysis,
   comparableAnalysisV2,
   delayedComparableAnalysisV2
  };
 }

 return Object.freeze({BUNDLE_VERSION,buildBundle});
});