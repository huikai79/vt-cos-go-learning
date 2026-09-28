(function(root){"use strict";
const STORAGE_KEY="go-advanced-decision-review-events-v1";
const STREAM_VERSION="advanced-decision-review-events-v1";
const SCHEMA_VERSION=1;
const TYPES=new Set(["review_presented","candidate_first","candidate_retry","original_revealed","reflection_saved"]);
function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){const raw=storage.getItem(STORAGE_KEY);if(!raw)return{ok:true,store:empty()};try{const store=JSON.parse(raw);if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();return{ok:true,store};}catch{return{ok:false,error:"advanced_decision_review_store_malformed",store:null};}}
function validPoint(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isInteger);}
function validate(e){
 if(!e||e.schemaVersion!==SCHEMA_VERSION||e.eventStreamVersion!==STREAM_VERSION||!TYPES.has(e.type))return"event_contract_invalid";
 for(const k of ["eventId","sessionId","reviewId","experienceId","experienceVersion","sourceId","sourcePositionVersion","positionFingerprint","candidateSetVersion","scoringContractVersion","evidenceTaxonomyVersion","rulesContractVersion","occurredAt"])if(typeof e[k]!=="string"||!e[k])return"event_metadata_missing";
 if(e.boardSize!==19||e.formalEligible!==false||e.evidenceUse!=="advanced_sgf_review_practice_only"||e.evaluationContext!=="sgf_decision_review"||e.transferLevel!==null)return"event_authority_invalid";
 if(["candidate_first","candidate_retry"].includes(e.type)){
   if(!validPoint(e.point)||typeof e.legal!=="boolean"||e.originalMove!==null||e.matchesOriginal!==null||e.originalExposed!==false)return"candidate_event_invalid";
 }
 if(e.type==="original_revealed"){
   if(!validPoint(e.originalMove)||typeof e.firstCandidateMatchesOriginal!=="boolean"||e.originalExposed!==true)return"reveal_event_invalid";
 }
 return null;
}
function append(storage,input){const r=read(storage);if(!r.ok)return r;const event={schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,...input,formalEligible:false,evidenceUse:"advanced_sgf_review_practice_only",evaluationContext:"sgf_decision_review",transferLevel:null};const error=validate(event);if(error)return{ok:false,error,store:r.store};const next={...r.store,events:[...r.store.events,event]};try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,store:next,event};}catch{return{ok:false,error:"advanced_decision_review_store_write_failed",store:r.store};}}
function summarize(store){const events=(store&&store.events)||[];return{reviews:new Set(events.map(e=>e.reviewId)).size,firstCandidates:events.filter(e=>e.type==="candidate_first").length,reveals:events.filter(e=>e.type==="original_revealed").length,reflections:events.filter(e=>e.type==="reflection_saved").length};}
const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,read,append,summarize,validate};
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.GoAdvancedDecisionReviewEvents=api;
})(typeof window!=="undefined"?window:globalThis);
