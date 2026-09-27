(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-big-pigs-mouth-source-case-v1";
  const BOARD_SIZE = 19;
  const SOURCE_CASE_ID = "bood-go-test-j-group-live2-before-move-52";
  const SOURCE_REPO = "https://github.com/bood/go-test";
  const SOURCE_SGF = "https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/sgf/%E5%A4%A7%E7%8C%AA%E5%98%B4.sgf";
  const SOURCE_CONFIG = "https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/config.yml";
  const SOURCE_LICENSE = "https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/LICENSE";

  // Reconstructed board state immediately before SGF move 52 (loadsgf ... 52).
  // The upstream MIT regression labels this case j_group_live2 / 大猪嘴 and
  // accepts R1 for White. This contract is intentionally source-case scoped:
  // it does not claim that this whole-board position is the canonical geometry
  // or that R1 is the answer for every J Group / 大豬嘴 position.
  const BASE_SETUP = Object.freeze([
    [4,2,2],[14,2,2],[2,3,1],[16,3,1],[2,4,1],[3,4,2],[15,4,2],[16,4,1],
    [3,5,2],[15,5,2],[16,5,1],[2,6,1],[15,6,2],[13,7,1],[15,7,1],[16,7,1],
    [12,9,2],[14,9,2],[16,9,2],[11,11,1],[14,12,1],[16,12,2],[17,12,2],
    [11,13,1],[16,13,2],[17,13,1],[18,13,2],[14,14,1],[15,14,1],[16,14,2],
    [17,14,1],[2,15,2],[3,15,2],[4,15,2],[5,15,2],[11,15,2],[15,15,2],
    [16,15,1],[18,15,1],[2,16,1],[3,16,1],[4,16,1],[5,16,2],[6,16,1],
    [12,16,2],[15,16,2],[16,16,1],[5,17,1],[7,17,1],[15,17,2],[16,17,1]
  ].map((stone) => Object.freeze(stone.slice())));

  const BASE_EXPECTED_MOVE = Object.freeze([16,18]); // R1
  const BASE_VIEWPORT = Object.freeze({minX:10,maxX:18,minY:10,maxY:18});

  function samePoint(a,b) {
    return Array.isArray(a) && Array.isArray(b) && a[0]===b[0] && a[1]===b[1];
  }

  function rotatePoint(point,quarterTurns,size=BOARD_SIZE) {
    let [x,y]=point;
    let turns=((quarterTurns%4)+4)%4;
    while (turns>0) {
      [x,y]=[size-1-y,x];
      turns-=1;
    }
    return [x,y];
  }

  function rotateStone(stone,quarterTurns,size=BOARD_SIZE) {
    const [x,y]=rotatePoint(stone,quarterTurns,size);
    return [x,y,stone[2]];
  }

  function stoneKey(stone) { return stone[0]+","+stone[1]+","+stone[2]; }
  function signature(stones) { return stones.map(stoneKey).sort().join(";"); }

  function rotatedSetup(quarterTurns) {
    return BASE_SETUP.map((stone) => rotateStone(stone,quarterTurns));
  }

  function validSignatures() {
    return [0,1,2,3].map((turns) => signature(rotatedSetup(turns)));
  }

  function validatePosition(stones) {
    if (!Array.isArray(stones) || stones.length!==BASE_SETUP.length) return {ok:false,reason:"stone_count_mismatch"};
    const occupied=new Set();
    for (const stone of stones) {
      if (!Array.isArray(stone) || stone.length!==3) return {ok:false,reason:"invalid_stone"};
      const [x,y,color]=stone;
      if (!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=BOARD_SIZE||y>=BOARD_SIZE) return {ok:false,reason:"out_of_bounds"};
      if (color!==1 && color!==2) return {ok:false,reason:"invalid_color"};
      const key=x+","+y;
      if (occupied.has(key)) return {ok:false,reason:"overlap"};
      occupied.add(key);
    }
    return validSignatures().includes(signature(stones))
      ? {ok:true,reason:null}
      : {ok:false,reason:"source_geometry_mismatch"};
  }

  function rotateViewport(viewport,quarterTurns) {
    const corners=[
      [viewport.minX,viewport.minY],[viewport.maxX,viewport.minY],
      [viewport.minX,viewport.maxY],[viewport.maxX,viewport.maxY]
    ].map((point)=>rotatePoint(point,quarterTurns));
    return {
      minX:Math.min(...corners.map((p)=>p[0])),
      maxX:Math.max(...corners.map((p)=>p[0])),
      minY:Math.min(...corners.map((p)=>p[1])),
      maxY:Math.max(...corners.map((p)=>p[1]))
    };
  }

  function materializeItem(item) {
    return {
      boardSize:BOARD_SIZE,
      setupStones:rotatedSetup(item.quarterTurns),
      expectedMove:rotatePoint(BASE_EXPECTED_MOVE,item.quarterTurns),
      viewport:rotateViewport(BASE_VIEWPORT,item.quarterTurns),
      playerColor:2
    };
  }

  function validateItem(item,Go) {
    const errors=[];
    if (!item || typeof item.id!=="string" || !item.id) return {ok:false,errors:["item id missing"]};
    if (item.scoringContractVersion!==CONTRACT_VERSION) errors.push(item.id+" scoring contract mismatch");
    if (item.sourceCaseId!==SOURCE_CASE_ID) errors.push(item.id+" source case mismatch");
    if (item.boardSize!==BOARD_SIZE) errors.push(item.id+" boardSize mismatch");
    if (!Number.isInteger(item.quarterTurns)||item.quarterTurns<0||item.quarterTurns>3) errors.push(item.id+" quarterTurns invalid");
    for (const field of ["answer","correctMove","expectedMove","setupStones"]) {
      if (Object.prototype.hasOwnProperty.call(item,field)) errors.push(item.id+" must not duplicate "+field);
    }

    let position=null;
    if (!errors.length) {
      position=materializeItem(item);
      const geometry=validatePosition(position.setupStones);
      if (!geometry.ok) errors.push(item.id+" source geometry invalid: "+geometry.reason);
      let board;
      try { board=Go.boardFromStones(position.setupStones,BOARD_SIZE); }
      catch (error) { errors.push(item.id+" setup invalid: "+error.message); }
      if (board) {
        const played=Go.playMove(board,position.expectedMove[0],position.expectedMove[1],position.playerColor);
        if (!played.legal) errors.push(item.id+" expected source move illegal: "+played.reason);
      }
    }
    return {ok:errors.length===0,errors,position:errors.length?null:position};
  }

  function validateAll(items,Go) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate big-pigs-mouth item id "+item.id);
      ids.add(item.id);
      const result=validateItem(item,Go);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:Array.isArray(items)&&items.length>0&&errors.length===0,errors,results};
  }

  function score(item,move,Go) {
    const validation=validateItem(item,Go);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    if (!Array.isArray(move)||move.length!==2||!move.every(Number.isInteger)) {
      return {ok:true,status:"INVALID_RESPONSE",correct:false};
    }
    const position=validation.position;
    const board=Go.boardFromStones(position.setupStones,BOARD_SIZE);
    const played=Go.playMove(board,move[0],move[1],position.playerColor);
    if (!played.legal) return {ok:true,status:"ILLEGAL_MOVE",correct:false,reason:played.reason};
    const correct=samePoint(move,position.expectedMove);
    return {
      ok:true,
      status:correct?"CORRECT":"INCORRECT",
      correct,
      sourceCaseId:SOURCE_CASE_ID,
      scope:"exact_source_position_first_move_only"
    };
  }

  const api={
    CONTRACT_VERSION,BOARD_SIZE,SOURCE_CASE_ID,SOURCE_REPO,SOURCE_SGF,SOURCE_CONFIG,SOURCE_LICENSE,
    BASE_SETUP,BASE_EXPECTED_MOVE,BASE_VIEWPORT,samePoint,rotatePoint,rotatedSetup,validatePosition,
    rotateViewport,materializeItem,validateItem,validateAll,score
  };
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoBigPigsMouthSourceCaseContract=api;
})(typeof window!=="undefined"?window:globalThis);
