const test=require("node:test");
const assert=require("node:assert/strict");
const Contract=require("../advanced-enclosure-comparable-contract.js");
const Events=require("../advanced-enclosure-comparable-events.js");
const Policy=require("../advanced-enclosure-comparable-policy.js");
const Analysis=require("../advanced-enclosure-comparable-analysis.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
function iso(ms){return new Date(ms).toISOString();}
function timing(item,anchorEvent,ms){
 if(item.minimumDelayMs===0)return{anchorEventId:null,anchorOccurredAt:null,dueAt:null,actualDelayMs:0};
 const anchorMs=Date.parse(anchorEvent.occurredAt);
 return{anchorEventId:anchorEvent.eventId,anchorOccurredAt:anchorEvent.occurredAt,dueAt:iso(anchorMs+item.minimumDelayMs),actualDelayMs:ms-anchorMs};
}
function appendBase(s,item,pid,type,ms,extra={},anchorEvent=null){
 const t=timing(item,anchorEvent,ms);
 return Events.append(s,{eventId:type+"-"+ms,sessionId:"s",presentationId:pid,itemId:item.itemId,occurredAt:iso(ms),type,decisionIndex:null,point:null,legal:null,correct:null,hintUsed:false,eligibilityDeclaredBeforeResponse:false,hintAvailable:false,forced:false,decisionFirstCorrect:null,decisionAttempts:null,eventualCorrect:null,...t,...extra});
}
function completeItem(s,item,startMs,anchorEvent=null,{firstWrongCut=false}={}){
 const pid="p-"+item.itemId;
 assert.equal(appendBase(s,item,pid,"enclosure_presented",startMs,{eligibilityDeclaredBeforeResponse:true,hintAvailable:false},anchorEvent).ok,true);
 assert.equal(appendBase(s,item,pid,"enclosure_decision_presented",startMs+100,{decisionIndex:0},anchorEvent).ok,true);
 if(firstWrongCut){
  assert.equal(appendBase(s,item,pid,"enclosure_move_first",startMs+200,{decisionIndex:0,point:[18,18],legal:true,correct:false,hintUsed:false},anchorEvent).ok,true);
  assert.equal(appendBase(s,item,pid,"enclosure_move_retry",startMs+300,{decisionIndex:0,point:item.cutMove,legal:true,correct:true,hintUsed:false},anchorEvent).ok,true);
 }else{
  assert.equal(appendBase(s,item,pid,"enclosure_move_first",startMs+200,{decisionIndex:0,point:item.cutMove,legal:true,correct:true,hintUsed:false},anchorEvent).ok,true);
 }
 assert.equal(appendBase(s,item,pid,"enclosure_opponent_move",startMs+400,{decisionIndex:0,point:item.forcedExtension,forced:true},anchorEvent).ok,true);
 assert.equal(appendBase(s,item,pid,"enclosure_decision_presented",startMs+500,{decisionIndex:1},anchorEvent).ok,true);
 assert.equal(appendBase(s,item,pid,"enclosure_move_first",startMs+600,{decisionIndex:1,point:item.finishMove,legal:true,correct:true,hintUsed:false},anchorEvent).ok,true);
 const attempts=[firstWrongCut?2:1,1],first=[!firstWrongCut,true];
 const done=appendBase(s,item,pid,"enclosure_completed",startMs+700,{decisionFirstCorrect:first,decisionAttempts:attempts,eventualCorrect:true},anchorEvent);
 assert.equal(done.ok,true);
 return done.event;
}

test("四個 Enclosure full-board item 直接引用既有 rules fixture，canonical multi-step 全部可重播",()=>{
 const all=Contract.validateAll();assert.equal(all.ok,true,JSON.stringify(all));
 assert.deepEqual(Contract.orderedItems().map(item=>item.role),["practice","process_check","delayed_24h_process_check","delayed_7d_process_check"]);
 for(const item of Contract.items){
  assert.equal(Contract.validateItem(item),null,item.itemId);
  const cut=Contract.scoreCut(item,item.cutMove),finish=Contract.scoreFinish(item,item.finishMove);
  assert.equal(cut.correct,true,item.itemId);assert.equal(finish.correct,true,item.itemId);
  assert.equal(finish.capturedCount,item.expectedCapturedCount,item.itemId);
 }
});

test("Enclosure item 不猜門吃／抱吃 label，也不把 learner answer 欄位塞進 item",()=>{
 for(const item of Contract.items){
  assert.equal("sourceLabelCandidate" in item,false);
  assert.equal("answer" in item,false);
  assert.equal("correctMove" in item,false);
 }
 assert.equal(Contract.validateItem({...Contract.items[0],answer:[0,0]}),"enclosure_item_answer_injection_forbidden");
});

test("固定生命週期保存兩個 decision 的 first response；retry 不覆寫第一次錯誤",()=>{
 const s=storage(),base=Date.parse("2026-09-30T00:00:00Z"),[practice,process]=Contract.immediateItems();
 const pDone=completeItem(s,practice,base);
 const qDone=completeItem(s,process,base+5000,null,{firstWrongCut:true});
 assert.deepEqual(qDone.decisionFirstCorrect,[false,true]);
 assert.deepEqual(qDone.decisionAttempts,[2,1]);
 const summary=Analysis.summarizeStore(Events.read(s).store,base+10000);
 const row=summary.items.find(item=>item.itemId===process.itemId);
 assert.deepEqual(row.firstCorrect,[false,true]);
 assert.deepEqual(row.retryCountByDecision,[1,0]);
 assert.equal(summary.mastery,null);assert.equal(summary.transferConclusion,null);
 assert.equal(pDone.eventualCorrect,true);
});

test("24h 與 7d 都錨定 immediate process completion；不到時間不得呈現，7d 還必須等 24h 完成",()=>{
 const s=storage(),base=Date.parse("2026-09-20T00:00:00Z"),[practice,process]=Contract.immediateItems(),[d24,d7]=Contract.delayedItems();
 completeItem(s,practice,base);const anchor=completeItem(s,process,base+5000);
 let store=Events.read(s).store;
 const before24=Policy.statusFor(store,d24,Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_24H_MS-1);
 assert.equal(before24.status,Policy.STATUS.WAITING_FOR_DELAY);
 const due24=Policy.statusFor(store,d24,Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_24H_MS);
 assert.equal(due24.status,Policy.STATUS.READY);
 const before7=Policy.statusFor(store,d7,Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_7D_MS);
 assert.equal(before7.status,Policy.STATUS.LOCKED);
 const d24Done=completeItem(s,d24,Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_24H_MS,anchor);
 store=Events.read(s).store;
 const now7=Policy.statusFor(store,d7,Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_7D_MS);
 assert.equal(now7.status,Policy.STATUS.READY);
 assert.equal(d24Done.retrievalTiming,"delayed_24h");
});

test("7d presentation 早於 dueAt 或跳過 24h item 都在 event/policy 層 fail closed",()=>{
 const s=storage(),base=Date.parse("2026-09-20T00:00:00Z"),[practice,process]=Contract.immediateItems(),[,d7]=Contract.delayedItems();
 completeItem(s,practice,base);const anchor=completeItem(s,process,base+5000);
 const due=Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_7D_MS;
 const early=appendBase(s,d7,"early","enclosure_presented",due-1,{eligibilityDeclaredBeforeResponse:true,hintAvailable:false},anchor);
 assert.equal(early.ok,false);
 assert.match(early.error,/previous_item_incomplete|delayed_time_relation_invalid/);
});

test("呈現後未答仍進 denominator",()=>{
 const s=storage(),base=Date.parse("2026-09-30T00:00:00Z"),[practice]=Contract.immediateItems();
 assert.equal(appendBase(s,practice,"p","enclosure_presented",base,{eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 const summary=Analysis.summarizeStore(Events.read(s).store,base);
 const row=summary.items[0];assert.equal(row.denominator,1);assert.equal(row.unanswered,true);assert.equal(row.firstResponseObserved[0],false);
});


test("tampered delayed anchor 不得只靠 event 自洽通過 policy",()=>{
 const s=storage(),base=Date.parse("2026-09-20T00:00:00Z"),[practice,process]=Contract.immediateItems(),[d24]=Contract.delayedItems();
 completeItem(s,practice,base);const anchor=completeItem(s,process,base+5000);
 const due=Date.parse(anchor.occurredAt)+Contract.MIN_DELAY_24H_MS;
 completeItem(s,d24,due,anchor);
 const store=Events.read(s).store;
 const presented=store.events.find(e=>e.itemId===d24.itemId&&e.type==="enclosure_presented");
 presented.anchorEventId="forged-anchor";
 const status=Policy.statusFor(store,d24,due+1000);
 assert.equal(status.ok,false);
 assert.equal(status.error,"enclosure_delayed_anchor_mismatch");
});
