const test=require("node:test");
const assert=require("node:assert/strict");
const http=require("node:http");
const Comparison=require("../decision-comparison.js");
const Provider=require("../decision-comparison-provider.js");
const Adapter=require("../katago-comparison-adapter.cjs");

const sgf="(;GM[1]FF[4]SZ[19]RU[Japanese]KM[6.5];B[pd];W[dd];B[qp])";

test("SGF decision comparison requires explicit rules and komi, preserving real move history",()=>{
 const p=Comparison.extractAnalysisPosition(sgf,3);
 assert.equal(p.ready,true);
 assert.equal(p.rules,"japanese");
 assert.equal(p.komi,6.5);
 assert.equal(p.toPlay,1);
 assert.deepEqual(p.moves.map(m=>[m.color,m.point]),[[1,[15,3]],[2,[3,3]]]);
 assert.deepEqual(p.originalMove,[16,15]);
 const r=Comparison.buildRequest(sgf,3,[4,4],{requestId:"cmp-1",maxVisits:100,analysisPVLen:8});
 assert.equal(Comparison.validateRequest(r),null);
 assert.equal(r.authority,"bounded_search_estimate_only");
 assert.equal(r.formalEligible,false);
 assert.deepEqual(r.candidates,[{role:"learner_first",point:[4,4]},{role:"original_game",point:[16,15]}]);
});

test("missing or unsupported SGF rules/komi do not silently invent analysis conditions",()=>{
 const missing="(;GM[1]FF[4]SZ[19];B[pd];W[dd];B[qp])";
 const p=Comparison.extractAnalysisPosition(missing,3);
 assert.equal(p.ready,false);
 assert.ok(p.reasons.includes("rules_missing_or_unsupported"));
 assert.ok(p.reasons.includes("komi_missing_or_invalid"));
 assert.throws(()=>Comparison.buildRequest(missing,3,[4,4],{requestId:"x"}),/comparison_rules_required/);
 const manual=Comparison.buildRequest(missing,3,[4,4],{requestId:"x2",rules:"japanese",komi:6.5});
 assert.equal(manual.rules,"japanese");
 assert.equal(manual.komi,6.5);
});

test("midgame setup is rejected instead of flattened into a fake move history",()=>{
 const text="(;GM[1]FF[4]SZ[19]RU[Japanese]KM[6.5];B[pd];AW[qq];W[dd];B[qp])";
 const p=Comparison.extractAnalysisPosition(text,4);
 assert.equal(p.historySupported,false);
 assert.ok(p.reasons.includes("midgame_setup_unsupported"));
 assert.throws(()=>Comparison.buildRequest(text,4,[4,4],{requestId:"bad"}),/midgame_setup_unsupported/);
});

test("same learner and original move is not sent as a fake comparison",()=>{
 assert.throws(()=>Comparison.buildRequest(sgf,3,[16,15],{requestId:"same"}),/comparison_request_candidates_same/);
});

test("KataGo adapter restricts root search to exactly the two candidates",()=>{
 const request=Comparison.buildRequest(sgf,3,[4,4],{requestId:"cmp-adapter",maxVisits:100,analysisPVLen:8});
 const query=Adapter.comparisonQuery(request);
 assert.equal(query.id,"cmp-adapter");
 assert.equal(query.rules,"japanese");
 assert.equal(query.komi,6.5);
 assert.deepEqual(query.moves,[["B","Q16"],["W","D16"]]);
 assert.deepEqual(query.allowMoves,[{player:"B",moves:["E15","R4"],untilDepth:1}]);
 assert.equal(query.maxVisits,100);
});

test("adapter validates both candidates and refuses partial engine output",()=>{
 const request=Comparison.buildRequest(sgf,3,[4,4],{requestId:"cmp-out",maxVisits:100,analysisPVLen:4});
 const output={id:"cmp-out",isDuringSearch:false,rootInfo:{currentPlayer:"B"},moveInfos:[
   {move:"E15",order:0,visits:61,scoreLead:1.2,winrate:.55,pv:["E15","Q10"]},
   {move:"R4",order:1,visits:39,scoreLead:.4,winrate:.51,pv:["R4","C10"]}
 ]};
 const result=Adapter.parseComparisonOutput(request,output,{engineVersion:"1.18.1",model:"model.bin.gz"});
 assert.equal(Comparison.validateResult(result,request),null);
 assert.equal(result.authority,"bounded_search_estimate_only");
 assert.equal(result.candidates[0].role,"learner_first");
 assert.equal(result.candidates[0].order,0);
 assert.throws(()=>Adapter.parseComparisonOutput(request,{...output,moveInfos:[output.moveInfos[0]]}),/comparison_candidate_missing_from_engine/);
 assert.throws(()=>Adapter.parseComparisonOutput(request,{...output,rootInfo:{currentPlayer:"W"}}),/comparison_engine_player_mismatch/);
});

test("browser provider keeps HTTP/provider failure as failure and validates success",async()=>{
 const request=Comparison.buildRequest(sgf,3,[4,4],{requestId:"cmp-http",maxVisits:100,analysisPVLen:4});
 const success={resultVersion:Comparison.RESULT_VERSION,comparisonContractVersion:Comparison.COMPARISON_CONTRACT_VERSION,requestId:request.requestId,sourceId:request.sourceId,positionFingerprint:request.positionFingerprint,boardSize:19,rules:"japanese",komi:6.5,maxVisits:100,analysisPVLen:4,searchScope:"root_allow_moves_only",authority:"bounded_search_estimate_only",formalEligible:false,providerVersion:"fixture-v1",engineVersion:"1.18.1",model:"fixture.bin.gz",candidates:[
   {role:"learner_first",point:[4,4],order:0,visits:55,scoreLead:1,winrate:.54,pv:["E15"]},
   {role:"original_game",point:[16,15],order:1,visits:45,scoreLead:.5,winrate:.52,pv:["R4"]}
 ]};
 let mode="ok";
 const server=http.createServer((req,res)=>{let raw="";req.on("data",d=>raw+=d);req.on("end",()=>{if(mode==="fail"){res.writeHead(503,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"katago_bridge_not_configured"}));return;}const body=JSON.parse(raw);assert.equal(body.requestId,"cmp-http");res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(success));});});
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 try{
   const endpoint=`http://127.0.0.1:${server.address().port}/v1/compare`;
   const result=await Provider.requestComparison(request,{endpoint,timeoutMs:2000});
   assert.equal(result.candidates.length,2);
   mode="fail";
   await assert.rejects(()=>Provider.requestComparison(request,{endpoint,timeoutMs:2000}),/katago_bridge_not_configured/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
