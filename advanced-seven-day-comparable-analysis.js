(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  contract:require("./advanced-seven-day-comparable-contract.js"),events:require("./advanced-seven-day-comparable-events.js"),policy:require("./advanced-seven-day-comparable-policy.js")
 }:{contract:root.GoAdvancedSevenDayComparableContract,events:root.GoAdvancedSevenDayComparableEvents,policy:root.GoAdvancedSevenDayComparablePolicy};
 const api=factory(deps);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.GoAdvancedSevenDayComparableAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";
const VERSION="advanced-seven-day-comparable-analysis-v1";
function summarize(immediateStore,delayed24Store,sevenStore,nowMs=Date.now()){
 const status=D.policy.statusFor(immediateStore,delayed24Store,sevenStore,nowMs);if(!status.ok)return{ok:false,error:status.error,status:status.status};
 const p=sevenStore.events.find(e=>e.type==="seven_day_presented"),f=sevenStore.events.find(e=>e.type==="seven_day_first"),r=sevenStore.events.filter(e=>e.type==="seven_day_retry"),c=sevenStore.events.find(e=>e.type==="seven_day_completed");
 return{ok:true,version:VERSION,familyId:D.contract.item.familyId,status:status.status,presented:Boolean(p),denominator:p?1:0,firstResponseObserved:Boolean(f),firstCorrect:f?f.correct:null,unanswered:Boolean(p&&!f),retryCount:r.length,eventualCorrect:c?c.eventualCorrect:null,completed:Boolean(c),actualDelayMs:p?p.actualDelayMs:null,dueAt:status.dueAt||null,authority:"descriptive_seven_day_public_process_check_only",constructValidated:false,skillUpdateEligible:false,schedulerEligible:false,formalEligible:false,independentEvaluation:false,mastery:null,retentionConclusion:null,transferConclusion:null};
}
return Object.freeze({VERSION,summarize});
});
