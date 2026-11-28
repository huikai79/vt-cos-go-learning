"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),draft=require("../locales/en/live-game-static-draft.json"),manifest=require("../site-locales.json");
test("live-game English static candidate covers source text and learner-facing labels",()=>{
 const html=fs.readFileSync(path.join(root,"live-game.html"),"utf8");
 const cleaned=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<!--[\s\S]*?-->/g," ");
 const visible=[...new Set(cleaned.replace(/<[^>]*>/g,"\n").split("\n").map(x=>x.trim()).filter(x=>/[\u3400-\u9fff]/u.test(x)))];
 const attribute=[...new Set([...html.matchAll(/\b(?:aria-label|title|placeholder|content)=["']([^"']+)["']/g)].map(x=>x[1]).filter(x=>/[\u3400-\u9fff]/u.test(x)))];
 for(const text of [...visible,...attribute])assert.ok(Object.hasOwn(draft.segments,text),"Missing Chinese source segment: "+text);
 for(const [original,copy] of Object.entries(draft.segments)){assert.ok(original.trim());assert.ok(copy.trim());assert.doesNotMatch(copy,/[\u3400-\u9fff]/u,"Untranslated English candidate: "+original);}
 assert.equal(draft.status,"candidate-not-runtime");
 assert.equal(manifest.locales.find(x=>x.id==="en").publishable,false);
});
test("English page draft cannot change game rules, scoring, provider, event or storage state",()=>{
 for(const key of ["events","answer","scoring","board","komi","playerColor","provider","localStorage"])assert.equal(Object.hasOwn(draft,key),false);
 assert.ok(draft.missing.some(x=>x.includes("dynamic")));
 const html=fs.readFileSync(path.join(root,"live-game.html"),"utf8");
 assert.doesNotMatch(html,/live-game-static-draft\.json/);
});