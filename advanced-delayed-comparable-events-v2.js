(function(root){"use strict";

const Framework=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-framework-v2.js"):root.GoAdvancedComparableFrameworkV2;
const Immediate=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-events-v2.js"):root.GoAdvancedComparableEventsV2;
if(!Framework||!Immediate)return;

const STORAGE_KEY="go-advanced-delayed-comparable-events-v2";
const STREAM_VERSION="advanced-delayed-comparable-events-v2";
const SCHEMA_VERSION=2;
const TYPES=new Set(["delayed_presented","delayed_first","delayed_retry","delayed_completed"]);

function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){
 const raw=storage.getItem(STORAGE_KEY);if(!raw)return{ok:true,store:empty()};
 try{
  const store=JSON.parse(raw);
  if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();
  return{ok:true,store};
 }catch{return{ok:false,error:"advanced_delayed_comparable_v2_store_malformed",store:null};}
}
function validPoint(point){return Array.isArray(point)&&point.length===2&&point.every(Number.isInteger)&&point[0]>=0&&point[0]<19&&point[1]>=0&&point[1]<19;}
function validIso(value){return typeof value==="string"&&Number.isFinite(Date.parse(value));}
function delayedItem(){return Framework.delayedItems()[0]||null;}
function validate(event){
 if(!event||event.schemaVersion!==SCHEMA_VERSION||event.eventStreamVersion!==STREAM_VERSION||!TYPES.has(event.type))return"v2_delayed_event_contract_invalid";
 for(const key of ["eventId","sessionId","attemptId","familyId","familyVersion","itemId","itemVersion","anchorItemId","anchorEventId","anchorOccurredAt","dueAt","positionFingerprint","scoringContractVersion","evidenceTaxonomyVersion","retrievalPolicyVersion","kcHypothesisId","kcHypothesisVersion","occurredAt"])if(typeof event[key]!=="string"||!event[key])return"v2_delayed_event_metadata_missing";
 const item=delayedItem();
 if(!item||event.itemId!==item.itemId||event.itemVersion!==item.itemVersion||event.familyId!==item.familyId||event.familyVersion!==item.familyVersion||event.anchorItemId!==item.anchorItemId||event.positionFingerprint!==item.positionFingerprint)return"v2_delayed_event_item_identity_mismatch";
 if(event.scoringContractVersion!==item.scoringContractVersion||event.evidenceTaxonomyVersion!==item.evidenceTaxonomyVersion||event.retrievalPolicyVersion!==item.delayedPolicyVersion)return"v2_delayed_event_version_invalid";
 if(event.kcHypothesisId!==item.kcHypothesisId||event.kcHypothesisVersion!==item.kcHypothesisVersion||event.kcStatus!=="not_promoted"||event.constructValidated!==false)return"v2_delayed_event_hypothesis_invalid";
 if(event.minimumDelayMs!==Framework.MIN_DELAY_MS||!Number.isFinite(event.actualDelayMs)||event.actualDelayMs<Framework.MIN_DELAY_MS)return"v2_delayed_event_delay_invalid";
 if(!validIso(event.anchorOccurredAt)||!validIso(event.dueAt)||!validIso(event.occurredAt))return"v2_delayed_event_time_invalid";
 const anchorMs=Date.parse(event.anchorOccurredAt),dueMs=Date.parse(event.dueAt),occurredMs=Date.parse(event.occurredAt);
 if(dueMs-anchorMs!==Framework.MIN_DELAY_MS||occurredMs<dueMs||event.actualDelayMs!==occurredMs-anchorMs)return"v2_delayed_event_time_relation_invalid";
 if(event.boardSize!==19||event.publicItem!==true||event.formalEligible!==false||event.independentEvaluation!==false||event.schedulerEligible!==false||event.skillUpdateEligible!==false||event.qualifiedOpportunity!==false)return"v2_delayed_event_authority_invalid";
 if(event.transferLevel!=="T2"||event.retrievalTiming!=="delayed"||event.evidenceUse!=="advanced_comparable_v2_delayed_public_process_check"||event.evaluationContext!=="process_check")return"v2_delayed_event_taxonomy_invalid";
 if(event.type==="delayed_presented"&&(event.eligibilityDeclaredBeforeResponse!==true||event.hintAvailable!==false))return"v2_delayed_presented_invalid";
 if(["delayed_first","delayed_retry"].includes(event.type)&&(!validPoint(event.point)||typeof event.legal!=="boolean"||typeof event.correct!=="boolean"||event.hintUsed!==false))return"v2_delayed_response_invalid";
 if(event.type==="delayed_completed"&&(typeof event.firstCorrect!=="boolean"||typeof event.eventualCorrect!=="boolean"||!Number.isInteger(event.attempts)||event.attempts<1))return"v2_delayed_completed_invalid";
 return null;
}
function lifecycleError(store,event){
 const same=store.events.filter(e=>e.itemId===event.itemId),attempt=same.filter(e=>e.attemptId===event.attemptId);
 if(event.type==="delayed_presented"){
  if(same.some(e=>e.type==="delayed_presented"))return"v2_delayed_item_already_presented";
  return null;
 }
 if(!attempt.some(e=>e.type==="delayed_presented"))return"v2_delayed_response_without_presentation";
 const firsts=attempt.filter(e=>e.type==="delayed_first"),retries=attempt.filter(e=>e.type==="delayed_retry"),completions=attempt.filter(e=>e.type==="delayed_completed");
 if(event.type==="delayed_first"&&firsts.length)return"v2_delayed_multiple_first";
 if(event.type==="delayed_retry"&&!firsts.length)return"v2_delayed_retry_without_first";
 if(event.type==="delayed_completed"){
  if(!firsts.length)return"v2_delayed_completion_without_first";
  if(completions.length)return"v2_delayed_multiple_completion";
  if(event.firstCorrect!==firsts[0].correct)return"v2_delayed_completion_first_mismatch";
  if(event.attempts!==1+retries.length)return"v2_delayed_completion_attempt_count_mismatch";
 }
 if(completions.length)return"v2_delayed_event_after_completion";
 return null;
}
function append(storage,input){
 const r=read(storage);if(!r.ok)return r;
 const item=delayedItem();
 if(!item||input.itemId!==item.itemId)return{ok:false,error:"advanced_delayed_comparable_v2_item_unknown",store:r.store};
 const event={
  schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,
  familyId:item.familyId,familyVersion:item.familyVersion,itemVersion:item.itemVersion,anchorItemId:item.anchorItemId,
  positionFingerprint:item.positionFingerprint,scoringContractVersion:item.scoringContractVersion,evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,retrievalPolicyVersion:item.delayedPolicyVersion,
  kcHypothesisId:item.kcHypothesisId,kcHypothesisVersion:item.kcHypothesisVersion,kcStatus:item.kcStatus,constructValidated:false,
  boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,
  transferLevel:"T2",retrievalTiming:"delayed",evidenceUse:"advanced_comparable_v2_delayed_public_process_check",evaluationContext:"process_check"
 };
 const error=validate(event);if(error)return{ok:false,error,store:r.store};
 const life=lifecycleError(r.store,event);if(life)return{ok:false,error:life,store:r.store};
 const next={...r.store,events:[...r.store.events,event]};
 try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,store:next,event};}
 catch{return{ok:false,error:"advanced_delayed_comparable_v2_store_write_failed",store:r.store};}
}
function validateStore(store){
 if(!store||store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))return{ok:false,error:"v2_delayed_store_invalid"};
 for(const event of store.events){const error=validate(event);if(error)return{ok:false,error:"v2_delayed_event_invalid:"+error,eventId:event.eventId};}
 const p=store.events.filter(e=>e.type==="delayed_presented"),f=store.events.filter(e=>e.type==="delayed_first"),r=store.events.filter(e=>e.type==="delayed_retry"),c=store.events.filter(e=>e.type==="delayed_completed");
 if(p.length>1)return{ok:false,error:"v2_delayed_store_multiple_presentation"};
 if(!p.length&&store.events.length)return{ok:false,error:"v2_delayed_store_missing_presentation"};
 if(p.length){
  const attempt=p[0].attemptId;
  if(store.events.some(e=>e.attemptId!==attempt))return{ok:false,error:"v2_delayed_store_attempt_mismatch"};
 }
 if(f.length>1)return{ok:false,error:"v2_delayed_store_multiple_first"};
 if(r.length&&!f.length)return{ok:false,error:"v2_delayed_store_retry_without_first"};
 if(c.length>1)return{ok:false,error:"v2_delayed_store_multiple_completion"};
 if(c.length&&!f.length)return{ok:false,error:"v2_delayed_store_completion_without_first"};
 if(c.length&&c[0].firstCorrect!==f[0].correct)return{ok:false,error:"v2_delayed_store_completion_first_mismatch"};
 if(c.length&&c[0].attempts!==1+r.length)return{ok:false,error:"v2_delayed_store_completion_attempt_count_mismatch"};
 let last=-Infinity,done=false;
 for(const event of store.events){
  const t=Date.parse(event.occurredAt);if(t<last)return{ok:false,error:"v2_delayed_store_time_order_invalid"};last=t;
  if(done)return{ok:false,error:"v2_delayed_store_event_after_completion"};
  if(event.type==="delayed_completed")done=true;
 }
 return{ok:true};
}
function activeAttempt(store){
 const p=store.events.find(e=>e.type==="delayed_presented");
 if(!p||store.events.some(e=>e.type==="delayed_completed"&&e.attemptId===p.attemptId))return null;
 return{attemptId:p.attemptId,presented:p,responses:store.events.filter(e=>["delayed_first","delayed_retry"].includes(e.type)&&e.attemptId===p.attemptId)};
}

const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,validate,validateStore,activeAttempt};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedDelayedComparableEventsV2=api;
})(typeof window!=="undefined"?window:globalThis);
