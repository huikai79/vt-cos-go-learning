(function(root){"use strict";

const Contract=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-position-contract.js"):root.GoAdvancedComparablePositionContract;
if(!Contract)return;

const STORAGE_KEY="go-advanced-comparable-position-events-v1";
const STREAM_VERSION="advanced-comparable-position-events-v1";
const SCHEMA_VERSION=1;
const TYPES=new Set(["comparable_presented","comparable_first","comparable_retry","comparable_completed"]);

function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){
 const raw=storage.getItem(STORAGE_KEY);if(!raw)return{ok:true,store:empty()};
 try{
  const store=JSON.parse(raw);
  if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();
  return{ok:true,store};
 }catch{return{ok:false,error:"advanced_comparable_store_malformed",store:null};}
}
function validPoint(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<19&&p[1]>=0&&p[1]<19;}
function validate(e){
 if(!e||e.schemaVersion!==SCHEMA_VERSION||e.eventStreamVersion!==STREAM_VERSION||!TYPES.has(e.type))return"event_contract_invalid";
 for(const k of ["eventId","sessionId","attemptId","pairId","pairVersion","pairHypothesisVersion","itemId","itemVersion","itemRole","positionFingerprint","scoringContractVersion","evidenceTaxonomyVersion","selectionPolicyVersion","occurredAt"])if(typeof e[k]!=="string"||!e[k])return"event_metadata_missing";
 const item=Contract.itemById(e.itemId);
 if(!item||item.itemVersion!==e.itemVersion||item.pairId!==e.pairId||item.pairVersion!==e.pairVersion||item.positionFingerprint!==e.positionFingerprint)return"event_item_identity_mismatch";
 if(e.scoringContractVersion!==Contract.SCORING_CONTRACT_VERSION||e.evidenceTaxonomyVersion!==Contract.EVIDENCE_TAXONOMY_VERSION||e.selectionPolicyVersion!==Contract.PAIR_POLICY_VERSION)return"event_version_invalid";
 if(e.boardSize!==19||e.publicItem!==true||e.formalEligible!==false||e.independentEvaluation!==false||e.schedulerEligible!==false||e.skillUpdateEligible!==false||e.qualifiedOpportunity!==false)return"event_authority_invalid";
 const expectedTransfer=item.role==="process_check"?"T2":"T0";
 const expectedUse=item.role==="process_check"?"advanced_comparable_public_process_check":"advanced_comparable_practice";
 if(e.transferLevel!==expectedTransfer||e.evidenceUse!==expectedUse||e.evaluationContext!==(item.role==="process_check"?"process_check":"practice"))return"event_taxonomy_invalid";
 if(e.type==="comparable_presented"){
  if(e.eligibilityDeclaredBeforeResponse!==true||e.hintAvailable!==false)return"presented_event_invalid";
 }
 if(["comparable_first","comparable_retry"].includes(e.type)){
  if(!validPoint(e.point)||typeof e.legal!=="boolean"||typeof e.correct!=="boolean"||e.hintUsed!==false)return"response_event_invalid";
 }
 if(e.type==="comparable_completed"){
  if(typeof e.firstCorrect!=="boolean"||typeof e.eventualCorrect!=="boolean"||!Number.isInteger(e.attempts)||e.attempts<1)return"completed_event_invalid";
 }
 return null;
}
function append(storage,input){
 const r=read(storage);if(!r.ok)return r;
 const item=Contract.itemById(input.itemId);
 if(!item)return{ok:false,error:"advanced_comparable_item_unknown",store:r.store};
 const event={
  schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,
  boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,
  transferLevel:item.role==="process_check"?"T2":"T0",
  evidenceUse:item.role==="process_check"?"advanced_comparable_public_process_check":"advanced_comparable_practice",
  evaluationContext:item.role==="process_check"?"process_check":"practice"
 };
 const error=validate(event);if(error)return{ok:false,error,store:r.store};
 const next={...r.store,events:[...r.store.events,event]};
 try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,store:next,event};}
 catch{return{ok:false,error:"advanced_comparable_store_write_failed",store:r.store};}
}
function eventsForItem(store,itemId){return((store&&store.events)||[]).filter(event=>event.itemId===itemId);}
function completedItemIds(store){
 const ids=new Set();
 for(const event of (store&&store.events)||[])if(event.type==="comparable_completed")ids.add(event.itemId);
 return ids;
}
function nextItem(store){
 const done=completedItemIds(store);
 return Contract.itemOrder().find(item=>!done.has(item.itemId))||null;
}
function activeAttempt(store,itemId){
 const events=eventsForItem(store,itemId);
 const presentations=events.filter(event=>event.type==="comparable_presented");
 if(!presentations.length)return null;
 const presented=presentations[presentations.length-1];
 const completed=events.find(event=>event.type==="comparable_completed"&&event.attemptId===presented.attemptId);
 if(completed)return null;
 const responses=events.filter(event=>["comparable_first","comparable_retry"].includes(event.type)&&event.attemptId===presented.attemptId);
 return{attemptId:presented.attemptId,presented,responses};
}
function summarize(store){
 const events=(store&&store.events)||[];
 return{
  presented:events.filter(e=>e.type==="comparable_presented").length,
  firstResponses:events.filter(e=>e.type==="comparable_first").length,
  completed:events.filter(e=>e.type==="comparable_completed").length,
  processChecksCompleted:events.filter(e=>e.type==="comparable_completed"&&e.itemRole==="process_check").length
 };
}

const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,validate,eventsForItem,completedItemIds,nextItem,activeAttempt,summarize};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedComparablePositionEvents=api;
})(typeof window!=="undefined"?window:globalThis);
