"use strict";
// Offline, read-only editorial renderer: NEVER mount in the learner runtime.
// The canonical app.js exportNotes and JSON event export remain authoritative.
const draft = require("./locales/en/core-markdown-export-draft.json");
function blocked(reason) {
  const error = new Error("Core Markdown English preview blocked: " + reason);
  error.code = "LOCALE_EXPORT_BLOCKED";
  throw error;
}
const record = x => x !== null && typeof x === "object" && !Array.isArray(x);
function requireRecord(x, name) { if (!record(x)) blocked(name + " must be an object"); return x; }
function count(x, name) { if (!Number.isSafeInteger(x) || x < 0) blocked(name + " must be a nonnegative integer"); return x; }
function text(x, name) { if (typeof x !== "string" || !x.trim()) blocked(name + " must be nonempty text"); return x; }
function safe(x) {
  // Escape untrusted notes and labels before including them in Markdown tables,
  // so an embedded pipe, heading or HTML tag cannot rewrite the report structure.
  return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ⏎ ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}
function copy(key, values={}) {
  if (!record(values)) blocked("invalid template variables: " + key);
  const entry=draft.messages[key];
  if (!entry || entry.review !== "candidate" || typeof entry.text !== "string") blocked("missing candidate " + key);
  const names=[...entry.text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(x=>x[1]);
  const expected=new Set(names), provided=Object.keys(values);
  if (provided.some(x=>!expected.has(x)) || [...expected].some(x=>!Object.hasOwn(values,x)))
    blocked("template variables mismatch: " + key);
  return entry.text.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_,name)=>{
    const v=values[name];
    if (typeof v !== "string" && !(typeof v === "number" && Number.isFinite(v))) blocked("unsafe variable: " + name);
    return safe(v);
  });
}
function optionalText(value, fallbackKey) { return value == null || value === "" ? copy(fallbackKey) : safe(text(value,"user field")); }
function previewReport(data, options={}) {
  if (!record(options) || options.preview !== true || options.runtime === true || options.publishable === true)
    blocked("offline candidate preview only");
  if (draft.status !== "candidate-not-runtime" || draft.locale !== "en" ||
    Object.values(draft.review).some(v=>v==="approved")) blocked("draft promotion status");
  requireRecord(data,"report");
  const allowed=new Set(["exportedAt","uiVersion","completed","total","pendingReview","items","skills",
    "diagnostics","events","practice","live","sgf","integrated","trial"]);
  if (Object.keys(data).some(k=>!allowed.has(k))) blocked("unrecognized report section");
  text(data.exportedAt,"exportedAt"); text(data.uiVersion,"uiVersion");
  count(data.total,"total"); count(data.completed,"completed"); count(data.pendingReview,"pendingReview");
  if (data.completed>data.total || data.pendingReview>data.total) blocked("invalid report totals");
  for(const k of ["items","skills","events","sgf"]) if (!Array.isArray(data[k])) blocked(k + " must be an array");
  // Untranslated computed diagnostic explanations or state-dependent trial/integrated
  // prose must fail closed, not appear as an apparently complete English export.
  if (data.integrated !== undefined || data.trial !== undefined) blocked("integrated/trial semantics need independent review");
  const diagnostics=requireRecord(data.diagnostics,"diagnostics");
  if (!["empty","partial"].includes(diagnostics.state)) blocked("diagnostic semantics unavailable");
  count(diagnostics.excluded,"diagnostics.excluded");
  const out=[copy("reportTitle"),"",copy("exportedAt",{date:data.exportedAt}),
    copy("uiVersion",{version:data.uiVersion}),"",copy("completed",{completed:data.completed,total:data.total}),
    copy("pendingReview",{count:data.pendingReview}),"",copy("itemsHeading"),""];
  for(const item of data.items) {
    requireRecord(item,"item");text(item.title,"item.title");count(item.attempts,"item.attempts");
    if(typeof item.completed!=="boolean" || typeof item.needsReview!=="boolean") blocked("item status");
    out.push(copy("itemRow",{title:item.title,status:copy(item.completed?"itemCompleted":"itemUncompleted"),
      attempts:item.attempts,review:item.needsReview?copy("itemReview"):""}));
  }
  if(data.skills.length) {
    out.push("",copy("skillsHeading"),"",copy("skillsBoundary"),"");
    for(const x of data.skills){
      requireRecord(x,"skill");text(x.name,"skill.name");count(x.eligible,"skill.eligible");
      count(x.correct,"skill.correct");if(x.correct>x.eligible)blocked("skill numerator exceeds eligible");
      out.push(copy("skillsRow",{skill:x.name,eligible:x.eligible,correct:x.correct}));
    }
  }
  out.push("",copy("diagnosticsHeading"),"");
  if(diagnostics.state==="empty") out.push(copy("diagnosticsEmpty"));
  else out.push("- UNKNOWN: diagnostic interpretation requires a reviewed English summary; no mastery claim is made.");
  out.push(copy("diagnosticsExcluded",{count:diagnostics.excluded}));
  if(data.events.length) {
    out.push("",copy("practiceEventsHeading"),"",copy("eventTableHeader"),"| --- | --- | --- | --- | --- | --- | --- |");
    for(const e of data.events){
      requireRecord(e,"event");text(e.occurredAt,"event.occurredAt");
      const eventTypes={presented:"eventPresented",presentation_end:"eventPresentationEnd",hint:"eventHint"};
      const eventName=Object.hasOwn(eventTypes,e.type)?copy(eventTypes[e.type])
        :e.type==="answer"?(e.firstAnswer===true?copy("eventFirst"):e.firstAnswer===false?copy("eventRetry"):"UNKNOWN (first-answer status)")
        :"UNKNOWN (unrecognized event)";
      const condition=e.type==="answer"?(e.unhinted===true?copy("eventUnhinted"):e.unhinted===false?copy("eventHinted"):"UNKNOWN (hint status)")
        :e.type==="hint"?copy("eventHint"):"—";
      let outcome="—";
      if(e.type==="answer") outcome=e.outcome==="correct"?copy("eventCorrect"):e.outcome==="wrong"?copy("eventWrong"):"UNKNOWN (answer outcome)";
      if(e.type==="presentation_end") outcome=e.outcome==="solved"?copy("eventSolved"):
        e.outcome==="unanswered"?copy("eventUnanswered"):e.outcome==="interrupted"?copy("eventInterrupted"):"UNKNOWN (presentation outcome)";
      const elapsed=Number.isFinite(e.elapsedMs)&&e.elapsedMs>=0?copy("eventElapsed",{seconds:Math.round(e.elapsedMs/1000)}):"—";
      out.push("| "+[e.occurredAt,e.skill||"UNKNOWN",e.item||"UNKNOWN",eventName,condition,outcome,elapsed].map(safe).join(" | ")+" |");
    }
  }
  function statusSection(value,name,heading,errorKey,okLines) {
    requireRecord(value,name);
    if(!["absent","ok","error","unknown"].includes(value.state))blocked(name+" status");
    if(value.state==="absent")return;
    out.push("",copy(heading),"");
    if(value.state==="unknown") out.push("- UNKNOWN: "+name+" data could not be verified; no values have been inferred.");
    else if(value.state==="error")out.push(copy(errorKey,{reason:text(value.reason,name+".reason")}));
    else okLines(value);
  }
  statusSection(data.practice,"practice","practiceHeading","practiceReadError",x=>{
    out.push(copy("practiceGames",{count:count(x.sessions,"sessions")}),copy("practiceDecisions",{count:count(x.decisions,"decisions")}),copy("practiceBoundary"));
  });
  statusSection(data.live,"live","liveHeading","liveReadError",x=>{
    for(const [key,field] of [["liveAssessed","assessed"],["liveEligible","eligible"],["liveUnscored","unscored"]])
      out.push(copy(key,{count:count(x[field],field)}));
    const versions=requireRecord(x.versions,"versions");
    for(const field of ["eligibility","scoring","progress"]) text(versions[field],"version "+field);
    out.push(copy("liveVersions",{versions:versions.eligibility+" / "+versions.scoring+" / "+versions.progress}));
    out.push(copy("liveLimits",{boundary:text(x.boundary,"live.boundary")}));
    if(!Array.isArray(x.skills))blocked("live.skills missing");
    for(const skill of x.skills){
      requireRecord(skill,"live skill");
      for(const field of ["eligible","first","satisfied","unsatisfied","unanswered"])count(skill[field],field);
      if(skill.satisfied+skill.unsatisfied+skill.unanswered>skill.eligible)blocked("live skill denominator");
      out.push(copy("liveSkillRow",{skill:text(skill.name,"skill.name"),eligible:skill.eligible,first:skill.first,
        satisfied:skill.satisfied,unsatisfied:skill.unsatisfied,unanswered:skill.unanswered,
        state:typeof skill.state==="string"&&skill.state?skill.state:"UNKNOWN"}));
    }
  });
  if(data.sgf.length){
    out.push("",copy("sgfHeading"),"",copy("sgfBoundary"),"");
    for(const entry of data.sgf){
      requireRecord(entry,"SGF entry");
      const source=text(entry.source,"SGF source");count(entry.number,"SGF move number");
      text(entry.skill,"SGF skill");text(entry.date,"SGF completion");
      out.push(copy("sgfRecord",{source,number:entry.number,skill:entry.skill,date:entry.date}));
      const reflection=requireRecord(entry.reflection,"SGF reflection");
      out.push(copy("sgfCandidate",{candidate:optionalText(reflection.candidate,"sgfNotFilled")}),
        copy("sgfReason",{reason:optionalText(reflection.reason,"sgfNotFilled")}),
        copy("sgfOpponent",{response:optionalText(reflection.opponent,"sgfNotFilled")}));
      if(!["before","after","not_saved"].includes(reflection.timing))blocked("SGF reflection timing");
      const timeKey={before:"sgfBefore",after:"sgfAfter",not_saved:"sgfNotSaved"};
      out.push(copy("sgfTiming",{timing:copy(timeKey[reflection.timing])}));
      const review=requireRecord(entry.review,"SGF review");
      if(!["unconfirmed","original_confirmed","alternative_confirmed"].includes(review.status))blocked("SGF review status");
      const status=review.status==="unconfirmed"?copy("sgfUnconfirmed"):
        review.status==="original_confirmed"?"original move marked acceptable by reviewer":
        "alternative move marked acceptable by reviewer";
      out.push(copy("sgfReview",{status}),copy("sgfEvidence",{evidence:optionalText(review.evidence,"sgfNotFilled")}),
        copy("sgfNext",{next:optionalText(review.next,"sgfNotFilled")}));
    }
  }
  out.push("",copy("observationHeading"),"",copy("observationOne"),copy("observationTwo"),copy("observationThree"),"");
  return Object.freeze({status:"candidate-preview",locale:"en",complete:false,
    content:out.join("\n"),filename:copy("fileName"),
    unreviewed:["integrated evidence","personal trial","diagnostic prose","localized canonical Go titles","full export review"]});
}
module.exports=Object.freeze({previewReport});
