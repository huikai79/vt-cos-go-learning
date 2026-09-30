(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  contract:require("./advanced-enclosure-comparable-contract.js"),
  events:require("./advanced-enclosure-comparable-events.js"),
  policy:require("./advanced-enclosure-comparable-policy.js")
 }:{contract:root.GoAdvancedEnclosureComparableContract,events:root.GoAdvancedEnclosureComparableEvents,policy:root.GoAdvancedEnclosureComparablePolicy};
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedEnclosureComparableAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

const VERSION="advanced-enclosure-comparable-analysis-v1";
function summarizeItem(store,item,nowMs=Date.now()){
 const status=D.policy.statusFor(store,item,nowMs);if(!status.ok)return{ok:false,itemId:item.itemId,error:status.error,status:status.status};
 const events=D.events.eventsForItem(store,item.itemId),p=events.find(e=>e.type==="enclosure_presented")||null,c=events.find(e=>e.type==="enclosure_completed")||null;
 const firstByDecision=[0,1].map(index=>events.find(e=>e.type==="enclosure_move_first"&&e.decisionIndex===index)||null);
 const retries=[0,1].map(index=>events.filter(e=>e.type==="enclosure_move_retry"&&e.decisionIndex===index).length);
 return{
  ok:true,itemId:item.itemId,familyId:item.familyId,itemRole:item.role,status:status.status,presented:Boolean(p),denominator:p?1:0,
  firstResponseObserved:firstByDecision.map(Boolean),firstCorrect:firstByDecision.map(event=>event?event.correct:null),
  unanswered:Boolean(p&&firstByDecision[0]===null),retryCountByDecision:retries,eventualCorrect:c?c.eventualCorrect:null,completed:Boolean(c),
  retrievalTiming:item.minimumDelayMs===0?"immediate":item.minimumDelayMs===D.contract.MIN_DELAY_24H_MS?"delayed_24h":"delayed_7d",
  actualDelayMs:p?p.actualDelayMs:null,dueAt:status.dueAt||p&&p.dueAt||null
 };
}
function summarizeStore(store,nowMs=Date.now()){
 const checked=D.events.validateStore(store);if(!checked.ok)return{ok:false,error:checked.error,items:[]};
 const items=D.contract.orderedItems().map(item=>summarizeItem(store,item,nowMs)),invalid=items.find(item=>!item.ok);
 if(invalid)return{ok:false,error:invalid.error,items};
 return{
  ok:true,version:VERSION,familyId:"enclosure_capture",familyVersion:D.contract.FAMILY_VERSION,items,
  totals:{presented:items.reduce((n,item)=>n+item.denominator,0),completed:items.filter(item=>item.completed).length,unanswered:items.filter(item=>item.unanswered).length},
  authority:"descriptive_public_process_check_only",constructValidated:false,skillUpdateEligible:false,schedulerEligible:false,formalEligible:false,independentEvaluation:false,
  mastery:null,retentionConclusion:null,transferConclusion:null
 };
}
return Object.freeze({VERSION,summarizeItem,summarizeStore});
});
