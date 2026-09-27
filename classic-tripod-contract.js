(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-tripod-oracle-first-move-v1";
  const BOARD_SIZE = 19;
  const ORACLE_CASE_ID = "gnugo-tripod2-r3-v1";
  const ORACLE_SOURCE_URL = "https://github.com/runningskull/gnugo/blob/84a32e9cee2a70c0ec6ef58c1be279fed84a9a53/regression/ld_owl.tst";
  const POSITION_SOURCE_URL = "https://github.com/runningskull/gnugo/blob/84a32e9cee2a70c0ec6ef58c1be279fed84a9a53/regression/games/life_and_death/tripod2.sgf";

  // Normalized board facts from the public tripod2 regression position.
  // GNU Go remains an external oracle/reference; no GNU Go code or runtime is imported.
  const BASE_SETUP = Object.freeze([
    [17,0,2],[0,1,2],[4,1,2],[3,2,2],[4,2,2],[5,2,2],[6,2,2],[12,2,2],[13,2,2],[14,2,2],[15,2,2],
    [2,3,2],[3,3,2],[15,3,2],[16,3,2],[2,4,2],[16,4,2],[17,4,2],[2,5,2],[16,5,2],[2,6,2],[16,6,2],
    [2,12,2],[16,12,2],[2,13,2],[16,13,2],[0,14,2],[1,14,2],[2,14,2],[16,14,2],[2,15,2],[3,15,2],
    [15,15,2],[16,15,2],[3,16,2],[4,16,2],[5,16,2],[6,16,2],[12,16,2],[13,16,2],[14,16,2],[15,16,2],
    [14,17,2],[18,17,2],[14,18,2],
    [2,0,1],[3,1,1],[16,1,1],[17,1,1],[1,2,1],[2,2,1],[16,2,1],[18,2,1],[17,3,1],
    [1,15,1],[0,16,1],[2,16,1],[16,16,1],[17,16,1],[2,17,1],[15,17,1],[17,17,1],[16,18,1]
  ].map((stone) => Object.freeze(stone.slice())));

  const BASE_TARGET = Object.freeze([16,16]); // R3 in GTP coordinates.
  const BASE_MOVES = Object.freeze({
    attack: Object.freeze([15,18]), // GNU Go regression expects Q1.
    defend: Object.freeze([18,18])  // GNU Go regression expects T1.
  });

  function samePoint(a,b) {
    return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  }

  function rotatePoint(point, quarterTurns, size = BOARD_SIZE) {
    let [x,y] = point;
    let turns = ((quarterTurns % 4) + 4) % 4;
    while (turns > 0) {
      [x,y] = [size - 1 - y, x];
      turns -= 1;
    }
    return [x,y];
  }

  function rotateStone(stone, quarterTurns, size = BOARD_SIZE) {
    const [x,y] = rotatePoint(stone,quarterTurns,size);
    return [x,y,stone[2]];
  }

  function pointKey(point) { return point[0] + "," + point[1]; }
  function stoneKey(stone) { return stone[0] + "," + stone[1] + "," + stone[2]; }
  function signature(stones) { return stones.map(stoneKey).sort().join(";"); }

  function rotatedSetup(quarterTurns) {
    return BASE_SETUP.map((stone) => rotateStone(stone,quarterTurns));
  }

  function validPositionSignatures() {
    return [0,1,2,3].map((turns) => signature(rotatedSetup(turns)));
  }

  function validatePosition(stones) {
    if (!Array.isArray(stones) || stones.length !== BASE_SETUP.length) {
      return { ok:false, reason:"stone_count_mismatch" };
    }
    const seen = new Set();
    for (const stone of stones) {
      if (!Array.isArray(stone) || stone.length !== 3) return { ok:false, reason:"invalid_stone" };
      const [x,y,color] = stone;
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) {
        return { ok:false, reason:"out_of_bounds" };
      }
      if (color !== 1 && color !== 2) return { ok:false, reason:"invalid_color" };
      const key = x + "," + y;
      if (seen.has(key)) return { ok:false, reason:"overlap" };
      seen.add(key);
    }
    return { ok:validPositionSignatures().includes(signature(stones)), reason:"geometry_mismatch" };
  }

  function viewportForTurns(quarterTurns) {
    const sourceCorners = [[10,10],[18,10],[10,18],[18,18]].map((point) => rotatePoint(point,quarterTurns));
    const xs = sourceCorners.map((point) => point[0]);
    const ys = sourceCorners.map((point) => point[1]);
    return {
      minX:Math.min(...xs),
      maxX:Math.max(...xs),
      minY:Math.min(...ys),
      maxY:Math.max(...ys)
    };
  }

  function materializeItem(item) {
    const turns = item.quarterTurns;
    const expectedMove = rotatePoint(BASE_MOVES[item.role],turns);
    return {
      boardSize:BOARD_SIZE,
      setupStones:rotatedSetup(turns),
      targetPoint:rotatePoint(BASE_TARGET,turns),
      expectedMove,
      viewport:viewportForTurns(turns)
    };
  }

  function validateItem(item,Go) {
    const errors=[];
    if (!item || typeof item.id !== "string" || !item.id) return {ok:false,errors:["item id missing"]};
    if (item.scoringContractVersion !== CONTRACT_VERSION) errors.push(item.id + " scoring contract mismatch");
    if (item.oracleCaseId !== ORACLE_CASE_ID) errors.push(item.id + " oracle case mismatch");
    if (item.role !== "attack" && item.role !== "defend") errors.push(item.id + " role invalid");
    if (!Number.isInteger(item.quarterTurns) || item.quarterTurns < 0 || item.quarterTurns > 3) errors.push(item.id + " quarterTurns invalid");
    if (item.boardSize !== BOARD_SIZE) errors.push(item.id + " boardSize mismatch");
    for (const forbidden of ["answer","acceptedMove","correctMove","setupStones"]) {
      if (Object.prototype.hasOwnProperty.call(item,forbidden)) errors.push(item.id + " must not duplicate " + forbidden);
    }

    let position=null;
    if (!errors.length) {
      position=materializeItem(item);
      const geometry=validatePosition(position.setupStones);
      if (!geometry.ok) errors.push(item.id + " materialized geometry invalid: " + geometry.reason);
      let board;
      try { board=Go.boardFromStones(position.setupStones,BOARD_SIZE); }
      catch (error) { errors.push(item.id + " setup invalid: " + error.message); }
      if (board) {
        const targetColor = item.role === "attack" ? Go.BLACK : Go.BLACK;
        const target=Go.groupAt(board,position.targetPoint[0],position.targetPoint[1]);
        if (!target || target.color !== targetColor) errors.push(item.id + " target tripod group missing");
        const playerColor = item.role === "attack" ? Go.WHITE : Go.BLACK;
        const played=Go.playMove(board,position.expectedMove[0],position.expectedMove[1],playerColor);
        if (!played.legal) errors.push(item.id + " oracle first move is illegal: " + played.reason);
      }
    }
    return {ok:errors.length===0,errors,position:errors.length?null:position};
  }

  function validateAll(items,Go) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate tripod item id " + item.id);
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
    const board=Go.boardFromStones(position.setupStones,BOARD_SIZE);
    const playerColor=item.role==="attack"?Go.WHITE:Go.BLACK;
    const played=Go.playMove(board,move[0],move[1],playerColor);
    if (!played.legal) return {ok:true,status:"ILLEGAL_MOVE",correct:false,reason:played.reason};
    const correct=samePoint(move,position.expectedMove);
    return {
      ok:true,
      status:correct?"CORRECT":"INCORRECT",
      correct,
      oracleCaseId:ORACLE_CASE_ID,
      scope:"source_position_first_move_only"
    };
  }

  const api={
    CONTRACT_VERSION,
    BOARD_SIZE,
    ORACLE_CASE_ID,
    ORACLE_SOURCE_URL,
    POSITION_SOURCE_URL,
    BASE_SETUP,
    BASE_TARGET,
    BASE_MOVES,
    samePoint,
    rotatePoint,
    rotatedSetup,
    validatePosition,
    viewportForTurns,
    materializeItem,
    validateItem,
    validateAll,
    score
  };
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoTripodOracleContract=api;
})(typeof window!=="undefined"?window:globalThis);
