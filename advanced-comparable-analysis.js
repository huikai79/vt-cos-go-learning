(function(root,factory){"use strict";
 const Contract=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-position-contract.js"):root.GoAdvancedComparablePositionContract;
 const Events=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-position-events.js"):root.GoAdvancedComparablePositionEvents;
 const api=factory(Contract,Events);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedComparableAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Contract,Events){"use strict";

 if(!Contract||!Events)throw new Error("Comparable contract and events are required.");

 const VERSION="advanced-comparable-analysis-v1";
 const STATUS=Object.freeze({
  COMPLETE:"COMPLETE",
  SOURCE_NOT_PRESENTED:"SOURCE_NOT_PRESENTED",
  SOURCE_UNANSWERED:"SOURCE_UNANSWERED",
  TARGET_NOT_PRESENTED:"TARGET_NOT_PRESENTED",
  TARGET_UNANSWERED:"TARGET_UNANSWERED",
  INVALID:"INVALID"
 });

 function eventsForAttempt(events,attemptId){
  return events.filter(event=>event.attemptId===attemptId);
 }
 function firstPresentationAttempt(events,itemId){
  return events.find(event=>event.itemId===itemId&&event.type==="comparable_presented")||null;
 }
 function summarizeFirstPresentation(store,item){
  const events=(store&&store.events)||[];
  const presented=firstPresentationAttempt(events,item.itemId);
  const presentationCount=events.filter(event=>event.itemId===item.itemId&&event.type==="comparable_presented").length;
  if(!presented){
   return{
    ok:true,itemId:item.itemId,itemRole:item.role,presentationCount,
    presented:false,attemptId:null,firstResponseObserved:false,firstCorrect:null,
    unanswered:false,retryCount:0,eventualCorrect:null,completed:false
   };
  }
  const attemptEvents=eventsForAttempt(events,presented.attemptId).filter(event=>event.itemId===item.itemId);
  const firsts=attemptEvents.filter(event=>event.type==="comparable_first");
  const retries=attemptEvents.filter(event=>event.type==="comparable_retry");
  const completions=attemptEvents.filter(event=>event.type==="comparable_completed");
  if(firsts.length>1)return{ok:false,error:"multiple_first_responses",itemId:item.itemId,attemptId:presented.attemptId};
  if(completions.length>1)return{ok:false,error:"multiple_completions",itemId:item.itemId,attemptId:presented.attemptId};
  if(retries.length&&firsts.length===0)return{ok:false,error:"retry_without_first",itemId:item.itemId,attemptId:presented.attemptId};
  if(completions.length&&firsts.length===0)return{ok:false,error:"completion_without_first",itemId:item.itemId,attemptId:presented.attemptId};
  if(completions.length&&completions[0].firstCorrect!==firsts[0].correct)return{ok:false,error:"completion_first_response_mismatch",itemId:item.itemId,attemptId:presented.attemptId};

  return{
   ok:true,itemId:item.itemId,itemRole:item.role,presentationCount,
   presented:true,attemptId:presented.attemptId,
   firstResponseObserved:firsts.length===1,
   firstCorrect:firsts.length===1?firsts[0].correct:null,
   unanswered:firsts.length===0,
   retryCount:retries.length,
   eventualCorrect:completions.length===1?completions[0].eventualCorrect:null,
   completed:completions.length===1
  };
 }
 function transitionLabel(source,target){
  if(source.firstCorrect===true&&target.firstCorrect===true)return"source_correct_target_correct";
  if(source.firstCorrect===true&&target.firstCorrect===false)return"source_correct_target_incorrect";
  if(source.firstCorrect===false&&target.firstCorrect===true)return"source_incorrect_target_correct";
  if(source.firstCorrect===false&&target.firstCorrect===false)return"source_incorrect_target_incorrect";
  return null;
 }
 function summarizePair(store,pair){
  const source=summarizeFirstPresentation(store,pair.source);
  const target=summarizeFirstPresentation(store,pair.target);
  if(!source.ok)return{ok:false,status:STATUS.INVALID,error:source.error,pairId:pair.pairId,source,target:null};
  if(!target.ok)return{ok:false,status:STATUS.INVALID,error:target.error,pairId:pair.pairId,source,target};

  let status=STATUS.COMPLETE;
  if(!source.presented)status=STATUS.SOURCE_NOT_PRESENTED;
  else if(source.unanswered)status=STATUS.SOURCE_UNANSWERED;
  else if(!target.presented)status=STATUS.TARGET_NOT_PRESENTED;
  else if(target.unanswered)status=STATUS.TARGET_UNANSWERED;

  return{
   ok:true,
   pairId:pair.pairId,
   pairVersion:pair.pairVersion,
   pairHypothesisVersion:pair.pairHypothesisVersion,
   kcHypothesisId:pair.source.kcHypothesisId,
   kcHypothesisVersion:pair.source.kcHypothesisVersion,
   constructValidated:false,
   status,
   source,
   target,
   transition:status===STATUS.COMPLETE?transitionLabel(source,target):null,
   targetProcessCheckDenominator:target.presented?1:0,
   targetFirstResponseNumerator:target.firstResponseObserved?1:0,
   targetUnanswered:target.presented&&target.unanswered,
   skillUpdateEligible:false,
   schedulerEligible:false,
   formalEligible:false,
   independentEvaluation:false,
   mastery:null,
   transferConclusion:null
  };
 }
 function summarizeStore(store){
  if(!store||store.schemaVersion!==Events.SCHEMA_VERSION||store.eventStreamVersion!==Events.STREAM_VERSION||!Array.isArray(store.events)){
   return{ok:false,status:STATUS.INVALID,error:"comparable_store_invalid",pairs:[]};
  }
  const pairs=Contract.pairs.map(pair=>summarizePair(store,pair));
  const invalid=pairs.find(pair=>!pair.ok);
  if(invalid)return{ok:false,status:STATUS.INVALID,error:invalid.error,pairs};
  return{
   ok:true,
   version:VERSION,
   pairs,
   totals:{
    pairs: pairs.length,
    completePairs:pairs.filter(pair=>pair.status===STATUS.COMPLETE).length,
    targetPresented:pairs.reduce((sum,pair)=>sum+pair.targetProcessCheckDenominator,0),
    targetFirstResponses:pairs.reduce((sum,pair)=>sum+pair.targetFirstResponseNumerator,0),
    targetUnanswered:pairs.filter(pair=>pair.targetUnanswered).length
   },
   authority:"descriptive_process_check_only",
   constructValidated:false,
   skillUpdateEligible:false,
   schedulerEligible:false,
   formalEligible:false,
   independentEvaluation:false,
   mastery:null,
   transferConclusion:null
  };
 }

 return Object.freeze({VERSION,STATUS,summarizeFirstPresentation,summarizePair,summarizeStore});
});