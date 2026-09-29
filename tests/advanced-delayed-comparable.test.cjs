const test=require("node:test");
const assert=require("node:assert/strict");
const Comparable=require("../advanced-comparable-position-contract.js");
const ComparableEvents=require("../advanced-comparable-position-events.js");
const Delayed=require("../advanced-delayed-comparable-contract.js");
const Events=require("../advanced-delayed-comparable-events.js");
const Policy=require("../advanced-delayed-comparable-policy.js");
const Analysis=require("../advanced-delayed-comparable-analysis.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
function comparableBase(item,attemptId,occurredAt,eventId){
 return{
  eventId,sessionId:"cs",attemptId,
  pairId:item.pairId,pairVersion:item.pairVersion,pairHypothesisVersion:item.pairHypothesisVersion,
  itemId:item.itemId,itemVersion:item.itemVersion,itemRole:item.role,
  positionFingerprint:item.positionFingerprint,
  scoringContractVersion:item.scoringContractVersion,
  evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,
  selectionPolicyVersion:item.pairPolicyVersion,
  occurredAt
 };
}
function completeComparablePairA(s,baseMs){
 const order=Comparable.itemOrder();
 const firstThree=order.slice(0,3);
 for(let i=0;i<firstThree.length;i++){
  const item=firstThree[i],attempt="c"+i,t0=new Date(baseMs+i*60000).toISOString();
  assert.equal(ComparableEvents.append(s,{...comparableBase(item,attempt,t0,"p"+i),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
  const point=Comparable.successfulPoints(item)[0],t1=new Date(baseMs+i*60000+1000).toISOString();
  assert.equal(ComparableEvents.append(s,{...comparableBase(item,attempt,t1,"f"+i),type:"comparable_first",point,legal:true,correct:true,hintUsed:false}).ok,true);
  const t2=new Date(baseMs+i*60000+2000).toISOString();
  assert.equal(ComparableEvents.append(s,{...comparableBase(item,attempt,t2,"d"+i),type:"comparable_completed",firstCorrect:true,eventualCorrect:true,attempts:1}).ok,true);
 }
 return ComparableEvents.read(s).store;
}
function delayedBase(item,meta,occurredAt,eventId,type,extra={}){
 return{
  eventId,sessionId:"ds",attemptId:"da",
  itemId:item.itemId,itemVersion:item.itemVersion,pairId:item.pairId,pairVersion:item.pairVersion,pairHypothesisVersion:item.pairHypothesisVersion,
  anchorItemId:item.anchorItemId,anchorEventId:meta.anchorEventId,anchorOccurredAt:meta.anchorOccurredAt,dueAt:meta.dueAt,
  positionFingerprint:item.positionFingerprint,kcHypothesisId:item.kcHypothesisId,kcHypothesisVersion:item.kcHypothesisVersion,
  scoringContractVersion:item.scoringContractVersion,evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,retrievalPolicyVersion:item.retrievalPolicyVersion,
  minimumDelayMs:meta.minimumDelayMs,actualDelayMs:Date.parse(occurredAt)-Date.parse(meta.anchorOccurredAt),occurredAt,type,...extra
 };
}

test("Delayed Comparable v1 兩個新局面都有唯一 rules-backed 成功點，且不是既有 pair 的同 surface class",()=>{
 const all=Delayed.validateAll();
 assert.equal(all.ok,true,JSON.stringify(all));
 for(const item of Delayed.items){
  assert.equal(Delayed.validateItem(item),null,item.itemId);
  assert.equal(Delayed.successfulPoints(item).length,1,item.itemId);
  const pair=Comparable.pairById(item.pairId);
  assert.notEqual(item.positionFingerprint,"delayed-"+pair.source.positionFingerprint);
  assert.notEqual(item.positionFingerprint,"delayed-"+pair.target.positionFingerprint);
  assert.equal(Comparable.sameSurfaceClass(item,pair.source),false,item.itemId+" source");
  assert.equal(Comparable.sameSurfaceClass(item,pair.target),false,item.itemId+" target");
 }
});

test("delayed item 禁止答案注入、stale fingerprint 與錯 anchor",()=>{
 const item=Delayed.items[0];
 assert.equal(Delayed.validateItem({...item,answer:[8,9]}),"delayed_item_answer_injection_forbidden");
 assert.equal(Delayed.validateItem({...item,positionFingerprint:"stale"}),"delayed_item_fingerprint_mismatch");
 assert.equal(Delayed.validateItem({...item,anchorItemId:"wrong"}),"delayed_item_anchor_invalid");
});

test("固定 24h 前不得呈現；到期後才回 DUE",()=>{
 const s=storage(),base=Date.parse("2026-09-28T00:00:00.000Z");
 const comparable=completeComparablePairA(s,base);
 const delayed=Events.read(storage()).store;
 const item=Delayed.items[0];
 const anchor=Policy.anchorForItem(comparable,item);
 assert.equal(anchor.ok,true);assert.equal(anchor.ready,true);
 const before=Policy.statusForItem(comparable,delayed,item,anchor.anchorMs+Delayed.MIN_DELAY_MS-1);
 assert.equal(before.status,Policy.STATUS.WAITING_FOR_DELAY);
 assert.equal(before.remainingMs,1);
 const due=Policy.statusForItem(comparable,delayed,item,anchor.anchorMs+Delayed.MIN_DELAY_MS);
 assert.equal(due.status,Policy.STATUS.DUE);
 assert.equal(due.presentationMetadata.minimumDelayMs,Delayed.MIN_DELAY_MS);
 assert.equal(due.presentationMetadata.actualDelayMs,Delayed.MIN_DELAY_MS);
});

test("時鐘早於 anchor、anchor 事件時間倒退都 fail closed",()=>{
 const s=storage(),base=Date.parse("2026-09-28T00:00:00.000Z");
 const comparable=completeComparablePairA(s,base),delayed=Events.read(storage()).store,item=Delayed.items[0];
 const anchor=Policy.anchorForItem(comparable,item);
 const clock=Policy.statusForItem(comparable,delayed,item,anchor.anchorMs-1);
 assert.equal(clock.ok,false);assert.equal(clock.error,"delayed_clock_before_anchor");

 const corrupted=structuredClone(comparable);
 const anchorEvents=corrupted.events.filter(e=>e.itemId===item.anchorItemId);
 const first=anchorEvents.find(e=>e.type==="comparable_first");
 const completed=anchorEvents.find(e=>e.type==="comparable_completed");
 completed.occurredAt=new Date(Date.parse(first.occurredAt)-1000).toISOString();
 const bad=Policy.anchorForItem(corrupted,item);
 assert.equal(bad.ok,false);assert.equal(bad.error,"delayed_anchor_time_order_invalid");
});

test("未完成 anchor 不能啟動 delayed retrieval",()=>{
 const s=storage(),item=Delayed.items[0];
 const emptyComparable=ComparableEvents.read(s).store;
 const delayed=Events.read(storage()).store;
 const status=Policy.statusForItem(emptyComparable,delayed,item,Date.parse("2026-09-30T00:00:00Z"));
 assert.equal(status.ok,true);
 assert.equal(status.status,Policy.STATUS.WAITING_FOR_ANCHOR);
});

test("呈現後未答仍進 denominator；首答與 retry 分開且 completion 保留 firstCorrect",()=>{
 const cs=storage(),base=Date.parse("2026-09-28T00:00:00.000Z");
 const comparable=completeComparablePairA(cs,base);
 const ds=storage(),delayed0=Events.read(ds).store,item=Delayed.items[0];
 const anchor=Policy.anchorForItem(comparable,item);
 const dueMs=anchor.anchorMs+Delayed.MIN_DELAY_MS;
 const due=Policy.statusForItem(comparable,delayed0,item,dueMs);
 const occurredAt=new Date(dueMs).toISOString();
 const presented=Events.append(ds,delayedBase(item,due.presentationMetadata,occurredAt,"dp","delayed_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false}));
 assert.equal(presented.ok,true);

 let summary=Analysis.summarizeStore(comparable,Events.read(ds).store,dueMs);
 assert.equal(summary.ok,true);
 assert.equal(summary.items[0].denominator,1);
 assert.equal(summary.items[0].unanswered,true);
 assert.equal(summary.items[0].firstResponseObserved,false);

 const wrongAt=new Date(dueMs+1000).toISOString();
 assert.equal(Events.append(ds,delayedBase(item,due.presentationMetadata,wrongAt,"df","delayed_first",{point:[0,0],legal:true,correct:false,hintUsed:false})).ok,true);
 const correctPoint=Delayed.successfulPoints(item)[0],retryAt=new Date(dueMs+2000).toISOString();
 assert.equal(Events.append(ds,delayedBase(item,due.presentationMetadata,retryAt,"dr","delayed_retry",{point:correctPoint,legal:true,correct:true,hintUsed:false})).ok,true);
 const doneAt=new Date(dueMs+3000).toISOString();
 assert.equal(Events.append(ds,delayedBase(item,due.presentationMetadata,doneAt,"dc","delayed_completed",{firstCorrect:false,eventualCorrect:true,attempts:2})).ok,true);

 summary=Analysis.summarizeStore(comparable,Events.read(ds).store,dueMs+3000);
 assert.equal(summary.items[0].firstCorrect,false);
 assert.equal(summary.items[0].eventualCorrect,true);
 assert.equal(summary.items[0].retryCount,1);
 assert.equal(summary.retentionConclusion,null);
 assert.equal(summary.transferConclusion,null);
 assert.equal(summary.skillUpdateEligible,false);
 assert.equal(summary.schedulerEligible,false);
 assert.equal(summary.formalEligible,false);
});

test("不到 dueAt 的 forged delayed event、重複 presentation、retry without first 都 fail closed",()=>{
 const cs=storage(),base=Date.parse("2026-09-28T00:00:00.000Z");
 const comparable=completeComparablePairA(cs,base);
 const ds=storage(),item=Delayed.items[0],anchor=Policy.anchorForItem(comparable,item);
 const dueMs=anchor.anchorMs+Delayed.MIN_DELAY_MS;
 const meta={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:new Date(dueMs).toISOString(),minimumDelayMs:Delayed.MIN_DELAY_MS};

 const earlyAt=new Date(dueMs-1).toISOString();
 const early=Events.append(ds,delayedBase(item,meta,earlyAt,"early","delayed_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false}));
 assert.equal(early.ok,false);
 assert.match(early.error,/delay_invalid|time_relation_invalid/);

 const dueAt=new Date(dueMs).toISOString();
 assert.equal(Events.append(ds,delayedBase(item,meta,dueAt,"p","delayed_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false})).ok,true);
 const duplicate=Events.append(ds,delayedBase(item,meta,new Date(dueMs+1).toISOString(),"p2","delayed_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false}));
 assert.equal(duplicate.ok,false);assert.equal(duplicate.error,"delayed_item_already_presented");
 const retry=Events.append(ds,delayedBase(item,meta,new Date(dueMs+2).toISOString(),"r","delayed_retry",{point:[8,9],legal:true,correct:true,hintUsed:false}));
 assert.equal(retry.ok,false);assert.equal(retry.error,"delayed_retry_without_first");
});

test("delayed analysis 只輸出描述性公開流程檢查，不產生 retention/mastery 結論",()=>{
 const comparable=ComparableEvents.read(storage()).store,delayed=Events.read(storage()).store;
 const summary=Analysis.summarizeStore(comparable,delayed,Date.parse("2026-09-30T00:00:00Z"));
 assert.equal(summary.ok,true);
 assert.equal(summary.authority,"descriptive_delayed_process_check_only");
 assert.equal(summary.constructValidated,false);
 assert.equal(summary.retentionConclusion,null);
 assert.equal(summary.transferConclusion,null);
 assert.equal(summary.mastery,null);
 assert.equal(summary.independentEvaluation,false);
});
