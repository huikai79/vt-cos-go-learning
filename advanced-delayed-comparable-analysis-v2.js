(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  framework:require("./advanced-comparable-framework-v2.js"),
  delayed:require("./advanced-delayed-comparable-events-v2.js"),
  policy:require("./advanced-delayed-comparable-policy-v2.js")
 }:{framework:root.GoAdvancedComparableFrameworkV2,delayed:root.GoAdvancedDelayedComparableEventsV2,policy:root.GoAdvancedDelayedComparablePolicyV2};
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedDelayedComparableAnalysisV2=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

const VERSION="advanced-delayed-comparable-analysis-v2";
function summarize(immediateStore,delayedStore,nowMs=Date.now()){
 const status=D.policy.statusFor(immediateStore,delayedStore,nowMs);if(!status.ok)return{ok:false,error:status.error,status:status.status};
 const p=delayedStore.events.find(e=>e.type==="delayed_presented"),f=delayedStore.events.find(e=>e.type==="delayed_first"),r=delayedStore.events.filter(e=>e.type==="delayed_retry"),c=delayedStore.events.find(e=>e.type==="delayed_completed");
 return{
  ok:true,version:VERSION,frameworkVersion:D.framework.FRAMEWORK_VERSION,familyId:D.framework.DOUBLE_ATARI_FAMILY.familyId,
  status:status.status,presented:Boolean(p),denominator:p?1:0,firstResponseObserved:Boolean(f),firstCorrect:f?f.correct:null,unanswered:Boolean(p&&!f),retryCount:r.length,eventualCorrect:c?c.eventualCorrect:null,completed:Boolean(c),actualDelayMs:p?p.actualDelayMs:null,dueAt:status.dueAt||null,
  authority:"descriptive_delayed_public_process_check_only",constructValidated:false,skillUpdateEligible:false,schedulerEligible:false,formalEligible:false,independentEvaluation:false,mastery:null,retentionConclusion:null,transferConclusion:null
 };
}
return Object.freeze({VERSION,summarize});
});
