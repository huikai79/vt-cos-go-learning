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
    if (state === "delayed_t2_observed_live_pending") return "等待新的合格 9×9 live 機會；沒有機會不算退步。";
    if (state === "live_observed_t2_pending") return "需要不同棋形、延後且無提示的 T2 才能補足保留證據。";
    if (state === "needs_more_practice_evidence") return "先保留錯誤與 live 未完成紀錄，再以新題／新局取得可比較機會。";
    if (state === "mixed_live_evidence" || state === "accumulating_live_evidence") return "需要更多預先合格的 live 機會；不依單局勝負判定。";
    if (state === "practice_evidence_only") return "目前只有練習證據；等待延後 T2 或合格 live 機會。";
    return "目前資料不足；先收集可比較首答、延後新題或合格 live 機會。";
  }

  function label(state) {
    const labels = {
      insufficient_evidence: "資料不足",
      needs_more_practice_evidence: "仍需更多可比較練習／實戰證據",
      delayed_t2_and_live_observed: "已觀察到延後 T2 與 live 應用",
      delayed_t2_observed_live_pending: "已觀察到延後 T2；live 待機會",
      live_observed_t2_pending: "已觀察到 live 應用；延後 T2 待驗",
      mixed_live_evidence: "live 證據混合",
      accumulating_live_evidence: "live 證據累積中",
      practice_evidence_only: "目前只有練習證據"
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
    let label = "尚未開始掃描 9×9 人機回合";
    if (assessedHumanTurns > 0 && eligibleOpportunities === 0) {
      stage = "scanning_no_eligible";
      label = "已開始整盤掃描，但尚未出現 v1 合格局部機會";
    } else if (eligibleOpportunities > 0 && firstResponses === 0) {
      stage = "eligible_waiting_response";
      label = "已出現合格局部機會，但尚無首答";
    } else if (firstResponses > 0 && distinctSessionsWithFirstResponse < 2) {
      stage = "collecting_single_session";
      label = "已開始收集合格首答；目前仍只來自單一棋局";
    } else if (distinctSessionsWithFirstResponse >= 2) {
      stage = "collecting_multi_session";
      label = "已跨不同棋局收集合格首答";
    }
    return {
      stage,
      label,
      assessedHumanTurns,
      eligibleOpportunities,
      firstResponses,
      unansweredOpportunities,
      distinctSessionsWithFirstResponse,
      interpretationBoundary: "這只是資料收集 readiness，不是樣本量充分性、mastery、棋力或學習成效判定；沒有 eligible 機會不表示退步。"
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
      interpretationBoundary: "這是證據狀態彙總，不是校準後 mastery、棋力或學習成效分數。T0–T2 練習／延後證據與 live T3 分開保存後才並列；單局勝負、bot 強度與不合格回合不改變技能狀態。",
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
