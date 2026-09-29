(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  comparableContract:require("./advanced-comparable-position-contract.js"),
  comparableEvents:require("./advanced-comparable-position-events.js"),
  comparableAnalysis:require("./advanced-comparable-analysis.js"),
  delayedContract:require("./advanced-delayed-comparable-contract.js"),
  delayedEvents:require("./advanced-delayed-comparable-events.js")
 }:{
  comparableContract:root.GoAdvancedComparablePositionContract,
  comparableEvents:root.GoAdvancedComparablePositionEvents,
  comparableAnalysis:root.GoAdvancedComparableAnalysis,
  delayedContract:root.GoAdvancedDelayedComparableContract,
  delayedEvents:root.GoAdvancedDelayedComparableEvents
 };
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedDelayedComparablePolicy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

 const STATUS=Object.freeze({
  WAITING_FOR_ANCHOR:"WAITING_FOR_ANCHOR",
  WAITING_FOR_DELAY:"WAITING_FOR_DELAY",
  DUE:"DUE",
  IN_PROGRESS:"IN_PROGRESS",
  COMPLETED:"COMPLETED",
  INVALID:"INVALID"
 });

 function parseTime(value){const ms=Date.parse(value);return Number.isFinite(ms)?ms:null;}
 function anchorForItem(comparableStore,item){
  const analysis=D.comparableAnalysis.summarizeStore(comparableStore);
  if(!analysis.ok)return{ok:false,error:"comparable_analysis_invalid:"+analysis.error};
  const pair=D.comparableContract.pairById(item.pairId);
  if(!pair)return{ok:false,error:"delayed_pair_unknown"};
  const summary=analysis.pairs.find(entry=>entry.pairId===item.pairId);
  if(!summary||summary.target.itemId!==item.anchorItemId)return{ok:false,error:"delayed_anchor_summary_missing"};
  if(!summary.target.presented||!summary.target.firstResponseObserved||!summary.target.completed||summary.target.eventualCorrect!==true)return{ok:true,ready:false,status:STATUS.WAITING_FOR_ANCHOR};

  const attemptId=summary.target.attemptId;
  const attemptEvents=comparableStore.events.filter(event=>event.itemId===item.anchorItemId&&event.attemptId===attemptId);
  const presented=attemptEvents.find(event=>event.type==="comparable_presented");
  const first=attemptEvents.find(event=>event.type==="comparable_first");
  const completed=attemptEvents.find(event=>event.type==="comparable_completed");
  if(!presented||!first||!completed)return{ok:false,error:"delayed_anchor_lifecycle_incomplete"};
  const times=[presented.occurredAt,first.occurredAt,...attemptEvents.filter(e=>e.type==="comparable_retry").map(e=>e.occurredAt),completed.occurredAt].map(parseTime);
  if(times.some(value=>value===null))return{ok:false,error:"delayed_anchor_time_invalid"};
  for(let i=1;i<times.length;i++)if(times[i]<times[i-1])return{ok:false,error:"delayed_anchor_time_order_invalid"};
  const anchorMs=parseTime(completed.occurredAt);
  return{ok:true,ready:true,status:null,anchorEvent:completed,anchorMs};
 }
 function validateDelayedStore(delayedStore){
  if(!delayedStore||delayedStore.schemaVersion!==D.delayedEvents.SCHEMA_VERSION||delayedStore.eventStreamVersion!==D.delayedEvents.STREAM_VERSION||!Array.isArray(delayedStore.events))return{ok:false,error:"delayed_store_invalid"};
  for(const event of delayedStore.events){
   const error=D.delayedEvents.validate(event);
   if(error)return{ok:false,error:"delayed_event_invalid:"+error,eventId:event.eventId};
  }
  return{ok:true};
 }
 function statusForItem(comparableStore,delayedStore,item,nowMs=Date.now()){
  if(!Number.isFinite(nowMs))return{ok:false,status:STATUS.INVALID,error:"delayed_now_invalid"};
  const checked=validateDelayedStore(delayedStore);if(!checked.ok)return{...checked,status:STATUS.INVALID};
  const anchor=anchorForItem(comparableStore,item);
  if(!anchor.ok)return{...anchor,status:STATUS.INVALID};
  if(!anchor.ready)return{ok:true,status:STATUS.WAITING_FOR_ANCHOR,itemId:item.itemId};

  const dueMs=anchor.anchorMs+D.delayedContract.MIN_DELAY_MS;
  const dueAt=new Date(dueMs).toISOString();
  const itemEvents=delayedStore.events.filter(event=>event.itemId===item.itemId);
  const presented=itemEvents.find(event=>event.type==="delayed_presented")||null;
  const completed=itemEvents.find(event=>event.type==="delayed_completed")||null;

  if(presented){
   if(presented.anchorEventId!==anchor.anchorEvent.eventId||presented.anchorOccurredAt!==anchor.anchorEvent.occurredAt||presented.dueAt!==dueAt||presented.minimumDelayMs!==D.delayedContract.MIN_DELAY_MS)return{ok:false,status:STATUS.INVALID,error:"delayed_presentation_anchor_mismatch"};
   if(completed)return{ok:true,status:STATUS.COMPLETED,itemId:item.itemId,anchorEvent:anchor.anchorEvent,dueAt,actualDelayMs:presented.actualDelayMs};
   return{ok:true,status:STATUS.IN_PROGRESS,itemId:item.itemId,anchorEvent:anchor.anchorEvent,dueAt,actualDelayMs:presented.actualDelayMs};
  }

  if(nowMs<anchor.anchorMs)return{ok:false,status:STATUS.INVALID,error:"delayed_clock_before_anchor"};
  if(nowMs<dueMs)return{ok:true,status:STATUS.WAITING_FOR_DELAY,itemId:item.itemId,anchorEvent:anchor.anchorEvent,dueAt,remainingMs:dueMs-nowMs};
  return{
   ok:true,status:STATUS.DUE,itemId:item.itemId,anchorEvent:anchor.anchorEvent,dueAt,
   presentationMetadata:{
    anchorEventId:anchor.anchorEvent.eventId,
    anchorOccurredAt:anchor.anchorEvent.occurredAt,
    dueAt,
    minimumDelayMs:D.delayedContract.MIN_DELAY_MS,
    actualDelayMs:nowMs-anchor.anchorMs
   }
  };
 }

 return Object.freeze({STATUS,anchorForItem,statusForItem});
});
