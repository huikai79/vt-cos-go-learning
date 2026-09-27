(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-curved-four-status-v1";
  const CURVED_FOUR_BASE = [[0,0],[1,0],[2,0],[2,1]];
  const STATUS = Object.freeze({ ALIVE:"alive", DEAD:"dead" });

  function pointKey([x,y]) { return x + "," + y; }
  function samePoint(a,b) { return Array.isArray(a) && Array.isArray(b) && a[0]===b[0] && a[1]===b[1]; }
  function isUniquePoints(points) { return Array.isArray(points) && new Set(points.map(pointKey)).size===points.length; }
  function otherColor(color,Go) { return color===Go.BLACK ? Go.WHITE : Go.BLACK; }
  function adjacent(a,b) { return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) === 1; }

  function proveAlive(item,deps,setupStones) {
    const { Go }=deps;
    const defender=item.defenderColor;
    const attacker=otherColor(defender,Go);
    const branches=[];

    for (const attackFirst of item.eyeSpace) {
      const board=Go.boardFromStones(setupStones,item.boardSize);
      const attack=Go.playMove(board,attackFirst[0],attackFirst[1],attacker);
      if (!attack.legal) return {ok:false,reason:"attacker move illegal",branches};

      let found=null;
      for (const response of item.eyeSpace) {
        if (samePoint(response,attackFirst)) continue;
        const defend=Go.playMove(attack.board,response[0],response[1],defender);
        if (!defend.legal) continue;
        const remaining=item.eyeSpace.filter((point)=>!samePoint(point,attackFirst)&&!samePoint(point,response));
        if (remaining.length===2 && !adjacent(remaining[0],remaining[1])) {
          found={
            attackerFirst:attackFirst.slice(),
            defenderReply:response.slice(),
            eyePoints:remaining.map((point)=>point.slice())
          };
          break;
        }
      }
      if (!found) return {ok:false,reason:"no defender response leaves two separated eye points",branches};
      branches.push(found);
    }
    return {ok:branches.length===item.eyeSpace.length,branches};
  }

  function validateItem(item,deps) {
    const { Go, PracticeContract }=deps;
    const errors=[];
    if (!item || typeof item.id!=="string" || !item.id) return {ok:false,errors:["item id missing"]};
    if (item.scoringContractVersion!==CONTRACT_VERSION) errors.push(item.id+" scoring contract mismatch");
    if (!Number.isInteger(item.boardSize)||item.boardSize<6||item.boardSize>19) errors.push(item.id+" boardSize invalid");
    if (!Array.isArray(item.eyeSpace)||item.eyeSpace.length!==4||!isUniquePoints(item.eyeSpace)) errors.push(item.id+" eyeSpace must contain four unique points");
    if (![Go.BLACK,Go.WHITE].includes(item.defenderColor)) errors.push(item.id+" defenderColor invalid");
    for (const field of ["answer","expectedStatus","status","correctChoice"]) {
      if (Object.prototype.hasOwnProperty.call(item,field)) errors.push(item.id+" must not duplicate "+field);
    }

    let setupStones=[];
    let proof=null;
    if (!errors.length) {
      const actual=PracticeContract.canonicalSignature(item.eyeSpace);
      const expected=PracticeContract.canonicalSignature(CURVED_FOUR_BASE);
      if (actual!==expected) errors.push(item.id+" eyeSpace is not curved-four L-tetromino geometry");

      const allInside=item.eyeSpace.every(([x,y])=>x>=1&&y>=1&&x<item.boardSize-1&&y<item.boardSize-1);
      if (!allInside) errors.push(item.id+" eyeSpace lacks one-point board margin");

      if (!errors.length) {
        setupStones=PracticeContract.buildSetupStones(item,Go);
        let board;
        try { board=Go.boardFromStones(setupStones,item.boardSize); }
        catch (error) { errors.push(item.id+" setup invalid: "+error.message); }
        if (board) {
          const first=setupStones[0];
          const group=Go.groupAt(board,first[0],first[1]);
          if (!group || group.stones.length!==setupStones.length) errors.push(item.id+" setup wall is not one connected defender group");
        }
      }

      if (!errors.length) {
        proof=proveAlive(item,deps,setupStones);
        if (!proof.ok) errors.push(item.id+" status proof failed: "+proof.reason);
      }
    }

    return {
      ok:errors.length===0,
      errors,
      expectedStatus:errors.length?null:STATUS.ALIVE,
      proof:errors.length?null:proof,
      setupStones:errors.length?[]:setupStones
    };
  }

  function score(item,response,deps) {
    const validation=validateItem(item,deps);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    if (![STATUS.ALIVE,STATUS.DEAD].includes(response)) return {ok:true,status:"INVALID_RESPONSE",correct:false,expectedStatus:validation.expectedStatus};
    const correct=response===validation.expectedStatus;
    return {ok:true,status:correct?"CORRECT":"INCORRECT",correct,expectedStatus:validation.expectedStatus,proof:validation.proof};
  }

  function validateAll(items,deps) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate curved-four status id "+item.id);
      ids.add(item.id);
      const result=validateItem(item,deps);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:Array.isArray(items)&&items.length>0&&errors.length===0,results,errors};
  }

  const api={CONTRACT_VERSION,CURVED_FOUR_BASE,STATUS,proveAlive,validateItem,validateAll,score};
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoCurvedFourStatusContract=api;
})(typeof window!=="undefined"?window:globalThis);
