(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  framework:require("./advanced-comparable-framework-v2.js"),
  events:require("./advanced-comparable-events-v2.js")
 }:{framework:root.GoAdvancedComparableFrameworkV2,events:root.GoAdvancedComparableEventsV2};
 const api=factory(deps);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoAdvancedComparableAnalysisV2=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";

const VERSION="advanced-comparable-analysis-v2";
function summarizeItem(store,item){
 const events=D.events.eventsForItem(store,item.itemId),presented=events.find(e=>e.type==="comparable_presented")||null;
 if(!presented)return{ok:true,itemId:item.itemId,familyId:item.familyId,itemRole:item.role,presented:false,denominator:0,firstResponseObserved:false,firstCorrect:null,unanswered:false,retryCount:0,eventualCorrect:null,completed:false};
 const attempt=events.filter(e=>e.attemptId===presented.attemptId),firsts=attempt.filter(e=>e.type==="comparable_first"),retries=attempt.filter(e=>e.type==="comparable_retry"),completions=attempt.filter(e=>e.type==="comparable_completed");
 if(firsts.length>1)return{ok:false,error:"v2_analysis_multiple_first",itemId:item.itemId};
 if(completions.length>1)return{ok:false,error:"v2_analysis_multiple_completion",itemId:item.itemId};
 if(retries.length&&!firsts.length)return{ok:false,error:"v2_analysis_retry_without_first",itemId:item.itemId};
 if(completions.length&&!firsts.length)return{ok:false,error:"v2_analysis_completion_without_first",itemId:item.itemId};
 return{ok:true,itemId:item.itemId,familyId:item.familyId,itemRole:item.role,presented:true,denominator:1,firstResponseObserved:firsts.length===1,firstCorrect:firsts.length===1?firsts[0].correct:null,unanswered:firsts.length===0,retryCount:retries.length,eventualCorrect:completions.length?completions[0].eventualCorrect:null,completed:completions.length===1};
}
function summarizeStore(store){
 const checked=D.events.validateStore(store);if(!checked.ok)return{ok:false,error:checked.error,items:[]};
 const items=D.framework.immediateItems().map(item=>summarizeItem(store,item));
 const invalid=items.find(item=>!item.ok);if(invalid)return{ok:false,error:invalid.error,items};
 return{
  ok:true,version:VERSION,frameworkVersion:D.framework.FRAMEWORK_VERSION,
  familyId:D.framework.DOUBLE_ATARI_FAMILY.familyId,familyVersion:D.framework.DOUBLE_ATARI_FAMILY.familyVersion,
  items,
  totals:{presented:items.reduce((n,item)=>n+item.denominator,0),firstResponses:items.filter(item=>item.firstResponseObserved).length,unanswered:items.filter(item=>item.unanswered).length,completed:items.filter(item=>item.completed).length},
  authority:"descriptive_public_process_check_only",constructValidated:false,skillUpdateEligible:false,schedulerEligible:false,formalEligible:false,independentEvaluation:false,mastery:null,transferConclusion:null
 };
}
return Object.freeze({VERSION,summarizeItem,summarizeStore});
});
