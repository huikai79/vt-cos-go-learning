(function(root){"use strict";

const Go=typeof require==="function"&&typeof module!=="undefined"?require("./go.js"):root.GoCore;
if(!Go)return;

const CONTRACT_VERSION="advanced-comparable-position-contract-v1";
const SCORING_CONTRACT_VERSION="urgent-atari-rescue-rules-v1";
const PAIR_POLICY_VERSION="advanced-comparable-fixed-pairs-v1";
const EVIDENCE_TAXONOMY_VERSION="advanced-comparable-evidence-v1";
const PAIR_HYPOTHESIS_VERSION="urgent-atari-rescue-hypothesis-v1";

const pairs=[
 {
  pairId:"urgent-rescue-pair-a",
  pairVersion:"urgent-rescue-pair-a-v1",
  pairHypothesisVersion:PAIR_HYPOTHESIS_VERSION,
  source:{
   itemId:"urgent-rescue-a-practice",
   itemVersion:"urgent-rescue-a-practice-v1",
   role:"practice",
   playerColor:Go.BLACK,
   stones:[
    [3,3,Go.BLACK],[4,3,Go.BLACK],
    [2,3,Go.WHITE],[3,2,Go.WHITE],[3,4,Go.WHITE],[4,2,Go.WHITE],[4,4,Go.WHITE],
    [15,3,Go.BLACK],[15,15,Go.BLACK],[9,9,Go.BLACK],
    [16,3,Go.WHITE],[3,15,Go.WHITE],[10,9,Go.WHITE]
   ]
  },
  target:{
   itemId:"urgent-rescue-a-process",
   itemVersion:"urgent-rescue-a-process-v1",
   role:"process_check",
   playerColor:Go.WHITE,
   stones:[
    [12,6,Go.WHITE],[12,7,Go.WHITE],[13,7,Go.WHITE],
    [11,6,Go.BLACK],[13,6,Go.BLACK],[11,7,Go.BLACK],[12,8,Go.BLACK],[13,8,Go.BLACK],[14,7,Go.BLACK],
    [3,3,Go.WHITE],[16,16,Go.WHITE],[9,14,Go.WHITE],
    [4,3,Go.BLACK],[16,15,Go.BLACK],[9,13,Go.BLACK]
   ]
  },
  variationAxes:["group_size","group_topology","player_color","board_region","global_distractors"]
 },
 {
  pairId:"urgent-rescue-pair-b",
  pairVersion:"urgent-rescue-pair-b-v1",
  pairHypothesisVersion:PAIR_HYPOTHESIS_VERSION,
  source:{
   itemId:"urgent-rescue-b-practice",
   itemVersion:"urgent-rescue-b-practice-v1",
   role:"practice",
   playerColor:Go.BLACK,
   stones:[
    [0,8,Go.BLACK],[0,9,Go.BLACK],[1,9,Go.BLACK],
    [1,8,Go.WHITE],[0,10,Go.WHITE],[1,10,Go.WHITE],[2,9,Go.WHITE],
    [10,3,Go.BLACK],[15,15,Go.BLACK],
    [10,4,Go.WHITE],[14,15,Go.WHITE]
   ]
  },
  target:{
   itemId:"urgent-rescue-b-process",
   itemVersion:"urgent-rescue-b-process-v1",
   role:"process_check",
   playerColor:Go.WHITE,
   stones:[
    [14,14,Go.WHITE],[14,15,Go.WHITE],
    [13,14,Go.BLACK],[15,14,Go.BLACK],[13,15,Go.BLACK],[15,15,Go.BLACK],[14,16,Go.BLACK],
    [3,4,Go.WHITE],[8,8,Go.WHITE],[4,15,Go.WHITE],
    [3,5,Go.BLACK],[8,9,Go.BLACK],[5,15,Go.BLACK]
   ]
  },
  variationAxes:["group_size","group_topology","edge_context","player_color","board_region","global_distractors"]
 }
];

function stableStringify(value){
 if(Array.isArray(value))return"["+value.map(stableStringify).join(",")+"]";
 if(value&&typeof value==="object")return"{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stableStringify(value[k])).join(",")+"}";
 return JSON.stringify(value);
}
function fnv1a(text){
 let h=0x811c9dc5;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
 return"h32-"+h.toString(16).padStart(8,"0");
}
function positionFingerprint(item){
 return"comparable-position-v1-"+fnv1a(stableStringify({boardSize:19,playerColor:item.playerColor,stones:[...item.stones].sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2])}));
}
function groupsForColor(board,color){
 const size=Go.boardSize(board);if(!size)return[];
 const seen=new Set(),groups=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  if(board[y][x]!==color||seen.has(x+","+y))continue;
  const group=Go.groupAt(board,x,y);if(!group)continue;
  group.stones.forEach(([gx,gy])=>seen.add(gx+","+gy));
  groups.push(group);
 }
 return groups;
}
function urgentGroup(item){
 const board=Go.boardFromStones(item.stones,19);
 const groups=groupsForColor(board,item.playerColor).filter(group=>group.liberties.length===1);
 return groups.length===1?groups[0]:null;
}
function scoreResponse(item,point){
 const board=Go.boardFromStones(item.stones,19);
 const before=urgentGroup(item);
 if(!before)return{legal:false,correct:false,error:"urgent_group_not_unique"};
 if(!Array.isArray(point)||point.length!==2)return{legal:false,correct:false,error:"point_invalid"};
 const [x,y]=point;
 const played=Go.playMove(board,x,y,item.playerColor);
 if(!played.legal)return{legal:false,correct:false,reason:played.reason,libertiesBefore:1,libertiesAfter:1};
 const anchor=before.stones[0];
 const after=Go.groupAt(played.board,anchor[0],anchor[1]);
 const libertiesAfter=after&&after.color===item.playerColor?after.liberties.length:0;
 return{
  legal:true,
  correct:Boolean(after&&after.color===item.playerColor&&libertiesAfter>=2),
  libertiesBefore:1,
  libertiesAfter,
  captured:played.captured.length
 };
}
function successfulPoints(item){
 const board=Go.boardFromStones(item.stones,19),points=[];
 for(let y=0;y<19;y++)for(let x=0;x<19;x++){
  if(board[y][x]!==Go.EMPTY)continue;
  const result=scoreResponse(item,[x,y]);
  if(result.legal&&result.correct)points.push([x,y]);
 }
 return points;
}
function surfaceDescriptor(item){
 const group=urgentGroup(item);if(!group)return null;
 const stoneSet=new Set(group.stones.map(([x,y])=>x+","+y));
 const degrees=group.stones.map(([x,y])=>{
  let degree=0;
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(stoneSet.has(nx+","+ny))degree++;
  return degree;
 }).sort((a,b)=>a-b);
 const edgeTouch=group.stones.some(([x,y])=>x===0||y===0||x===18||y===18);
 return{groupSize:group.stones.length,degrees,edgeTouch};
}
function sameSurfaceClass(a,b){
 const da=surfaceDescriptor(a),db=surfaceDescriptor(b);
 return Boolean(da&&db&&da.groupSize===db.groupSize&&da.edgeTouch===db.edgeTouch&&JSON.stringify(da.degrees)===JSON.stringify(db.degrees));
}
function normalizeItem(raw,pair){
 return {
  ...raw,
  boardSize:19,
  contractVersion:CONTRACT_VERSION,
  scoringContractVersion:SCORING_CONTRACT_VERSION,
  evidenceTaxonomyVersion:EVIDENCE_TAXONOMY_VERSION,
  pairPolicyVersion:PAIR_POLICY_VERSION,
  pairId:pair.pairId,
  pairVersion:pair.pairVersion,
  pairHypothesisVersion:pair.pairHypothesisVersion,
  provenance:{type:"project_synthetic",license:"project_original",public:true},
  prompt:(raw.playerColor===Go.BLACK?"黑":"白")+"棋下。盤上只有一串你的棋只剩一氣。請直接在全盤下出一手，讓那串棋脫離立即被提的危險。",
  positionFingerprint:null
 };
}
const normalizedPairs=pairs.map(pair=>{
 const source=normalizeItem(pair.source,pair),target=normalizeItem(pair.target,pair);
 source.positionFingerprint=positionFingerprint(source);
 target.positionFingerprint=positionFingerprint(target);
 return Object.freeze({...pair,source:Object.freeze(source),target:Object.freeze(target)});
});

