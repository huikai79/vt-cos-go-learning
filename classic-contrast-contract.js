(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-contrast-vital-point-v1";
  const FORBIDDEN_FIELDS = Object.freeze(["eyeSpace","vitalPoint","answer","correctMove","setupStones"]);

  function sourceSet(deps, sourceType) {
    if (sourceType === "bulky-five") {
      return {
        items: deps.BulkyPractice.items,
        validate: (item) => deps.BulkyContract.validateItem(item,deps.Go),
        score: (item,move) => deps.BulkyContract.score(item,move,deps.Go),
        familyLabel: "刀把五／Bulky Five",
        structureLabel: "唯一 degree-3 急所"
      };
    }
    if (sourceType === "cross-five") {
      return {
        items: deps.CrossPractice.items,
        validate: (item) => deps.CrossContract.validateItem(item,{ Go:deps.Go, PracticeContract:deps.BulkyContract }),
        score: (item,move) => deps.CrossContract.score(item,move,{ Go:deps.Go, PracticeContract:deps.BulkyContract }),
        familyLabel: "梅花五／Cross Five",
        structureLabel: "唯一 degree-4 中心"
      };
    }
    return null;
  }

  function resolveSource(round,deps) {
    const set=sourceSet(deps,round && round.sourceType);
    if (!set) return null;
    const item=set.items.find((candidate) => candidate.id===round.sourceItemId);
    return item ? {set,item} : null;
  }

  function validateRound(round,deps) {
    const errors=[];
    if (!round || typeof round.id!=="string" || !round.id) return {ok:false,errors:["round id missing"]};
    if (round.scoringContractVersion!==CONTRACT_VERSION) errors.push(round.id+" scoring contract mismatch");
    for (const field of FORBIDDEN_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(round,field)) errors.push(round.id+" duplicates answer field "+field);
    }
    const resolved=resolveSource(round,deps);
    if (!resolved) errors.push(round.id+" source item missing");
    if (!errors.length) {
      const sourceValidation=resolved.set.validate(resolved.item);
      if (!sourceValidation.ok) errors.push(...sourceValidation.errors.map((error)=>round.id+" source: "+error));
    }
    return {
      ok:errors.length===0,
      errors,
      sourceItem:errors.length?null:resolved.item,
      familyLabel:errors.length?null:resolved.set.familyLabel,
      structureLabel:errors.length?null:resolved.set.structureLabel
    };
  }

  function validateAll(rounds,deps) {
    const errors=[];
    const results=[];
    const ids=new Set();
    let previousFamily=null;
    const familyCounts=new Map();
    for (const round of Array.isArray(rounds)?rounds:[]) {
      if (ids.has(round.id)) errors.push("duplicate contrast id "+round.id);
      ids.add(round.id);
      const result=validateRound(round,deps);
      results.push({id:round.id,...result});
      errors.push(...result.errors);
      if (result.ok) {
        const family=round.sourceType;
        familyCounts.set(family,(familyCounts.get(family)||0)+1);
        if (previousFamily===family) errors.push(round.id+" does not interleave family");
        previousFamily=family;
      }
    }
    if ((familyCounts.get("bulky-five")||0)<2 || (familyCounts.get("cross-five")||0)<2) {
      errors.push("contrast set must include at least two rounds from each family");
    }
    return {ok:rounds.length>0 && errors.length===0,results,errors,familyCounts:Object.fromEntries(familyCounts)};
  }

  function score(round,move,deps) {
    const validation=validateRound(round,deps);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    const resolved=resolveSource(round,deps);
    const scored=resolved.set.score(resolved.item,move);
    return {
      ...scored,
      familyLabel:resolved.set.familyLabel,
      structureLabel:resolved.set.structureLabel,
      sourceItemId:resolved.item.id
    };
  }

  const api={CONTRACT_VERSION,FORBIDDEN_FIELDS,resolveSource,validateRound,validateAll,score};
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoClassicContrastContract=api;
})(typeof window!=="undefined"?window:globalThis);
