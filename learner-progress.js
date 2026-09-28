(function (root) {
  "use strict";

  const POLICY_VERSION = "learner-evidence-progress-v2";

  function byId(list) {
    return new Map((Array.isArray(list) ? list : []).filter((item) => item && item.skillId).map((item) => [item.skillId, item]));
  }

  function practiceState(skill) {
    if (!skill) return "no_comparable_practice";
    if (skill.scd && skill.scd.active) return "active_correction_cycle";
    if (skill.scd && Array.isArray(skill.scd.completed) && skill.scd.completed.length) return "delayed_t2_observed";
    if (skill.observedErrors > 0) return "error_observed_without_completed_t2";
    if (skill.qualifiedOpportunities > 0) return "practice_opportunities_observed";
    return "no_comparable_practice";
  }

  function liveState(skill) {
    if (!skill || !skill.eligibleOpportunities) return "no_live_opportunity";
    return skill.evidenceState || "live_data_available";
  }

  function combine(practice, live) {
    const p = practiceState(practice);
    const l = liveState(live);
    const hasDelayedT2 = p === "delayed_t2_observed";
    const liveConsistent = l === "recent_consistent";
    const liveConcern = l === "needs_review";
    const practiceConcern = p === "active_correction_cycle" || p === "error_observed_without_completed_t2";

    if (!practice && (!live || !live.eligibleOpportunities)) return "insufficient_evidence";
    if (practiceConcern || liveConcern) return "needs_more_practice_evidence";
    if (hasDelayedT2 && liveConsistent) return "delayed_t2_and_live_observed";
    if (hasDelayedT2) return "delayed_t2_observed_live_pending";
    if (liveConsistent) return "live_observed_t2_pending";
    if (l === "mixed") return "mixed_live_evidence";
    if (l === "accumulating") return "accumulating_live_evidence";
    return "practice_evidence_only";
  }

  function nextEvidenceNeed(state) {
    if (state === "delayed_t2_and_live_observed") return "繼續用新的可比較機會觀察是否維持；不因目前狀態停止學習。";
    if (state === "delayed_t2_observed_live_pending") return "等待新的 9×9 實戰機會；暫時沒有機會不算退步。";
    if (state === "live_observed_t2_pending") return "還需要隔一段時間，用不同棋形、沒有提示地再做一次。";
    if (state === "needs_more_practice_evidence") return "先保留目前的錯誤與未完成紀錄，再用新題或新棋局繼續觀察。";
    if (state === "mixed_live_evidence" || state === "accumulating_live_evidence") return "還需要更多符合條件的實戰機會；不會只看一盤勝負就下結論。";
    if (state === "practice_evidence_only") return "目前只有練習紀錄；還需要延後複習或新的實戰機會。";
    return "目前資料還不夠；先累積第一次作答、延後新題與實戰紀錄。";
  }

  function label(state) {
    const labels = {
      insufficient_evidence: "資料不足",
      needs_more_practice_evidence: "仍需更多可比較的練習與實戰紀錄",
      delayed_t2_and_live_observed: "延後複習與實戰都有紀錄",
      delayed_t2_observed_live_pending: "延後複習已有紀錄；實戰待觀察",
      live_observed_t2_pending: "實戰已有紀錄；延後複習待觀察",
      mixed_live_evidence: "實戰表現不一致",
      accumulating_live_evidence: "實戰紀錄累積中",
      practice_evidence_only: "目前只有練習紀錄"
    };
    return labels[state] || state;
  }

  function collectionReadiness(live = {}) {
    const skills = Array.isArray(live.skills) ? live.skills : [];
    const assessedHumanTurns = Number(live.assessedHumanTurns) || 0;
    const eligibleOpportunities = Number(live.eligibleOpportunities) || 0;
    const firstResponses = skills.reduce((sum, skill) => sum + (Number(skill.firstResponses) || 0), 0);
    const unansweredOpportunities = skills.reduce((sum, skill) => sum + (Number(skill.unansweredOpportunities) || 0), 0);
    const sessionIds = new Set();
    for (const skill of skills) {
      for (const session of Array.isArray(skill.sessionOutcomes) ? skill.sessionOutcomes : []) {
        if (session && typeof session.sessionId === "string" && session.sessionId) sessionIds.add(session.sessionId);
      }
    }
    const distinctSessionsWithFirstResponse = sessionIds.size;
    let stage = "not_started";
    let label = "尚未開始記錄 9×9 人機實戰";
    if (assessedHumanTurns > 0 && eligibleOpportunities === 0) {
      stage = "scanning_no_eligible";
      label = "已開始記錄整盤實戰，但還沒有出現符合目前條件的局部機會";
    } else if (eligibleOpportunities > 0 && firstResponses === 0) {
      stage = "eligible_waiting_response";
      label = "已出現符合條件的局部機會，但還沒有第一次作答";
    } else if (firstResponses > 0 && distinctSessionsWithFirstResponse < 2) {
      stage = "collecting_single_session";
      label = "已開始記錄符合條件的第一次作答；目前仍只來自一盤棋";
    } else if (distinctSessionsWithFirstResponse >= 2) {
      stage = "collecting_multi_session";
      label = "已在不同棋局中記錄符合條件的第一次作答";
    }
    return {
      stage,
      label,
      assessedHumanTurns,
      eligibleOpportunities,
      firstResponses,
      unansweredOpportunities,
      distinctSessionsWithFirstResponse,
      interpretationBoundary: "這只表示目前收集到多少可比較資料，不代表樣本已足夠，也不是熟練程度、棋力或學習成效判定；沒有符合條件的機會不表示退步。"
    };
  }

  function summarize(input = {}) {
    const diagnostic = input.learningDiagnostics || { skills: [] };
    const live = input.liveEvidenceSummary || { skills: [] };
    const practiceMap = byId(diagnostic.skills);
    const liveMap = byId(live.skills);
    const skillIds = [...new Set([...practiceMap.keys(), ...liveMap.keys()])].sort();
    const skills = skillIds.map((skillId) => {
      const practice = practiceMap.get(skillId) || null;
      const liveSkill = liveMap.get(skillId) || null;
      const state = combine(practice, liveSkill);
      return {
        skillId,
        state,
        label: label(state),
        practiceState: practiceState(practice),
        liveState: liveState(liveSkill),
        practiceQualifiedOpportunities: practice ? practice.qualifiedOpportunities : 0,
        practiceObservedErrors: practice ? practice.observedErrors : 0,
        completedDelayedT2Cycles: practice && practice.scd && Array.isArray(practice.scd.completed) ? practice.scd.completed.length : 0,
        liveEligibleOpportunities: liveSkill ? liveSkill.eligibleOpportunities : 0,
        liveFirstResponses: liveSkill ? liveSkill.firstResponses : 0,
        liveSatisfiedFirstResponses: liveSkill ? liveSkill.satisfiedFirstResponses : 0,
        liveUnansweredOpportunities: liveSkill ? liveSkill.unansweredOpportunities : 0,
        nextEvidenceNeed: nextEvidenceNeed(state)
      };
    });
    return {
      schemaVersion: 1,
      progressPolicyVersion: POLICY_VERSION,
      generatedAt: new Date().toISOString(),
      interpretationBoundary: "這只是把課程練習、延後複習與實戰紀錄放在一起查看，不是熟練程度、棋力或學習成效分數。單局勝負、電腦強度與不符合條件的回合都不會直接改變能力紀錄。",
      schedulerAuthority: false,
      formalEvaluationAuthority: false,
      collectionReadiness: collectionReadiness(live),
      skills
    };
  }

  const api = { POLICY_VERSION, practiceState, liveState, collectionReadiness, summarize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoLearnerProgress = api;
})(typeof window !== "undefined" ? window : globalThis);
