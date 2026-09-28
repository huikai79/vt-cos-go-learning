(function(root){"use strict";
const Sgf=typeof require==="function"&&typeof module!=="undefined"?require("./sgf.js"):root.GoSgf;
const REQUEST_VERSION="decision-comparison-provider-v1";
const RESULT_VERSION="decision-comparison-result-v1";
const COMPARISON_CONTRACT_VERSION="decision-point-comparison-v1";
const RULES=new Set(["tromp-taylor","chinese","chinese-ogs","chinese-kgs","japanese","korean","stone-scoring","aga","bga","new-zealand","aga-button"]);
function fail(code){throw new Error(code);}
function validPoint(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<19&&p[1]>=0&&p[1]<19;}
function parsePoint(value){if(!/^[a-s]{2}$/i.test(value||""))return null;const x=value.toLowerCase().charCodeAt(0)-97,y=value.toLowerCase().charCodeAt(1)-97;return x<19&&y<19?[x,y]:null;}
function pointToGtp(point,size=19){if(!validPoint(point)||size!==19)fail("comparison_point_invalid");const letters="ABCDEFGHJKLMNOPQRST";return letters[point[0]]+String(size-point[1]);}
function normalizeRules(value){const text=String(value||"").trim().toLowerCase().replace(/_/g,"-").replace(/\s+/g," ");if(!text)return null;const direct=text.replace(/ /g,"-");if(RULES.has(direct))return direct;const aliases={"japan":"japanese","japanese-rules":"japanese","china":"chinese","chinese-rules":"chinese","korea":"korean","korean-rules":"korean","new-zealand-rules":"new-zealand","new zealand":"new-zealand","tromp taylor":"tromp-taylor"};return aliases[text]||null;}
function parseKomi(value){if(value===null||value===undefined||String(value).trim()==="")return null;const n=Number(value);return Number.isFinite(n)&&n>=-400&&n<=400&&Number.isInteger(n*2)?n:null;}
function moveFromNode(node){if(node.B&&node.W)fail("comparison_sgf_move_invalid");const prop=node.B?"B":node.W?"W":null;if(!prop)return null;if(node[prop].length!==1)fail("comparison_sgf_move_invalid");const raw=node[prop][0];if(raw==="")return{color:prop==="B"?1:2,type:"pass",point:null};const p=parsePoint(raw);if(!p)fail("comparison_sgf_point_unsupported");return{color:prop==="B"?1:2,type:"play",point:p};}
function rootSetup(rootNode){const out=[];for(const [name,color] of [["AB",1],["AW",2]])for(const raw of rootNode[name]||[]){const p=parsePoint(raw);if(!p)fail("comparison_sgf_setup_unsupported");out.push([color,p]);}return out;}
function extractAnalysisPosition(text,moveNumber){
 const game=Sgf.parseDecisionReviewSgf(text);const selected=game.moves.find(m=>m.number===moveNumber);if(!selected)fail("comparison_move_not_found");
 const nodes=game.nodes,rootNode=nodes[0]||{};const reasons=[];
 if((rootNode.AE||[]).length)reasons.push("root_remove_setup_unsupported");
 for(let i=1;i<=selected.nodeIndex;i++){const node=nodes[i]||{};if((node.AB||[]).length||(node.AW||[]).length||(node.AE||[]).length){reasons.push("midgame_setup_unsupported");break;}}
 const moves=[];for(let i=0;i<selected.nodeIndex;i++){const m=moveFromNode(nodes[i]||{});if(m)moves.push(m);}
 const rulesRaw=rootNode.RU&&rootNode.RU[0]||null,komiRaw=rootNode.KM&&rootNode.KM[0]||null;
 const rules=normalizeRules(rulesRaw),komi=parseKomi(komiRaw);
 if(!rules)reasons.push("rules_missing_or_unsupported");if(komi===null)reasons.push("komi_missing_or_invalid");
 const exp=Sgf.makeDecisionReviewExperience(text,moveNumber,"comparison-source");
 return{boardSize:19,sourceId:exp.source.sourceId,positionFingerprint:exp.source.positionFingerprint,moveNumber:selected.number,nodeIndex:selected.nodeIndex,toPlay:selected.color,originalMove:selected.point.slice(),initialStones:rootSetup(rootNode),moves,rulesRaw,komiRaw,rules,komi,historyMode:"root_setup_plus_moves",historySupported:!reasons.includes("root_remove_setup_unsupported")&&!reasons.includes("midgame_setup_unsupported"),ready:reasons.length===0,reasons};
}
function normalizeMaxVisits(value){const n=Number(value);return Number.isInteger(n)&&n>=20&&n<=5000?n:100;}
function normalizePvLen(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=20?n:8;}
function validateRequest(r){
 if(!r||r.contractVersion!==REQUEST_VERSION||r.comparisonContractVersion!==COMPARISON_CONTRACT_VERSION)return"comparison_request_contract_invalid";
 if(typeof r.requestId!=="string"||!r.requestId||typeof r.sourceId!=="string"||!r.sourceId||typeof r.positionFingerprint!=="string"||!r.positionFingerprint)return"comparison_request_identity_missing";
 if(r.boardSize!==19||![1,2].includes(r.toPlay)||!RULES.has(r.rules)||parseKomi(r.komi)===null)return"comparison_request_position_invalid";
 if(!Number.isInteger(r.maxVisits)||r.maxVisits<20||r.maxVisits>5000||!Number.isInteger(r.analysisPVLen)||r.analysisPVLen<1||r.analysisPVLen>20)return"comparison_request_budget_invalid";
 if(!Array.isArray(r.initialStones)||!r.initialStones.every(x=>Array.isArray(x)&&[1,2].includes(x[0])&&validPoint(x[1])))return"comparison_request_setup_invalid";
 if(!Array.isArray(r.moves)||!r.moves.every(m=>m&&[1,2].includes(m.color)&&((m.type==="pass"&&m.point===null)||(m.type==="play"&&validPoint(m.point)))))return"comparison_request_moves_invalid";
 if(!Array.isArray(r.candidates)||r.candidates.length!==2)return"comparison_request_candidates_invalid";
 const roles=r.candidates.map(c=>c&&c.role);if(new Set(roles).size!==2||!roles.includes("learner_first")||!roles.includes("original_game")||!r.candidates.every(c=>validPoint(c.point)))return"comparison_request_candidates_invalid";
 if(r.candidates[0].point[0]===r.candidates[1].point[0]&&r.candidates[0].point[1]===r.candidates[1].point[1])return"comparison_request_candidates_same";
 return null;
}
function buildRequest(text,moveNumber,learnerPoint,options={}){
 if(!validPoint(learnerPoint))fail("comparison_learner_point_invalid");const p=extractAnalysisPosition(text,moveNumber);
 if(!p.historySupported)fail(p.reasons.find(x=>x.includes("setup"))||"comparison_history_unsupported");
 const rules=normalizeRules(options.rules)||p.rules,komi=options.komi===undefined?p.komi:parseKomi(options.komi);
 if(!rules)fail("comparison_rules_required");if(komi===null)fail("comparison_komi_required");
 const request={contractVersion:REQUEST_VERSION,comparisonContractVersion:COMPARISON_CONTRACT_VERSION,requestId:String(options.requestId||("cmp-"+p.sourceId+"-"+p.nodeIndex)),sourceId:p.sourceId,positionFingerprint:p.positionFingerprint,boardSize:19,toPlay:p.toPlay,rules,komi,maxVisits:normalizeMaxVisits(options.maxVisits),analysisPVLen:normalizePvLen(options.analysisPVLen),historyMode:p.historyMode,initialStones:p.initialStones.map(([c,pt])=>[c,pt.slice()]),moves:p.moves.map(m=>({color:m.color,type:m.type,point:m.point?m.point.slice():null})),candidates:[{role:"learner_first",point:learnerPoint.slice()},{role:"original_game",point:p.originalMove.slice()}],authority:"bounded_search_estimate_only",formalEligible:false};
 const error=validateRequest(request);if(error)fail(error);return request;
}
function validateResult(result,request){
 if(!result||result.resultVersion!==RESULT_VERSION||result.comparisonContractVersion!==COMPARISON_CONTRACT_VERSION)return"comparison_result_contract_invalid";
 for(const k of ["requestId","sourceId","positionFingerprint","providerVersion","engineVersion","model"])if(typeof result[k]!=="string"||!result[k])return"comparison_result_metadata_missing";
 if(request&&(result.requestId!==request.requestId||result.sourceId!==request.sourceId||result.positionFingerprint!==request.positionFingerprint))return"comparison_result_identity_mismatch";
 if(result.boardSize!==19||!RULES.has(result.rules)||parseKomi(result.komi)===null||!Number.isInteger(result.maxVisits)||result.maxVisits<20)return"comparison_result_position_invalid";
 if(result.searchScope!=="root_allow_moves_only"||result.authority!=="bounded_search_estimate_only"||result.formalEligible!==false)return"comparison_result_authority_invalid";
 if(!Array.isArray(result.candidates)||result.candidates.length!==2)return"comparison_result_candidates_invalid";
 const byRole=new Map(result.candidates.map(c=>[c.role,c]));for(const role of ["learner_first","original_game"]){const c=byRole.get(role);if(!c||!validPoint(c.point)||!Number.isInteger(c.order)||c.order<0||!Number.isInteger(c.visits)||c.visits<0||!Array.isArray(c.pv)||!c.pv.every(v=>typeof v==="string"))return"comparison_result_candidate_invalid";if(c.scoreLead!==null&&!Number.isFinite(c.scoreLead))return"comparison_result_candidate_invalid";if(c.winrate!==null&&(!Number.isFinite(c.winrate)||c.winrate<0||c.winrate>1))return"comparison_result_candidate_invalid";}
 return null;
}
const api={REQUEST_VERSION,RESULT_VERSION,COMPARISON_CONTRACT_VERSION,RULES:[...RULES],validPoint,pointToGtp,normalizeRules,parseKomi,extractAnalysisPosition,buildRequest,validateRequest,validateResult};
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.GoDecisionComparison=api;
})(typeof window!=="undefined"?window:globalThis);
