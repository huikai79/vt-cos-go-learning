const test=require("node:test");
const assert=require("node:assert/strict");
const Go=require("../go.js");
const Legacy=require("../advanced-comparable-position-contract.js");
const Framework=require("../advanced-comparable-framework-v2.js");
const Events=require("../advanced-comparable-events-v2.js");
const Analysis=require("../advanced-comparable-analysis-v2.js");
const DelayedEvents=require("../advanced-delayed-comparable-events-v2.js");
const DelayedPolicy=require("../advanced-delayed-comparable-policy-v2.js");
const DelayedAnalysis=require("../advanced-delayed-comparable-analysis-v2.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
function iso(ms){return new Date(ms).toISOString();}
function base(item,attempt,eventId,occurredAt){
 return{eventId,sessionId:"s",attemptId:attempt,itemId:item.itemId,itemVersion:item.itemVersion,occurredAt};
}
function completeImmediate(storageObj,startMs){
 const items=Framework.immediateItems();
 let ms=startMs;
 for(const item of items){
  const attempt="a-"+item.itemId;
  assert.equal(Events.append(storageObj,{...base(item,attempt,"p-"+item.itemId,iso(ms)),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
  ms+=1000;
  const point=Framework.successfulPoints(item.familyId,item)[0];
  const score=Framework.scoreResponse(item.familyId,item,point);
  assert.equal(Events.append(storageObj,{...base(item,attempt,"f-"+item.itemId,iso(ms)),type:"comparable_first",point,legal:score.legal,correct:score.correct,hintUsed:false}).ok,true);
  ms+=1000;
  assert.equal(Events.append(storageObj,{...base(item,attempt,"c-"+item.itemId,iso(ms)),type:"comparable_completed",firstCorrect:true,eventualCorrect:true,attempts:1}).ok,true);
  ms+=1000;
 }
 return Events.read(storageObj).store;
}

test("Comparable Framework v2 註冊 legacy read-only 與 Double Atari family",()=>{
 assert.equal(Framework.FRAMEWORK_VERSION,"advanced-comparable-framework-v2");
 assert.equal(Framework.familyById("urgent_atari_rescue").writer,"legacy_read_only");
 assert.equal(Framework.familyById("double_atari").kcStatus,"not_promoted");
 assert.equal(Framework.immediateItems().length,2);
 assert.equal(Framework.delayedItems().length,1);
});

test("Double Atari 三個公開 19x19 item 各有唯一成功點且 surface descriptor 不重複",()=>{
 const all=Framework.validateAll();
 assert.equal(all.ok,true,JSON.stringify(all));
 const descriptors=new Set();
 for(const item of Framework.items){
  assert.equal(Framework.validateV2Item(item),null,item.itemId);
  const points=Framework.successfulPoints(item.familyId,item);
  assert.equal(points.length,1,item.itemId);
  const score=Framework.scoreResponse(item.familyId,item,points[0]);
  assert.equal(score.legal,true);
  assert.equal(score.correct,true);
  assert.equal(score.newlyAtariCount,2);
  assert.equal(score.capturedCount,0);
  const descriptor=JSON.stringify(Framework.doubleAtariSurfaceDescriptor(item));
  assert.equal(descriptors.has(descriptor),false,item.itemId);
  descriptors.add(descriptor);
 }
});

test("Double Atari scoring 要求恰好兩串，不把三串同時打吃納入 family",()=>{
 const custom={
  playerColor:Go.BLACK,
  stones:[
   [5,5,Go.WHITE],[4,5,Go.BLACK],[5,4,Go.BLACK],
   [7,5,Go.WHITE],[8,5,Go.BLACK],[7,4,Go.BLACK],
   [6,4,Go.WHITE],[5,4,Go.BLACK],[7,4,Go.BLACK],
   [3,3,Go.BLACK],[15,15,Go.WHITE]
  ]
 };
 const dedup=[];const seen=new Set();
 for(const stone of custom.stones){const k=stone[0]+","+stone[1];if(!seen.has(k)){seen.add(k);dedup.push(stone);}}
 custom.stones=dedup;
 const result=Framework.doubleAtariScore(custom,[6,5]);
 assert.equal(result.legal,true);
 assert.equal(result.correct,false);
 assert.equal(result.newlyAtariCount,3);
});

test("既有對方棋已在打吃時 fail closed，不用新落子冒充 Double Atari",()=>{
 const custom={
  playerColor:Go.BLACK,
  stones:[
   [5,5,Go.WHITE],[4,5,Go.BLACK],[5,4,Go.BLACK],[5,6,Go.BLACK],
   [7,5,Go.WHITE],[8,5,Go.BLACK],[7,4,Go.BLACK]
  ]
 };
 const result=Framework.doubleAtariScore(custom,[6,5]);
 assert.equal(result.correct,false);
 assert.equal(result.error,"opponent_already_in_atari");
});

test("v2 item 禁止答案注入、stale fingerprint 與 family/scoring mismatch",()=>{
 const item=Framework.immediateItems()[0];
 assert.equal(Framework.validateV2Item({...item,answer:[6,5]}),"v2_item_answer_injection_forbidden");
 assert.equal(Framework.validateV2Item({...item,positionFingerprint:"stale"}),"v2_item_fingerprint_mismatch");
 assert.equal(Framework.validateV2Item({...item,familyId:"urgent_atari_rescue"}),"v2_item_identity_invalid");
 assert.equal(Framework.validateV2Item({...item,scoringContractVersion:"urgent-atari-rescue-rules-v1"}),"v2_item_version_invalid");
});

test("legacy urgent-atari 可透過 adapter 重算，但 v2 writer 明確拒絕 legacy item",()=>{
 const legacy=Legacy.itemOrder()[0];
 const point=Legacy.successfulPoints(legacy)[0];
 assert.equal(Framework.scoreResponse("urgent_atari_rescue",legacy,point).correct,true);
 const s=storage();
 const result=Events.append(s,{...base(legacy,"legacy","legacy",iso(Date.parse("2026-09-30T00:00:00Z"))),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 assert.equal(result.ok,false);
 assert.equal(result.error,"advanced_comparable_v2_item_unknown");
 assert.equal(s.getItem(Events.STORAGE_KEY),null);
});

test("v2 fixed immediate order 必須 practice -> process；首答錯不能被 retry 覆蓋",()=>{
 const s=storage(),[practice,process]=Framework.immediateItems(),t=Date.parse("2026-09-30T00:00:00Z");
 const premature=Events.append(s,{...base(process,"p2","x",iso(t)),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 assert.equal(premature.ok,false);assert.equal(premature.error,"v2_previous_item_incomplete");

 assert.equal(Events.append(s,{...base(practice,"p1","p",iso(t)),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 assert.equal(Events.append(s,{...base(practice,"p1","f",iso(t+1000)),type:"comparable_first",point:[0,0],legal:true,correct:false,hintUsed:false}).ok,true);
 const good=Framework.successfulPoints(practice.familyId,practice)[0];
 assert.equal(Events.append(s,{...base(practice,"p1","r",iso(t+2000)),type:"comparable_retry",point:good,legal:true,correct:true,hintUsed:false}).ok,true);
 assert.equal(Events.append(s,{...base(practice,"p1","c",iso(t+3000)),type:"comparable_completed",firstCorrect:false,eventualCorrect:true,attempts:2}).ok,true);
 const summary=Analysis.summarizeStore(Events.read(s).store);
 assert.equal(summary.ok,true);
 assert.equal(summary.items[0].firstCorrect,false);
 assert.equal(summary.items[0].eventualCorrect,true);
 assert.equal(summary.mastery,null);
 assert.equal(summary.transferConclusion,null);
});

test("process-check 呈現即進 denominator，未答不能事後消失",()=>{
 const s=storage(),t=Date.parse("2026-09-30T00:00:00Z"),[practice,process]=Framework.immediateItems();
 const pa="pa";
 assert.equal(Events.append(s,{...base(practice,pa,"pp",iso(t)),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 const good=Framework.successfulPoints(practice.familyId,practice)[0];
 assert.equal(Events.append(s,{...base(practice,pa,"pf",iso(t+1000)),type:"comparable_first",point:good,legal:true,correct:true,hintUsed:false}).ok,true);
 assert.equal(Events.append(s,{...base(practice,pa,"pc",iso(t+2000)),type:"comparable_completed",firstCorrect:true,eventualCorrect:true,attempts:1}).ok,true);
 assert.equal(Events.append(s,{...base(process,"pb","qp",iso(t+3000)),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 const summary=Analysis.summarizeStore(Events.read(s).store);
 const target=summary.items.find(x=>x.itemId===process.itemId);
 assert.equal(target.denominator,1);
 assert.equal(target.unanswered,true);
 assert.equal(target.firstResponseObserved,false);
});

test("24h delayed v2 只錨定 Double Atari process completion；未滿時間不得呈現",()=>{
 const s=storage(),baseMs=Date.parse("2026-09-28T00:00:00Z");
 const immediate=completeImmediate(s,baseMs);
 const ds=storage(),delayed=DelayedEvents.read(ds).store;
 const anchor=DelayedPolicy.anchor(immediate);
 assert.equal(anchor.ok,true);assert.equal(anchor.ready,true);
 const before=DelayedPolicy.statusFor(immediate,delayed,anchor.anchorMs+Framework.MIN_DELAY_MS-1);
 assert.equal(before.status,DelayedPolicy.STATUS.WAITING_FOR_DELAY);
 const due=DelayedPolicy.statusFor(immediate,delayed,anchor.anchorMs+Framework.MIN_DELAY_MS);
 assert.equal(due.status,DelayedPolicy.STATUS.DUE);
 assert.equal(due.presentationMetadata.actualDelayMs,Framework.MIN_DELAY_MS);
});

test("delayed v2 forged early event、clock rollback、錯 anchor 都 fail closed",()=>{
 const s=storage(),baseMs=Date.parse("2026-09-28T00:00:00Z"),immediate=completeImmediate(s,baseMs);
 const ds=storage(),anchor=DelayedPolicy.anchor(immediate),item=Framework.delayedItems()[0],dueMs=anchor.anchorMs+Framework.MIN_DELAY_MS;
 const meta={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:iso(dueMs),minimumDelayMs:Framework.MIN_DELAY_MS};
 const earlyAt=dueMs-1;
 const early=DelayedEvents.append(ds,{...base(item,"d","early",iso(earlyAt)),type:"delayed_presented",anchorEventId:meta.anchorEventId,anchorOccurredAt:meta.anchorOccurredAt,dueAt:meta.dueAt,minimumDelayMs:meta.minimumDelayMs,actualDelayMs:earlyAt-anchor.anchorMs,eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 assert.equal(early.ok,false);
 const clock=DelayedPolicy.statusFor(immediate,DelayedEvents.read(ds).store,anchor.anchorMs-1);
 assert.equal(clock.ok,false);assert.equal(clock.error,"v2_clock_before_anchor");

 const dueAt=dueMs;
 const good=DelayedEvents.append(ds,{...base(item,"d","p",iso(dueAt)),type:"delayed_presented",anchorEventId:meta.anchorEventId,anchorOccurredAt:meta.anchorOccurredAt,dueAt:meta.dueAt,minimumDelayMs:meta.minimumDelayMs,actualDelayMs:Framework.MIN_DELAY_MS,eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 assert.equal(good.ok,true);
 const polluted=DelayedEvents.read(ds).store;
 polluted.events[0].anchorEventId="wrong";
 const bad=DelayedPolicy.statusFor(immediate,polluted,dueMs);
 assert.equal(bad.ok,false);
});

test("delayed v2 first wrong -> retry correct 保留 firstCorrect，analysis 不產 retention 結論",()=>{
 const is=storage(),baseMs=Date.parse("2026-09-28T00:00:00Z"),immediate=completeImmediate(is,baseMs);
 const ds=storage(),anchor=DelayedPolicy.anchor(immediate),item=Framework.delayedItems()[0],dueMs=anchor.anchorMs+Framework.MIN_DELAY_MS;
 const common={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:iso(dueMs),minimumDelayMs:Framework.MIN_DELAY_MS};
 assert.equal(DelayedEvents.append(ds,{...base(item,"d","p",iso(dueMs)),type:"delayed_presented",...common,actualDelayMs:Framework.MIN_DELAY_MS,eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 assert.equal(DelayedEvents.append(ds,{...base(item,"d","f",iso(dueMs+1000)),type:"delayed_first",...common,actualDelayMs:Framework.MIN_DELAY_MS+1000,point:[0,0],legal:true,correct:false,hintUsed:false}).ok,true);
 const good=Framework.successfulPoints(item.familyId,item)[0];
 assert.equal(DelayedEvents.append(ds,{...base(item,"d","r",iso(dueMs+2000)),type:"delayed_retry",...common,actualDelayMs:Framework.MIN_DELAY_MS+2000,point:good,legal:true,correct:true,hintUsed:false}).ok,true);
 assert.equal(DelayedEvents.append(ds,{...base(item,"d","c",iso(dueMs+3000)),type:"delayed_completed",...common,actualDelayMs:Framework.MIN_DELAY_MS+3000,firstCorrect:false,eventualCorrect:true,attempts:2}).ok,true);
 const summary=DelayedAnalysis.summarize(immediate,DelayedEvents.read(ds).store,dueMs+3000);
 assert.equal(summary.ok,true);
 assert.equal(summary.firstCorrect,false);
 assert.equal(summary.eventualCorrect,true);
 assert.equal(summary.retentionConclusion,null);
 assert.equal(summary.transferConclusion,null);
 assert.equal(summary.mastery,null);
 assert.equal(summary.schedulerEligible,false);
 assert.equal(summary.formalEligible,false);
});

test("v1 stores 保持獨立；v2 空 store 不讀寫 v1 key",()=>{
 const s=storage();
 const legacy={schemaVersion:1,eventStreamVersion:"advanced-comparable-position-events-v1",events:[{sentinel:"legacy"}]};
 s.setItem("go-advanced-comparable-position-events-v1",JSON.stringify(legacy));
 const r=Events.read(s);
 assert.equal(r.ok,true);assert.equal(r.store.events.length,0);
 assert.deepEqual(JSON.parse(s.getItem("go-advanced-comparable-position-events-v1")),legacy);
});
