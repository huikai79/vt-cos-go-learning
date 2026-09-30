(function(root){"use strict";

const Framework=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-framework-v2.js"):root.GoAdvancedComparableFrameworkV2;
if(!Framework)return;

const STORAGE_KEY="go-advanced-comparable-events-v2";
const STREAM_VERSION="advanced-comparable-events-v2";
const SCHEMA_VERSION=2;
const TYPES=new Set(["comparable_presented","comparable_first","comparable_retry","comparable_completed"]);

function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){
 const raw=storage.getItem(STORAGE_KEY);if(!raw)return{ok:true,store:empty()};
 try{
  const store=JSON.parse(raw);
  if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();
  return{ok:true,store};
 }catch{return{ok:false,error:"advanced_comparable_v2_store_malformed",store:null};}
}
function validPoint(point){return Array.isArray(point)&&point.length===2&&point.every(Number.isInteger)&&point[0]>=0&&point[0]<19&&point[1]>=0&&point[1]<19;}
function validate(event){
 if(!event||event.schemaVersion!==SCHEMA_VERSION||event.eventStreamVersion!==STREAM_VERSION||!TYPES.has(event.type))return"v2_event_contract_invalid";
 for(const key of ["eventId","sessionId","attemptId","familyId","familyVersion","itemId","itemVersion","itemRole","positionFingerprint","scoringContractVersion","evidenceTaxonomyVersion","selectionPolicyVersion","kcHypothesisId","kcHypothesisVersion","occurredAt"])if(typeof event[key]!=="string"||!event[key])return"v2_event_metadata_missing";
 const item=Framework.itemById(event.itemId);
 if(!item||item.role==="delayed_process_check")return"v2_event_item_unknown";
 if(item.itemVersion!==event.itemVersion||item.familyId!==event.familyId||item.familyVersion!==event.familyVersion||item.role!==event.itemRole||item.positionFingerprint!==event.positionFingerprint)return"v2_event_item_identity_mismatch";
 if(event.scoringContractVersion!==item.scoringContractVersion||event.evidenceTaxonomyVersion!==item.evidenceTaxonomyVersion||event.selectionPolicyVersion!==item.immediatePolicyVersion)return"v2_event_version_invalid";
 if(event.kcHypothesisId!==item.kcHypothesisId||event.kcHypothesisVersion!==item.kcHypothesisVersion||event.kcStatus!=="not_promoted"||event.constructValidated!==false)return"v2_event_hypothesis_invalid";
 if(event.boardSize!==19||event.publicItem!==true||event.formalEligible!==false||event.independentEvaluation!==false||event.schedulerEligible!==false||event.skillUpdateEligible!==false||event.qualifiedOpportunity!==false)return"v2_event_authority_invalid";
 const process=item.role==="process_check";
 if(event.transferLevel!==(process?"T2":"T0")||event.evidenceUse!==(process?"advanced_comparable_v2_public_process_check":"advanced_comparable_v2_practice")||event.evaluationContext!==(process?"process_check":"practice"))return"v2_event_taxonomy_invalid";
 if(event.type==="comparable_presented"&&(event.eligibilityDeclaredBeforeResponse!==true||event.hintAvailable!==false))return"v2_presented_invalid";
 if(["comparable_first","comparable_retry"].includes(event.type)&&(!validPoint(event.point)||typeof event.legal!=="boolean"||typeof event.correct!=="boolean"||event.hintUsed!==false))return"v2_response_invalid";
 if(event.type==="comparable_completed"&&(typeof event.firstCorrect!=="boolean"||typeof event.eventualCorrect!=="boolean"||!Number.isInteger(event.attempts)||event.attempts<1))return"v2_completed_invalid";
 return null;
}
function lifecycleError(store,event){
 const order=Framework.immediateItems();
 const itemIndex=order.findIndex(item=>item.itemId===event.itemId);
 if(itemIndex<0)return"v2_item_not_writable";
 const sameItem=store.events.filter(e=>e.itemId===event.itemId);
 const sameAttempt=sameItem.filter(e=>e.attemptId===event.attemptId);
 if(event.type==="comparable_presented"){
  if(sameItem.some(e=>e.type==="comparable_presented"))return"v2_item_already_presented";
  for(let i=0;i<itemIndex;i++)if(!store.events.some(e=>e.itemId===order[i].itemId&&e.type==="comparable_completed"))return"v2_previous_item_incomplete";
  return null;
 }
 if(!sameAttempt.some(e=>e.type==="comparable_presented"))return"v2_response_without_presentation";
 const firsts=sameAttempt.filter(e=>e.type==="comparable_first");
 const retries=sameAttempt.filter(e=>e.type==="comparable_retry");
 const completions=sameAttempt.filter(e=>e.type==="comparable_completed");
 if(event.type==="comparable_first"&&firsts.length)return"v2_multiple_first";
 if(event.type==="comparable_retry"&&!firsts.length)return"v2_retry_without_first";
 if(event.type==="comparable_completed"){
  if(!firsts.length)return"v2_completion_without_first";
  if(completions.length)return"v2_multiple_completion";
  if(event.firstCorrect!==firsts[0].correct)return"v2_completion_first_mismatch";
  if(event.attempts!==1+retries.length)return"v2_completion_attempt_count_mismatch";
 }
 if(completions.length)return"v2_event_after_completion";
 return null;
}
function append(storage,input){
 const r=read(storage);if(!r.ok)return r;
 const item=Framework.itemById(input.itemId);
 if(!item||item.role==="delayed_process_check")return{ok:false,error:"advanced_comparable_v2_item_unknown",store:r.store};
 const event={
  schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,
  familyId:item.familyId,familyVersion:item.familyVersion,itemRole:item.role,
  positionFingerprint:item.positionFingerprint,scoringContractVersion:item.scoringContractVersion,
  evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,selectionPolicyVersion:item.immediatePolicyVersion,
  kcHypothesisId:item.kcHypothesisId,kcHypothesisVersion:item.kcHypothesisVersion,kcStatus:item.kcStatus,constructValidated:false,
  boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,
  transferLevel:item.role==="process_check"?"T2":"T0",
  evidenceUse:item.role==="process_check"?"advanced_comparable_v2_public_process_check":"advanced_comparable_v2_practice",
  evaluationContext:item.role==="process_check"?"process_check":"practice"
 };
 const error=validate(event);if(error)return{ok:false,error,store:r.store};
 const life=lifecycleError(r.store,event);if(life)return{ok:false,error:life,store:r.store};
 const next={...r.store,events:[...r.store.events,event]};
 try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,store:next,event};}
 catch{return{ok:false,error:"advanced_comparable_v2_store_write_failed",store:r.store};}
}
function validateStore(store){
 if(!store||store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))return{ok:false,error:"v2_store_invalid"};
 let gap=false;
 for(const item of Framework.immediateItems()){
  const events=store.events.filter(e=>e.itemId===item.itemId);
  if(!events.length){gap=true;continue;}
  if(gap)return{ok:false,error:"v2_store_order_skipped_item",itemId:item.itemId};
  for(const event of events){const error=validate(event);if(error)return{ok:false,error:"v2_event_invalid:"+error,eventId:event.eventId};}
  const p=events.filter(e=>e.type==="comparable_presented"),f=events.filter(e=>e.type==="comparable_first"),r=events.filter(e=>e.type==="comparable_retry"),c=events.filter(e=>e.type==="comparable_completed");
  if(p.length!==1)return{ok:false,error:"v2_store_presentation_count_invalid",itemId:item.itemId};
  const attempt=p[0].attemptId;if(events.some(e=>e.attemptId!==attempt))return{ok:false,error:"v2_store_attempt_mismatch",itemId:item.itemId};
  if(f.length>1)return{ok:false,error:"v2_store_multiple_first",itemId:item.itemId};
  if(r.length&&!f.length)return{ok:false,error:"v2_store_retry_without_first",itemId:item.itemId};
  if(c.length>1)return{ok:false,error:"v2_store_multiple_completion",itemId:item.itemId};
  if(c.length&&!f.length)return{ok:false,error:"v2_store_completion_without_first",itemId:item.itemId};
  if(c.length&&c[0].firstCorrect!==f[0].correct)return{ok:false,error:"v2_store_completion_first_mismatch",itemId:item.itemId};
  if(c.length&&c[0].attempts!==1+r.length)return{ok:false,error:"v2_store_completion_attempt_count_mismatch",itemId:item.itemId};
 }
 return{ok:true};
}
function eventsForItem(store,itemId){return((store&&store.events)||[]).filter(e=>e.itemId===itemId);}
function completedItemIds(store){return new Set(((store&&store.events)||[]).filter(e=>e.type==="comparable_completed").map(e=>e.itemId));}
function nextItem(store){const done=completedItemIds(store);return Framework.immediateItems().find(item=>!done.has(item.itemId))||null;}
function activeAttempt(store,itemId){
 const events=eventsForItem(store,itemId),presented=events.find(e=>e.type==="comparable_presented");
 if(!presented||events.some(e=>e.type==="comparable_completed"&&e.attemptId===presented.attemptId))return null;
 return{attemptId:presented.attemptId,presented,responses:events.filter(e=>["comparable_first","comparable_retry"].includes(e.type)&&e.attemptId===presented.attemptId)};
}

const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,validate,validateStore,eventsForItem,completedItemIds,nextItem,activeAttempt};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedComparableEventsV2=api;
})(typeof window!=="undefined"?window:globalThis);
