(function(root){"use strict";
 const Go=typeof require==="function"&&typeof module!=="undefined"?require("./go.js"):root.GoCore;
 const B=Go.BLACK,W=Go.WHITE;
 const CONTRACT_ID="semeai-liberty-structure-v1";
 const STATUS="teaching_candidate";

 function pointKey(point){return point[0]+","+point[1];}
 function trackedGroup(board,seed,color){
  return board[seed[1]]&&board[seed[1]][seed[0]]===color?Go.groupAt(board,seed[0],seed[1]):null;
 }
 function simpleEyes(board,group,color){
  if(!group)return[];
  const stones=new Set(group.stones.map(pointKey)),size=board.length,eyes=[];
  for(const [x,y] of group.liberties){
   const neighbors=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([nx,ny])=>nx>=0&&ny>=0&&nx<size&&ny<size);
   if(neighbors.length&&neighbors.every(([nx,ny])=>board[ny][nx]===color&&stones.has(nx+","+ny)))eyes.push([x,y]);
  }
  return eyes;
 }
 function sharedLiberties(black,white){
  if(!black||!white)return[];
  const whiteLibs=new Set(white.liberties.map(pointKey));
  return black.liberties.filter(point=>whiteLibs.has(pointKey(point)));
 }
 function localCandidateMoves(board,blackSeed,whiteSeed){
  const moves=new Map();
  for(const [seed,color] of [[blackSeed,B],[whiteSeed,W]]){
   const group=trackedGroup(board,seed,color);
   if(group)for(const liberty of group.liberties)moves.set(pointKey(liberty),liberty);
  }
  return [...moves.values()];
 }
 function boundedWinner(board,toPlay,blackSeed,whiteSeed,depth=12,memo=new Map()){
  const black=trackedGroup(board,blackSeed,B),white=trackedGroup(board,whiteSeed,W);
  if(!black)return W;
  if(!white)return B;
  if(depth<=0)return 0;
  const key=toPlay+"|"+depth+"|"+board.flat().join("");
  if(memo.has(key))return memo.get(key);
  const opponent=toPlay===B?W:B;
  let sawLegal=false,sawUnknown=false;
  for(const [x,y] of localCandidateMoves(board,blackSeed,whiteSeed)){
   const result=Go.playMove(board,x,y,toPlay);
   if(!result.legal)continue;
   sawLegal=true;
   const winner=boundedWinner(result.board,opponent,blackSeed,whiteSeed,depth-1,memo);
   if(winner===toPlay){memo.set(key,toPlay);return toPlay;}
   if(winner===0)sawUnknown=true;
  }
  const outcome=sawLegal?(sawUnknown?0:opponent):0;
  memo.set(key,outcome);
  return outcome;
 }
 function facts(fixture){
  const board=Go.boardFromStones(fixture.setupStones,fixture.boardSize);
  const black=trackedGroup(board,fixture.blackSeed,B),white=trackedGroup(board,fixture.whiteSeed,W);
  return{
   board,black,white,
   blackEyes:simpleEyes(board,black,B),
   whiteEyes:simpleEyes(board,white,W),
   shared:sharedLiberties(black,white)
  };
 }

 const fixtures=Object.freeze([
  {
   id:"semeai-baseline-no-eye-v1",kind:"baseline",
   boardSize:5,setupStones:[[1,1,B],[3,1,W],[4,1,B],[1,2,W],[2,2,B],[3,2,W],[4,2,B],[3,3,B]],
   blackSeed:[2,2],whiteSeed:[3,2],
   expected:{blackEyes:0,whiteEyes:0,blackLiberties:2,whiteLiberties:2,blackWinsIfBlackStarts:true}
  },
  {
   id:"semeai-one-eye-bounded-advantage-v1",kind:"eye_structure",
   boardSize:4,setupStones:[[1,0,B],[0,1,B],[1,1,B],[2,1,W],[1,3,B]],
   blackSeed:[1,0],whiteSeed:[2,1],
   expected:{blackEyes:1,whiteEyes:0,sharedAtLeast:1,winnerWhenWhiteStarts:B}
  },
  {
   id:"semeai-one-eye-not-auto-win-v1",kind:"negative_eye_rule",
   boardSize:4,setupStones:[[1,1,W],[0,2,B],[1,2,B],[1,3,B],[2,3,W]],
   blackSeed:[0,2],whiteSeed:[1,1],
   expected:{blackEyes:1,whiteEyes:0,sharedAtLeast:1,winnerWhenWhiteStarts:W}
  },
  {
   id:"semeai-increase-liberties-before-attack-v1",kind:"increase_liberties",
   boardSize:4,setupStones:[[0,0,W],[1,0,W],[2,0,B],[1,1,B],[3,1,W],[0,2,W],[0,3,B],[1,3,B],[2,3,W]],
   blackSeed:[2,0],whiteSeed:[3,1],
   increaseMove:[2,1],directAttackMove:[3,0],
   expected:{blackLiberties:2,whiteLiberties:3,increaseMoveBlackLiberties:4,winnerAfterIncrease:B,winnerAfterDirectAttack:W}
  }
 ]);

 function validateFixture(fixture){
  const errors=[];
  let state;
  try{state=facts(fixture);}catch(error){return{ok:false,errors:["setup invalid: "+error.message]};}
  const {board,black,white,blackEyes,whiteEyes,shared}=state;
  if(!black||!white)errors.push("tracked group missing");
  const expected=fixture.expected||{};
  if(Number.isInteger(expected.blackEyes)&&blackEyes.length!==expected.blackEyes)errors.push("black eye count mismatch");
  if(Number.isInteger(expected.whiteEyes)&&whiteEyes.length!==expected.whiteEyes)errors.push("white eye count mismatch");
  if(Number.isInteger(expected.blackLiberties)&&black&&black.liberties.length!==expected.blackLiberties)errors.push("black liberties mismatch");
  if(Number.isInteger(expected.whiteLiberties)&&white&&white.liberties.length!==expected.whiteLiberties)errors.push("white liberties mismatch");
  if(Number.isInteger(expected.sharedAtLeast)&&shared.length<expected.sharedAtLeast)errors.push("shared liberties below expected minimum");
  if(expected.blackWinsIfBlackStarts===true&&boundedWinner(board,B,fixture.blackSeed,fixture.whiteSeed)!==B)errors.push("baseline black-start result mismatch");
  if(expected.winnerWhenWhiteStarts!==undefined&&boundedWinner(board,W,fixture.blackSeed,fixture.whiteSeed)!==expected.winnerWhenWhiteStarts)errors.push("white-start bounded result mismatch");
  if(fixture.increaseMove){
   const move=Go.playMove(board,fixture.increaseMove[0],fixture.increaseMove[1],B);
   if(!move.legal||move.captured.length)errors.push("increase move must be legal non-capture");
   else{
    const after=trackedGroup(move.board,fixture.blackSeed,B);
    if(!after||after.liberties.length!==expected.increaseMoveBlackLiberties)errors.push("increase move liberty result mismatch");
    if(boundedWinner(move.board,W,fixture.blackSeed,fixture.whiteSeed)!==expected.winnerAfterIncrease)errors.push("increase move bounded winner mismatch");
   }
  }
  if(fixture.directAttackMove){
   const move=Go.playMove(board,fixture.directAttackMove[0],fixture.directAttackMove[1],B);
   if(!move.legal||move.captured.length)errors.push("direct attack must be legal non-capture");
   else if(boundedWinner(move.board,W,fixture.blackSeed,fixture.whiteSeed)!==expected.winnerAfterDirectAttack)errors.push("direct attack bounded winner mismatch");
  }
  return{ok:errors.length===0,errors,facts:{blackEyes:blackEyes.length,whiteEyes:whiteEyes.length,sharedLiberties:shared.length,blackLiberties:black&&black.liberties.length,whiteLiberties:white&&white.liberties.length}};
 }
 function validateAll(){const results=fixtures.map(fixture=>({id:fixture.id,...validateFixture(fixture)}));return{ok:results.every(result=>result.ok),results,errors:results.flatMap(result=>result.errors.map(error=>result.id+": "+error))};}
 const api={CONTRACT_ID,STATUS,fixtures,trackedGroup,simpleEyes,sharedLiberties,boundedWinner,facts,validateFixture,validateAll};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.GoSemeaiLibertyStructure=api;
})(typeof window!=="undefined"?window:globalThis);
