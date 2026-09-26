(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-cross-five-vital-point-v1";
  const CROSS_BASE = [[1,0],[0,1],[1,1],[2,1],[1,2]];

  function pointKey([x,y]) { return x + "," + y; }
  function samePoint(a,b) { return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1]; }
  function isUniquePoints(points) { return Array.isArray(points) && new Set(points.map(pointKey)).size === points.length; }

  function deriveCenter(points, PracticeContract) {
    const degrees = PracticeContract.degreeMap(points);
    const centers = points.filter((point) => degrees.get(pointKey(point)) === 4);
    return centers.length === 1 ? centers[0] : null;
  }

  function validateItem(item,deps) {
    const { Go, PracticeContract } = deps;
    const errors = [];
    if (!item || typeof item.id !== "string" || !item.id) return { ok:false, errors:["item id missing"] };
    if (item.scoringContractVersion !== CONTRACT_VERSION) errors.push(item.id + " scoring contract mismatch");
    if (!Number.isInteger(item.boardSize) || item.boardSize < 5 || item.boardSize > 19) errors.push(item.id + " boardSize invalid");
    if (!Array.isArray(item.eyeSpace) || item.eyeSpace.length !== 5 || !isUniquePoints(item.eyeSpace)) errors.push(item.id + " eyeSpace must contain five unique points");
    if (!Array.isArray(item.vitalPoint) || item.vitalPoint.length !== 2) errors.push(item.id + " vitalPoint invalid");
    if (![Go.BLACK,Go.WHITE].includes(item.playerColor)) errors.push(item.id + " playerColor invalid");
    if (![Go.BLACK,Go.WHITE].includes(item.defenderColor)) errors.push(item.id + " defenderColor invalid");

    if (!errors.length) {
      const actual = PracticeContract.canonicalSignature(item.eyeSpace);
      const expected = PracticeContract.canonicalSignature(CROSS_BASE);
      if (actual !== expected) errors.push(item.id + " eyeSpace is not cross-five geometry");

      const center = deriveCenter(item.eyeSpace,PracticeContract);
      if (!center) errors.push(item.id + " geometry lacks a unique degree-4 center");
      else if (!samePoint(center,item.vitalPoint)) errors.push(item.id + " vitalPoint is not the degree-4 center");

      const allInside = item.eyeSpace.every(([x,y]) => x >= 1 && y >= 1 && x < item.boardSize-1 && y < item.boardSize-1);
      if (!allInside) errors.push(item.id + " eyeSpace lacks one-point board margin");

      if (!errors.length) {
        const setupStones = PracticeContract.buildSetupStones(item,Go);
        let board;
        try { board = Go.boardFromStones(setupStones,item.boardSize); }
        catch (error) { errors.push(item.id + " setup invalid: " + error.message); }

        if (board) {
          const first = setupStones[0];
          const group = Go.groupAt(board,first[0],first[1]);
          if (!group || group.stones.length !== setupStones.length) errors.push(item.id + " setup wall is not one connected defender group");
          for (const point of item.eyeSpace) {
            const move = Go.playMove(board,point[0],point[1],item.playerColor);
            if (!move.legal) errors.push(item.id + " candidate point " + pointKey(point) + " is unexpectedly illegal");
          }
        }
      }
    }

    return {
      ok:errors.length===0,
      errors,
      vitalPoint:errors.length?null:item.vitalPoint,
      setupStones:errors.length?[]:PracticeContract.buildSetupStones(item,Go)
    };
  }

  function validateAll(items,deps) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate cross-five id " + item.id);
      ids.add(item.id);
      const result=validateItem(item,deps);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:items.length>0 && errors.length===0,results,errors};
  }

  function score(item,move,deps) {
    const validation=validateItem(item,deps);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    if (!Array.isArray(move) || move.length!==2 || !move.every(Number.isInteger)) {
      return {ok:true,status:"INVALID_RESPONSE",correct:false};
    }
    const { Go }=deps;
    const board=Go.boardFromStones(validation.setupStones,item.boardSize);
    const played=Go.playMove(board,move[0],move[1],item.playerColor);
    if (!played.legal) return {ok:true,status:"ILLEGAL_MOVE",correct:false,reason:played.reason};
    const correct=samePoint(move,item.vitalPoint);
    return {ok:true,status:correct?"CORRECT":"INCORRECT",correct};
  }

  const api={CONTRACT_VERSION,CROSS_BASE,pointKey,samePoint,deriveCenter,validateItem,validateAll,score};
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoCrossFiveContract=api;
})(typeof window!=="undefined"?window:globalThis);
