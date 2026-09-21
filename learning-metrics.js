(function (root) {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const metricPolicy = Object.freeze({
    id: "skill-correction-diagnostics-v1",
    firstDelayedProbeMs: DAY_MS,
    secondDelayedProbeMs: 7 * DAY_MS,
    qualifyingTransferLevel: "T2"
  });

  const errorTypes = Object.freeze({
    "capture-last-liberty-v1": Object.freeze({
      id: "capture-last-liberty-outcome-miss-v1",
      label: "最後一口氣未找對",
      interpretation: "只表示指定棋串的一手提子題首答未達標，不推定粗心、讀棋不足或其他心理根因。"
    }),
    "direct-join-v1": Object.freeze({
      id: "direct-join-outcome-miss-v1",
      label: "直接連接點未找對",
      interpretation: "只表示指定兩串的一手直接連接題首答未達標，不推定視覺、規則或計算根因。"
    }),
    "rescue-last-liberty-foundation-v1": Object.freeze({
      id: "rescue-last-liberty-outcome-miss-v1",
      label: "救出最後一氣未達標",
      interpretation: "只表示被打吃棋串的救棋題首答未達標，不推定心理根因。"
    }),
    "make-two-eyes-straight-three-v1": Object.freeze({
      id: "make-two-eyes-straight-three-outcome-miss-v1",
      label: "直三做活急所未找對",
      interpretation: "只表示直三一手做活題首答未達標，不推定眼形理解或讀棋根因。"
    }),
    "kill-straight-three-v1": Object.freeze({
      id: "kill-straight-three-outcome-miss-v1",
      label: "直三破眼急所未找對",
      interpretation: "只表示直三一手破眼題首答未達標，不推定計算或棋形辨識根因。"
    }),
    "complete-second-eye-v1": Object.freeze({
      id: "complete-second-eye-outcome-miss-v1",
      label: "第二眼邊界缺口未補對",
      interpretation: "只表示補完整第二眼題首答未達標，不推定眼形理解或注意力根因。"
    }),
    "block-second-eye-v1": Object.freeze({
      id: "block-second-eye-outcome-miss-v1",
      label: "破壞第二眼缺口未找對",
      interpretation: "只表示搶先佔據第二眼缺口題首答未達標，不推定讀棋或棋形辨識根因。"
    })
  });

  function errorTypeForSkill(skillId) {
    return errorTypes[skillId] || null;
  }

  function validTime(value) {
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
  }

  function normalizeLessonEvents(events) {
    return (Array.isArray(events) ? events : []).flatMap((event, index) => {
      if (event.type !== "answer" || event.qualifiedOpportunity !== true || !event.skillId) return [];
      const occurredAtMs = validTime(event.occurredAt);
      if (occurredAtMs === null) return [];
      return [{
        source: "lesson_event",
        sourceIndex: index,
        occurredAt: event.occurredAt,
        occurredAtMs,
        problemId: event.problemId,
        skillId: event.skillId,
        skillVersion: event.skillVersion || null,
        correct: event.outcome === "correct",
        unhinted: event.unhinted === true,
        qualifiedOpportunity: true,
        transferLevel: event.transferLevel || "T0",
        pool: event.pool || "practice",
        errorTypeId: event.errorTypeId || (event.outcome === "incorrect" && errorTypeForSkill(event.skillId)?.id) || null
      }];
    });
  }

  function normalizeSchedulerResponses(responses) {
    return (Array.isArray(responses) ? responses : []).flatMap((response, index) => {
      if (!response.skillId || response.qualifiedOpportunity !== true || response.unhinted !== true) return [];
      const occurredAtMs = validTime(response.occurredAt);
      if (occurredAtMs === null) return [];
      return [{
        source: "scheduler_response",
        sourceIndex: index,
        occurredAt: response.occurredAt,
        occurredAtMs,
        problemId: response.problemId,
        skillId: response.skillId,
        skillVersion: response.skillVersion || null,
        correct: response.firstAnswerCorrect === true,
        unhinted: true,
        qualifiedOpportunity: true,
        transferLevel: response.transferLevel || null,
        pool: response.pool || null,
        errorTypeId: response.errorTypeId || (response.firstAnswerCorrect === false && errorTypeForSkill(response.skillId)?.id) || null
      }];
    });
  }

  function normalizedOpportunities(input = {}) {
    return [...normalizeLessonEvents(input.events), ...normalizeSchedulerResponses(input.schedulerResponses)]
      .filter((item) => item.unhinted && item.qualifiedOpportunity)
      .sort((a, b) => a.occurredAtMs - b.occurredAtMs || a.source.localeCompare(b.source) || a.sourceIndex - b.sourceIndex);
  }

  function successfulBetween(items, startIndex, endIndex) {
    return items.slice(startIndex + 1, endIndex).filter((item) => item.correct).length;
  }

  function recurrenceSummary(items) {
    const errorIndexes = items.map((item, index) => !item.correct ? index : null).filter(Number.isInteger);
    const intervals = [];
    for (let index = 1; index < errorIndexes.length; index += 1) {
      const previous = errorIndexes[index - 1];
      const current = errorIndexes[index];
      intervals.push({
        from: items[previous].occurredAt,
        to: items[current].occurredAt,
        successfulOpportunitiesBetween: successfulBetween(items, previous, current),
        elapsedMs: items[current].occurredAtMs - items[previous].occurredAtMs
      });
    }
    const lastErrorIndex = errorIndexes.at(-1);
    return {
      status: errorIndexes.length === 0 ? "no_confirmed_error" : intervals.length ? "recurrence_observed" : "lower_bound_only",
      intervals,
      latestLowerBound: lastErrorIndex === undefined ? null : {
        since: items[lastErrorIndex].occurredAt,
        successfulOpportunitiesWithoutRecurrence: successfulBetween(items, lastErrorIndex, items.length),
        elapsedMs: Math.max(0, Date.now() - items[lastErrorIndex].occurredAtMs)
      }
    };
  }

  function isEligibleT2Pass(item) {
    return item.correct && item.unhinted && item.transferLevel === metricPolicy.qualifyingTransferLevel && item.pool !== "holdout";
  }

  function scdSummary(items) {
    const completed = [];
    let active = null;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.correct) {
        active = { triggerIndex: index, triggerAt: item.occurredAt, triggerAtMs: item.occurredAtMs, firstProbeIndex: null };
        continue;
      }
      if (!active || !isEligibleT2Pass(item)) continue;
      const elapsedFromError = item.occurredAtMs - active.triggerAtMs;
      if (active.firstProbeIndex === null && elapsedFromError >= metricPolicy.firstDelayedProbeMs) {
        active.firstProbeIndex = index;
        continue;
      }
      if (active.firstProbeIndex !== null && elapsedFromError >= metricPolicy.secondDelayedProbeMs) {
        const sample = {
          triggerAt: active.triggerAt,
          completedAt: item.occurredAt,
          relevantOpportunityCount: index - active.triggerIndex,
          firstDelayedProbeAt: items[active.firstProbeIndex].occurredAt,
          secondDelayedProbeAt: item.occurredAt,
          elapsedMs: item.occurredAtMs - active.triggerAtMs
        };
        completed.push(sample);
        active = null;
      }
    }
    if (!active) return {
      status: completed.length ? "completed" : "no_active_error",
      completed,
      active: null
    };
    const later = items.slice(active.triggerIndex + 1);
    return {
      status: active.firstProbeIndex === null ? "awaiting_first_delayed_t2" : "awaiting_second_delayed_t2",
      completed,
      active: {
        triggerAt: active.triggerAt,
        relevantOpportunityCount: later.length,
        firstDelayedProbeAt: active.firstProbeIndex === null ? null : items[active.firstProbeIndex].occurredAt,
        requirement: active.firstProbeIndex === null ? "至少 24 小時後的未提示、非 holdout T2 首答" : "觸發錯誤至少 7 天後的第二次未提示、非 holdout T2 首答"
      }
    };
  }

  function summarize(input = {}) {
    const opportunities = normalizedOpportunities(input);
    const skillIds = [...new Set(opportunities.map((item) => item.skillId))];
    const excludedLessonResponses = (Array.isArray(input.events) ? input.events : []).filter((event) => event.type === "answer" && (event.qualifiedOpportunity !== true || event.unhinted !== true)).length;
    const excludedSchedulerResponses = (Array.isArray(input.schedulerResponses) ? input.schedulerResponses : []).filter((response) => response.qualifiedOpportunity !== true || response.unhinted !== true).length;
    return {
      schemaVersion: 1,
      metricPolicyVersion: metricPolicy.id,
      generatedAt: new Date().toISOString(),
      interpretationBoundary: "錯誤類型按可觀察的技能題結果分組，不代表已確認心理或認知根因。SCD 只接受未提示、非 holdout 的延後 T2 首答。",
      excludedResponsesWithoutQualification: excludedLessonResponses + excludedSchedulerResponses,
      skills: skillIds.map((skillId) => {
        const items = opportunities.filter((item) => item.skillId === skillId);
        const classification = errorTypeForSkill(skillId);
        return {
          skillId,
          errorTypeId: classification?.id || null,
          errorTypeLabel: classification?.label || "尚未分類的技能結果",
          interpretation: classification?.interpretation || "沒有足夠定義，不推定根因。",
          qualifiedOpportunities: items.length,
          observedErrors: items.filter((item) => !item.correct).length,
          firstAnswerCorrect: items.filter((item) => item.correct).length,
          scd: scdSummary(items),
          recurrence: recurrenceSummary(items)
        };
      })
    };
  }

  const api = { metricPolicy, errorTypes, errorTypeForSkill, normalizedOpportunities, summarize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoLearningMetrics = api;
})(typeof window !== "undefined" ? window : globalThis);
