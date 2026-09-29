const test=require("node:test");
const assert=require("node:assert/strict");
const Contract=require("../advanced-comparable-position-contract.js");
const Events=require("../advanced-comparable-position-events.js");
const Analysis=require("../advanced-comparable-analysis.js");

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
function baseEvent(item,attemptId="a"){
 return{
  eventId:"e-"+attemptId,
  sessionId:"s",
  attemptId,
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
  occurredAt:"2026-09-29T09:00:00.000Z"
 };
}
function appendPresented(s,item,attemptId){
 return Events.append(s,{...baseEvent(item,attemptId),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
}
function appendFirst(s,item,attemptId,correct,eventId="first"){
 return Events.append(s,{...baseEvent(item,attemptId),eventId,type:"comparable_first",point:[0,0],legal:true,correct,hintUsed:false});
}
function appendRetry(s,item,attemptId,correct,eventId="retry"){
 return Events.append(s,{...baseEvent(item,attemptId),eventId,type:"comparable_retry",point:[1,1],legal:true,correct,hintUsed:false});
}
function appendCompleted(s,item,attemptId,firstCorrect,eventualCorrect,attempts){
 return Events.append(s,{...baseEvent(item,attemptId),eventId:"completed-"+attemptId,type:"comparable_completed",firstCorrect,eventualCorrect,attempts});
}

test("pair summary 只用第一次 presentation 的 first response，retry 不覆寫",()=>{
 const s=storage(),pair=Contract.pairs[0],source=pair.source,target=pair.target;
 appendPresented(s,source,"s1");appendFirst(s,source,"s1",false,"sf");appendRetry(s,source,"s1",true,"sr");appendCompleted(s,source,"s1",false,true,2);
 appendPresented(s,target,"t1");appendFirst(s,target,"t1",true,"tf");appendCompleted(s,target,"t1",true,true,1);
 const summary=Analysis.summarizePair(Events.read(s).store,pair);
 assert.equal(summary.ok,true);
 assert.equal(summary.status,Analysis.STATUS.COMPLETE);
 assert.equal(summary.source.firstCorrect,false);
 assert.equal(summary.source.eventualCorrect,true);
 assert.equal(summary.target.firstCorrect,true);
 assert.equal(summary.transition,"source_incorrect_target_correct");
 assert.equal(summary.transferConclusion,null);
 assert.equal(summary.mastery,null);
});

test("target 已呈現但未答必須留在分母，不能因未答消失",()=>{
 const s=storage(),pair=Contract.pairs[0];
 appendPresented(s,pair.source,"s1");appendFirst(s,pair.source,"s1",true,"sf");
 appendPresented(s,pair.target,"t1");
 const summary=Analysis.summarizePair(Events.read(s).store,pair);
 assert.equal(summary.status,Analysis.STATUS.TARGET_UNANSWERED);
 assert.equal(summary.targetProcessCheckDenominator,1);
 assert.equal(summary.targetFirstResponseNumerator,0);
 assert.equal(summary.targetUnanswered,true);
 assert.equal(summary.transition,null);
});

test("target 尚未呈現時不能偷偷進 process-check 分母",()=>{
 const s=storage(),pair=Contract.pairs[0];
 appendPresented(s,pair.source,"s1");appendFirst(s,pair.source,"s1",true,"sf");
 const summary=Analysis.summarizePair(Events.read(s).store,pair);
 assert.equal(summary.status,Analysis.STATUS.TARGET_NOT_PRESENTED);
 assert.equal(summary.targetProcessCheckDenominator,0);
 assert.equal(summary.targetUnanswered,false);
});

test("重新開始同一 item 不能取較好的後一次首答覆蓋第一次 presentation",()=>{
 const s=storage(),pair=Contract.pairs[0],item=pair.source;
 appendPresented(s,item,"a1");appendFirst(s,item,"a1",false,"f1");
 appendPresented(s,item,"a2");appendFirst(s,item,"a2",true,"f2");
 const itemSummary=Analysis.summarizeFirstPresentation(Events.read(s).store,item);
 assert.equal(itemSummary.presentationCount,2);
 assert.equal(itemSummary.attemptId,"a1");
 assert.equal(itemSummary.firstCorrect,false);
});

test("store aggregate 只輸出描述性 process-check，不產生 KC/scheduler/formal authority",()=>{
 const s=storage();
 const summary=Analysis.summarizeStore(Events.read(s).store);
 assert.equal(summary.ok,true);
 assert.equal(summary.authority,"descriptive_process_check_only");
 assert.equal(summary.constructValidated,false);
 assert.equal(summary.skillUpdateEligible,false);
 assert.equal(summary.schedulerEligible,false);
 assert.equal(summary.formalEligible,false);
 assert.equal(summary.independentEvaluation,false);
 assert.equal(summary.mastery,null);
 assert.equal(summary.transferConclusion,null);
});

test("生命週期矛盾 fail closed，不用完成事件補造首答",()=>{
 const pair=Contract.pairs[0],item=pair.source;
 const store=Events.read(storage()).store;
 store.events.push({
  ...baseEvent(item,"bad"),
  schemaVersion:Events.SCHEMA_VERSION,
  eventStreamVersion:Events.STREAM_VERSION,
  type:"comparable_presented",
  kcHypothesisId:item.kcHypothesisId,
  kcHypothesisVersion:item.kcHypothesisVersion,
  constructValidated:false,
  boardSize:19,publicItem:true,formalEligible:false,independentEvaluation:false,schedulerEligible:false,skillUpdateEligible:false,qualifiedOpportunity:false,
  transferLevel:"T0",evidenceUse:"advanced_comparable_practice",evaluationContext:"practice",
  eligibilityDeclaredBeforeResponse:true,hintAvailable:false
 });
 store.events.push({
  ...store.events[0],
  eventId:"bad-complete",
  type:"comparable_completed",
  firstCorrect:true,eventualCorrect:true,attempts:1
 });
 const summary=Analysis.summarizePair(store,pair);
 assert.equal(summary.ok,false);
 assert.equal(summary.status,Analysis.STATUS.INVALID);
 assert.equal(summary.error,"completion_without_first");
});
