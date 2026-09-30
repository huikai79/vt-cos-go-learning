(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  contract:require("./advanced-seven-day-comparable-contract.js"),
  immediate:require("./advanced-comparable-events-v2.js"),
  delayed24:require("./advanced-delayed-comparable-events-v2.js"),
  events:require("./advanced-seven-day-comparable-events.js"),
  framework:require("./advanced-comparable-framework-v2.js")
 }:{contract:root.GoAdvancedSevenDayComparableContract,immediate:root.GoAdvancedComparableEventsV2,delayed24:root.GoAdvancedDelayedComparableEventsV2,events:root.GoAdvancedSevenDayComparableEvents,framework:root.GoAdvancedComparableFrameworkV2};
 const api=factory(deps);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.GoAdvancedSevenDayComparablePolicy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";
const STATUS=Object.freeze({WAITING_FOR_ANCHOR:"WAITING_FOR_ANCHOR",WAITING_FOR_24H:"WAITING_FOR_24H",WAITING_FOR_DELAY:"WAITING_FOR_DELAY",DUE:"DUE",IN_PROGRESS:"IN_PROGRESS",COMPLETED:"COMPLETED",INVALID:"INVALID"});
function parse(v){const ms=Date.parse(v);return Number.isFinite(ms)?ms:null;}
function anchor(immediateStore){
 const checked=D.immediate.validateStore(immediateStore);if(!checked.ok)return{ok:false,error:"seven_day_immediate_store_invalid:"+checked.error};
 const item=D.framework.immediateItems().find(x=>x.role==="process_check");if(!item)return{ok:false,error:"seven_day_anchor_item_missing"};
 const events=D.immediate.eventsForItem(immediateStore,item.itemId),completed=events.find(e=>e.type==="comparable_completed");
 if(!completed)return{ok:true,ready:false};let last=-Infinity;
 for(const e of events){const t=parse(e.occurredAt);if(t===null)return{ok:false,error:"seven_day_anchor_time_invalid"};if(t<last)return{ok:false,error:"seven_day_anchor_time_order_invalid"};last=t;}
 return{ok:true,ready:true,anchorEvent:completed,anchorMs:parse(completed.occurredAt)};
}
function statusFor(immediateStore,delayed24Store,sevenStore,nowMs=Date.now()){
 if(!Number.isFinite(nowMs))return{ok:false,status:STATUS.INVALID,error:"seven_day_now_invalid"};
 const sevenChecked=D.events.validateStore(sevenStore);if(!sevenChecked.ok)return{ok:false,status:STATUS.INVALID,error:sevenChecked.error};
 const a=anchor(immediateStore);if(!a.ok)return{ok:false,status:STATUS.INVALID,error:a.error};if(!a.ready)return{ok:true,status:STATUS.WAITING_FOR_ANCHOR};
 const dueMs=a.anchorMs+D.contract.MIN_DELAY_MS,dueAt=new Date(dueMs).toISOString();
 const p=sevenStore.events.find(e=>e.type==="seven_day_presented"),c=sevenStore.events.find(e=>e.type==="seven_day_completed");
 if(p){
  if(p.anchorEventId!==a.anchorEvent.eventId||p.anchorOccurredAt!==a.anchorEvent.occurredAt||p.dueAt!==dueAt)return{ok:false,status:STATUS.INVALID,error:"seven_day_anchor_mismatch"};
  return{ok:true,status:c?STATUS.COMPLETED:STATUS.IN_PROGRESS,dueAt,anchorEvent:a.anchorEvent,actualDelayMs:p.actualDelayMs};
 }
 const delayedChecked=D.delayed24.validateStore(delayed24Store);if(!delayedChecked.ok)return{ok:false,status:STATUS.INVALID,error:"seven_day_24h_store_invalid:"+delayedChecked.error};
 if(!delayed24Store.events.some(e=>e.type==="delayed_completed"))return{ok:true,status:STATUS.WAITING_FOR_24H,dueAt,anchorEvent:a.anchorEvent};
 if(nowMs<a.anchorMs)return{ok:false,status:STATUS.INVALID,error:"seven_day_clock_before_anchor"};
 if(nowMs<dueMs)return{ok:true,status:STATUS.WAITING_FOR_DELAY,dueAt,remainingMs:dueMs-nowMs,anchorEvent:a.anchorEvent};
 return{ok:true,status:STATUS.DUE,dueAt,anchorEvent:a.anchorEvent,presentationMetadata:{anchorEventId:a.anchorEvent.eventId,anchorOccurredAt:a.anchorEvent.occurredAt,dueAt,actualDelayMs:nowMs-a.anchorMs}};
}
return Object.freeze({STATUS,anchor,statusFor});
});
