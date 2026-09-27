(function (root) {
  "use strict";

  const CONTRACT_VERSION = "classic-rectangular-six-miai-v1";
  const RECTANGULAR_SIX_BASE = [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]];

  function pointKey([x,y]) { return x + "," + y; }
  function samePoint(a,b) { return Array.isArray(a) && Array.isArray(b) && a[0]===b[0] && a[1]===b[1]; }
  function isUniquePoints(points) { return Array.isArray(points) && new Set(points.map(pointKey)).size===points.length; }
  function otherColor(color,Go) { return color===Go.BLACK ? Go.WHITE : Go.BLACK; }

  function deriveCenters(points,PracticeContract) {
    const degrees=PracticeContract.degreeMap(points);
    return points.filter((point)=>degrees.get(pointKey(point))===3).map((point)=>point.slice());
  }

  function validateItem(item,deps) {
    const { Go, PracticeContract }=deps;
    const errors=[];
    if (!item || typeof item.id!=="string" || !item.id) return {ok:false,errors:["item id missing"]};
    if (item.scoringContractVersion!==CONTRACT_VERSION) errors.push(item.id+" scoring contract mismatch");
    if (!Number.isInteger(item.boardSize)||item.boardSize<7||item.boardSize>19) errors.push(item.id+" boardSize invalid");
    if (!Array.isArray(item.eyeSpace)||item.eyeSpace.length!==6||!isUniquePoints(item.eyeSpace)) errors.push(item.id+" eyeSpace must contain six unique points");
    if (![Go.BLACK,Go.WHITE].includes(item.defenderColor)) errors.push(item.id+" defenderColor invalid");
    if (!Array.isArray(item.attackPoint)||item.attackPoint.length!==2||!item.attackPoint.every(Number.isInteger)) errors.push(item.id+" attackPoint invalid");
    for (const field of ["answer","correctMove","responsePoint","vitalPoint"]) {
      if (Object.prototype.hasOwnProperty.call(item,field)) errors.push(item.id+" must not duplicate "+field);
    }

    let centers=[];
    let expectedResponse=null;
    let setupStones=[];
    let boardAfterAttack=null;

    if (!errors.length) {
      const actual=PracticeContract.canonicalSignature(item.eyeSpace);
      const expected=PracticeContract.canonicalSignature(RECTANGULAR_SIX_BASE);
      if (actual!==expected) errors.push(item.id+" eyeSpace is not rectangular-six 2x3 geometry");

      centers=deriveCenters(item.eyeSpace,PracticeContract);
      if (centers.length!==2) errors.push(item.id+" rectangular six must have exactly two degree-3 centers");
      if (!centers.some((point)=>samePoint(point,item.attackPoint))) errors.push(item.id+" attackPoint must be one of the two miai centers");
      expectedResponse=centers.find((point)=>!samePoint(point,item.attackPoint)) || null;
      if (!expectedResponse) errors.push(item.id+" opposite miai response not derivable");

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

          const attacker=otherColor(item.defenderColor,Go);
          const attack=Go.playMove(board,item.attackPoint[0],item.attackPoint[1],attacker);
          if (!attack.legal) errors.push(item.id+" source attackPoint is illegal");
          else {
            boardAfterAttack=attack.board;
            const defend=Go.playMove(boardAfterAttack,expectedResponse[0],expectedResponse[1],item.defenderColor);
            if (!defend.legal) errors.push(item.id+" derived miai response is illegal");
          }
        }
      }
    }

    return {
      ok:errors.length===0,
      errors,
      centers:errors.length?[]:centers,
      expectedResponse:errors.length?null:expectedResponse,
      setupStones:errors.length?[]:setupStones,
      boardAfterAttack:errors.length?null:boardAfterAttack
    };
  }

  function score(item,move,deps) {
    const validation=validateItem(item,deps);
    if (!validation.ok) return {ok:false,status:"ERROR",errors:validation.errors};
    if (!Array.isArray(move)||move.length!==2||!move.every(Number.isInteger)) return {ok:true,status:"INVALID_RESPONSE",correct:false};
    const { Go }=deps;
    const played=Go.playMove(validation.boardAfterAttack,move[0],move[1],item.defenderColor);
    if (!played.legal) return {ok:true,status:"ILLEGAL_MOVE",correct:false,reason:played.reason};
    const correct=samePoint(move,validation.expectedResponse);
    return {
      ok:true,
      status:correct?"CORRECT":"INCORRECT",
      correct,
      expectedResponse:validation.expectedResponse,
      centers:validation.centers
    };
  }

  function validateAll(items,deps) {
    const errors=[];
    const results=[];
    const ids=new Set();
    for (const item of Array.isArray(items)?items:[]) {
      if (ids.has(item.id)) errors.push("duplicate rectangular-six id "+item.id);
      ids.add(item.id);
      const result=validateItem(item,deps);
      results.push({id:item.id,...result});
      errors.push(...result.errors);
    }
    return {ok:Array.isArray(items)&&items.length>0&&errors.length===0,results,errors};
  }

  const api={CONTRACT_VERSION,RECTANGULAR_SIX_BASE,pointKey,samePoint,deriveCenters,validateItem,validateAll,score};
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoRectangularSixMiaiContract=api;
})(typeof window!=="undefined"?window:globalThis);
