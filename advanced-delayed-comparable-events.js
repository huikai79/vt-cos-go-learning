(function(root){"use strict";

const Contract=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-delayed-comparable-contract.js"):root.GoAdvancedDelayedComparableContract;
if(!Contract)return;

const STORAGE_KEY="go-advanced-delayed-comparable-events-v1";
const STREAM_VERSION="advanced-delayed-comparable-events-v1";
const SCHEMA_VERSION=1;
const TYPES=new Set(["delayed_presented","delayed_first","delayed_retry","delayed_completed"]);

function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){
 const raw=storage.getItem(STORAGE_KEY);if(!raw)return{ok:true,store:empty()};
 try{
  const store=JSON.parse(raw);
  if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();
  return{ok:true,store};
 }catch{return{ok:false,error:"advanced_delayed_comparable_store_malformed",store:null};}
}
function validPoint(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<19&&p[1]>=0&&p[1]<19;}
function validIso(value){return typeof value==="string"&&Number.isFinite(Date.parse(value));}
function validate(event){
 if(!event||event.schemaVersion!==SCHEMA_VERSION||event.eventStreamVersion!==STREAM_VERSION||!TYPES.has(event.type))return"delayed_event_contract_invalid";
 for(const key of ["eventId","sessionId","attemptId","itemId","itemVersion","pairId","pairVersion","pairHypothesisVersion","anchorItemId","anchorEventId","anchorOccurredAt","dueAt","positionFingerprint","kcHypothesisId","kcHypothesisVersion","scoringContractVersion","evidenceTaxonomyVersion","retrievalPolicyVersion","occurredAt"])if(typeof event[key]!=="string"||!event[key])return"delayed_event_metadata_missing";
 const item=Contract.itemById(event.itemId);
 if(!item||item.itemVersion!==event.itemVersion||item.pairId!==event.pairId||item.pairVersion!==event.pairVersion||item.pairHypothesisVersion!==event.pairHypothesisVersion||item.anchorItemId!==event.anchorItemId||item.positionFingerprint!==event.positionFingerprint)return"delayed_event_item_identity_mismatch";
 if(event.kcHypothesisId!==item.kcHypothesisId||event.kcHypothesisVersion!==item.kcHypothesisVersion||event.constructValidated!==false)return"delayed_event_kc_hypothesis_invalid";
 if(event.scoringContractVersion!==item.scoringContractVersion||event.evidenceTaxonomyVersion!==item.evidenceTaxonomyVersion||event.retrievalPolicyVersion!==Contract.RETRIEVAL_POLICY_VERSION)return"delayed_event_version_invalid";
 if(event.minimumDelayMs!==Contract.MIN_DELAY_MS||!Number.isFinite(event.actualDelayMs)||event.actualDelayMs<Contract.MIN_DELAY_MS)return"delayed_event_delay_invalid";
 if(!validIso(event.anchorOccurredAt)||!validIso(event.dueAt)||!validIso(event.occurredAt))return"delayed_event_time_invalid";
 const anchorMs=Date.parse(event.anchorOccurredAt),dueMs=Date.parse(event.dueAt),occurredMs=Date.parse(event.occurredAt);
 if(dueMs-anchorMs!==Contract.MIN_DELAY_MS||occurredMs<dueMs||event.actualDelayMs!==occurredMs-anchorMs)return"delayed_event_time_relation_invalid";
 if(event.boardSize!==19||event.publicItem!==true||event.formalEligible!==false||event.independentEvaluation!==false||event.schedulerEligible!==false||event.skillUpdateEligible!==false||event.qualifiedOpportunity!==false)return"delayed_event_authority_invalid";
 if(event.transferLevel!=="T2"||event.retrievalTiming!=="delayed"||event.evidenceUse!=="advanced_delayed_comparable_public_process_check"||event.evaluationContext!=="process_check")return"delayed_event_taxonomy_invalid";
 if(event.type==="delayed_presented"){
  if(event.eligibilityDeclaredBeforeResponse!==true||event.hintAvailable!==false)return"delayed_presented_invalid";
 }
 if(["delayed_first","delayed_retry"].includes(event.type)){
  if(!validPoint(event.point)||typeof event.legal!=="boolean"||typeof event.correct!=="boolean"||event.hintUsed!==false)return"delayed_response_invalid";
 }
 if(event.type==="delayed_completed"){
  if(typeof event.firstCorrect!=="boolean"||typeof event.eventualCorrect!=="boolean"||!Number.isInteger(event.attempts)||event.attempts<1)return"delayed_completed_invalid";
 }
 return null;
}
function lifecycleError(store,event){
 const sameItem=store.events.filter(e=>e.itemId===event.itemId);
 const sameAttempt=sameItem.filter(e=>e.attemptId===event.attemptId);
 const presentations=sameItem.filter(e=>e.type==="delayed_presented");
 const firsts=sameAttempt.filter(e=>e.type==="delayed_first");
 const retries=sameAttempt.filter(e=>e.type==="delayed_retry");
 const completions=sameAttempt.filter(e=>e.type==="delayed_completed");
 if(event.type==="delayed_presented"){
  if(presentations.length)return"delayed_item_already_presented";
  const itemIndex=Contract.items.findIndex(item=>item.itemId===event.itemId);
  for(let index=0;index<itemIndex;index++){
   const previousId=Contract.items[index].itemId;
   const previousCompleted=store.events.some(e=>e.itemId===previousId&&e.type==="delayed_completed");
   if(!previousCompleted)return"delayed_previous_item_incomplete";
  }
  return null;
 }
 if(!sameAttempt.some(e=>e.type==="delayed_presented"))return"delayed_response_without_presentation";
 if(event.type==="delayed_first"&&firsts.length)return"delayed_multiple_first_responses";
 if(event.type==="delayed_retry"&&!firsts.length)return"delayed_retry_without_first";
 if(event.type==="delayed_completed"){
  if(!firsts.length)return"delayed_completion_without_first";
  if(completions.length)return"delayed_multiple_completions";
  if(event.firstCorrect!==firsts[0].correct)return"delayed_completion_first_mismatch";
  if(event.attempts!==1+retries.length)return"delayed_completion_attempt_count_mismatch";
 }
 return null;
}
function append(storage,input){
 const r=read(storage);if(!r.ok)return r;
 const item=Contract.itemById(input.itemId);
 if(!item)return{ok:false,error:"advanced_delayed_comparable_item_unknown",store:r.store};
 const event={
  schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,
  boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,
  constructValidated:false,transferLevel:"T2",retrievalTiming:"delayed",
  evidenceUse:"advanced_delayed_comparable_public_process_check",evaluationContext:"process_check"
 };
 const error=validate(event);if(error)return{ok:false,error,store:r.store};
 const lifecycle=lifecycleError(r.store,event);if(lifecycle)return{ok:false,error:lifecycle,store:r.store};
 const next={...r.store,events:[...r.store.events,event]};
 try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,store:next,event};}
 catch{return{ok:false,error:"advanced_delayed_comparable_store_write_failed",store:r.store};}
}
function validateStore(store){
 if(!store||store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))return{ok:false,error:"delayed_store_invalid"};
 for(const event of store.events){
  const error=validate(event);if(error)return{ok:false,error:"event_invalid:"+error,eventId:event&&event.eventId||null};
 }
 let seenDelayedGap=false;
 for(const item of Contract.items){
  const events=store.events.filter(event=>event.itemId===item.itemId);
  if(!events.length){seenDelayedGap=true;continue;}
  if(seenDelayedGap)return{ok:false,error:"delayed_store_presentation_order_skipped_item",itemId:item.itemId};
  const presentations=events.filter(event=>event.type==="delayed_presented");
  const firsts=events.filter(event=>event.type==="delayed_first");
  const retries=events.filter(event=>event.type==="delayed_retry");
  const completions=events.filter(event=>event.type==="delayed_completed");
  if(presentations.length!==1)return{ok:false,error:"delayed_store_presentation_count_invalid",itemId:item.itemId};
  const attemptId=presentations[0].attemptId;
  if(events.some(event=>event.attemptId!==attemptId))return{ok:false,error:"delayed_store_attempt_mismatch",itemId:item.itemId};
  if(firsts.length>1)return{ok:false,error:"delayed_store_multiple_first",itemId:item.itemId};
  if(completions.length>1)return{ok:false,error:"delayed_store_multiple_completion",itemId:item.itemId};
  if(retries.length&&firsts.length===0)return{ok:false,error:"delayed_store_retry_without_first",itemId:item.itemId};
  if(completions.length&&firsts.length===0)return{ok:false,error:"delayed_store_completion_without_first",itemId:item.itemId};
  if(completions.length&&completions[0].firstCorrect!==firsts[0].correct)return{ok:false,error:"delayed_store_completion_first_mismatch",itemId:item.itemId};
  if(completions.length&&completions[0].attempts!==1+retries.length)return{ok:false,error:"delayed_store_completion_attempt_count_mismatch",itemId:item.itemId};
  const order={delayed_presented:0,delayed_first:1,delayed_retry:2,delayed_completed:3};
  let lastTime=-Infinity,seenFirst=false,seenCompleted=false;
  for(const event of events){
   const time=Date.parse(event.occurredAt);
   if(time<lastTime)return{ok:false,error:"delayed_store_time_order_invalid",itemId:item.itemId};
   lastTime=time;
   if(event.type==="delayed_first"){if(seenFirst)return{ok:false,error:"delayed_store_multiple_first",itemId:item.itemId};seenFirst=true;}
   if(event.type==="delayed_retry"&&!seenFirst)return{ok:false,error:"delayed_store_retry_before_first",itemId:item.itemId};
   if(event.type==="delayed_completed"){if(seenCompleted)return{ok:false,error:"delayed_store_multiple_completion",itemId:item.itemId};seenCompleted=true;}
   if(seenCompleted&&event.type!=="delayed_completed")return{ok:false,error:"delayed_store_event_after_completion",itemId:item.itemId};
  }
 }
 return{ok:true};
}
function eventsForItem(store,itemId){return((store&&store.events)||[]).filter(event=>event.itemId===itemId);}
function completedItemIds(store){return new Set(((store&&store.events)||[]).filter(e=>e.type==="delayed_completed").map(e=>e.itemId));}
function activeAttempt(store,itemId){
 const events=eventsForItem(store,itemId);
 const presented=events.find(e=>e.type==="delayed_presented");
 if(!presented)return null;
 const completed=events.find(e=>e.type==="delayed_completed"&&e.attemptId===presented.attemptId);
 if(completed)return null;
 return{
  attemptId:presented.attemptId,
  presented,
  responses:events.filter(e=>["delayed_first","delayed_retry"].includes(e.type)&&e.attemptId===presented.attemptId)
 };
}

const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,validate,validateStore,eventsForItem,completedItemIds,activeAttempt};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedDelayedComparableEvents=api;
})(typeof window!=="undefined"?window:globalThis);
