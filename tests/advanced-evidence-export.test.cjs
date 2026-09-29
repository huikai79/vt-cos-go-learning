const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Exporter=require("../advanced-evidence-export.js");
const Choice=require("../advanced-events.js");
const Sequence=require("../advanced-sequence-events.js");
const Comparison=require("../advanced-decision-comparison-events.js");

function storage(){
 const data=new Map();
 return{
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key),
  _data:data
 };
}

test("空的 Advanced stores 仍能形成完整、無權威升格的備份",()=>{
 const s=storage();
 const bundle=Exporter.buildBundle(s,{exportedAt:"2026-09-29T09:00:00.000Z"});
 assert.equal(bundle.bundleVersion,"advanced-evidence-bundle-v2");
 assert.equal(bundle.schemaVersion,2);
 assert.equal(bundle.complete,true);
 assert.deepEqual(bundle.errors,[]);
 assert.equal(bundle.authority,"advanced_practice_backup_only");
 assert.equal(bundle.formalEligible,false);
 assert.equal(bundle.skillUpdateEligible,false);
 assert.equal(bundle.schedulerEligible,false);
 assert.equal(bundle.independentEvaluation,false);
 assert.equal(bundle.mastery,null);
 assert.equal(bundle.learningEffect,null);
 for(const entry of Object.values(bundle.streams)){
  assert.equal(entry.status,"ok",entry.name);
  assert.ok(Array.isArray(entry.events),entry.name);
 }
 assert.equal(bundle.comparableAnalysis.authority,"descriptive_process_check_only");
 assert.equal(bundle.comparableAnalysis.transferConclusion,null);
 assert.equal(bundle.streams.delayedComparable.status,"ok");
 assert.equal(bundle.delayedComparableAnalysis.authority,"descriptive_delayed_process_check_only");
 assert.equal(bundle.delayedComparableAnalysis.retentionConclusion,null);
 assert.equal(bundle.delayedComparableAnalysis.transferConclusion,null);
});

test("choice practice 健康事件會原樣保留在 bundle",()=>{
 const s=storage();
 const appended=Choice.append(s,{
  eventId:"choice-e1",sessionId:"choice-s",presentationId:"choice-p",
  experienceId:"adv-reading-01",trackId:"reading-tesuji",type:"answer_first",
  occurredAt:"2026-09-29T09:01:00.000Z",selectedIndex:1,correct:false,hintShown:false
 });
 assert.equal(appended.ok,true);
 const bundle=Exporter.buildBundle(s);
 assert.equal(bundle.complete,true);
 assert.equal(bundle.streams.choicePractice.events.length,1);
 assert.equal(bundle.streams.choicePractice.events[0].type,"answer_first");
 assert.equal(bundle.streams.choicePractice.events[0].correct,false);
});

test("sequence v1/v2/v3 分開備份，不把 legacy 改寫成目前版本",()=>{
 const s=storage();
 s.setItem(Sequence.V1_STORAGE_KEY,JSON.stringify({
  schemaVersion:1,eventStreamVersion:"advanced-sequence-events-v1",events:[]
 }));
 s.setItem(Sequence.LEGACY_STORAGE_KEY,JSON.stringify({
  schemaVersion:2,eventStreamVersion:"advanced-sequence-events-v2",events:[]
 }));
 s.setItem(Sequence.STORAGE_KEY,JSON.stringify({
  schemaVersion:3,eventStreamVersion:"advanced-sequence-events-v3",events:[]
 }));
 const bundle=Exporter.buildBundle(s);
 assert.equal(bundle.complete,true);
 assert.equal(bundle.streams.sequenceV1.schemaVersion,1);
 assert.equal(bundle.streams.sequenceV1.eventStreamVersion,"advanced-sequence-events-v1");
 assert.equal(bundle.streams.sequenceV2.schemaVersion,2);
 assert.equal(bundle.streams.sequenceV2.eventStreamVersion,"advanced-sequence-events-v2");
 assert.equal(bundle.streams.sequenceV3.schemaVersion,3);
 assert.equal(bundle.streams.sequenceV3.eventStreamVersion,"advanced-sequence-events-v3");
});

