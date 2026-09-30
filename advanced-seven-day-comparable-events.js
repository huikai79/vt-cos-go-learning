(function(root){"use strict";
const Contract=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-seven-day-comparable-contract.js"):root.GoAdvancedSevenDayComparableContract;
if(!Contract)return;
const STORAGE_KEY="go-advanced-seven-day-comparable-events-v1",STREAM_VERSION="advanced-seven-day-comparable-events-v1",SCHEMA_VERSION=1;
const TYPES=new Set(["seven_day_presented","seven_day_first","seven_day_retry","seven_day_completed"]);
function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){let raw;try{raw=storage.getItem(STORAGE_KEY);}catch(error){return{ok:false,error:"seven_day_store_unreadable",detail:error&&error.message||"unknown",store:null};}if(raw===null)return{ok:true,store:empty()};try{const store=JSON.parse(raw);if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();return{ok:true,store};}catch{return{ok:false,error:"seven_day_store_malformed",store:null};}}
function point(value){return Array.isArray(value)&&value.length===2&&value.every(Number.isInteger)&&value[0]>=0&&value[0]<19&&value[1]>=0&&value[1]<19;}
function validIso(value){return typeof value==="string"&&Number.isFinite(Date.parse(value));}
function validate(event){
 const item=Contract.item;
 if(!event||event.schemaVersion!==SCHEMA_VERSION||event.eventStreamVersion!==STREAM_VERSION||!TYPES.has(event.type))return"seven_day_event_contract_invalid";
 for(const key of ["eventId","sessionId","attemptId","itemId","itemVersion","familyId","familyVersion","anchorItemId","anchorEventId","anchorOccurredAt","dueAt","positionFingerprint","scoringContractVersion","evidenceTaxonomyVersion","retrievalPolicyVersion","kcHypothesisId","kcHypothesisVersion","occurredAt"])if(typeof event[key]!=="string"||!event[key])return"seven_day_event_metadata_missing";
 if(event.itemId!==item.itemId||event.itemVersion!==item.itemVersion||event.familyId!==item.familyId||event.familyVersion!==item.familyVersion||event.anchorItemId!==item.anchorItemId||event.positionFingerprint!==item.positionFingerprint)return"seven_day_event_item_identity_mismatch";
 if(event.scoringContractVersion!==item.scoringContractVersion||event.evidenceTaxonomyVersion!==item.evidenceTaxonomyVersion||event.retrievalPolicyVersion!==item.retrievalPolicyVersion)return"seven_day_event_version_invalid";
 if(event.kcHypothesisId!==item.kcHypothesisId||event.kcHypothesisVersion!==item.kcHypothesisVersion||event.kcStatus!=="not_promoted"||event.constructValidated!==false)return"seven_day_event_hypothesis_invalid";
 if(event.minimumDelayMs!==Contract.MIN_DELAY_MS||!Number.isFinite(event.actualDelayMs)||event.actualDelayMs<Contract.MIN_DELAY_MS)return"seven_day_event_delay_invalid";
 if(!validIso(event.anchorOccurredAt)||!validIso(event.dueAt)||!validIso(event.occurredAt))return"seven_day_event_time_invalid";
 const anchorMs=Date.parse(event.anchorOccurredAt),dueMs=Date.parse(event.dueAt),occurredMs=Date.parse(event.occurredAt);
 if(dueMs-anchorMs!==Contract.MIN_DELAY_MS||occurredMs<dueMs||event.actualDelayMs!==occurredMs-anchorMs)return"seven_day_event_time_relation_invalid";
 if(event.boardSize!==19||event.publicItem!==true||event.formalEligible!==false||event.independentEvaluation!==false||event.schedulerEligible!==false||event.skillUpdateEligible!==false||event.qualifiedOpportunity!==false)return"seven_day_event_authority_invalid";
 if(event.transferLevel!=="T2"||event.retrievalTiming!=="delayed_7d"||event.evidenceUse!=="advanced_seven_day_public_process_check"||event.evaluationContext!=="process_check")return"seven_day_event_taxonomy_invalid";
 if(event.type==="seven_day_presented"&&(event.eligibilityDeclaredBeforeResponse!==true||event.hintAvailable!==false))return"seven_day_presented_invalid";
 if(["seven_day_first","seven_day_retry"].includes(event.type)&&(!point(event.point)||typeof event.legal!=="boolean"||typeof event.correct!=="boolean"||event.hintUsed!==false))return"seven_day_response_invalid";
 if(event.type==="seven_day_completed"&&(typeof event.firstCorrect!=="boolean"||event.eventualCorrect!==true||!Number.isInteger(event.attempts)||event.attempts<1))return"seven_day_completed_invalid";
 return null;
}
function lifecycleError(store,event){
 const p=store.events.filter(e=>e.type==="seven_day_presented"),f=store.events.filter(e=>e.type==="seven_day_first"),r=store.events.filter(e=>e.type==="seven_day_retry"),c=store.events.filter(e=>e.type==="seven_day_completed");
 if(event.type==="seven_day_presented")return p.length?"seven_day_already_presented":null;
 if(!p.length||p[0].attemptId!==event.attemptId)return"seven_day_response_without_presentation";
 if(c.length)return"seven_day_event_after_completion";
 if(event.type==="seven_day_first"&&f.length)return"seven_day_multiple_first";
 if(event.type==="seven_day_retry"&&!f.length)return"seven_day_retry_without_first";
 if(event.type==="seven_day_completed"){
  if(!f.length)return"seven_day_completion_without_first";
  if(event.firstCorrect!==f[0].correct)return"seven_day_completion_first_mismatch";
  if(event.attempts!==1+r.length)return"seven_day_completion_attempt_count_mismatch";
 }
 return null;
}
function append(storage,input){
 const current=read(storage);if(!current.ok)return current;const item=Contract.item;
 const event={schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,itemVersion:item.itemVersion,familyId:item.familyId,familyVersion:item.familyVersion,anchorItemId:item.anchorItemId,positionFingerprint:item.positionFingerprint,scoringContractVersion:item.scoringContractVersion,evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,retrievalPolicyVersion:item.retrievalPolicyVersion,kcHypothesisId:item.kcHypothesisId,kcHypothesisVersion:item.kcHypothesisVersion,kcStatus:item.kcStatus,constructValidated:false,boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,transferLevel:"T2",retrievalTiming:"delayed_7d",evidenceUse:"advanced_seven_day_public_process_check",evaluationContext:"process_check"};
 const error=validate(event);if(error)return{ok:false,error,store:current.store};const life=lifecycleError(current.store,event);if(life)return{ok:false,error:life,store:current.store};
 const next={...current.store,events:[...current.store.events,event]};try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,event,store:next};}catch(error){return{ok:false,error:"seven_day_store_write_failed",detail:error&&error.message||"unknown",store:current.store};}
}
function validateStore(store){
 if(!store||store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))return{ok:false,error:"seven_day_store_invalid"};
 for(const event of store.events){const error=validate(event);if(error)return{ok:false,error:"seven_day_event_invalid:"+error,eventId:event.eventId};}
 const p=store.events.filter(e=>e.type==="seven_day_presented"),f=store.events.filter(e=>e.type==="seven_day_first"),r=store.events.filter(e=>e.type==="seven_day_retry"),c=store.events.filter(e=>e.type==="seven_day_completed");
 if(p.length>1||f.length>1||c.length>1)return{ok:false,error:"seven_day_store_lifecycle_count_invalid"};
 if(!p.length&&store.events.length)return{ok:false,error:"seven_day_store_missing_presentation"};
 if(p.length&&store.events.some(e=>e.attemptId!==p[0].attemptId))return{ok:false,error:"seven_day_store_attempt_mismatch"};
 if(r.length&&!f.length)return{ok:false,error:"seven_day_store_retry_without_first"};
 if(c.length&&!f.length)return{ok:false,error:"seven_day_store_completion_without_first"};
 if(c.length&&c[0].firstCorrect!==f[0].correct)return{ok:false,error:"seven_day_store_completion_first_mismatch"};
 if(c.length&&c[0].attempts!==1+r.length)return{ok:false,error:"seven_day_store_completion_attempt_count_mismatch"};
 let last=-Infinity,done=false;for(const event of store.events){const t=Date.parse(event.occurredAt);if(t<last)return{ok:false,error:"seven_day_store_time_order_invalid"};last=t;if(done)return{ok:false,error:"seven_day_store_event_after_completion"};if(event.type==="seven_day_completed")done=true;}
 return{ok:true};
}
function activeAttempt(store){const p=store.events.find(e=>e.type==="seven_day_presented");if(!p||store.events.some(e=>e.type==="seven_day_completed"))return null;return{attemptId:p.attemptId,presented:p,responses:store.events.filter(e=>["seven_day_first","seven_day_retry"].includes(e.type))};}
const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,validate,validateStore,activeAttempt};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedSevenDayComparableEvents=api;
})(typeof window!=="undefined"?window:globalThis);
