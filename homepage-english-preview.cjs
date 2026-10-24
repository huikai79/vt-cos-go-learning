"use strict";
// Offline editorial preview only. Never attach this adapter to the learner runtime.
const draft = require("./locales/en/homepage-introduction-draft.json");
function refuse(message) { const e = new Error("HOMEPAGE_ENGLISH_PREVIEW_BLOCKED: " + message); e.code = "LOCALE_COPY_BLOCKED"; throw e; }
function buildPreview(options = {}) {
 if (!options || options.preview !== true || options.runtime === true || options.publishable === true) refuse("explicit isolated preview required");
 if (draft.status !== "candidate-not-runtime" || draft.locale !== "en") refuse("unexpected authoring status");
 const records = Object.entries(draft.items).map(([key,item])=>({key,...item}));
 if (records.some(x=>x.review !== "candidate" || typeof x.text !== "string" || !x.text.trim())) refuse("unreviewed or missing text");
 const sourceMap = new Map();
 for(const item of records) {
   const file = item.sourceFile || "index.html";
   const k = file + "\u0000" + item.source;
   if(sourceMap.has(k) && sourceMap.get(k) !== item.text) sourceMap.set(k,null);
   else if(!sourceMap.has(k)) sourceMap.set(k,item.text);
 }
 return Object.freeze({
  locale:"en",status:"isolated-candidate-preview",
  text(key, sourceFile = "index.html") {
    const item=draft.items[key]; if(!item || (item.sourceFile || "index.html") !== sourceFile) refuse("unknown or wrong-source item " + key);
    return item.text;
  },
  sourceText(source, sourceFile = "index.html") {
    const k=sourceFile+"\u0000"+source;
    if(!sourceMap.has(k) || sourceMap.get(k) === null) refuse("missing or ambiguous mapping for source");
    return sourceMap.get(k);
  },
  coverageKeys:Object.freeze(records.map(x=>x.key))
 });
}
module.exports=Object.freeze({buildPreview});
