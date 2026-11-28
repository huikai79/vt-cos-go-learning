"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const draft=require("../locales/en/core-lesson-drafts.json");
const source=require("../content.js");
test("English Core authored lesson drafts cover exact source lesson IDs without replacing Go authority",()=>{
 assert.equal(draft.locale,"en");
 assert.equal(draft.status,"partial-draft-not-for-runtime-or-release");
 assert.equal(draft.units.length,source.units.length);
 assert.equal(draft.lessons.length,source.lessons.length);
 for(const [i,item] of draft.lessons.entries()){
  assert.equal(item.lessonIndex,i);
  assert.ok(item.title.length>4 && item.text.length>35 && item.takeaway.length>15);
  assert.equal(item.goReview,"pending");
  assert.equal(item.nativeReview,"pending");
 }
 assert.ok(draft.missing.length>=5);
});
test("No unscreened English lesson draft promoted to learner runtime",()=>{
 const fs=require("node:fs");
 const html=fs.readFileSync(require("node:path").resolve(__dirname,"../index.html"),"utf8");
 assert.doesNotMatch(html,/core-lesson-drafts\.json/);
 const locales=require("../site-locales.json");
 assert.equal(locales.locales.find(x=>x.id==="en").publishable,false);
});