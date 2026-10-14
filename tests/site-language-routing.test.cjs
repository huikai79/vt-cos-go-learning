"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const router=require("../site-language.js");
const root=path.resolve(__dirname,"..");
const config=require("../site-locales.json");
test("eleven public pages load the same locale guard without changing source language",()=>{
 for(const page of config.publicPages){
  const s=fs.readFileSync(path.join(root,page),"utf8");
  assert.match(s,/<script defer src="site-language\.js\?v=public-site-locale-gate-v1"><\/script>/,page);
  assert.match(s,/<html lang="zh-Hant(?:-TW)?">/,page);
 }
});
test("unknown and incomplete locales never claim an English website",()=>{
 const base="https://example.test/vt-cos-go-learning/index.html?size=9#core";
 assert.equal(router.stateFor(base).status,"source");
 for(const item of router.LOCALES.filter(x=>!x.available)){
  const dest=router.routeFor(base,item.id);
  assert.equal(router.stateFor(dest).status,"unavailable");
  assert.equal(router.stateFor(dest).rendered,"zh-Hant-TW");
  assert.equal(new URL(dest).searchParams.get("size"),"9");
  assert.equal(new URL(dest).hash,"#core");
 }
 assert.equal(router.stateFor(base+"&lang=xxx").status,"unknown");
 assert.equal(router.routeFor(base,"xx"),null);
});
test("locale routing preserves existing page query and never touches event records",()=>{
 const inUrl="file:///C:/go-learning/live-game.html?size=9#board";
 const selected=router.routeFor(inUrl,"en");
 assert.equal(selected,"file:///C:/go-learning/live-game.html?size=9&lang=en#board");
 const back=router.routeFor(selected,"zh-Hant-TW");
 assert.equal(back,inUrl);
 const outside="https://elsewhere.test/index.html";
 assert.equal(router.localDocumentLink(outside,"https://example.test/vt-cos-go-learning/index.html"),false);
 assert.equal(router.localDocumentLink("../other/index.html","https://example.test/vt-cos-go-learning/index.html"),false);
 assert.equal(router.localDocumentLink("advanced.html#practice","https://example.test/vt-cos-go-learning/index.html"),true);
 const script=fs.readFileSync(path.join(root,"site-language.js"),"utf8");
 assert.doesNotMatch(script,/localStorage|sessionStorage|\.setItem\s*\(|GoContent\.problems\s*=|\.answer\s*=|firstResponse\s*=/);
});
