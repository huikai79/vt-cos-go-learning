"use strict";
// Offline preview adapter. The browser's exportNotes(), canonical events and
// versioned metric/trial implementations remain the sole source of truth.
// Do not import this file from index.html or app.js.
const Metrics = require("./learning-metrics.js");
const Trial = require("./trial.js");
const {previewReport} = require("./core-markdown-english-preview.cjs");
const DisplayNames = require("./core-markdown-display-names.cjs");
function reject(reason) {
  const error = new Error("Core Markdown source adapter blocked: " + reason);
  error.code = "LOCALE_EXPORT_BLOCKED";
  throw error;
}
const isRecord = x => x !== null && typeof x === "object" && !Array.isArray(x);
function required(x, label) { if(!isRecord(x)) reject(label+" must be an object"); return x; }
function nonnegative(x, label) {
  if(!Number.isSafeInteger(x)||x<0) reject(label+" must be a nonnegative integer");
  return x;
}
function string(x, label) { if(typeof x!=="string"||!x.trim())reject(label+" must be nonempty");return x; }
function asSet(x,label) {
  if(x instanceof Set)return x;
  if(Array.isArray(x))return new Set(x);
  reject(label+" must be a Set or array");
}
function statusRead(input, label) {
  required(input,label);
  if(input.ok===false)return {state:"error",reason:string(input.error,label+".error")};
  if(input.ok!==true)reject(label+" missing explicit ok/fail status");
  if(input.summary===null || input.summary===undefined)return {state:"absent"};
  return {state:"ok",summary:required(input.summary,label+".summary")};
}
function adapt(snapshot,options={}) {
  if(!isRecord(options)||options.preview!==true||options.publishable===true||options.runtime===true)
    reject("isolated preview:true is required");
  required(snapshot,"snapshot");
  if(snapshot.schemaVersion!==1)reject("unsupported source snapshot version");
  const state=required(snapshot.state,"state");
  const problems=snapshot.problems,skills=snapshot.skills;
  if(!Array.isArray(problems)||!Array.isArray(skills))reject("catalogues must be arrays");
  if(!Array.isArray(state.events)||!Array.isArray(state.applicationResults)||
    !Array.isArray(state.applicationEvents)) reject("canonical event arrays missing");
  const scheduler=required(state.scheduler,"scheduler");
  if(!Array.isArray(scheduler.responses))reject("canonical scheduler responses missing");
  const completed=asSet(state.completed,"completed"), missed=asSet(state.missed,"missed");
  const attempts=required(state.attempts,"attempts");
  const uiVersion=string(snapshot.uiVersion,"uiVersion");
  const exportedAt=string(snapshot.exportedAt,"exportedAt");
  for(const item of problems){
    required(item,"problem");string(item.id,"problem.id");
    if(!Object.hasOwn(attempts,item.id))continue;
    nonnegative(attempts[item.id],"attempt count");
  }
  const skillLookup=new Map(skills.map(x=>[x.id,x]));
  const problemLookup=new Map(problems.map(x=>[x.id,x]));
  const namesAudit=[];
  const displayName=(source,kind)=>{
    const label=kind==="skill"?DisplayNames.skillTitle(source):DisplayNames.problemTitle(source);
    namesAudit.push({kind,id:label.id,sourceStatus:label.sourceStatus,review:label.review});
    return label.text;
  };
  const unresolved=(id,kind)=>{namesAudit.push({kind,id,sourceStatus:"catalog-missing",review:"candidate-unapproved"});return id;};
  const skillName=id=>{const source=skillLookup.get(id);return source?displayName(source,"skill"):unresolved(id,"skill");};
  const problemName=id=>{const source=problemLookup.get(id);return source?displayName(source,"problem"):unresolved(id,"problem");};
  const known=new Set(problems.map(x=>x.id));
  if([...completed,...missed].some(id=>!known.has(id)))reject("unknown completed or missed ID");
  // Exactly the same eligible numerator as the canonical exportNotes:
  // skill events, answer events, qualifiedOpportunity===truthy, correct outcome.
  const skillEvents=state.events.filter(e=>e&&e.skillId);
  const skillRows=skills.map(s=>{
    required(s,"skill");string(s.id,"skill.id");
    const eligible=skillEvents.filter(e=>e.type==="answer"&&e.skillId===s.id&&e.qualifiedOpportunity);
    return {name:displayName(s,"skill"),eligible:eligible.length,correct:eligible.filter(e=>e.outcome==="correct").length};
  });
  // Metrics.summarize owns the actual eligibility and SCD/recurrence contracts.
  const metrics=Metrics.summarize({events:state.events,schedulerResponses:scheduler.responses});
  const diagnosticRows=metrics.skills.map(s=>{
    const active=s.scd.active;
    const scd=active?{state:active.firstDelayedProbeAt?"awaiting_second":"awaiting_first",
      opportunities:nonnegative(active.relevantOpportunityCount,"SCD opportunities")}
      :s.scd.completed.length?{state:"completed",samples:nonnegative(s.scd.completed.length,"SCD samples")}
      :{state:"no_sample"};
    const rec=s.recurrence.intervals.length?{state:"observed",intervals:s.recurrence.intervals.length}
      :s.recurrence.latestLowerBound?{state:"lower_bound",
        opportunities:nonnegative(s.recurrence.latestLowerBound.successfulOpportunitiesWithoutRecurrence,"recurrence lower bound")}
      :{state:"not_measured"};
    return {id:s.skillId,label:skillLookup.has(s.skillId)?skillName(s.skillId):null,opportunities:nonnegative(s.qualifiedOpportunities,"qualified"),
      errors:nonnegative(s.observedErrors,"errors"),scd,recurrence:rec};
  });
  const items=problems.map(p=>({
    title:displayName(p,"problem"),attempts:nonnegative(attempts[p.id]||0,"attempts"),completed:completed.has(p.id),needsReview:missed.has(p.id)
  }));
  const events=skillEvents.map(e=>{
    const knownType=["presented","presentation_end","hint","answer"].includes(e.type);
    // Do not infer missing first-answer, hint, time, or outcome semantics.
    return {occurredAt:string(e.occurredAt,"event.occurredAt"),skill:skillName(e.skillId),
      item:e.problemId?problemName(e.problemId):"UNKNOWN",type:knownType?e.type:"unknown",
      firstAnswer:e.firstAnswer===true?true:e.firstAnswer===false?false:null,
      unhinted:e.unhinted===true?true:e.unhinted===false?false:null,
      outcome:typeof e.outcome==="string"?e.outcome:"UNKNOWN",elapsedMs:e.elapsedMs};
  });
  const lp=statusRead(snapshot.livePractice,"livePractice");
  const practice=lp.state==="ok"?(lp.summary.totalEvents?{
    state:"ok",sessions:nonnegative(lp.summary.computerSessions,"computerSessions"),
    decisions:nonnegative(lp.summary.humanDecisions,"humanDecisions")}:{state:"absent"}):lp;
  const le=statusRead(snapshot.liveEvidence,"liveEvidence");
  const live=le.state==="ok"?(le.summary.assessedHumanTurns?{
    state:"ok",assessed:nonnegative(le.summary.assessedHumanTurns,"assessed"),
    eligible:nonnegative(le.summary.eligibleOpportunities,"eligible"),
    unscored:nonnegative(le.summary.unscoredHumanTurns,"unscored"),
    versions:{eligibility:string(le.summary.eligibilityContractVersion,"eligibility version"),
      scoring:string(le.summary.scoringContractVersion,"scoring version"),
      progress:string(le.summary.progressPolicyVersion,"progress version")},
    boundary:string(le.summary.interpretationBoundary,"live boundary"),
    skills:(le.summary.skills||[]).map(s=>({
      name:skillName(string(s.skillId,"live skill id")),eligible:nonnegative(s.eligibleOpportunities,"live eligible"),
      first:nonnegative(s.firstResponses,"live first"),satisfied:nonnegative(s.satisfiedFirstResponses,"live satisfied"),
      unsatisfied:nonnegative(s.notSatisfiedFirstResponses,"live unsatisfied"),
      unanswered:nonnegative(s.unansweredOpportunities,"live unanswered"),state:s.evidenceState||"UNKNOWN"
    }))
  }:{state:"absent"}):le;
  // Combined evidence must be supplied as the canonical computed summary; it
  // is never silently derived from event counts by this adapter.
  let integrated;
  if(snapshot.integrated===null)integrated={state:"absent"};
  else if(snapshot.integrated!==undefined){
    const x=required(snapshot.integrated,"integrated");
    if(x.state==="error"||x.state==="unknown")integrated={state:x.state,reason:x.reason};
    else if(x.state==="absent")integrated={state:"absent"};
    else if(x.state==="ok"){
      const c=required(x.summary,"canonical integrated summary");
      integrated={state:"ok",policy:{version:string(c.progressPolicyVersion,"progress version")},
        boundary:string(c.interpretationBoundary,"integrated boundary"),
        skills:(c.skills||[]).map(s=>({
          name:skillName(string(s.skillId,"integrated skill id")),
          practice:nonnegative(s.practiceQualifiedOpportunities,"practice qualified"),
          delayed:nonnegative(s.completedDelayedT2Cycles,"delayed cycles"),
          live:nonnegative(s.liveEligibleOpportunities,"live opportunities"),
          first:nonnegative(s.liveFirstResponses,"live first"),
          satisfied:nonnegative(s.liveSatisfiedFirstResponses,"live satisfied"),
          next:string(s.nextEvidenceNeed,"next evidence need")
        }))};
      if(c.collectionReadiness){
        const q=required(c.collectionReadiness,"collection readiness");
        integrated.collection={status:string(q.label,"collection status"),
          inspected:nonnegative(q.assessedHumanTurns,"inspected"),eligible:nonnegative(q.eligibleOpportunities,"eligible"),
          first:nonnegative(q.firstResponses,"first"),unanswered:nonnegative(q.unansweredOpportunities,"unanswered"),
          sessions:nonnegative(q.distinctSessionsWithFirstResponse,"sessions"),
          boundary:string(q.interpretationBoundary,"collection boundary")};
      }
    } else reject("unknown integrated state");
  } else reject("integrated result must be explicitly supplied, even if absent");
  // The previously exposed pilot uses the existing authoritative summarizer.
  const pilot=Trial.summarize(state.trial,state.applicationResults,state.applicationEvents);
  if(pilot.status!=="data_insufficient" || Trial.protocol.formalEligible!==false ||
    pilot.reviewGate!=="personal_pilot_only")reject("pilot eligibility changed");
  const app=required(pilot.application,"pilot application");
  const trial={state:"ok",status:"data_insufficient",formalEligible:false,
    batches:pilot.batchResults.map(row=>({role:row.role,correct:nonnegative(row.correct,"pilot correct"),
      total:nonnegative(row.total,"pilot total")})),
    application:{correct:nonnegative(app.correct,"application correct"),total:nonnegative(app.total,"application total"),
      presented:nonnegative(app.presented,"application presented"),
      unanswered:nonnegative(app.unansweredOrInterrupted,"application unanswered"),
      inappropriate:nonnegative(app.inappropriateUseErrors,"inappropriate uses"),
      excluded:nonnegative(app.excludedHintedOrRepeated,"excluded applications")}};
  if(pilot.bySkillDirection){
    trial.directions=Object.entries(pilot.bySkillDirection).map(([id,v])=>({
      skill:skillName(id),baselineCorrect:v.baseline.correct,baselineTotal:v.baseline.total,
      followupCorrect:v.followup.correct,followupTotal:v.followup.total
    }));
  }
  // Map the same SGF entry and originalStones source fields as exportNotes().
  // Reject missing or malformed positions: zero stones is not the same as an
  // absent original position, and no rules/scoring inference is allowed here.
  if(!Array.isArray(state.localExercises))reject("local exercises missing");
  const sgf=state.localExercises.map((entry,index)=>{
    required(entry,"SGF entry "+index);
    const source=required(entry.source,"SGF source");
    const boardSize=nonnegative(source.boardSize,"SGF board size");
    if(boardSize<2 || boardSize>25)reject("SGF board size unsupported");
    if(!Array.isArray(source.originalStones))reject("SGF original stones unavailable");
    const seen=new Set();
    const coords={black:[],white:[]};
    for(const stone of source.originalStones){
      if(!Array.isArray(stone)||stone.length!==3)reject("SGF stone tuple malformed");
      const [x,y,color]=stone;
      if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<0||x>=boardSize||y>=boardSize)
        reject("SGF original coordinate out of bounds");
      if(color!==1 && color!==2)reject("SGF original stone color unrecognized");
      const key=x+","+y;
      if(seen.has(key))reject("SGF original intersection duplicated");
      seen.add(key);
      coords[color===1?"black":"white"].push("("+(x+1)+","+(y+1)+")");
    }
    const reflection=entry.reflection==null?null:required(entry.reflection,"SGF reflection");
    if(reflection && typeof reflection.savedBeforeAnswer!=="boolean")reject("SGF reflection timing unknown");
    const review=entry.review==null?null:required(entry.review,"SGF manual review");
    if(review && !["unconfirmed","original_confirmed","alternative_confirmed"].includes(review.status))
      reject("SGF review status unrecognized");
    const timing=reflection?(reflection.savedBeforeAnswer?"before":"after"):"not_saved";
    // The labels mean a manually entered review state, not independently
    // validated correctness. Keep the exact free-text notes and source order.
    return {
      source:string(source.sourceName,"SGF sourceName"),
      number:nonnegative(source.moveNumber,"SGF move number"),
      skill:skillName(string(entry.linkedSkill,"SGF linkedSkill")),
      date:string(entry.completedAt,"SGF completedAt"),
      size:boardSize,
      position:{black:coords.black.join(", ")||"none",white:coords.white.join(", ")||"none"},
      reflection:{candidate:reflection?.candidate||"",reason:reflection?.reason||"",
        opponent:reflection?.expectedOpponentResponse||"",timing},
      review:{status:review?.status||"unconfirmed",evidence:review?.acceptableAnswer||"",
        next:review?.nextCue||""}
    };
  });
  const report={
    exportedAt,uiVersion,total:problems.length,completed:completed.size,pendingReview:missed.size,
    items,skills:skillRows,diagnostics:{state:diagnosticRows.length?"partial":"empty",
      excluded:metrics.excludedResponsesWithoutQualification,skills:diagnosticRows},
    events,practice,live,integrated,trial,sgf
  };
  const audit=Object.freeze({
    status:"partial-source-adapter",
    sourceEvents:state.events.length,
    skillEvents:skillEvents.length,
    eventIds:skillEvents.map(e=>e.problemId||"UNKNOWN"),
    eventVersions:skillEvents.map(e=>({
      itemVersion:e.itemVersion??null,skillVersion:e.skillVersion??null,
      evidenceTaxonomyVersion:e.evidenceTaxonomyVersion??null,
      scoringContractVersion:e.scoringContractVersion??null
    })),
    metricsPolicyVersion:metrics.metricPolicyVersion,
    trialProtocolId:Trial.protocol.id,
    sgfSourceCount:state.localExercises.length,
    sgfPositionStoneCounts:sgf.map((x,i)=>state.localExercises[i].source.originalStones.length),
    sgfReviewStates:sgf.map(x=>x.review.status),
    excludedDiagnostics:metrics.excludedResponsesWithoutQualification,
    displayNameCandidates:namesAudit,
    unresolvedDisplayNames:[...new Set(namesAudit.filter(x=>x.sourceStatus!=="source-matched").map(x=>x.kind+":"+x.id))],
    displayNameReview:"PENDING",
    unsupported:["native-English/Go review of candidate display names","actual canonical browser download parity","manual review states are not independent Go correctness verification"]
  });
  return Object.freeze({status:"candidate-adapter",complete:false,report,audit});
}
function render(snapshot,options) {
  const converted=adapt(snapshot,options);
  return Object.freeze({converted,preview:previewReport(converted.report,{preview:true})});
}
module.exports=Object.freeze({adapt,render});