function forbiddenAnswerField(item){
 return["answer","correctMove","expectedMove","solution","rescuePoint","targetAnchor"].some(key=>Object.prototype.hasOwnProperty.call(item,key));
}
function validateItem(item){
 if(!item||item.contractVersion!==CONTRACT_VERSION||item.scoringContractVersion!==SCORING_CONTRACT_VERSION)return"item_contract_invalid";
 if(item.boardSize!==19||![Go.BLACK,Go.WHITE].includes(item.playerColor)||!["practice","process_check"].includes(item.role))return"item_metadata_invalid";
 if(typeof item.itemId!=="string"||!item.itemId||typeof item.itemVersion!=="string"||!item.itemVersion||typeof item.positionFingerprint!=="string"||!item.positionFingerprint)return"item_identity_missing";
 if(!item.provenance||item.provenance.type!=="project_synthetic"||item.provenance.license!=="project_original"||item.provenance.public!==true)return"item_provenance_invalid";
 if(forbiddenAnswerField(item))return"item_answer_injection_forbidden";
 let board;try{board=Go.boardFromStones(item.stones,19);}catch{return"item_stones_invalid";}
 const ownAtari=groupsForColor(board,item.playerColor).filter(group=>group.liberties.length===1);
 if(ownAtari.length!==1)return"item_requires_exactly_one_own_atari_group";
 const successes=successfulPoints(item);
 if(successes.length!==1)return"item_success_not_unique";
 if(positionFingerprint(item)!==item.positionFingerprint)return"item_fingerprint_mismatch";
 return null;
}
function validatePair(pair){
 if(!pair||typeof pair.pairId!=="string"||!pair.pairId||typeof pair.pairVersion!=="string"||!pair.pairVersion)return"pair_identity_invalid";
 if(pair.pairHypothesisVersion!==PAIR_HYPOTHESIS_VERSION)return"pair_hypothesis_invalid";
 if(!Array.isArray(pair.variationAxes)||pair.variationAxes.length<3)return"pair_variation_axes_insufficient";
 for(const item of [pair.source,pair.target]){const error=validateItem(item);if(error)return error;}
 if(pair.source.role!=="practice"||pair.target.role!=="process_check")return"pair_role_invalid";
 if(pair.source.positionFingerprint===pair.target.positionFingerprint)return"pair_position_reused";
 if(sameSurfaceClass(pair.source,pair.target))return"pair_surface_too_equivalent";
 return null;
}
function itemOrder(){return[...normalizedPairs.map(pair=>pair.source),...normalizedPairs.map(pair=>pair.target)];}
function pairById(pairId){return normalizedPairs.find(pair=>pair.pairId===pairId)||null;}
function itemById(itemId){return itemOrder().find(item=>item.itemId===itemId)||null;}
function validateAll(){
 const ids=new Set();
 for(const pair of normalizedPairs){
  const error=validatePair(pair);if(error)return{ok:false,error,pairId:pair.pairId};
  for(const item of [pair.source,pair.target]){
   if(ids.has(item.itemId))return{ok:false,error:"duplicate_item_id",itemId:item.itemId};
   ids.add(item.itemId);
  }
 }
 return{ok:true};
}

const api={CONTRACT_VERSION,SCORING_CONTRACT_VERSION,PAIR_POLICY_VERSION,EVIDENCE_TAXONOMY_VERSION,PAIR_HYPOTHESIS_VERSION,pairs:normalizedPairs,itemOrder,pairById,itemById,positionFingerprint,groupsForColor,urgentGroup,scoreResponse,successfulPoints,surfaceDescriptor,sameSurfaceClass,validateItem,validatePair,validateAll};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedComparablePositionContract=api;
})(typeof window!=="undefined"?window:globalThis);
