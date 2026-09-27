(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-golden-chicken-mechanism-v1";
  const BOARD_SIZE = 7;

  // Project-authored teaching position. It is generated from the published
  // mechanism of 金雞獨立 (edge descent + double shortage of liberties),
  // not copied from a third-party problem diagram.
  const BASE_SETUP = Object.freeze([
    [0,0,1],[1,1,1],[2,2,1],[3,1,1],[4,2,1],[5,1,1],[6,0,1],
    [1,0,2],[2,1,2],[3,2,2],[4,1,2],[5,0,2]
  ].map((stone) => Object.freeze(stone.slice())));
  const BASE_ANCHOR = Object.freeze([3,1]);
  const BASE_DESCENT = Object.freeze([3,0]);
  const BASE_NO_ENTRY = Object.freeze([[2,0],[4,0]].map((point) => Object.freeze(point.slice())));

  function samePoint(a,b) {
    return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  }

  function pointKey(point) { return point[0] + "," + point[1]; }

  function rotatePoint(point, quarterTurns, size = BOARD_SIZE) {
    let [x,y] = point;
    let turns = ((quarterTurns % 4) + 4) % 4;
    while (turns > 0) {
      [x,y] = [size - 1 - y, x];
      turns -= 1;
    }
    return [x,y];
  }

  function swapColor(color) {
    if (color === 1) return 2;
    if (color === 2) return 1;
    return color;
  }

  function transformStone(stone, quarterTurns, colorSwap) {
    const [x,y] = rotatePoint(stone,quarterTurns);
    return [x,y,colorSwap ? swapColor(stone[2]) : stone[2]];
  }

  function materializeItem(item) {
    const setupStones = BASE_SETUP.map((stone) => transformStone(stone,item.quarterTurns,item.colorSwap));
    const playerColor = item.colorSwap ? 2 : 1;
    return {
      boardSize:BOARD_SIZE,
      setupStones,
      playerColor,
      opponentColor:playerColor === 1 ? 2 : 1,
      anchor:rotatePoint(BASE_ANCHOR,item.quarterTurns),
      descent:rotatePoint(BASE_DESCENT,item.quarterTurns),
      noEntryPoints:BASE_NO_ENTRY.map((point) => rotatePoint(point,item.quarterTurns))
    };
  }

  function samePointSet(first,second) {
    if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length) return false;
    const a=first.map(pointKey).sort();
    const b=second.map(pointKey).sort();
    return a.every((value,index) => value === b[index]);
  }

  function validateMechanism(position,Go) {
    const errors=[];
    let board;
    try {
      board=Go.boardFromStones(position.setupStones,position.boardSize);
    } catch (error) {
      return {ok:false,errors:["setup invalid: " + error.message]};
    }

    const anchorGroup=Go.groupAt(board,position.anchor[0],position.anchor[1]);
    if (!anchorGroup || anchorGroup.color !== position.playerColor) {
      errors.push("anchor group missing or wrong color");
    } else if (!samePointSet(anchorGroup.liberties,[position.descent])) {
      errors.push("pre-descent player group must have exactly one liberty at descent");
    }

    const descentResult=Go.playMove(board,position.descent[0],position.descent[1],position.playerColor);
    if (!descentResult.legal) {
      errors.push("descent must be legal");
      return {ok:false,errors};
    }
    if (descentResult.captured.length !== 0) errors.push("descent must not capture immediately");

    const afterGroup=Go.groupAt(descentResult.board,position.descent[0],position.descent[1]);
    if (!afterGroup || !samePointSet(afterGroup.liberties,position.noEntryPoints)) {
      errors.push("descent must create exactly the two no-entry liberties");
    }

    const noEntryChecks=[];
    for (const point of position.noEntryPoints) {
      const opponentAttempt=Go.playMove(descentResult.board,point[0],point[1],position.opponentColor);
      const playerCapture=Go.playMove(descentResult.board,point[0],point[1],position.playerColor);
      const check={
        point:point.slice(),
        opponentLegal:opponentAttempt.legal,
        opponentReason:opponentAttempt.reason || null,
        playerCaptureLegal:playerCapture.legal,
        capturedByPlayer:playerCapture.legal ? playerCapture.captured.length : 0
      };
      noEntryChecks.push(check);
      if (opponentAttempt.legal) errors.push("opponent must be unable to enter " + pointKey(point));
      if (!playerCapture.legal || playerCapture.captured.length !== 2) {
        errors.push("player must be able to capture two stones at " + pointKey(point));
      }
    }

    return {
      ok:errors.length===0,
      errors,
      boardBefore:board,
      boardAfterDescent:descentResult.board,
      noEntryChecks
    };
  }

  function validateItem(item,Go) {
    const errors=[];
    if (!item || typeof item.id !== "string" || !item.id) return {ok:false,errors:["item id missing"]};
    if (item.scoringContractVersion !== CONTRACT_VERSION) errors.push(item.id + " scoring contract mismatch");
    if (!Number.isInteger(item.quarterTurns) || item.quarterTurns < 0 || item.quarterTurns > 3) errors.push(item.id + " quarterTurns invalid");
    if (typeof item.colorSwap !== "boolean") errors.push(item.id + " colorSwap invalid");
    if (item.boardSize !== BOARD_SIZE) errors.push(item.id + " boardSize mismatch");
    for (const forbidden of ["answer","correctMove","setupStones","descent","noEntryPoints"]) {
      if (Object.prototype.hasOwnProperty.call(item,forbidden)) errors.push(item.id + " must not duplicate " + forbidden);
    }
    const position=errors.length ? null : materializeItem(item);
    const mechanism=position ? validateMechanism(position,Go) : {ok:false,errors:[]};
    errors.push(...mechanism.errors.map((message) => item.id + " " + message));
    return {ok:errors.length===0,errors,position:errors.length?null:position,mechanism:errors.length?null:mechanism};
  }

  function validateAll(items,Go) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate golden-chicken item id " + item.id);
      ids.add(item.id);
      const result=validateItem(item,Go);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:Array.isArray(items) && items.length>0 && errors.length===0,results,errors};
  }

  function score(item,move,Go) {
    const validation=validateItem(item,Go);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    if (!Array.isArray(move) || move.length!==2 || !move.every(Number.isInteger)) {
      return {ok:true,status:"INVALID_RESPONSE",correct:false};
    }
    const position=validation.position;
    const board=Go.boardFromStones(position.setupStones,position.boardSize);
    const played=Go.playMove(board,move[0],move[1],position.playerColor);
    if (!played.legal) return {ok:true,status:"ILLEGAL_MOVE",correct:false,reason:played.reason};
    const correct=samePoint(move,position.descent);
    return {
      ok:true,
      status:correct?"CORRECT":"INCORRECT",
      correct,
      mechanismVerified:validation.mechanism.ok,
      scope:"first-line-descent_double-shortage_mechanism"
    };
  }

  const api={
    CONTRACT_VERSION,
    BOARD_SIZE,
    BASE_SETUP,
    BASE_ANCHOR,
    BASE_DESCENT,
    BASE_NO_ENTRY,
    samePoint,
    rotatePoint,
    materializeItem,
    validateMechanism,
    validateItem,
    validateAll,
    score
  };
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoGoldenChickenContract=api;
})(typeof window!=="undefined"?window:globalThis);