test("一個 store malformed 時仍匯出健康 streams，但 complete=false 且不洩漏 raw 壞資料",()=>{
 const s=storage();
 const secretBroken='{broken-raw-do-not-export';
 s.setItem(Comparison.STORAGE_KEY,secretBroken);
 const appended=Choice.append(s,{
  eventId:"choice-e2",sessionId:"choice-s",presentationId:"choice-p2",
  experienceId:"adv-reading-02",trackId:"reading-tesuji",type:"answer_first",
  occurredAt:"2026-09-29T09:02:00.000Z",selectedIndex:0,correct:true,hintShown:false
 });
 assert.equal(appended.ok,true);

 const bundle=Exporter.buildBundle(s);
 assert.equal(bundle.complete,false);
 assert.equal(bundle.streams.decisionComparison.status,"error");
 assert.match(bundle.streams.decisionComparison.error,/malformed/);
 assert.equal(bundle.streams.decisionComparison.store,null);
 assert.equal(bundle.streams.choicePractice.status,"ok");
 assert.equal(bundle.streams.choicePractice.events.length,1);
 assert.ok(bundle.errors.some(item=>item.stream==="decisionComparison"));
 assert.equal(JSON.stringify(bundle).includes(secretBroken),false);
});

test("storage read exception 只污染對應 streams，不偽裝成空 store",()=>{
 const base=storage();
 const wrapped={
  getItem(key){
   if(key===Comparison.STORAGE_KEY)throw new Error("denied");
   return base.getItem(key);
  },
  setItem:(key,value)=>base.setItem(key,value)
 };
 const bundle=Exporter.buildBundle(wrapped);
 assert.equal(bundle.complete,false);
 assert.equal(bundle.streams.decisionComparison.status,"error");
 assert.match(bundle.streams.decisionComparison.error,/store_read_exception/);
 assert.equal(bundle.streams.choicePractice.status,"ok");
});

test("Advanced 頁提供單向原始事件備份，明示不屬正式評量",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","advanced.html"),"utf8");
 assert.match(html,/advanced-comparable-analysis\.js\?v=advanced-comparable-analysis-v1/);
 assert.match(html,/advanced-evidence-export\.js\?v=advanced-evidence-export-v1/);
 assert.match(html,/advanced-evidence-export-ui\.js\?v=advanced-evidence-export-v1/);
 assert.match(html,/id="advanced-export-evidence"/);
 assert.match(html,/匯出進階練習原始事件/);
 assert.match(html,/只作備份與分析，不作正式評量/);
});


test("schema 合法但 event authority 被污染時不得標成健康 stream",()=>{
 const s=storage();
 s.setItem(Comparison.STORAGE_KEY,JSON.stringify({
  schemaVersion:1,
  eventStreamVersion:"advanced-decision-comparison-events-v1",
  events:[{
   schemaVersion:1,eventStreamVersion:"advanced-decision-comparison-events-v1",
   type:"comparison_requested",eventId:"bad",sessionId:"s",reviewId:"r",requestId:"q",
   sourceId:"src",positionFingerprint:"p",comparisonContractVersion:"c",
   providerContractVersion:"p",occurredAt:"2026-09-29T09:03:00.000Z",
   formalEligible:true,evidenceUse:"advanced_sgf_comparison_reference_only",
   evaluationContext:"sgf_decision_comparison",transferLevel:null
  }]
 }));
 const bundle=Exporter.buildBundle(s);
 assert.equal(bundle.complete,false);
 assert.equal(bundle.streams.decisionComparison.status,"error");
 assert.match(bundle.streams.decisionComparison.error,/event_invalid:comparison_event_authority_invalid/);
 assert.equal(bundle.streams.decisionComparison.store,null);
});


test("delayed comparable store malformed 時只污染 delayed stream，且 raw 壞資料不外洩",()=>{
 const s=storage();
 const DelayedEvents=require("../advanced-delayed-comparable-events.js");
 const secret='{broken-delayed-secret';
 s.setItem(DelayedEvents.STORAGE_KEY,secret);
 const bundle=Exporter.buildBundle(s,{exportedAt:"2026-09-29T10:00:00.000Z"});
 assert.equal(bundle.complete,false);
 assert.equal(bundle.streams.delayedComparable.status,"error");
 assert.equal(bundle.streams.delayedComparable.store,null);
 assert.ok(bundle.errors.some(item=>item.stream==="delayedComparable"));
 assert.equal(bundle.streams.comparablePosition.status,"ok");
 assert.equal(JSON.stringify(bundle).includes(secret),false);
});
