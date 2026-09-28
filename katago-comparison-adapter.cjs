"use strict";
const Comparison=require("./decision-comparison.js");
const COMPARISON_PROVIDER_VERSION="katago-analysis-comparison-v1";
function colorName(color){return color===1?"B":color===2?"W":null;}
function comparisonQuery(body){
 const error=Comparison.validateRequest(body);if(error)throw new Error(error);
 const player=colorName(body.toPlay),allowed=body.candidates.map(c=>Comparison.pointToGtp(c.point,body.boardSize));
 return{id:body.requestId,initialStones:body.initialStones.map(([c,p])=>[colorName(c),Comparison.pointToGtp(p,body.boardSize)]),moves:body.moves.map(m=>[colorName(m.color),m.type==="pass"?"pass":Comparison.pointToGtp(m.point,body.boardSize)]),rules:body.rules,komi:body.komi,boardXSize:body.boardSize,boardYSize:body.boardSize,maxVisits:body.maxVisits,analysisPVLen:body.analysisPVLen,allowMoves:[{player,moves:allowed,untilDepth:1}]};
}
function parseComparisonOutput(body,output,meta={}){
 let parsed;try{parsed=typeof output==="string"?JSON.parse(output.trim()):output;}catch{throw new Error("comparison_engine_json_invalid");}
 if(!parsed||parsed.id!==body.requestId||parsed.isDuringSearch===true||!Array.isArray(parsed.moveInfos))throw new Error("comparison_engine_response_invalid");
 if(!parsed.rootInfo||parsed.rootInfo.currentPlayer!==colorName(body.toPlay))throw new Error("comparison_engine_player_mismatch");
 const infoByMove=new Map(parsed.moveInfos.map(info=>[String(info.move||"").toUpperCase(),info]));
 const candidates=body.candidates.map(candidate=>{const move=Comparison.pointToGtp(candidate.point,body.boardSize),info=infoByMove.get(move.toUpperCase());if(!info)throw new Error("comparison_candidate_missing_from_engine");return{role:candidate.role,point:candidate.point.slice(),order:Number(info.order),visits:Number(info.visits),scoreLead:Number.isFinite(Number(info.scoreLead))?Number(info.scoreLead):null,winrate:Number.isFinite(Number(info.winrate))?Number(info.winrate):null,pv:Array.isArray(info.pv)?info.pv.slice(0,body.analysisPVLen).map(String):[]};});
 const result={resultVersion:Comparison.RESULT_VERSION,comparisonContractVersion:Comparison.COMPARISON_CONTRACT_VERSION,requestId:body.requestId,sourceId:body.sourceId,positionFingerprint:body.positionFingerprint,boardSize:body.boardSize,rules:body.rules,komi:body.komi,maxVisits:body.maxVisits,analysisPVLen:body.analysisPVLen,searchScope:"root_allow_moves_only",authority:"bounded_search_estimate_only",formalEligible:false,providerVersion:meta.providerVersion||COMPARISON_PROVIDER_VERSION,engineVersion:meta.engineVersion||"unknown",model:meta.model||"unknown",candidates};
 const error=Comparison.validateResult(result,body);if(error)throw new Error(error);return result;
}
module.exports={COMPARISON_PROVIDER_VERSION,colorName,comparisonQuery,parseComparisonOutput};
