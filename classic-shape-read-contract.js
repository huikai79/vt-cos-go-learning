(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-bulky-five-short-read-v1";

  function pointKey([x,y]) { return x + "," + y; }
  function samePoint(a,b) { return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1]; }

  function deriveReplyPair(item, PracticeContract) {
    const vital = PracticeContract.deriveVitalPoint(item.eyeSpace);
    if (!vital) return [];
    const degrees = PracticeContract.degreeMap(item.eyeSpace);
    return item.eyeSpace
      .filter((point) => !samePoint(point, vital))
      .filter((point) => Math.abs(point[0]-vital[0]) + Math.abs(point[1]-vital[1]) === 1)
      .filter((point) => degrees.get(pointKey(point)) === 2)
      .map(([x,y]) => [x,y])
      .sort((a,b) => a[1]-b[1] || a[0]-b[0]);
  }

  function complement(pair, point) {
    if (!Array.isArray(pair) || pair.length !== 2) return null;
    if (samePoint(pair[0], point)) return pair[1];
    if (samePoint(pair[1], point)) return pair[0];
    return null;
  }

  function validateItem(item, deps) {
    const { Go, PracticeContract } = deps;
    const errors = [];
    if (!item || typeof item.id !== "string" || !item.id) return { ok:false, errors:["item id missing"] };
    if (item.scoringContractVersion !== CONTRACT_VERSION) errors.push(item.id + " scoring contract mismatch");
    const base = item.baseItem;
    if (!base) errors.push(item.id + " baseItem missing");
    let baseValidation = null;
    if (base) {
      baseValidation = PracticeContract.validateItem(base, Go);
      if (!baseValidation.ok) errors.push(...baseValidation.errors.map((error) => item.id + " base: " + error));
      if (base.playerColor === base.defenderColor) errors.push(item.id + " base item must be attacker-to-play");
    }
    if (!Array.isArray(item.defenderReply) || item.defenderReply.length !== 2) errors.push(item.id + " defenderReply invalid");

    if (!errors.length) {
      const pair = deriveReplyPair(base, PracticeContract);
      if (pair.length !== 2) errors.push(item.id + " expected exactly two A/B reply points");
      if (!pair.some((point) => samePoint(point, item.defenderReply))) errors.push(item.id + " defenderReply is outside A/B pair");
      const expected = complement(pair, item.defenderReply);
      if (!expected) errors.push(item.id + " complement reply missing");
      else if (!samePoint(expected, item.attackerFollowup)) errors.push(item.id + " attackerFollowup is not the A/B complement");

      if (!errors.length) {
        let board = Go.boardFromStones(baseValidation.setupStones, base.boardSize);
        let move = Go.playMove(board, base.vitalPoint[0], base.vitalPoint[1], base.playerColor);
        if (!move.legal) errors.push(item.id + " attacker vital move illegal");
        else board = move.board;
        move = Go.playMove(board, item.defenderReply[0], item.defenderReply[1], base.defenderColor);
        if (!move.legal) errors.push(item.id + " defender A/B reply illegal");
        else board = move.board;
        move = Go.playMove(board, item.attackerFollowup[0], item.attackerFollowup[1], base.playerColor);
        if (!move.legal) errors.push(item.id + " attacker complement reply illegal");
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      replyPair: errors.length ? [] : deriveReplyPair(item.baseItem, PracticeContract)
    };
  }

  function validateAll(items, deps) {
    const errors = [];
    const ids = new Set();
    const results = [];
    for (const item of Array.isArray(items) ? items : []) {
      if (ids.has(item.id)) errors.push("duplicate short-read id " + item.id);
      ids.add(item.id);
      const result = validateItem(item, deps);
      results.push({ id:item.id, ...result });
      errors.push(...result.errors);
    }
    return { ok: items.length > 0 && errors.length === 0, results, errors };
  }

  function scoreFollowup(item, move, deps) {
    const validation = validateItem(item, deps);
    if (!validation.ok) return { ok:false, status:"ERROR", errors:validation.errors };
    if (!Array.isArray(move) || move.length !== 2 || !move.every(Number.isInteger)) {
      return { ok:true, status:"INVALID_RESPONSE", correct:false };
    }
    return {
      ok:true,
      status:samePoint(move,item.attackerFollowup) ? "CORRECT" : "INCORRECT",
      correct:samePoint(move,item.attackerFollowup)
    };
  }

  const api = { CONTRACT_VERSION, samePoint, deriveReplyPair, complement, validateItem, validateAll, scoreFollowup };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoClassicShapeReadContract = api;
})(typeof window !== "undefined" ? window : globalThis);
