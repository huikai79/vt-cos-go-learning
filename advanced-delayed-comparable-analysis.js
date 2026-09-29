(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  comparableEvents:require("./advanced-comparable-position-events.js"),
  delayedContract:require("./advanced-delayed-comparable-contract.js"),
  delayedEvents:require("./advanced-delayed-comparable-events.js"),
  delayedPolicy:require("./advanced-delayed-comparable-policy.js")
 }:{
  comparableEvents:root.GoAdvancedComparablePositionEvents,
  delayedContract:root.GoAdvancedDelayedComparableContract,
  delayedEvents:root.GoAdvancedDelayedComparableEvents,
  delayedPolicy:root.GoAdvancedDelayedComparablePolicy
 };
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedDelayedComparableAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

 const VERSION="advanced-delayed-comparable-analysis-v1";
 function summarizeItem(comparableStore,delayedStore,item,nowMs=Date.now()){
  const status=D.delayedPolicy.statusForItem(comparableStore,delayedStore,item,nowMs);
  if(!status.ok)return{ok:false,itemId:item.itemId,error:status.error,status:status.status};
  const events=D.delayedEvents.eventsForItem(delayedStore,item.itemId);
  const presented=events.find(e=>e.type==="delayed_presented")||null;
  const first=events.find(e=>e.type==="delayed_first")||null;
  const retries=events.filter(e=>e.type==="delayed_retry");
  const completed=events.find(e=>e.type==="delayed_completed")||null;
  return{
   ok:true,
   itemId:item.itemId,
   pairId:item.pairId,
   status:status.status,
   presented:Boolean(presented),
   denominator:presented?1:0,
   firstResponseObserved:Boolean(first),
   firstCorrect:first?first.correct:null,
   unanswered:Boolean(presented&&!first),
   retryCount:retries.length,
   eventualCorrect:completed?completed.eventualCorrect:null,
   completed:Boolean(completed),
   actualDelayMs:presented?presented.actualDelayMs:null,
   minimumDelayMs:D.delayedContract.MIN_DELAY_MS,
   dueAt:status.dueAt||null
  };
 }
 function summarizeStore(comparableStore,delayedStore,nowMs=Date.now()){
  if(!comparableStore||comparableStore.schemaVersion!==D.comparableEvents.SCHEMA_VERSION||comparableStore.eventStreamVersion!==D.comparableEvents.STREAM_VERSION||!Array.isArray(comparableStore.events))return{ok:false,error:"comparable_store_invalid",items:[]};
  if(!delayedStore||delayedStore.schemaVersion!==D.delayedEvents.SCHEMA_VERSION||delayedStore.eventStreamVersion!==D.delayedEvents.STREAM_VERSION||!Array.isArray(delayedStore.events))return{ok:false,error:"delayed_store_invalid",items:[]};
  const items=D.delayedContract.items.map(item=>summarizeItem(comparableStore,delayedStore,item,nowMs));
  const invalid=items.find(item=>!item.ok);
  if(invalid)return{ok:false,error:invalid.error,items};
  return{
   ok:true,
   version:VERSION,
   items,
   totals:{
    items:items.length,
    presented:items.reduce((sum,item)=>sum+item.denominator,0),
    firstResponses:items.filter(item=>item.firstResponseObserved).length,
    unanswered:items.filter(item=>item.unanswered).length,
    completed:items.filter(item=>item.completed).length
   },
   policyVersion:D.delayedContract.RETRIEVAL_POLICY_VERSION,
   minimumDelayMs:D.delayedContract.MIN_DELAY_MS,
   authority:"descriptive_delayed_process_check_only",
   constructValidated:false,
   skillUpdateEligible:false,
   schedulerEligible:false,
   formalEligible:false,
   independentEvaluation:false,
   mastery:null,
   retentionConclusion:null,
   transferConclusion:null
  };
 }

 return Object.freeze({VERSION,summarizeItem,summarizeStore});
});
