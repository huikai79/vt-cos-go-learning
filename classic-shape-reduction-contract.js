(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-bulky-five-sealed-reduction-v1";

  function key([x,y]) { return x + "," + y; }
  function samePoint(a,b) { return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1]; }
  function sortPoints(points) { return points.map(([x,y]) => [x,y]).sort((a,b) => a[1]-b[1] || a[0]-b[0]); }
  function setEquals(pointsA, pointsB) {
    const a = new Set(pointsA.map(key));
    const b = new Set(pointsB.map(key));
    return a.size === b.size && [...a].every((value) => b.has(value));
  }

  function deriveSquareCore(eyeSpace) {
    const set = new Set(eyeSpace.map(key));
    const candidates = [];
    for (const [x,y] of eyeSpace) {
      const square = [[x,y],[x+1,y],[x,y+1],[x+1,y+1]];
      if (square.every((point) => set.has(key(point)))) candidates.push(sortPoints(square));
    }
    const unique = [];
    const seen = new Set();
    for (const square of candidates) {
      const sig = square.map(key).join(";");
      if (!seen.has(sig)) { seen.add(sig); unique.push(square); }
    }
    return unique.length === 1 ? unique[0] : null;
  }

  function deriveCapturePoint(eyeSpace, squareCore) {
    if (!squareCore) return null;
    const squareSet = new Set(squareCore.map(key));
    const rest = eyeSpace.filter((point) => !squareSet.has(key(point)));
    return rest.length === 1 ? rest[0] : null;
  }

  function bbox(points) {
    return {
      minX: Math.min(...points.map(([x]) => x)),
      maxX: Math.max(...points.map(([x]) => x)),
      minY: Math.min(...points.map(([,y]) => y)),
      maxY: Math.max(...points.map(([,y]) => y))
    };
  }

  function buildSetupStones(item, Go, options = {}) {
    const sealed = options.sealed !== false;
    const box = bbox(item.eyeSpace);
    const inner = { minX:box.minX-1, maxX:box.maxX+1, minY:box.minY-1, maxY:box.maxY+1 };
    const outer = { minX:inner.minX-1, maxX:inner.maxX+1, minY:inner.minY-1, maxY:inner.maxY+1 };
    const eye = new Set(item.eyeSpace.map(key));
    const stones = [];

    for (let y=inner.minY; y<=inner.maxY; y+=1) {
      for (let x=inner.minX; x<=inner.maxX; x+=1) {
        if (!eye.has(x + "," + y)) stones.push([x,y,item.defenderColor]);
      }
    }

    if (sealed) {
      for (let y=outer.minY; y<=outer.maxY; y+=1) {
        for (let x=outer.minX; x<=outer.maxX; x+=1) {
          const onPerimeter = x===outer.minX || x===outer.maxX || y===outer.minY || y===outer.maxY;
          if (onPerimeter) stones.push([x,y,item.attackerColor]);
        }
      }
    }

    return stones;
  }

  function findColorGroup(board, color, Go) {
    for (let y=0; y<board.length; y+=1) {
      for (let x=0; x<board.length; x+=1) {
        if (board[y][x] === color) return Go.groupAt(board,x,y);
      }
    }
    return null;
  }

  function deriveReductionPoints(item, PracticeContract) {
    const vital = PracticeContract.deriveVitalPoint(item.eyeSpace);
    const square = deriveSquareCore(item.eyeSpace);
    if (!vital || !square) return [];
    return square.filter((point) => !samePoint(point,vital));
  }

  function permutations(points) {
    if (points.length <= 1) return [points.map((point) => point.slice())];
    const result = [];
    for (let i=0; i<points.length; i+=1) {
      const head = points[i];
      const rest = points.slice(0,i).concat(points.slice(i+1));
      for (const tail of permutations(rest)) result.push([head.slice(), ...tail]);
    }
    return result;
  }

  function replay(item, order, deps, options = {}) {
    const { Go, PracticeContract } = deps;
    const errors = [];
    let setupStones;
    let board;
    try {
      setupStones = buildSetupStones(item,Go,options);
      board = Go.boardFromStones(setupStones,item.boardSize);
    } catch (error) {
      return { ok:false, errors:["setup invalid: " + error.message] };
    }

    const defenderGroup = findColorGroup(board,item.defenderColor,Go);
    if (!defenderGroup) return { ok:false, errors:["defender group missing"] };

    const sealedBefore = setEquals(defenderGroup.liberties,item.eyeSpace);
    const vital = PracticeContract.deriveVitalPoint(item.eyeSpace);
    const squareCore = deriveSquareCore(item.eyeSpace);
    const capturePoint = deriveCapturePoint(item.eyeSpace,squareCore);

    if (!vital || !squareCore || !capturePoint) return { ok:false, errors:["geometry derivation failed"] };

    let move = Go.playMove(board,vital[0],vital[1],item.attackerColor);
    if (!move.legal) return { ok:false, errors:["vital move illegal"] };
    board = move.board;

    const accepted = [];
    for (const point of order) {
      move = Go.playMove(board,point[0],point[1],item.attackerColor);
      if (!move.legal) {
        errors.push("reduction move illegal at " + key(point));
        break;
      }
      board = move.board;
      accepted.push(point.slice());
    }

    const defenderBeforeCapture = findColorGroup(board,item.defenderColor,Go);
    const defenderLiberties = defenderBeforeCapture ? sortPoints(defenderBeforeCapture.liberties) : [];
    const forcedCapture = defenderBeforeCapture && defenderBeforeCapture.liberties.length === 1
      && samePoint(defenderBeforeCapture.liberties[0],capturePoint);

    let captureResult = null;
    let terminalEmpty = [];
    let capturedInner = [];
    if (forcedCapture) {
      captureResult = Go.playMove(board,capturePoint[0],capturePoint[1],item.defenderColor);
      if (!captureResult.legal) errors.push("forced capture move illegal");
      else {
        board = captureResult.board;
        capturedInner = captureResult.captured.filter((point) => squareCore.some((candidate) => samePoint(candidate,point)));
        terminalEmpty = item.eyeSpace.filter(([x,y]) => board[y][x] === Go.EMPTY);
      }
    }

    const squareFourReached = forcedCapture
      && captureResult && captureResult.legal
      && capturedInner.length === 4
      && setEquals(terminalEmpty,squareCore)
      && squareCore.every(([x,y]) => board[y][x] === Go.EMPTY)
      && board[capturePoint[1]][capturePoint[0]] === item.defenderColor;

    return {
      ok: errors.length === 0,
      errors,
      sealedBefore,
      vitalPoint:vital,
      squareCore,
      capturePoint,
      accepted,
      defenderLiberties,
      forcedCapture,
      capturedInner,
      squareFourReached,
      board
    };
  }

  function validateItem(item,deps) {
    const { Go, PracticeContract } = deps;
    const errors = [];
    if (!item || typeof item.id !== "string" || !item.id) return { ok:false, errors:["item id missing"] };
    if (item.scoringContractVersion !== CONTRACT_VERSION) errors.push(item.id + " scoring contract mismatch");
    if (!Array.isArray(item.eyeSpace) || item.eyeSpace.length !== 5) errors.push(item.id + " eyeSpace invalid");
    if (![Go.BLACK,Go.WHITE].includes(item.defenderColor) || ![Go.BLACK,Go.WHITE].includes(item.attackerColor) || item.defenderColor === item.attackerColor) {
      errors.push(item.id + " colors invalid");
    }

    const vital = PracticeContract.deriveVitalPoint(item.eyeSpace || []);
    const square = deriveSquareCore(item.eyeSpace || []);
    const capture = deriveCapturePoint(item.eyeSpace || [],square);
    const reductions = deriveReductionPoints(item,PracticeContract);
    if (!vital) errors.push(item.id + " vital point missing");
    if (!square) errors.push(item.id + " unique 2x2 square core missing");
    if (!capture) errors.push(item.id + " capture point missing");
    if (reductions.length !== 3) errors.push(item.id + " expected three reduction points");

    if (!errors.length) {
      const baseValidation = PracticeContract.validateItem({
        ...item,
        playerColor:item.attackerColor,
        vitalPoint:vital,
        scoringContractVersion:PracticeContract.CONTRACT_VERSION
      },Go);
      if (!baseValidation.ok) errors.push(...baseValidation.errors.map((error) => item.id + " base: " + error));

      for (const order of permutations(reductions)) {
        const result = replay(item,order,deps,{sealed:true});
        if (!result.ok || !result.sealedBefore || !result.forcedCapture || !result.squareFourReached) {
          errors.push(item.id + " sealed reduction failed for order " + order.map(key).join(" -> "));
          break;
        }
      }

      const openResult = replay(item,reductions,deps,{sealed:false});
      if (openResult.forcedCapture || openResult.squareFourReached) {
        errors.push(item.id + " external-liberty negative oracle failed");
      }
    }

    return {
      ok:errors.length===0,
      errors,
      vitalPoint:vital,
      squareCore:square,
      capturePoint:capture,
      reductionPoints:reductions
    };
  }

  function validateAll(items,deps) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate sealed-reduction id " + item.id);
      ids.add(item.id);
      const result=validateItem(item,deps);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:items.length>0 && errors.length===0,results,errors};
  }

  function scoreNext(item,priorMoves,move,deps) {
    const validation=validateItem(item,deps);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    const used=new Set((priorMoves||[]).map(key));
    const allowed=validation.reductionPoints.filter((point) => !used.has(key(point)));
    if (!Array.isArray(move) || move.length!==2 || !move.every(Number.isInteger)) return {ok:true,status:"INVALID_RESPONSE",correct:false};
    const correct=allowed.some((point) => samePoint(point,move));
    return {ok:true,status:correct?"CORRECT":"INCORRECT",correct,remaining:allowed};
  }

  function finalize(item,moves,deps) {
    const validation=validateItem(item,deps);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    if (!Array.isArray(moves) || moves.length!==3 || new Set(moves.map(key)).size!==3) return {ok:true,status:"INCOMPLETE",complete:false};
    const result=replay(item,moves,deps,{sealed:true});
    return {
      ok:result.ok,
      status:result.squareFourReached?"SQUARE_FOUR_REACHED":"FAILED",
      complete:result.squareFourReached,
      result
    };
  }

  const api={CONTRACT_VERSION,samePoint,deriveSquareCore,deriveCapturePoint,deriveReductionPoints,buildSetupStones,replay,validateItem,validateAll,scoreNext,finalize};
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoClassicShapeReductionContract=api;
})(typeof window!=="undefined"?window:globalThis);
