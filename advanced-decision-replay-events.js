(function(root){"use strict";

const STORAGE_KEY="go-advanced-decision-replay-events-v1";
const STREAM_VERSION="advanced-decision-replay-events-v1";
const SCHEMA_VERSION=1;
const REPLAY_CONTRACT_VERSION="advanced-decision-replay-v1";
const REPLAY_SCORING_CONTRACT_VERSION="sgf-decision-replay-historical-comparison-v1";
const REPLAY_EVIDENCE_TAXONOMY_VERSION="sgf-decision-replay-evidence-v1";
const TYPES=new Set(["replay_queued","replay_presented","replay_candidate_first","replay_candidate_retry","replay_original_revealed"]);

function empty(){return{schemaVersion:SCHEMA_VERSION,eventStreamVersion:STREAM_VERSION,events:[]};}
function read(storage){
 const raw=storage.getItem(STORAGE_KEY);
 if(!raw)return{ok:true,store:empty()};
 try{
  const store=JSON.parse(raw);
  if(store.schemaVersion!==SCHEMA_VERSION||store.eventStreamVersion!==STREAM_VERSION||!Array.isArray(store.events))throw new Error();
  return{ok:true,store};
 }catch{return{ok:false,error:"advanced_decision_replay_store_malformed",store:null};}
}
function validPoint(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<19&&p[1]>=0&&p[1]<19;}
function validStones(stones){
 if(!Array.isArray(stones))return false;
 const seen=new Set();
 for(const stone of stones){
  if(!Array.isArray(stone)||stone.length!==3||![1,2].includes(stone[2])||!validPoint(stone.slice(0,2)))return false;
  const key=stone[0]+","+stone[1];
  if(seen.has(key))return false;
  seen.add(key);
 }
 return true;
}
function validCommon(e){
 if(!e||e.schemaVersion!==SCHEMA_VERSION||e.eventStreamVersion!==STREAM_VERSION||!TYPES.has(e.type))return"event_contract_invalid";
 for(const k of ["eventId","sessionId","replayId","sourceReviewId","sourceExperienceId","sourceExperienceVersion","sourceId","sourcePositionVersion","positionFingerprint","candidateSetVersion","sourceScoringContractVersion","sourceEvidenceTaxonomyVersion","rulesContractVersion","replayContractVersion","replayScoringContractVersion","replayEvidenceTaxonomyVersion","occurredAt"])if(typeof e[k]!=="string"||!e[k])return"event_metadata_missing";
 if(e.replayContractVersion!==REPLAY_CONTRACT_VERSION||e.replayScoringContractVersion!==REPLAY_SCORING_CONTRACT_VERSION||e.replayEvidenceTaxonomyVersion!==REPLAY_EVIDENCE_TAXONOMY_VERSION)return"event_version_invalid";
 if(e.boardSize!==19||e.formalEligible!==false||e.qualifiedOpportunity!==false||e.evidenceUse!=="advanced_sgf_replay_practice_only"||e.evaluationContext!=="sgf_decision_replay"||e.transferLevel!=="T0"||e.sourceExposure!=="previously_exposed"||e.skillId!==null)return"event_authority_invalid";
 return null;
}
function validate(e){
 const common=validCommon(e);if(common)return common;
 if(e.type==="replay_queued"){
  if(typeof e.sourceRevealEventId!=="string"||!e.sourceRevealEventId||e.sourceOriginalExposed!==true||![1,2].includes(e.playerColor)||!Number.isInteger(e.moveNumber)||e.moveNumber<1||!Number.isInteger(e.nodeIndex)||e.nodeIndex<0)return"replay_queue_metadata_invalid";
  if(!validStones(e.stones)||!validStones(e.koPreviousStones)||!validPoint(e.originalMove))return"replay_queue_snapshot_invalid";
 }
 if(e.type==="replay_presented"){
  if(typeof e.attemptId!=="string"||!e.attemptId||e.originalMove!==null||e.originalExposed!==false)return"replay_presented_invalid";
 }
 if(["replay_candidate_first","replay_candidate_retry"].includes(e.type)){
  if(typeof e.attemptId!=="string"||!e.attemptId||!validPoint(e.point)||typeof e.legal!=="boolean"||e.originalMove!==null||e.matchesOriginal!==null||e.originalExposed!==false)return"replay_candidate_invalid";
 }
 if(e.type==="replay_original_revealed"){
  if(typeof e.attemptId!=="string"||!e.attemptId||!validPoint(e.originalMove)||typeof e.firstCandidateMatchesOriginal!=="boolean"||typeof e.firstCandidateLegal!=="boolean"||e.originalExposed!==true)return"replay_reveal_invalid";
 }
 return null;
}
function append(storage,input){
 const r=read(storage);if(!r.ok)return r;
 const event={
  schemaVersion:SCHEMA_VERSION,
  eventStreamVersion:STREAM_VERSION,
  ...input,
  formalEligible:false,
  qualifiedOpportunity:false,
  evidenceUse:"advanced_sgf_replay_practice_only",
  evaluationContext:"sgf_decision_replay",
  transferLevel:"T0",
  sourceExposure:"previously_exposed",
  skillId:null
 };
 const error=validate(event);if(error)return{ok:false,error,store:r.store};
 const next={...r.store,events:[...r.store.events,event]};
 try{storage.setItem(STORAGE_KEY,JSON.stringify(next));return{ok:true,store:next,event};}
 catch{return{ok:false,error:"advanced_decision_replay_store_write_failed",store:r.store};}
}
function queuedReplays(store){
 const events=(store&&store.events)||[];
 const byId=new Map();
 for(const event of events)if(event.type==="replay_queued"&&!byId.has(event.replayId))byId.set(event.replayId,event);
 return[...byId.values()];
}
function findQueued(store,replayId){return queuedReplays(store).find(event=>event.replayId===replayId)||null;}
function summarize(store){
 const events=(store&&store.events)||[];
 return{
  queued:queuedReplays(store).length,
  presentations:events.filter(event=>event.type==="replay_presented").length,
  firstCandidates:events.filter(event=>event.type==="replay_candidate_first").length,
  reveals:events.filter(event=>event.type==="replay_original_revealed").length
 };
}

const api={STORAGE_KEY,STREAM_VERSION,SCHEMA_VERSION,REPLAY_CONTRACT_VERSION,REPLAY_SCORING_CONTRACT_VERSION,REPLAY_EVIDENCE_TAXONOMY_VERSION,read,append,validate,queuedReplays,findQueued,summarize};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedDecisionReplayEvents=api;
})(typeof window!=="undefined"?window:globalThis);
