"use strict";
const Go=require("./go.js");
const Advanced=require("./advanced-content.js");
const SequenceContract=require("./advanced-sequence-contract.js");

const CONTRACT_ID="throw-in-transfer-v1";
const STATUS="teaching_candidate";

const semeaiFixtures=Object.freeze([
  {
    id:"throw-in-semeai-liberty-reduction-v1",
    role:"positive_liberty_change",
    boardSize:4,
    setupStones:[[0,0,Go.BLACK],[2,0,Go.WHITE],[3,0,Go.WHITE],[1,1,Go.BLACK],[2,1,Go.WHITE],[3,1,Go.WHITE],[0,2,Go.BLACK],[2,2,Go.WHITE],[3,2,Go.WHITE],[1,3,Go.BLACK]],
    targetSeed:[2,0],
    insertion:[3,3],
    forcedCapture:[2,3],
    expected:{beforeTargetLiberties:4,afterTargetLiberties:3}
  },
  {
    id:"throw-in-no-structural-change-v1",
    role:"negative_no_change",
    boardSize:4,
    setupStones:[[0,1,Go.WHITE],[2,1,Go.WHITE],[3,1,Go.BLACK],[2,2,Go.WHITE],[0,3,Go.BLACK]],
    targetSeed:[0,1],
    insertion:[0,0],
    forcedCapture:[1,0],
    expected:{beforeTargetLiberties:3,afterTargetLiberties:3}
  }
]);

function validateSemeaiFixture(item){
  const errors=[];
  let board;
  try{board=Go.boardFromStones(item.setupStones,item.boardSize);}catch(error){return{ok:false,errors:["setup invalid: "+error.message]};}
  const target=Go.groupAt(board,item.targetSeed[0],item.targetSeed[1]);
  if(!target){errors.push("target group missing");return{ok:false,errors};}
  if(target.liberties.length!==item.expected.beforeTargetLiberties)errors.push("before target liberties mismatch");

  const insertion=Go.playMove(board,item.insertion[0],item.insertion[1],Go.BLACK);
  if(!insertion.legal)errors.push("insertion illegal: "+insertion.reason);
  else if(insertion.captured.length!==0)errors.push("insertion must not immediately capture");

  if(errors.length)return{ok:false,errors};

  const capture=Go.playMove(insertion.board,item.forcedCapture[0],item.forcedCapture[1],Go.WHITE,{previousBoard:board});
  if(!capture.legal)errors.push("forced capture illegal: "+capture.reason);
  if(!capture.captured.some(([x,y])=>x===item.insertion[0]&&y===item.insertion[1]))errors.push("forced capture did not remove inserted stone");
  const after=capture.board[item.targetSeed[1]]&&capture.board[item.targetSeed[1]][item.targetSeed[0]]===Go.WHITE
    ?Go.groupAt(capture.board,item.targetSeed[0],item.targetSeed[1]):null;
  if(!after)errors.push("target group missing after capture");
  else if(after.liberties.length!==item.expected.afterTargetLiberties)errors.push("after target liberties mismatch");

  return{ok:errors.length===0,errors,before:target.liberties.length,after:after&&after.liberties.length};
}

function snapbackReference(){
  return Advanced.sequenceExperiences.find(item=>item.id==="adv-seq-snapback-01")||null;
}

function validateSnapbackReference(){
  const item=snapbackReference();
  if(!item)return{ok:false,errors:["existing snapback reference missing"]};
  const result=SequenceContract.validateExperience(item,Go);
  if(!result.ok)return{ok:false,errors:result.errors};
  const recapture=item.decisions[item.decisions.length-1];
  if(recapture.expectedLearnerCapturedCount<=1)return{ok:false,errors:["snapback reference must recapture more than the sacrificed stone"]};
  return{ok:true,errors:[],sourceExperienceId:item.id,recaptureCount:recapture.expectedLearnerCapturedCount};
}

function validateAll(){
  const snapback=validateSnapbackReference();
  const semeai=semeaiFixtures.map(item=>({id:item.id,...validateSemeaiFixture(item)}));
  const errors=[...snapback.errors.map(error=>"snapback: "+error),...semeai.flatMap(result=>result.errors.map(error=>result.id+": "+error))];
  return{ok:errors.length===0,snapback,semeai,errors};
}

module.exports=Object.freeze({
  CONTRACT_ID,
  STATUS,
  semeaiFixtures,
  deferredContexts:Object.freeze([{context:"false_eye_destruction",status:"research_candidate_not_promoted",reason:"No independent project-generated rules-backed fixture in this cycle."}]),
  snapbackReference,
  validateSnapbackReference,
  validateSemeaiFixture,
  validateAll
});
