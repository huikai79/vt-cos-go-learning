(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  contract:require("./advanced-enclosure-comparable-contract.js"),
  events:require("./advanced-enclosure-comparable-events.js")
 }:{contract:root.GoAdvancedEnclosureComparableContract,events:root.GoAdvancedEnclosureComparableEvents};
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedEnclosureComparablePolicy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

const STATUS=Object.freeze({LOCKED:"LOCKED",READY:"READY",WAITING_FOR_DELAY:"WAITING_FOR_DELAY",IN_PROGRESS:"IN_PROGRESS",COMPLETED:"COMPLETED",INVALID:"INVALID"});
function parse(value){const ms=Date.parse(value);return Number.isFinite(ms)?ms:null;}
function anchor(store){
 const item=D.contract.itemById("enclosure-fullboard-process-v1");if(!item)return{ok:false,error:"enclosure_anchor_item_missing"};
 const events=D.events.eventsForItem(store,item.itemId);
 const completed=events.find(e=>e.type==="enclosure_completed");
 if(!completed)return{ok:true,ready:false};
 const times=events.map(e=>parse(e.occurredAt));if(times.some(v=>v===null))return{ok:false,error:"enclosure_anchor_time_invalid"};
 for(let i=1;i<times.length;i++)if(times[i]<times[i-1])return{ok:false,error:"enclosure_anchor_time_order_invalid"};
 return{ok:true,ready:true,anchorEvent:completed,anchorMs:parse(completed.occurredAt)};
}
function statusFor(store,item,nowMs=Date.now()){
 if(!Number.isFinite(nowMs))return{ok:false,status:STATUS.INVALID,error:"enclosure_now_invalid"};
 const checked=D.events.validateStore(store);if(!checked.ok)return{ok:false,status:STATUS.INVALID,error:checked.error};
 const order=D.contract.orderedItems(),index=order.findIndex(entry=>entry.itemId===item.itemId);
 if(index<0)return{ok:false,status:STATUS.INVALID,error:"enclosure_policy_item_unknown"};
 const events=D.events.eventsForItem(store,item.itemId);
 const completed=events.find(e=>e.type==="enclosure_completed");
 const presented=events.find(e=>e.type==="enclosure_presented");
 if(completed)return{ok:true,status:STATUS.COMPLETED,itemId:item.itemId};
 if(presented)return{ok:true,status:STATUS.IN_PROGRESS,itemId:item.itemId};
 for(let i=0;i<index;i++){
  if(!store.events.some(e=>e.itemId===order[i].itemId&&e.type==="enclosure_completed"))return{ok:true,status:STATUS.LOCKED,itemId:item.itemId};
 }
 if(item.minimumDelayMs===0)return{ok:true,status:STATUS.READY,itemId:item.itemId,presentationMetadata:{anchorEventId:null,anchorOccurredAt:null,dueAt:null,actualDelayMs:0}};
 const a=anchor(store);if(!a.ok)return{ok:false,status:STATUS.INVALID,error:a.error};if(!a.ready)return{ok:true,status:STATUS.LOCKED,itemId:item.itemId};
 const dueMs=a.anchorMs+item.minimumDelayMs,dueAt=new Date(dueMs).toISOString();
 if(nowMs<a.anchorMs)return{ok:false,status:STATUS.INVALID,error:"enclosure_clock_before_anchor"};
 if(nowMs<dueMs)return{ok:true,status:STATUS.WAITING_FOR_DELAY,itemId:item.itemId,dueAt,remainingMs:dueMs-nowMs};
 return{ok:true,status:STATUS.READY,itemId:item.itemId,dueAt,presentationMetadata:{anchorEventId:a.anchorEvent.eventId,anchorOccurredAt:a.anchorEvent.occurredAt,dueAt,actualDelayMs:nowMs-a.anchorMs}};
}
function nextAvailable(store,nowMs=Date.now()){
 for(const item of D.contract.orderedItems()){
  const status=statusFor(store,item,nowMs);
  if(!status.ok)return{ok:false,error:status.error,status:STATUS.INVALID};
  if([STATUS.READY,STATUS.IN_PROGRESS].includes(status.status))return{ok:true,item,status};
 }
 return{ok:true,item:null,status:null};
}
return Object.freeze({STATUS,anchor,statusFor,nextAvailable});
});
