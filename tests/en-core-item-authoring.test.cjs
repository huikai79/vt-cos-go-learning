"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const core=require("../content.js");
const draft=require("../locales/en/core-item-drafts.json");
test("English item drafts have unique canonical item IDs and preserve all source scoring fields",()=>{
 const originals=new Map(core.problems.map(p=>[p.id,p]));
 const keys=Object.keys(draft.items);
 assert.equal(keys.length,draft.itemCount);
 assert.ok(keys.length>0 && keys.length<core.problems.length,"partial coverage must not be advertised as full");
 for(const [id,item] of Object.entries(draft.items)){
  assert.ok(originals.has(id),"unknown item "+id);
  assert.equal(id,item.id);
  assert.ok(item.title.length>3 && item.prompt.length>10 && item.hint.length>8 && item.explanation.length>15,id);
  assert.equal(item.editorialStatus,"draft");
  assert.equal(item.goReview,"pending");
  assert.equal(item.nativeReview,"pending");
  assert.ok(!("answer" in item)&&!("goal" in item)&&!("stones" in item)&&!("scoring" in item),id);
 }
});
test("Unreviewed item copy is not published as a complete English locale",()=>{
 const manifest=require("../site-locales.json");
 const en=manifest.locales.find(x=>x.id==="en");
 assert.equal(en.publishable,false);
 assert.equal(draft.status,"candidate-not-runtime");
 assert.equal(draft.contentAuthority,"GoContent");
 const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
 assert.doesNotMatch(html,/core-item-drafts\.json/);
});
