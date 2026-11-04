"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const preview=require("../homepage-english-preview.cjs");
const site=require("../site-locales.json");
test("Homepage English preview exists only behind an explicit isolated authoring request",()=>{
 assert.throws(()=>preview.buildPreview(),{code:"LOCALE_COPY_BLOCKED"});
 assert.throws(()=>preview.buildPreview({preview:true,runtime:true}),{code:"LOCALE_COPY_BLOCKED"});
 assert.throws(()=>preview.buildPreview({preview:true,publishable:true}),{code:"LOCALE_COPY_BLOCKED"});
 assert.equal(site.locales.find(x=>x.id==="en").publishable,false);
});
test("Preview maps source-scoped English including ARIA and dynamic before/after without fallback",()=>{
 const v=preview.buildPreview({preview:true});
 assert.equal(v.status,"isolated-candidate-preview");
 assert.ok(v.coverageKeys.length>=150);
 assert.match(v.text("hero-intro"),/does not count as a course answer/);
 assert.match(v.text("header-navigation-aria"),/homepage navigation/);
 assert.match(v.text("preview-live-after","homepage-experience.js"),/original choice/);
 assert.match(v.text("preview-live-before","homepage-experience.js"),/Nothing was added/);
 assert.throws(()=>v.text("preview-live-after"),{code:"LOCALE_COPY_BLOCKED"});
 assert.throws(()=>v.text("unknown"),{code:"LOCALE_COPY_BLOCKED"});
 assert.throws(()=>v.sourceText("unexpected Chinese instruction"),{code:"LOCALE_COPY_BLOCKED"});
 assert.equal(v.sourceText("需要先懂規則嗎？"),"Do I need to know the rules?");
});
