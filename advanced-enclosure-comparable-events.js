(function(root){"use strict";

const Contract=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-enclosure-comparable-contract.js"):root.GoAdvancedEnclosureComparableContract;
if(!Contract)return;

const STORAGE_KEY="go-advanced-enclosure-comparable-events-v1";
const STREAM_VERSION="advanced-enclosure-comparable-events-v1";
const SCHEMA_VERSION=1;
const TYPES=new Set(["enclosure_presented","enclosure_decision_presented","enclosure_move_first","enclosure_move_retry","enclosure_opponent_move","enclosure_completed"]);

function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){
 let raw;
 try{raw=storage.getItem(STORAGE_KEY);}catch(error){return{ok:false,error:"enclosure_store_unreadable",detail:error&&error.message||"unknown",store:null};}
 if(raw===null)return{ok:true,store:empty()};
 try{
  const store=JSON.parse(raw);
  if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();
  return{ok:true,store};
 }catch{return{ok:false,error:"enclosure_store_malformed",store:null};}
}
function point(value){return Array.isArray(value)&&value.length===2&&value.every(Number.isInteger)&&value[0]>=0&&value[0]<19&&value[1]>=0&&value[1]<19;}
function validIso(value){return typeof value==="string"&&Number.isFinite(Date.parse(value));}
function roleMeta(item){
 if(item.role==="practice")return{transferLevel:"T0",evaluationContext:"practice",evidenceUse:"advanced_enclosure_practice",retrievalTiming:"immediate"};
 if(item.role==="process_check")return{transferLevel:"T2",evaluationContext:"process_check",evidenceUse:"advanced_enclosure_public_process_check",retrievalTiming:"immediate"};
 if(item.role==="delayed_24h_process_check")return{transferLevel:"T2",evaluationContext:"process_check",evidenceUse:"advanced_enclosure_delayed_public_process_check",retrievalTiming:"delayed_24h"};
 return{transferLevel:"T2",evaluationContext:"process_check",evidenceUse:"advanced_enclosure_delayed_public_process_check",retrievalTiming:"delayed_7d"};
}
function validateTiming(event,item){
 if(item.minimumDelayMs===0){
  if(event.anchorEventId!==null||event.anchorOccurredAt!==null||event.dueAt!==null||event.actualDelayMs!==0)return"enclosure_immediate_timing_invalid";
  return null;
 }
 if(typeof event.anchorEventId!=="string"||!event.anchorEventId||!validIso(event.anchorOccurredAt)||!validIso(event.dueAt)||!Number.isFinite(event.actualDelayMs))return"enclosure_delayed_timing_metadata_invalid";
 const anchorMs=Date.parse(event.anchorOccurredAt),dueMs=Date.parse(event.dueAt),occurredMs=Date.parse(event.occurredAt);
 if(dueMs-anchorMs!==item.minimumDelayMs||occurredMs<dueMs||event.actualDelayMs!==occurredMs-anchorMs)return"enclosure_delayed_time_relation_invalid";
 return null;
}
function validate(event){
 if(!event||event.schemaVersion!==SCHEMA_VERSION||event.eventStreamVersion!==STREAM_VERSION||!TYPES.has(event.type))return"enclosure_event_contract_invalid";
 for(const key of ["eventId","sessionId","presentationId","itemId","itemVersion","familyId","familyVersion","scoringContractVersion","evidenceTaxonomyVersion","presentationPolicyVersion","kcHypothesisId","kcHypothesisVersion","occurredAt"])if(typeof event[key]!=="string"||!event[key])return"enclosure_event_metadata_missing";
 if(!validIso(event.occurredAt))return"enclosure_event_time_invalid";
 const item=Contract.itemById(event.itemId);if(!item)return"enclosure_event_item_unknown";
 if(event.itemVersion!==item.itemVersion||event.familyId!==item.familyId||event.familyVersion!==item.familyVersion||event.scoringContractVersion!==item.scoringContractVersion||event.evidenceTaxonomyVersion!==item.evidenceTaxonomyVersion||event.presentationPolicyVersion!==item.presentationPolicyVersion)return"enclosure_event_version_invalid";
 if(event.kcHypothesisId!==item.kcHypothesisId||event.kcHypothesisVersion!==item.kcHypothesisVersion||event.kcStatus!=="not_promoted"||event.constructValidated!==false)return"enclosure_event_hypothesis_invalid";
 if(event.boardSize!==19||event.publicItem!==true||event.formalEligible!==false||event.independentEvaluation!==false||event.schedulerEligible!==false||event.skillUpdateEligible!==false||event.qualifiedOpportunity!==false)return"enclosure_event_authority_invalid";
 const meta=roleMeta(item);
 if(event.transferLevel!==meta.transferLevel||event.evaluationContext!==meta.evaluationContext||event.evidenceUse!==meta.evidenceUse||event.retrievalTiming!==meta.retrievalTiming)return"enclosure_event_taxonomy_invalid";
 const timingError=validateTiming(event,item);if(timingError)return timingError;
 const decisionTypes=new Set(["enclosure_decision_presented","enclosure_move_first","enclosure_move_retry"]);
 if(decisionTypes.has(event.type)){
  if(!Number.isInteger(event.decisionIndex)||event.decisionIndex<0||event.decisionIndex>1)return"enclosure_decision_index_invalid";
 }else if(event.type==="enclosure_opponent_move"){
  if(event.decisionIndex!==0)return"enclosure_opponent_decision_invalid";
 }else if(event.decisionIndex!==null)return"enclosure_nondecision_index_invalid";
 if(["enclosure_move_first","enclosure_move_retry","enclosure_opponent_move"].includes(event.type)&&!point(event.point))return"enclosure_move_point_invalid";
 if(!["enclosure_move_first","enclosure_move_retry","enclosure_opponent_move"].includes(event.type)&&event.point!==null)return"enclosure_nonmove_point_invalid";
 if(["enclosure_move_first","enclosure_move_retry"].includes(event.type)){
  if(typeof event.legal!=="boolean"||typeof event.correct!=="boolean"||event.hintUsed!==false)return"enclosure_response_invalid";
 }else if(event.legal!==null||event.correct!==null)return"enclosure_nonresponse_result_invalid";
 if(event.type==="enclosure_presented"&&(event.eligibilityDeclaredBeforeResponse!==true||event.hintAvailable!==false))return"enclosure_presented_invalid";
 if(event.type==="enclosure_opponent_move"&&event.forced!==true)return"enclosure_opponent_move_not_forced";
 if(event.type==="enclosure_completed"){
  if(!Array.isArray(event.decisionFirstCorrect)||event.decisionFirstCorrect.length!==2||event.decisionFirstCorrect.some(v=>typeof v!=="boolean"))return"enclosure_completion_first_results_invalid";
  if(!Array.isArray(event.decisionAttempts)||event.decisionAttempts.length!==2||event.decisionAttempts.some(v=>!Number.isInteger(v)||v<1))return"enclosure_completion_attempts_invalid";
  if(event.eventualCorrect!==true)return"enclosure_completion_result_invalid";
 }
 return null;
}
function itemEvents(store,itemId){return store.events.filter(event=>event.itemId===itemId);}
function lifecycleError(store,event){
 const order=Contract.orderedItems(),index=order.findIndex(item=>item.itemId===event.itemId);
 if(index<0)return"enclosure_item_not_writable";
 const same=itemEvents(store,event.itemId),presentation=same.find(e=>e.type==="enclosure_presented");
 if(event.type==="enclosure_presented"){
  if(presentation)return"enclosure_item_already_presented";
  for(let i=0;i<index;i++)if(!store.events.some(e=>e.itemId===order[i].itemId&&e.type==="enclosure_completed"))return"enclosure_previous_item_incomplete";
  return null;
 }
 if(!presentation||presentation.presentationId!==event.presentationId)return"enclosure_event_without_presentation";
 if(same.some(e=>e.type==="enclosure_completed"))return"enclosure_event_after_completion";
 const decisionEvents=(d)=>same.filter(e=>e.decisionIndex===d);
 const firsts=(d)=>decisionEvents(d).filter(e=>e.type==="enclosure_move_first");
 const retries=(d)=>decisionEvents(d).filter(e=>e.type==="enclosure_move_retry");
 const shown=(d)=>decisionEvents(d).filter(e=>e.type==="enclosure_decision_presented");
 if(event.type==="enclosure_decision_presented"){
  if(shown(event.decisionIndex).length)return"enclosure_decision_already_presented";
  if(event.decisionIndex===1&&!same.some(e=>e.type==="enclosure_opponent_move"))return"enclosure_second_decision_before_forced_move";
  return null;
 }
 if(["enclosure_move_first","enclosure_move_retry"].includes(event.type)){
  if(!shown(event.decisionIndex).length)return"enclosure_response_before_decision_presentation";
  if(event.type==="enclosure_move_first"&&firsts(event.decisionIndex).length)return"enclosure_multiple_first";
  if(event.type==="enclosure_move_retry"&&!firsts(event.decisionIndex).length)return"enclosure_retry_without_first";
  return null;
 }
 if(event.type==="enclosure_opponent_move"){
  if(!firsts(0).length)return"enclosure_opponent_before_first";
  const firstDecisionMoves=decisionEvents(0).filter(e=>["enclosure_move_first","enclosure_move_retry"].includes(e.type));
  if(!firstDecisionMoves.some(e=>e.correct))return"enclosure_opponent_before_correct_cut";
  if(same.some(e=>e.type==="enclosure_opponent_move"))return"enclosure_multiple_opponent_moves";
  return null;
 }
 if(event.type==="enclosure_completed"){
  if(!firsts(0).length||!firsts(1).length)return"enclosure_completion_missing_first";
  if(!decisionEvents(0).some(e=>["enclosure_move_first","enclosure_move_retry"].includes(e.type)&&e.correct))return"enclosure_completion_cut_not_correct";
  if(!decisionEvents(1).some(e=>["enclosure_move_first","enclosure_move_retry"].includes(e.type)&&e.correct))return"enclosure_completion_finish_not_correct";
  if(event.decisionFirstCorrect[0]!==firsts(0)[0].correct||event.decisionFirstCorrect[1]!==firsts(1)[0].correct)return"enclosure_completion_first_mismatch";
  if(event.decisionAttempts[0]!==1+retries(0).length||event.decisionAttempts[1]!==1+retries(1).length)return"enclosure_completion_attempt_count_mismatch";
 }
 return null;
}
function append(storage,input){
 const current=read(storage);if(!current.ok)return current;
 const item=Contract.itemById(input.itemId);if(!item)return{ok:false,error:"enclosure_item_unknown",store:current.store};
 const meta=roleMeta(item);
 const event={
  schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,
  itemVersion:item.itemVersion,familyId:item.familyId,familyVersion:item.familyVersion,scoringContractVersion:item.scoringContractVersion,evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,presentationPolicyVersion:item.presentationPolicyVersion,
  kcHypothesisId:item.kcHypothesisId,kcHypothesisVersion:item.kcHypothesisVersion,kcStatus:item.kcStatus,constructValidated:false,
  boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,
  transferLevel:meta.transferLevel,evaluationContext:meta.evaluationContext,evidenceUse:meta.evidenceUse,retrievalTiming:meta.retrievalTiming
 };
 const error=validate(event);if(error)return{ok:false,error,store:current.store};
 const life=lifecycleError(current.store,event);if(life)return{ok:false,error:life,store:current.store};
 const next={...current.store,events:[...current.store.events,event]};
 try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,event,store:next};}
 catch(error){return{ok:false,error:"enclosure_store_write_failed",detail:error&&error.message||"unknown",store:current.store};}
}
function validateStore(store){
 if(!store||store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))return{ok:false,error:"enclosure_store_invalid"};
 let gap=false;
 for(const item of Contract.orderedItems()){
  const events=itemEvents(store,item.itemId);
  if(!events.length){gap=true;continue;}
  if(gap)return{ok:false,error:"enclosure_store_order_skipped_item",itemId:item.itemId};
  for(const event of events){const err=validate(event);if(err)return{ok:false,error:"enclosure_event_invalid:"+err,eventId:event.eventId};}
  const presentations=events.filter(e=>e.type==="enclosure_presented");
  if(presentations.length!==1)return{ok:false,error:"enclosure_store_presentation_count_invalid",itemId:item.itemId};
  const pid=presentations[0].presentationId;if(events.some(e=>e.presentationId!==pid))return{ok:false,error:"enclosure_store_presentation_id_mismatch",itemId:item.itemId};
  for(const d of [0,1]){
   const shown=events.filter(e=>e.type==="enclosure_decision_presented"&&e.decisionIndex===d);
   const first=events.filter(e=>e.type==="enclosure_move_first"&&e.decisionIndex===d);
   const retries=events.filter(e=>e.type==="enclosure_move_retry"&&e.decisionIndex===d);
   if(shown.length>1||first.length>1)return{ok:false,error:"enclosure_store_decision_lifecycle_invalid",itemId:item.itemId};
   if(retries.length&&!first.length)return{ok:false,error:"enclosure_store_retry_without_first",itemId:item.itemId};
  }
  const opponent=events.filter(e=>e.type==="enclosure_opponent_move");
  const completed=events.filter(e=>e.type==="enclosure_completed");
  if(opponent.length>1)return{ok:false,error:"enclosure_store_multiple_opponent_moves",itemId:item.itemId};
  if(completed.length>1)return{ok:false,error:"enclosure_store_multiple_completion",itemId:item.itemId};
  const first0=events.find(e=>e.type==="enclosure_move_first"&&e.decisionIndex===0);
  const first1=events.find(e=>e.type==="enclosure_move_first"&&e.decisionIndex===1);
  const retry0=events.filter(e=>e.type==="enclosure_move_retry"&&e.decisionIndex===0);
  const retry1=events.filter(e=>e.type==="enclosure_move_retry"&&e.decisionIndex===1);
  const shown0=events.filter(e=>e.type==="enclosure_decision_presented"&&e.decisionIndex===0);
  const shown1=events.filter(e=>e.type==="enclosure_decision_presented"&&e.decisionIndex===1);
  if((first0||retry0.length||opponent.length||shown1.length||first1||retry1.length||completed.length)&&shown0.length!==1)return{ok:false,error:"enclosure_store_first_decision_presentation_invalid",itemId:item.itemId};
  if(retry0.length&&!first0)return{ok:false,error:"enclosure_store_retry0_without_first",itemId:item.itemId};
  const cutCorrect=events.some(e=>["enclosure_move_first","enclosure_move_retry"].includes(e.type)&&e.decisionIndex===0&&e.correct===true);
  if(opponent.length&&!cutCorrect)return{ok:false,error:"enclosure_store_opponent_before_correct_cut",itemId:item.itemId};
  if((shown1.length||first1||retry1.length||completed.length)&&opponent.length!==1)return{ok:false,error:"enclosure_store_second_decision_without_forced_move",itemId:item.itemId};
  if(retry1.length&&!first1)return{ok:false,error:"enclosure_store_retry1_without_first",itemId:item.itemId};
  if(completed.length){
   if(!first0||!first1)return{ok:false,error:"enclosure_store_completion_missing_first",itemId:item.itemId};
   if(completed[0].decisionFirstCorrect[0]!==first0.correct||completed[0].decisionFirstCorrect[1]!==first1.correct)return{ok:false,error:"enclosure_store_completion_first_mismatch",itemId:item.itemId};
   if(completed[0].decisionAttempts[0]!==1+retry0.length||completed[0].decisionAttempts[1]!==1+retry1.length)return{ok:false,error:"enclosure_store_completion_attempt_count_mismatch",itemId:item.itemId};
  }
  let last=-Infinity,done=false;
  for(const event of events){
   const t=Date.parse(event.occurredAt);if(t<last)return{ok:false,error:"enclosure_store_time_order_invalid",itemId:item.itemId};last=t;
   if(done)return{ok:false,error:"enclosure_store_event_after_completion",itemId:item.itemId};
   if(event.type==="enclosure_completed")done=true;
  }
 }
 return{ok:true};
}
function completedItemIds(store){return new Set(store.events.filter(e=>e.type==="enclosure_completed").map(e=>e.itemId));}
function activeItem(store){
 const presentation=[...store.events].reverse().find(e=>e.type==="enclosure_presented"&&!store.events.some(c=>c.itemId===e.itemId&&c.type==="enclosure_completed"));
 return presentation?Contract.itemById(presentation.itemId):null;
}
function eventsForItem(store,itemId){return itemEvents(store,itemId);}

const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,validate,validateStore,completedItemIds,activeItem,eventsForItem};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedEnclosureComparableEvents=api;
})(typeof window!=="undefined"?window:globalThis);
