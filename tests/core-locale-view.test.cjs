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
