const test=require("node:test");
const assert=require("node:assert/strict");
const Framework=require("../advanced-comparable-framework-v2.js");
const Immediate=require("../advanced-comparable-events-v2.js");
const Delay24=require("../advanced-delayed-comparable-events-v2.js");
const Delay24Policy=require("../advanced-delayed-comparable-policy-v2.js");
const Contract=require("../advanced-seven-day-comparable-contract.js");
const Events=require("../advanced-seven-day-comparable-events.js");
const Policy=require("../advanced-seven-day-comparable-policy.js");
const Analysis=require("../advanced-seven-day-comparable-analysis.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
function iso(ms){return new Date(ms).toISOString();}
function ibase(item,attempt,eventId,occurredAt){return{eventId,sessionId:"s",attemptId:attempt,itemId:item.itemId,itemVersion:item.itemVersion,occurredAt};}
function completeImmediate(s,start){
 let ms=start;
 for(const item of Framework.immediateItems()){
  const a="a-"+item.itemId;
  assert.equal(Immediate.append(s,{...ibase(item,a,"p-"+item.itemId,iso(ms)),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);ms+=1000;
  const point=Framework.successfulPoints(item.familyId,item)[0],score=Framework.scoreResponse(item.familyId,item,point);
  assert.equal(Immediate.append(s,{...ibase(item,a,"f-"+item.itemId,iso(ms)),type:"comparable_first",point,legal:score.legal,correct:score.correct,hintUsed:false}).ok,true);ms+=1000;
  assert.equal(Immediate.append(s,{...ibase(item,a,"c-"+item.itemId,iso(ms)),type:"comparable_completed",firstCorrect:true,eventualCorrect:true,attempts:1}).ok,true);ms+=1000;
 }
 return Immediate.read(s).store;
}
function complete24(s,immediate){
 const anchor=Delay24Policy.anchor(immediate),item=Framework.delayedItems()[0],due=anchor.anchorMs+Framework.MIN_DELAY_MS,a="d24";
 const meta={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:iso(due),minimumDelayMs:Framework.MIN_DELAY_MS};
 assert.equal(Delay24.append(s,{...ibase(item,a,"d24-p",iso(due)),type:"delayed_presented",...meta,actualDelayMs:Framework.MIN_DELAY_MS,eligibilityDeclaredBeforeResponse:true,hintAvailable:false}).ok,true);
 const point=Framework.successfulPoints(item.familyId,item)[0],score=Framework.scoreResponse(item.familyId,item,point);
 assert.equal(Delay24.append(s,{...ibase(item,a,"d24-f",iso(due+1000)),type:"delayed_first",...meta,actualDelayMs:Framework.MIN_DELAY_MS+1000,point,legal:score.legal,correct:true,hintUsed:false}).ok,true);
 assert.equal(Delay24.append(s,{...ibase(item,a,"d24-c",iso(due+2000)),type:"delayed_completed",...meta,actualDelayMs:Framework.MIN_DELAY_MS+2000,firstCorrect:true,eventualCorrect:true,attempts:1}).ok,true);
 return Delay24.read(s).store;
}
function sevenInput(type,ms,meta,extra={}){
 const item=Contract.item;
 return{eventId:type+"-"+ms,sessionId:"s7",attemptId:"a7",itemId:item.itemId,anchorEventId:meta.anchorEventId,anchorOccurredAt:meta.anchorOccurredAt,dueAt:meta.dueAt,minimumDelayMs:Contract.MIN_DELAY_MS,actualDelayMs:ms-Date.parse(meta.anchorOccurredAt),occurredAt:iso(ms),type,...extra};
}

test("7d fresh Double Atari item 唯一解且 surface descriptor 不重用 P0 三題",()=>{
 assert.equal(Contract.validateItem(Contract.item),null);
 const success=Contract.successfulPoints();assert.equal(success.length,1);
 const score=Contract.scoreResponse(success[0]);assert.equal(score.correct,true);assert.equal(score.newlyAtariCount,2);assert.equal(score.capturedCount,0);
 for(const old of Framework.items) assert.equal(Framework.sameDoubleAtariSurface(Contract.item,old),false,old.itemId);
});

test("7d 必須先完成 immediate 與 24h；未滿 7x24h 不得呈現",()=>{
 const is=storage(),base=Date.parse("2026-09-20T00:00:00Z"),immediate=completeImmediate(is,base);
 const d24s=storage(),empty24=Delay24.read(d24s).store,s7=Events.read(storage()).store,anchor=Policy.anchor(immediate);
 let status=Policy.statusFor(immediate,empty24,s7,anchor.anchorMs+Contract.MIN_DELAY_MS);
 assert.equal(status.status,Policy.STATUS.WAITING_FOR_24H);
 const d24=complete24(d24s,immediate);
 status=Policy.statusFor(immediate,d24,s7,anchor.anchorMs+Contract.MIN_DELAY_MS-1);
 assert.equal(status.status,Policy.STATUS.WAITING_FOR_DELAY);
 status=Policy.statusFor(immediate,d24,s7,anchor.anchorMs+Contract.MIN_DELAY_MS);
 assert.equal(status.status,Policy.STATUS.DUE);
 assert.equal(status.presentationMetadata.actualDelayMs,Contract.MIN_DELAY_MS);
});

test("forged early 7d event fail closed；clock rollback 也 INVALID",()=>{
 const is=storage(),base=Date.parse("2026-09-20T00:00:00Z"),immediate=completeImmediate(is,base),d24s=storage(),d24=complete24(d24s,immediate);
 const ss=storage(),anchor=Policy.anchor(immediate),due=anchor.anchorMs+Contract.MIN_DELAY_MS,meta={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:iso(due)};
 const early=Events.append(ss,sevenInput("seven_day_presented",due-1,meta,{eligibilityDeclaredBeforeResponse:true,hintAvailable:false}));
 assert.equal(early.ok,false);
 const clock=Policy.statusFor(immediate,d24,Events.read(ss).store,anchor.anchorMs-1);
 assert.equal(clock.ok,false);assert.equal(clock.error,"seven_day_clock_before_anchor");
});

test("7d first wrong -> retry correct 保留 firstCorrect，analysis 不產 retention/transfer 結論",()=>{
 const is=storage(),base=Date.parse("2026-09-20T00:00:00Z"),immediate=completeImmediate(is,base),d24s=storage(),d24=complete24(d24s,immediate);
 const ss=storage(),anchor=Policy.anchor(immediate),due=anchor.anchorMs+Contract.MIN_DELAY_MS,meta={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:iso(due)};
 assert.equal(Events.append(ss,sevenInput("seven_day_presented",due,meta,{eligibilityDeclaredBeforeResponse:true,hintAvailable:false})).ok,true);
 assert.equal(Events.append(ss,sevenInput("seven_day_first",due+1000,meta,{point:[0,0],legal:true,correct:false,hintUsed:false})).ok,true);
 const point=Contract.successfulPoints()[0];
 assert.equal(Events.append(ss,sevenInput("seven_day_retry",due+2000,meta,{point,legal:true,correct:true,hintUsed:false})).ok,true);
 assert.equal(Events.append(ss,sevenInput("seven_day_completed",due+3000,meta,{firstCorrect:false,eventualCorrect:true,attempts:2})).ok,true);
 const summary=Analysis.summarize(immediate,d24,Events.read(ss).store,due+3000);
 assert.equal(summary.ok,true);assert.equal(summary.firstCorrect,false);assert.equal(summary.eventualCorrect,true);
 assert.equal(summary.retentionConclusion,null);assert.equal(summary.transferConclusion,null);assert.equal(summary.mastery,null);
 assert.equal(summary.schedulerEligible,false);assert.equal(summary.formalEligible,false);
});

test("7d presentation 進 denominator；未答不能消失",()=>{
 const is=storage(),base=Date.parse("2026-09-20T00:00:00Z"),immediate=completeImmediate(is,base),d24s=storage(),d24=complete24(d24s,immediate);
 const ss=storage(),anchor=Policy.anchor(immediate),due=anchor.anchorMs+Contract.MIN_DELAY_MS,meta={anchorEventId:anchor.anchorEvent.eventId,anchorOccurredAt:anchor.anchorEvent.occurredAt,dueAt:iso(due)};
 assert.equal(Events.append(ss,sevenInput("seven_day_presented",due,meta,{eligibilityDeclaredBeforeResponse:true,hintAvailable:false})).ok,true);
 const summary=Analysis.summarize(immediate,d24,Events.read(ss).store,due);
 assert.equal(summary.denominator,1);assert.equal(summary.unanswered,true);assert.equal(summary.firstResponseObserved,false);
});
