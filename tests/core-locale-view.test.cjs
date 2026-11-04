"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {languageView}=require("../core-locale-view.js");
const source=require("../content.js");
const lessons=require("../locales/en/core-lesson-drafts.json");
const items=require("../locales/en/core-item-drafts.json");
const demos=require("../locales/en/core-demo-drafts.json");
const terms=require("../locales/en/core-demo-term-drafts.json");
const bundle={schemaVersion:1,locale:"en",status:"approved-for-runtime",lessons,items,demos,terms};
test("source rendering maps unchanged canonical records",()=>{
 const v=languageView(source,null,"zh-Hant-TW");
 assert.equal(v.problem("u1-01"),source.problems[0]);
 assert.equal(v.lesson(0),source.lessons[0]);
});
test("drafts never become approved runtime via a bundle flag alone",()=>{
 assert.throws(()=>languageView(source,bundle,"en"),/LOCALE_COPY_BLOCKED|human or Go review incomplete/);
 assert.throws(()=>languageView(source,{...bundle,status:"candidate-not-runtime"},"en"),/bundle not promoted/);
});
test("incomplete lesson, item or glossary coverage fails closed",()=>{
 assert.throws(()=>languageView(source,{...bundle,lessons:{...lessons,lessons:[]}},"en"),/incomplete canonical coverage/);
 assert.throws(()=>languageView(source,{...bundle,items:{...items,items:{}}},"en"),/incomplete canonical coverage/);
});
test("unknown locales fail and scoring never comes from translation",()=>{
 assert.throws(()=>languageView(source,bundle,"fr"),/locale fr/);
 const fs=require("node:fs");
 const runtime=fs.readFileSync(require("node:path").join(__dirname,"../core-locale-view.js"),"utf8");
 assert.doesNotMatch(runtime,/localStorage|sessionStorage|\.setItem\s*\(|\.answer\s*=/);
});
test("English UI separates formal hidden feedback, ordinary retry and storage-safe errors",()=>{
 const {uiText}=require("../core-locale-view.js");
 assert.match(uiText("en","evaluationRecorded",""),/Results stay hidden/);
 assert.doesNotMatch(uiText("en","evaluationRecorded",""),/Correct|Incorrect|wrong/i);
 assert.match(uiText("en","retryAfterWrong",""),/try again/);
 assert.match(uiText("en","occupiedPoint",""),/already a stone/);
 assert.equal(uiText("zh-Hant-TW","correctTitle","答對了"),"答對了");
 assert.throws(()=>uiText("en","nonexistent",""),/LOCALE_COPY_BLOCKED|missing UI string/);
 assert.equal(uiText("en","termCount","",{count:1}),"(1 term)");
 assert.equal(uiText("en","termCount","",{count:2}),"(2 terms)");
});

test("instructions and keyboard accessibility copy are presentation only",()=>{
 const {uiText}=require("../core-locale-view.js");
 for(const key of ["moveInstruction","choiceFocused","choiceRead","spotInstruction","playableBoard","observedBoard","selectedPointBoard","hintShown","demoRestart","demoNext"]) {
  assert.ok(uiText("en",key,"").length>3,key);
 }
 assert.match(uiText("en","evaluationPolicy",""),/Correctness stays hidden/);
 assert.equal(uiText("en","liberties","",{count:1}),"1 liberty");
 assert.equal(uiText("en","liberties","",{count:4}),"4 liberties");
 assert.equal(uiText("zh-Hant-TW","moveInstruction","點選落子"),"點選落子");
});

test("storage failures and unknown engine reasons remain explicit failures in English",()=>{
 const {uiText,legalMoveFailureText}=require("../core-locale-view.js");
 for(const key of ["storageRecoverySaved","storageRecoveryFailed","storageWriteFailed","storageUnsavedResult"]){
   const text=uiText("en",key,"");
   assert.ok(text.length>45,key);
 }
 assert.match(uiText("en","storageWriteFailed",""),/could not be saved/);
 assert.match(uiText("en","storageRecoveryFailed",""),/not been saved/);
 assert.match(legalMoveFailureText("en","這手沒有氣，也沒有提掉對方的棋。"),/not legal/);
 assert.match(legalMoveFailureText("en","這手會立刻回到上一個棋形；依簡單劫規則，必須先在別處下一手。"),/simple ko/);
 assert.match(legalMoveFailureText("en","provider unexpectedly failed"),/could not verify/);
 assert.doesNotMatch(legalMoveFailureText("en","provider unexpectedly failed"),/success|correct/i);
 assert.equal(legalMoveFailureText("zh-Hant-TW","任意原始錯誤"),"任意原始錯誤");
 const app=require("node:fs").readFileSync(require("node:path").join(__dirname,"../app.js"),"utf8");
 assert.match(app,/uiText\("storageWriteFailed"/);
 assert.match(app,/legalMoveFailureText\(displayLocale, result.reason\)/);
 assert.match(app,/firstAnswer: isFirstAnswer/);
});

test("Core progress and spaced review English are isolated from canonical counters",()=>{
 const {uiText}=require("../core-locale-view.js");
 assert.match(uiText("en","progressRemaining","",{count:1}),/1 question remaining/);
 assert.match(uiText("en","progressRemaining","",{count:2}),/2 questions remaining/);
 assert.match(uiText("en","scheduledReviewDue","",{count:2}),/not change Core lesson progress/);
 assert.match(uiText("en","progressComplete","",{count:15}),/does not establish a playing rank/);
 assert.match(uiText("en","dueReviewAria","",{count:1}),/1 review question is due/);
 assert.equal(uiText("zh-Hant-TW","progressRemaining","還有 2 題待完成",{count:2}),"還有 2 題待完成");
 const app=require("node:fs").readFileSync(require("node:path").join(__dirname,"../app.js"),"utf8");
 for(const key of ["progressComplete","progressRemaining","dueReviewAria","scheduledReviewButton","scheduledReviewDue","scheduledReviewEmpty","resumeCurrentQuestion"]) assert.ok(app.includes('uiText("'+key+'"'),key);
 assert.match(app,/state\.completed\.size \/ problems\.length \* 100/);
 assert.match(app,/state\.scheduler\.reviews\[problem\.id\]/);
});
