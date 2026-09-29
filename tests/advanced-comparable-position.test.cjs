const test=require("node:test");
const assert=require("node:assert/strict");
const Contract=require("../advanced-comparable-position-contract.js");
const Events=require("../advanced-comparable-position-events.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}

test("Comparable Position v1 所有公開合成題都有唯一 rules-backed 救棋點",()=>{
 const all=Contract.validateAll();
 assert.equal(all.ok,true,JSON.stringify(all));
 for(const pair of Contract.pairs){
  for(const item of [pair.source,pair.target]){
   assert.equal(Contract.validateItem(item),null,item.itemId);
   const urgent=Contract.urgentGroup(item);
   assert.ok(urgent,item.itemId);
   assert.equal(urgent.liberties.length,1,item.itemId);
   const successes=Contract.successfulPoints(item);
   assert.equal(successes.length,1,item.itemId);
   const score=Contract.scoreResponse(item,successes[0]);
   assert.equal(score.legal,true);
   assert.equal(score.correct,true);
   assert.ok(score.libertiesAfter>=2);
  }
 }
});

test("pair 不是同一局面或單純表面等價，且固定先做兩題 practice 再做兩題新局面",()=>{
 for(const pair of Contract.pairs){
  assert.notEqual(pair.source.positionFingerprint,pair.target.positionFingerprint);
  assert.equal(Contract.sameSurfaceClass(pair.source,pair.target),false,pair.pairId);
  assert.ok(pair.variationAxes.length>=3);
 }
 assert.deepEqual(Contract.itemOrder().map(item=>item.role),["practice","practice","process_check","process_check"]);
});

test("item 不得內嵌答案欄位，fingerprint 或棋盤被改也 fail closed",()=>{
 const item=Contract.pairs[0].source;
 const injected={...item,answer:[5,3]};
 assert.equal(Contract.validateItem(injected),"item_answer_injection_forbidden");
 const stale={...item,positionFingerprint:"stale"};
 assert.equal(Contract.validateItem(stale),"item_fingerprint_mismatch");
 const bad={...item,stones:item.stones.filter((_,i)=>i!==0)};
 assert.notEqual(Contract.validateItem(bad),null);
});

test("scoring 只判是否讓唯一一氣己方棋串脫離立即危險，不判全盤最佳手",()=>{
 const item=Contract.pairs[0].source;
 const correct=Contract.successfulPoints(item)[0];
 assert.deepEqual(correct,[5,3]);
 const elsewhere=Contract.scoreResponse(item,[10,10]);
 assert.equal(elsewhere.legal,true);
 assert.equal(elsewhere.correct,false);
 assert.equal(elsewhere.libertiesAfter,1);
});

function baseEvent(item){
 return{
  eventId:"e",
  sessionId:"s",
  attemptId:"a",
  pairId:item.pairId,
  pairVersion:item.pairVersion,
  pairHypothesisVersion:item.pairHypothesisVersion,
  itemId:item.itemId,
  itemVersion:item.itemVersion,
  itemRole:item.role,
  positionFingerprint:item.positionFingerprint,
  scoringContractVersion:item.scoringContractVersion,
  evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,
  selectionPolicyVersion:item.pairPolicyVersion,
  occurredAt:"2026-09-29T08:00:00.000Z"
 };
}

test("practice 與 public process-check taxonomy 分開，兩者都不得進 formal/KC/scheduler",()=>{
 const s=storage();
 const practice=Contract.itemOrder()[0];
 const process=Contract.itemOrder()[2];
 const p=Events.append(s,{...baseEvent(practice),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 const q=Events.append(s,{...baseEvent(process),eventId:"e2",attemptId:"a2",type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 assert.equal(p.ok,true);assert.equal(q.ok,true);
 assert.equal(p.event.transferLevel,"T0");
 assert.equal(p.event.evaluationContext,"practice");
 assert.equal(q.event.transferLevel,"T2");
 assert.equal(q.event.evaluationContext,"process_check");
 for(const event of [p.event,q.event]){
  assert.equal(event.formalEligible,false);
  assert.equal(event.independentEvaluation,false);
  assert.equal(event.schedulerEligible,false);
  assert.equal(event.skillUpdateEligible,false);
  assert.equal(event.qualifiedOpportunity,false);
 }
});

test("首答與 retry 分開保存，錯答不能從分母消失",()=>{
 const s=storage(),item=Contract.itemOrder()[2],base=baseEvent(item);
 assert.equal(Events.append(s,{...base,type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 assert.equal(Events.append(s,{...base,eventId:"f",type:"comparable_first",point:[0,0],legal:true,correct:false,hintUsed:false}).ok,true);
 assert.equal(Events.append(s,{...base,eventId:"r",type:"comparable_retry",point:Contract.successfulPoints(item)[0],legal:true,correct:true,hintUsed:false}).ok,true);
 assert.equal(Events.append(s,{...base,eventId:"c",type:"comparable_completed",firstCorrect:false,eventualCorrect:true,attempts:2}).ok,true);
 const events=Events.read(s).store.events;
 assert.deepEqual(events.map(e=>e.type),["comparable_presented","comparable_first","comparable_retry","comparable_completed"]);
 assert.equal(events[1].correct,false);
 assert.equal(events[3].firstCorrect,false);
 assert.equal(events[3].eventualCorrect,true);
});

test("presentation eligibility 必須在 response 前固定，malformed store fail closed",()=>{
 const s=storage(),item=Contract.itemOrder()[2],base=baseEvent(item);
 const bad=Events.append(s,{...base,type:"comparable_presented",eligibilityDeclaredBeforeResponse:false,hintAvailable:false});
 assert.equal(bad.ok,false);
 s.setItem(Events.STORAGE_KEY,"{bad");
 assert.equal(Events.read(s).ok,false);
});
