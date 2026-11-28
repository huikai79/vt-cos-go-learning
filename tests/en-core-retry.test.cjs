"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {retryText}=require("../core-locale-view.js");
const source=require("../content.js");
const drafts=require("../locales/en/core-retry-drafts.json");
test("all 106 English post-answer retry drafts match canonical items",()=>{
 const ids=Object.keys(drafts.items);
 assert.equal(ids.length,source.problems.length);
 for(const id of ids){assert.ok(source.problems.some(p=>p.id===id));const item=drafts.items[id];assert.equal(item.id,id);assert.ok(item.text.length>50);assert.equal(item.nativeReview,"pending");}
});
test("unreviewed or incomplete English retry cannot become a teaching hint",()=>{
 const problem=source.problems.find(x=>x.id==="u1-06");
 assert.throws(()=>retryText("en",problem,drafts),/retry bundle unavailable/);
 assert.throws(()=>retryText("en",problem,{...drafts,status:"approved-for-runtime"}),/unreviewed retry/);
 assert.equal(retryText("zh-Hant-TW",problem,drafts),problem.retry||"再找一次沿線相鄰的交叉點。");
 const finalItem=source.problems.find(x=>x.id==="u15-06");
 assert.throws(()=>retryText("en",finalItem,{...drafts,status:"approved-for-runtime"}),/unreviewed retry/);
});
test("runtime asks for retry copy only after incorrect choice; evaluator remains canonical",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
 assert.match(app,/reportAnswer\(correct, correct \? "" : visibleRetry\(current\(\)\)/);
 assert.match(app,/const correct = value === current\(\)\.answer/);
 assert.match(app,/firstAnswer: isFirstAnswer/);
 assert.match(app,/recordEvent\("answer"/);
});