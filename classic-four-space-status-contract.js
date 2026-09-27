(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-four-space-status-v1";
  const SQUARE_FOUR_BASE = [[0,0],[1,0],[0,1],[1,1]];
  const STRAIGHT_FOUR_BASE = [[0,0],[1,0],[2,0],[3,0]];
  const STATUS = Object.freeze({ ALIVE:"alive", DEAD:"dead" });

  function pointKey([x,y]) { return x + "," + y; }
  function samePoint(a,b) { return Array.isArray(a) && Array.isArray(b) && a[0]===b[0] && a[1]===b[1]; }
  function isUniquePoints(points) { return Array.isArray(points) && new Set(points.map(pointKey)).size===points.length; }
  function otherColor(color,Go) { return color===Go.BLACK ? Go.WHITE : Go.BLACK; }
  function adjacent(a,b) { return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) === 1; }

  function shapeKind(points,PracticeContract) {
    const sig=PracticeContract.canonicalSignature(points);
    if (sig===PracticeContract.canonicalSignature(SQUARE_FOUR_BASE)) return "square-four";
    if (sig===PracticeContract.canonicalSignature(STRAIGHT_FOUR_BASE)) return "straight-four";
    return null;
  }

  function proveSquareDead(item,deps,setupStones) {
    const { Go, PracticeContract, BentThreeContract }=deps;
    const defender=item.defenderColor;
    const attacker=otherColor(defender,Go);
    const bentSig=PracticeContract.canonicalSignature(BentThreeContract.BENT_THREE_BASE);
    const branches=[];

    for (const first of item.eyeSpace) {
      const board=Go.boardFromStones(setupStones,item.boardSize);
      const defend=Go.playMove(board,first[0],first[1],defender);
      if (!defend.legal) return {ok:false,reason:"defender move illegal",branches};
      const remaining=item.eyeSpace.filter((point)=>!samePoint(point,first));
      if (PracticeContract.canonicalSignature(remaining)!==bentSig) {
        return {ok:false,reason:"defender move does not reduce square four to bent three",branches};
      }
      const bend=BentThreeContract.deriveBend(remaining,PracticeContract);
      if (!bend) return {ok:false,reason:"bent-three reply not derivable",branches};
      const attack=Go.playMove(defend.board,bend[0],bend[1],attacker);
      if (!attack.legal) return {ok:false,reason:"attacker bent-three vital reply illegal",branches};
      branches.push({defenderFirst:first.slice(),attackerReply:bend.slice()});
    }
    return {ok:branches.length===item.eyeSpace.length,branches};
  }

  function proveStraightAlive(item,deps,setupStones) {
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
          found={attackerFirst:attackFirst.slice(),defenderReply:response.slice(),eyePoints:remaining.map((p)=>p.slice())};
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

    let kind=null;
    let setupStones=[];
    let proof=null;
    let expectedStatus=null;

    if (!errors.length) {
      kind=shapeKind(item.eyeSpace,PracticeContract);
      if (!kind) errors.push(item.id+" geometry is neither square-four nor straight-four");
      if (item.shapeKind!==kind) errors.push(item.id+" shapeKind does not match geometry");
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
        if (kind==="square-four") {
          proof=proveSquareDead(item,deps,setupStones);
          expectedStatus=STATUS.DEAD;
        } else {
          proof=proveStraightAlive(item,deps,setupStones);
          expectedStatus=STATUS.ALIVE;
        }
        if (!proof.ok) errors.push(item.id+" status proof failed: "+proof.reason);
      }
    }

    return {ok:errors.length===0,errors,shapeKind:kind,expectedStatus:errors.length?null:expectedStatus,proof:errors.length?null:proof,setupStones:errors.length?[]:setupStones};
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
      if (ids.has(item.id)) errors.push("duplicate four-space status id "+item.id);
      ids.add(item.id);
      const result=validateItem(item,deps);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:Array.isArray(items)&&items.length>0&&errors.length===0,results,errors};
  }

  const api={CONTRACT_VERSION,SQUARE_FOUR_BASE,STRAIGHT_FOUR_BASE,STATUS,shapeKind,proveSquareDead,proveStraightAlive,validateItem,validateAll,score};
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoFourSpaceStatusContract=api;
})(typeof window!=="undefined"?window:globalThis);
