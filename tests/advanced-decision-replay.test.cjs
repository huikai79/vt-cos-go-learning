const test=require("node:test");
const assert=require("node:assert/strict");
const Events=require("../advanced-decision-replay-events.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
const base={
 sessionId:"s",
 replayId:"decision-replay-r",
 sourceReviewId:"r",
 sourceExperienceId:"r",
 sourceExperienceVersion:"sgf-decision-review-item-v1",
 sourceId:"src",
 sourcePositionVersion:"sgf-source-position-v1",
 positionFingerprint:"pos",
 candidateSetVersion:"board-intersection-attempts-rules-checked-v1",
 sourceScoringContractVersion:"sgf-decision-review-historical-comparison-v1",
 sourceEvidenceTaxonomyVersion:"sgf-decision-review-evidence-v1",
 rulesContractVersion:"go-core-simple-ko-v1",
 replayContractVersion:Events.REPLAY_CONTRACT_VERSION,
 replayScoringContractVersion:Events.REPLAY_SCORING_CONTRACT_VERSION,
 replayEvidenceTaxonomyVersion:Events.REPLAY_EVIDENCE_TAXONOMY_VERSION,
 boardSize:19,
 occurredAt:"2026-09-29T02:00:00.000Z"
};
test("replay queue 只能保存已曝光 source，並固定為 T0 practice",()=>{
 const s=storage();
 const queued=Events.append(s,{...base,eventId:"q",type:"replay_queued",sourceRevealEventId:"reveal-1",sourceOriginalExposed:true,playerColor:1,moveNumber:3,nodeIndex:3,stones:[[15,3,1],[3,3,2]],koPreviousStones:[[15,3,1]],originalMove:[16,15]});
 assert.equal(queued.ok,true);
 assert.equal(queued.event.sourceExposure,"previously_exposed");
 assert.equal(queued.event.transferLevel,"T0");
 assert.equal(queued.event.formalEligible,false);
 assert.equal(queued.event.qualifiedOpportunity,false);
 assert.equal(queued.event.skillId,null);
});
test("未證明原著曝光或 snapshot 壞掉時 queue fail closed",()=>{
 const s=storage();
 const hidden=Events.append(s,{...base,eventId:"q1",type:"replay_queued",sourceRevealEventId:"r",sourceOriginalExposed:false,playerColor:1,moveNumber:3,nodeIndex:3,stones:[],koPreviousStones:[],originalMove:[16,15]});
 assert.equal(hidden.ok,false);
 const duplicate=Events.append(s,{...base,eventId:"q2",type:"replay_queued",sourceRevealEventId:"r",sourceOriginalExposed:true,playerColor:1,moveNumber:3,nodeIndex:3,stones:[[3,3,1],[3,3,2]],koPreviousStones:[],originalMove:[16,15]});
 assert.equal(duplicate.ok,false);
});
test("replay first response 與 retry 分開，揭露前不能帶原著",()=>{
 const s=storage();
 const presented=Events.append(s,{...base,eventId:"p",type:"replay_presented",attemptId:"a1",originalMove:null,originalExposed:false});
 const first=Events.append(s,{...base,eventId:"f",type:"replay_candidate_first",attemptId:"a1",point:[4,4],legal:true,originalMove:null,matchesOriginal:null,originalExposed:false});
 const retry=Events.append(s,{...base,eventId:"r",type:"replay_candidate_retry",attemptId:"a1",point:[5,5],legal:true,originalMove:null,matchesOriginal:null,originalExposed:false});
 assert.equal(presented.ok,true);assert.equal(first.ok,true);assert.equal(retry.ok,true);
 assert.deepEqual(Events.read(s).store.events.map(e=>e.type),["replay_presented","replay_candidate_first","replay_candidate_retry"]);
 assert.ok(Events.read(s).store.events.every(e=>e.originalMove===null));
});
test("replay reveal 只記歷史比較，不產生 correct/mastery/formal evidence",()=>{
 const s=storage();
 const reveal=Events.append(s,{...base,eventId:"x",type:"replay_original_revealed",attemptId:"a1",originalMove:[16,15],firstCandidateMatchesOriginal:false,firstCandidateLegal:true,originalExposed:true});
 assert.equal(reveal.ok,true);
 assert.equal("correct" in reveal.event,false);
 assert.equal("mastery" in reveal.event,false);
 assert.equal(reveal.event.formalEligible,false);
 assert.equal(reveal.event.transferLevel,"T0");
});
test("malformed replay store fail closed",()=>{
 const s=storage();s.setItem(Events.STORAGE_KEY,"{bad");assert.equal(Events.read(s).ok,false);
});
