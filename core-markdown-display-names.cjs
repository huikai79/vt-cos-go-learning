"use strict";
// Editorial display labels only. Source GoContent owns item/KC identities,
// versions, scoring and state. All English names remain review candidates.
const source=require("./content.js");
const itemDraft=require("./locales/en/core-item-drafts.json");
const skillCandidates=Object.freeze({
  "capture-last-liberty-v1":{source:"指定棋串的一手提子",text:"Capture a named group on its last liberty"},
  "direct-join-v1":{source:"指定兩串的一手直接連接",text:"Connect two specified groups in one move"},
  "make-two-eyes-straight-three-v1":{source:"直三一手做出兩眼",text:"Make two eyes from a straight-three shape"},
  "kill-straight-three-v1":{source:"直三一手佔據破眼急所",text:"Occupy the straight-three vital point to prevent two eyes"},
  "complete-second-eye-v1":{source:"補完整第二個真眼",text:"Complete the second real eye"},
  "block-second-eye-v1":{source:"搶先破壞第二眼缺口",text:"Block the point needed for a second real eye"}
});
function display(value,kind,reason,id) {return Object.freeze({text:value,id,kind,sourceStatus:reason,review:"candidate-unapproved",resolved:reason==="source-matched"});}
const problems=new Map(source.problems.map(x=>[x.id,x]));
const skills=new Map(source.skills.map(x=>[x.id,x]));
function problemTitle(item) {
 if(!item || typeof item.id!=="string") throw new TypeError("problem ID required");
 const actual=problems.get(item.id),draft=itemDraft.items?.[item.id];
 // No inference from translated titles: check the exact current canonical
 // identity and native title before borrowing its English editorial candidate.
 if(!actual || actual.title!==item.title)return display(item.id,"problem","source-missing-or-changed",item.id);
 if(!draft || draft.id!==item.id || draft.editorialStatus!=="draft" || typeof draft.title!=="string" ||
    !draft.title.trim())return display(item.id,"problem","candidate-missing",item.id);
 return display(draft.title,"problem","source-matched",item.id);
}
function skillTitle(item) {
 if(!item || typeof item.id!=="string")throw new TypeError("skill ID required");
 const current=skills.get(item.id),cand=skillCandidates[item.id];
 if(!current || !cand || current.name!==cand.source || current.name!==item.name)
   return display(item.id,"skill","source-missing-or-changed",item.id);
 return display(cand.text,"skill","source-matched",item.id);
}
module.exports=Object.freeze({problemTitle,skillTitle,skillCandidates});