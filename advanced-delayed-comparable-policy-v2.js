(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  framework:require("./advanced-comparable-framework-v2.js"),
  immediate:require("./advanced-comparable-events-v2.js"),
  delayed:require("./advanced-delayed-comparable-events-v2.js")
 }:{framework:root.GoAdvancedComparableFrameworkV2,immediate:root.GoAdvancedComparableEventsV2,delayed:root.GoAdvancedDelayedComparableEventsV2};
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedDelayedComparablePolicyV2=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

const STATUS=Object.freeze({WAITING_FOR_ANCHOR:"WAITING_FOR_ANCHOR",WAITING_FOR_DELAY:"WAITING_FOR_DELAY",DUE:"DUE",IN_PROGRESS:"IN_PROGRESS",COMPLETED:"COMPLETED",INVALID:"INVALID"});
function parseTime(value){const ms=Date.parse(value);return Number.isFinite(ms)?ms:null;}
function anchor(immediateStore){
 const checked=D.immediate.validateStore(immediateStore);if(!checked.ok)return{ok:false,error:"v2_immediate_store_invalid:"+checked.error};
 const item=D.framework.immediateItems().find(entry=>entry.role==="process_check");
 if(!item)return{ok:false,error:"v2_process_item_missing"};
 const events=D.immediate.eventsForItem(immediateStore,item.itemId);
 const presented=events.find(e=>e.type==="comparable_presented"),first=events.find(e=>e.type==="comparable_first"),completed=events.find(e=>e.type==="comparable_completed");
 if(!completed)return{ok:true,ready:false,status:STATUS.WAITING_FOR_ANCHOR};
 if(!presented||!first)return{ok:false,error:"v2_anchor_lifecycle_incomplete"};
 const ordered=events.filter(e=>e.attemptId===presented.attemptId);
 let last=-Infinity;
 for(const event of ordered){const t=parseTime(event.occurredAt);if(t===null)return{ok:false,error:"v2_anchor_time_invalid"};if(t<last)return{ok:false,error:"v2_anchor_time_order_invalid"};last=t;}
 const anchorMs=parseTime(completed.occurredAt);
 return{ok:true,ready:true,anchorEvent:completed,anchorMs};
}
function statusFor(immediateStore,delayedStore,nowMs=Date.now()){
 if(!Number.isFinite(nowMs))return{ok:false,status:STATUS.INVALID,error:"v2_now_invalid"};
 const delayedChecked=D.delayed.validateStore(delayedStore);if(!delayedChecked.ok)return{...delayedChecked,status:STATUS.INVALID};
 const a=anchor(immediateStore);if(!a.ok)return{...a,status:STATUS.INVALID};if(!a.ready)return{ok:true,status:STATUS.WAITING_FOR_ANCHOR};
 const dueMs=a.anchorMs+D.framework.MIN_DELAY_MS,dueAt=new Date(dueMs).toISOString();
 const p=delayedStore.events.find(e=>e.type==="delayed_presented"),c=delayedStore.events.find(e=>e.type==="delayed_completed");
 if(p){
  if(p.anchorEventId!==a.anchorEvent.eventId||p.anchorOccurredAt!==a.anchorEvent.occurredAt||p.dueAt!==dueAt||p.minimumDelayMs!==D.framework.MIN_DELAY_MS)return{ok:false,status:STATUS.INVALID,error:"v2_delayed_anchor_mismatch"};
  return{ok:true,status:c?STATUS.COMPLETED:STATUS.IN_PROGRESS,anchorEvent:a.anchorEvent,dueAt,actualDelayMs:p.actualDelayMs};
 }
 if(nowMs<a.anchorMs)return{ok:false,status:STATUS.INVALID,error:"v2_clock_before_anchor"};
 if(nowMs<dueMs)return{ok:true,status:STATUS.WAITING_FOR_DELAY,anchorEvent:a.anchorEvent,dueAt,remainingMs:dueMs-nowMs};
 return{ok:true,status:STATUS.DUE,anchorEvent:a.anchorEvent,dueAt,presentationMetadata:{anchorEventId:a.anchorEvent.eventId,anchorOccurredAt:a.anchorEvent.occurredAt,dueAt,minimumDelayMs:D.framework.MIN_DELAY_MS,actualDelayMs:nowMs-a.anchorMs}};
}
return Object.freeze({STATUS,anchor,statusFor});
});
