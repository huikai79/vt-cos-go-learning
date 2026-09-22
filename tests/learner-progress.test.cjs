const test = require("node:test");
const assert = require("node:assert/strict");
const Progress = require("../learner-progress.js");

function diagnosticSkill(overrides = {}) {
  return {
    skillId: "capture-last-liberty-v1",
    qualifiedOpportunities: 4,
    observedErrors: 1,
    firstAnswerCorrect: 3,
    scd: { status: "no_active_error", completed: [], active: null },
    recurrence: { intervals: [], latestLowerBound: null },
    ...overrides
  };
}

function liveSkill(overrides = {}) {
  return {
    skillId: "capture-last-liberty-v1",
    eligibleOpportunities: 3,
    firstResponses: 3,
    satisfiedFirstResponses: 3,
    notSatisfiedFirstResponses: 0,
    unansweredOpportunities: 0,
    evidenceState: "recent_consistent",
    ...overrides
  };
}

test("延後 T2 與最近 live 應用都存在時只輸出證據狀態，不輸出 mastery", () => {
  const summary = Progress.summarize({
    learningDiagnostics: { skills: [diagnosticSkill({ scd: { status:"completed", completed:[{ completedAt:"2026-09-22" }], active:null } })] },
    liveEvidenceSummary: { skills: [liveSkill()] }
  });
  assert.equal(summary.progressPolicyVersion, "learner-evidence-progress-v2");
  assert.equal(summary.schedulerAuthority, false);
  assert.equal(summary.formalEvaluationAuthority, false);
  assert.equal(summary.skills[0].state, "delayed_t2_and_live_observed");
  assert.match(summary.skills[0].label, /延後 T2 與 live/);
  assert.equal("masteryPercent" in summary.skills[0], false);
  assert.match(summary.interpretationBoundary, /不是校準後 mastery/);
});

test("live 最近一致但延後 T2 尚未完成時維持 T2 待驗", () => {
  const summary = Progress.summarize({
    learningDiagnostics: { skills: [diagnosticSkill({ observedErrors: 0, scd: { status:"no_active_error", completed:[], active:null } })] },
    liveEvidenceSummary: { skills: [liveSkill()] }
  });
  assert.equal(summary.skills[0].state, "live_observed_t2_pending");
  assert.match(summary.skills[0].nextEvidenceNeed, /延後且無提示的 T2/);
});

test("仍有 active correction cycle 時不能被漂亮的 live 結果覆蓋", () => {
  const summary = Progress.summarize({
    learningDiagnostics: { skills: [diagnosticSkill({ scd: { status:"awaiting_first_delayed_t2", completed:[], active:{ triggerAt:"2026-09-22" } } })] },
    liveEvidenceSummary: { skills: [liveSkill()] }
  });
  assert.equal(summary.skills[0].state, "needs_more_practice_evidence");
});

test("live 最近一次未完成會保持需更多證據，不因既有 T2 自動通過", () => {
  const summary = Progress.summarize({
    learningDiagnostics: { skills: [diagnosticSkill({ observedErrors:0, scd:{ status:"completed", completed:[{}], active:null } })] },
    liveEvidenceSummary: { skills: [liveSkill({ evidenceState:"needs_review", satisfiedFirstResponses:2, notSatisfiedFirstResponses:1 })] }
  });
  assert.equal(summary.skills[0].state, "needs_more_practice_evidence");
});

test("沒有 live 機會時保留延後 T2 已觀察、live 待機會", () => {
  const summary = Progress.summarize({
    learningDiagnostics: { skills: [diagnosticSkill({ observedErrors:0, scd:{ status:"completed", completed:[{}], active:null } })] },
    liveEvidenceSummary: { skills: [] }
  });
  assert.equal(summary.skills[0].state, "delayed_t2_observed_live_pending");
  assert.match(summary.skills[0].nextEvidenceNeed, /沒有機會不算退步/);
});


test("資料收集 readiness 分開未開始、掃描、未答、單局與跨局", () => {
  const notStarted = Progress.summarize({ learningDiagnostics:{skills:[]}, liveEvidenceSummary:{assessedHumanTurns:0,eligibleOpportunities:0,skills:[]} }).collectionReadiness;
  assert.equal(notStarted.stage, "not_started");

  const scanning = Progress.summarize({ learningDiagnostics:{skills:[]}, liveEvidenceSummary:{assessedHumanTurns:12,eligibleOpportunities:0,skills:[]} }).collectionReadiness;
  assert.equal(scanning.stage, "scanning_no_eligible");

  const waiting = Progress.summarize({
    learningDiagnostics:{skills:[]},
    liveEvidenceSummary:{assessedHumanTurns:12,eligibleOpportunities:1,skills:[liveSkill({eligibleOpportunities:1,firstResponses:0,satisfiedFirstResponses:0,unansweredOpportunities:1,sessionOutcomes:[]})]}
  }).collectionReadiness;
  assert.equal(waiting.stage, "eligible_waiting_response");
  assert.equal(waiting.unansweredOpportunities, 1);

  const single = Progress.summarize({
    learningDiagnostics:{skills:[]},
    liveEvidenceSummary:{assessedHumanTurns:20,eligibleOpportunities:3,skills:[liveSkill({sessionOutcomes:[{sessionId:"g1",responseCount:3,allSatisfied:true,anyNotSatisfied:false}]})]}
  }).collectionReadiness;
  assert.equal(single.stage, "collecting_single_session");
  assert.equal(single.distinctSessionsWithFirstResponse, 1);

  const multi = Progress.summarize({
    learningDiagnostics:{skills:[]},
    liveEvidenceSummary:{assessedHumanTurns:30,eligibleOpportunities:4,skills:[liveSkill({firstResponses:4,satisfiedFirstResponses:4,sessionOutcomes:[
      {sessionId:"g1",responseCount:2,allSatisfied:true,anyNotSatisfied:false},
      {sessionId:"g2",responseCount:2,allSatisfied:true,anyNotSatisfied:false}
    ]})]}
  }).collectionReadiness;
  assert.equal(multi.stage, "collecting_multi_session");
  assert.equal(multi.distinctSessionsWithFirstResponse, 2);
  assert.match(multi.interpretationBoundary, /不是樣本量充分性/);
});
