(function(root,factory){"use strict";
 const deps=typeof module==="object"&&module.exports?{
  legacyImmediate:require("./advanced-comparable-analysis.js"),legacyDelayed:require("./advanced-delayed-comparable-analysis.js"),
  doubleImmediate:require("./advanced-comparable-analysis-v2.js"),doubleDelayed:require("./advanced-delayed-comparable-analysis-v2.js"),doubleSeven:require("./advanced-seven-day-comparable-analysis.js"),
  enclosure:require("./advanced-enclosure-comparable-analysis.js")
 }:{legacyImmediate:root.GoAdvancedComparableAnalysis,legacyDelayed:root.GoAdvancedDelayedComparableAnalysis,doubleImmediate:root.GoAdvancedComparableAnalysisV2,doubleDelayed:root.GoAdvancedDelayedComparableAnalysisV2,doubleSeven:root.GoAdvancedSevenDayComparableAnalysis,enclosure:root.GoAdvancedEnclosureComparableAnalysis};
 const api=factory(deps);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.GoAdvancedCrossFamilyAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D){"use strict";
const VERSION="advanced-cross-family-analysis-v1";
function firstFromItems(items,role){const item=(items||[]).find(x=>x.itemRole===role||x.itemRole===role.replace("_24h","")||x.itemRole===role.replace("_7d",""));return item&&item.firstResponseObserved?item.firstCorrect:null;}
function row(familyId,immediate,delay24,delay7){
 return{familyId,immediateFirst:immediate??null,delayed24hFirst:delay24??null,delayed7dFirst:delay7??null,mastery:null,retentionConclusion:null,transferConclusion:null};
}
function summarize(stores,{nowMs=Date.now()}={}){
 const errors=[],rows=[];
 let legacyImmediate=null,legacyDelayed=null,doubleImmediate=null,doubleDelayed=null,doubleSeven=null,enclosure=null;
 try{legacyImmediate=D.legacyImmediate.summarizeStore(stores.legacyImmediate);}catch(error){errors.push({source:"urgent_immediate",error:error.message});}
 try{legacyDelayed=D.legacyDelayed.summarizeStore(stores.legacyImmediate,stores.legacyDelayed,nowMs);}catch(error){errors.push({source:"urgent_24h",error:error.message});}
 try{doubleImmediate=D.doubleImmediate.summarizeStore(stores.doubleImmediate);}catch(error){errors.push({source:"double_immediate",error:error.message});}
 try{doubleDelayed=D.doubleDelayed.summarize(stores.doubleImmediate,stores.doubleDelayed,nowMs);}catch(error){errors.push({source:"double_24h",error:error.message});}
 try{doubleSeven=D.doubleSeven.summarize(stores.doubleImmediate,stores.doubleDelayed,stores.doubleSeven,nowMs);}catch(error){errors.push({source:"double_7d",error:error.message});}
 try{enclosure=D.enclosure.summarizeStore(stores.enclosure,nowMs);}catch(error){errors.push({source:"enclosure",error:error.message});}
 if(legacyImmediate&&legacyImmediate.ok&&legacyDelayed&&legacyDelayed.ok){
  const process=(legacyImmediate.items||[]).find(item=>item.itemRole==="process_check");
  const delayed=(legacyDelayed.items||[]).find(item=>item.presented||item.completed);
  rows.push(row("urgent_atari_rescue",process&&process.firstResponseObserved?process.firstCorrect:null,delayed&&delayed.firstResponseObserved?delayed.firstCorrect:null,null));
 }else errors.push({source:"urgent_atari_rescue",error:"analysis_unavailable"});
 if(doubleImmediate&&doubleImmediate.ok&&doubleDelayed&&doubleDelayed.ok&&doubleSeven&&doubleSeven.ok){
  const process=(doubleImmediate.items||[]).find(item=>item.itemRole==="process_check");
  rows.push(row("double_atari",process&&process.firstResponseObserved?process.firstCorrect:null,doubleDelayed.firstResponseObserved?doubleDelayed.firstCorrect:null,doubleSeven.firstResponseObserved?doubleSeven.firstCorrect:null));
 }else errors.push({source:"double_atari",error:"analysis_unavailable"});
 if(enclosure&&enclosure.ok){
  const process=enclosure.items.find(item=>item.itemRole==="process_check"),d24=enclosure.items.find(item=>item.itemRole==="delayed_24h_process_check"),d7=enclosure.items.find(item=>item.itemRole==="delayed_7d_process_check");
  rows.push(row("enclosure_capture",process&&process.firstResponseObserved[0]?process.firstCorrect.every(v=>v===true):null,d24&&d24.firstResponseObserved[0]?d24.firstCorrect.every(v=>v===true):null,d7&&d7.firstResponseObserved[0]?d7.firstCorrect.every(v=>v===true):null));
 }else errors.push({source:"enclosure_capture",error:"analysis_unavailable"});
 return{
  ok:errors.length===0,version:VERSION,rows,errors,
  authority:"descriptive_cross_family_process_check_only",aggregation:"no_combined_score",
  constructValidated:false,skillUpdateEligible:false,schedulerEligible:false,formalEligible:false,independentEvaluation:false,
  mastery:null,learningEffect:null,retentionConclusion:null,transferConclusion:null
 };
}
return Object.freeze({VERSION,summarize});
});
