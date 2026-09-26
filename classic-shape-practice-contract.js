(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-vital-point-v1";
  const BULKY_BASE = [[0,0],[1,0],[0,1],[1,1],[2,1]];

  function pointKey([x, y]) { return x + "," + y; }
  function samePoint(a, b) { return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1]; }
  function sortPoints(points) { return points.map(([x,y]) => [x,y]).sort((a,b) => a[1]-b[1] || a[0]-b[0]); }
  function normalize(points) {
    const minX = Math.min(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([,y]) => y));
    return sortPoints(points.map(([x,y]) => [x-minX, y-minY]));
  }
  function signature(points) { return normalize(points).map(pointKey).join(";"); }
  function rotate([x,y]) { return [-y, x]; }
  function reflect([x,y]) { return [-x, y]; }
  function canonicalSignature(points) {
    let current = points.map(([x,y]) => [x,y]);
    const candidates = [];
    for (let i = 0; i < 4; i += 1) {
      candidates.push(signature(current));
      candidates.push(signature(current.map(reflect)));
      current = current.map(rotate);
    }
    return candidates.sort()[0];
  }
  const BULKY_SIGNATURE = canonicalSignature(BULKY_BASE);

  function isUniquePoints(points) {
    return Array.isArray(points) && new Set(points.map(pointKey)).size === points.length;
  }

  function degreeMap(points) {
    const set = new Set(points.map(pointKey));
    const result = new Map();
    for (const [x,y] of points) {
      let degree = 0;
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        if (set.has((x+dx)+","+(y+dy))) degree += 1;
      }
      result.set(x+","+y, degree);
    }
    return result;
  }

  function deriveVitalPoint(points) {
    const degrees = degreeMap(points);
    const degreeThree = points.filter((point) => degrees.get(pointKey(point)) === 3);
    return degreeThree.length === 1 ? degreeThree[0] : null;
  }

  function buildSetupStones(item, Go) {
    const points = item.eyeSpace;
    const minX = Math.min(...points.map(([x]) => x)) - 1;
    const maxX = Math.max(...points.map(([x]) => x)) + 1;
    const minY = Math.min(...points.map(([,y]) => y)) - 1;
    const maxY = Math.max(...points.map(([,y]) => y)) + 1;
    const eye = new Set(points.map(pointKey));
    const stones = [];
    for (let y=minY; y<=maxY; y+=1) {
      for (let x=minX; x<=maxX; x+=1) {
        if (!eye.has(x+","+y)) stones.push([x,y,item.defenderColor || Go.BLACK]);
      }
    }
    return stones;
  }

  function validateItem(item, Go) {
    const errors = [];
    if (!item || typeof item.id !== "string" || !item.id) return { ok:false, errors:["item id missing"] };
    if (item.scoringContractVersion !== CONTRACT_VERSION) errors.push(item.id + " scoring contract mismatch");
    if (!Number.isInteger(item.boardSize) || item.boardSize < 5 || item.boardSize > 19) errors.push(item.id + " boardSize invalid");
    if (!Array.isArray(item.eyeSpace) || item.eyeSpace.length !== 5 || !isUniquePoints(item.eyeSpace)) errors.push(item.id + " eyeSpace must contain five unique points");
    if (!Array.isArray(item.vitalPoint) || item.vitalPoint.length !== 2) errors.push(item.id + " vitalPoint invalid");
    if (![Go.BLACK, Go.WHITE].includes(item.playerColor)) errors.push(item.id + " playerColor invalid");
    if (![Go.BLACK, Go.WHITE].includes(item.defenderColor)) errors.push(item.id + " defenderColor invalid");
    if (item.playerColor === undefined || item.defenderColor === undefined) errors.push(item.id + " colors missing");

    if (!errors.length) {
      if (canonicalSignature(item.eyeSpace) !== BULKY_SIGNATURE) errors.push(item.id + " eyeSpace is not bulky-five P-pentomino geometry");
      const derived = deriveVitalPoint(item.eyeSpace);
      if (!derived) errors.push(item.id + " geometry lacks a unique degree-3 vital point");
      else if (!samePoint(derived, item.vitalPoint)) errors.push(item.id + " vitalPoint does not match unique degree-3 point");

      const allInside = item.eyeSpace.every(([x,y]) => x >= 1 && y >= 1 && x < item.boardSize-1 && y < item.boardSize-1);
      if (!allInside) errors.push(item.id + " eyeSpace lacks one-point board margin");

      if (!errors.length) {
        let board;
        const setupStones = buildSetupStones(item, Go);
        try { board = Go.boardFromStones(setupStones, item.boardSize); }
        catch (error) { errors.push(item.id + " setup invalid: " + error.message); }
        if (board) {
          const first = setupStones[0];
          const group = Go.groupAt(board, first[0], first[1]);
          if (!group || group.stones.length !== setupStones.length) errors.push(item.id + " setup wall is not one connected defender group");
          const result = Go.playMove(board, item.vitalPoint[0], item.vitalPoint[1], item.playerColor);
          if (!result.legal) errors.push(item.id + " vital point is not a legal move for playerColor");
          for (const point of item.eyeSpace) {
            const move = Go.playMove(board, point[0], point[1], item.playerColor);
            if (!move.legal) errors.push(item.id + " candidate point " + pointKey(point) + " is unexpectedly illegal");
          }
        }
      }
    }
    return { ok: errors.length === 0, errors, vitalPoint: errors.length ? null : item.vitalPoint, setupStones: errors.length ? [] : buildSetupStones(item, Go) };
  }

  function score(item, move, Go) {
    const validation = validateItem(item, Go);
    if (!validation.ok) return { ok:false, status:"ERROR", errors:validation.errors };
    if (!Array.isArray(move) || move.length !== 2 || !move.every(Number.isInteger)) return { ok:true, status:"INVALID_RESPONSE", correct:false };
    const board = Go.boardFromStones(validation.setupStones, item.boardSize);
    const played = Go.playMove(board, move[0], move[1], item.playerColor);
    if (!played.legal) return { ok:true, status:"ILLEGAL_MOVE", correct:false, reason:played.reason };
    return { ok:true, status:samePoint(move,item.vitalPoint) ? "CORRECT" : "INCORRECT", correct:samePoint(move,item.vitalPoint) };
  }

  function validateAll(items, Go) {
    const results = [];
    const errors = [];
    const ids = new Set();
    for (const item of Array.isArray(items) ? items : []) {
      if (ids.has(item.id)) errors.push("duplicate practice id " + item.id);
      ids.add(item.id);
      const result = validateItem(item, Go);
      results.push({ id:item.id, ...result });
      errors.push(...result.errors);
    }
    return { ok: items.length > 0 && errors.length === 0, results, errors };
  }

  const api = { CONTRACT_VERSION, BULKY_SIGNATURE, pointKey, canonicalSignature, degreeMap, deriveVitalPoint, buildSetupStones, validateItem, validateAll, score };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoClassicShapePracticeContract = api;
})(typeof window !== "undefined" ? window : globalThis);
