(function(root){"use strict";

const Go=typeof require==="function"&&typeof module!=="undefined"?require("./go.js"):root.GoCore;
const Legacy=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-position-contract.js"):root.GoAdvancedComparablePositionContract;
if(!Go||!Legacy)return;

const FRAMEWORK_VERSION="advanced-comparable-framework-v2";
const EVIDENCE_TAXONOMY_VERSION="advanced-comparable-evidence-v2";
const IMMEDIATE_POLICY_VERSION="advanced-comparable-fixed-family-v2";
const DELAY_POLICY_VERSION="advanced-delayed-fixed-24h-v2";
const MIN_DELAY_MS=24*60*60*1000;

const DOUBLE_ATARI_FAMILY=Object.freeze({
 familyId:"double_atari",
 familyVersion:"double-atari-family-v1",
 scoringContractVersion:"double-atari-two-targets-rules-v1",
 pairHypothesisVersion:"double-atari-pair-hypothesis-v1",
 kcHypothesisId:"double-atari-kc",
 kcHypothesisVersion:"double-atari-kc-v1",
 kcStatus:"not_promoted",
 sourceReviewId:"capture-pattern-concept-anchors-v1"
});

const LEGACY_URGENT_FAMILY=Object.freeze({
 familyId:"urgent_atari_rescue",
 familyVersion:"urgent-atari-rescue-legacy-v1",
 scoringContractVersion:Legacy.SCORING_CONTRACT_VERSION,
 pairHypothesisVersion:Legacy.PAIR_HYPOTHESIS_VERSION,
 kcHypothesisId:Legacy.KC_HYPOTHESIS_ID,
 kcHypothesisVersion:Legacy.KC_HYPOTHESIS_VERSION,
 kcStatus:"not_promoted",
 writer:"legacy_read_only"
});

const rawItems=[
 {
  itemId:"double-atari-fullboard-practice-v1",
  itemVersion:"double-atari-fullboard-practice-v1",
  role:"practice",
  playerColor:Go.BLACK,
  stones:[
   [5,5,Go.WHITE],[4,5,Go.BLACK],[5,4,Go.BLACK],
   [7,5,Go.WHITE],[8,5,Go.BLACK],[7,4,Go.BLACK],
   [3,3,Go.BLACK],[15,15,Go.BLACK],[3,15,Go.WHITE],[15,3,Go.WHITE]
  ],
  variationAxes:["single-single-targets","black-to-play","upper-left-local","global-distractors"]
 },
 {
  itemId:"double-atari-fullboard-process-v1",
  itemVersion:"double-atari-fullboard-process-v1",
  role:"process_check",
  playerColor:Go.WHITE,
  stones:[
   [12,10,Go.BLACK],[12,11,Go.BLACK],
   [11,10,Go.WHITE],[12,9,Go.WHITE],[11,11,Go.WHITE],[13,11,Go.WHITE],
   [14,10,Go.BLACK],[15,10,Go.WHITE],[14,9,Go.WHITE],
   [3,3,Go.WHITE],[15,15,Go.WHITE],[3,15,Go.BLACK],[8,4,Go.BLACK]
  ],
  variationAxes:["two-plus-one-targets","white-to-play","right-center-local","global-distractors"]
 },
 {
  itemId:"double-atari-fullboard-delayed-v1",
  itemVersion:"double-atari-fullboard-delayed-v1",
  role:"delayed_process_check",
  anchorItemId:"double-atari-fullboard-process-v1",
  playerColor:Go.BLACK,
  stones:[
   [1,14,Go.WHITE],[1,15,Go.WHITE],
   [0,14,Go.BLACK],[1,13,Go.BLACK],[0,15,Go.BLACK],[2,15,Go.BLACK],
   [3,13,Go.WHITE],[3,14,Go.WHITE],
   [2,13,Go.BLACK],[3,12,Go.BLACK],[4,14,Go.BLACK],[3,15,Go.BLACK],
   [15,3,Go.BLACK],[15,15,Go.BLACK],[14,3,Go.WHITE],[8,8,Go.WHITE]
  ],
  variationAxes:["two-plus-two-targets","black-to-play","lower-left-local","near-edge-context","global-distractors"]
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
 return"comparable-v2-"+fnv1a(stableStringify({boardSize:19,playerColor:item.playerColor,stones:[...item.stones].sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2])}));
}
function uniqueGroups(board,color){
 const size=Go.boardSize(board),seen=new Set(),groups=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  if(board[y][x]!==color||seen.has(x+","+y))continue;
  const group=Go.groupAt(board,x,y);if(!group)continue;
  group.stones.forEach(([gx,gy])=>seen.add(gx+","+gy));
  groups.push(group);
 }
 return groups;
}
function stoneKey(stones){return stones.map(([x,y])=>x+","+y).sort().join("|");}
function doubleAtariScore(item,point){
 let board;
 try{board=Go.boardFromStones(item.stones,19);}catch{return{legal:false,correct:false,error:"board_invalid"};}
 if(!Array.isArray(point)||point.length!==2)return{legal:false,correct:false,error:"point_invalid"};
 const opponent=item.playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
 const beforeGroups=uniqueGroups(board,opponent);
 const before=new Map(beforeGroups.map(group=>[stoneKey(group.stones),group]));
 const beforeAtari=beforeGroups.filter(group=>group.liberties.length===1).length;
 if(beforeAtari!==0)return{legal:false,correct:false,error:"opponent_already_in_atari"};
 const played=Go.playMove(board,point[0],point[1],item.playerColor);
 if(!played.legal)return{legal:false,correct:false,reason:played.reason||"illegal_move",newlyAtariCount:0,capturedCount:0};
 if(played.captured.length!==0)return{legal:true,correct:false,error:"immediate_capture_not_allowed",newlyAtariCount:0,capturedCount:played.captured.length};
 const afterGroups=uniqueGroups(played.board,opponent);
 const newly=[];
 for(const group of afterGroups){
  const prior=before.get(stoneKey(group.stones));
  if(prior&&prior.liberties.length===2&&group.liberties.length===1)newly.push(group);
 }
 return{
  legal:true,
  correct:newly.length===2,
  newlyAtariCount:newly.length,
  targetGroupSizes:newly.map(group=>group.stones.length).sort((a,b)=>a-b),
  capturedCount:0
 };
}
function successfulPointsForDoubleAtari(item){
 const board=Go.boardFromStones(item.stones,19),points=[];
 for(let y=0;y<19;y++)for(let x=0;x<19;x++){
  if(board[y][x]!==Go.EMPTY)continue;
  const result=doubleAtariScore(item,[x,y]);
  if(result.legal&&result.correct)points.push([x,y]);
 }
 return points;
}
function doubleAtariSurfaceDescriptor(item){
 const success=successfulPointsForDoubleAtari(item);
 if(success.length!==1)return null;
 const board=Go.boardFromStones(item.stones,19),opponent=item.playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
 const before=new Map(uniqueGroups(board,opponent).map(group=>[stoneKey(group.stones),group]));
 const played=Go.playMove(board,success[0][0],success[0][1],item.playerColor);
 const targets=uniqueGroups(played.board,opponent).filter(group=>{
  const prior=before.get(stoneKey(group.stones));
  return prior&&prior.liberties.length===2&&group.liberties.length===1;
 });
 return{
  targetSizes:targets.map(group=>group.stones.length).sort((a,b)=>a-b),
  edgeTouch:targets.some(group=>group.stones.some(([x,y])=>x===0||y===0||x===18||y===18)),
  playerColor:item.playerColor
 };
}
function sameDoubleAtariSurface(a,b){
 const da=doubleAtariSurfaceDescriptor(a),db=doubleAtariSurfaceDescriptor(b);
 return Boolean(da&&db&&JSON.stringify(da)===JSON.stringify(db));
}
function forbiddenAnswerField(item){
 return["answer","correctMove","expectedMove","solution","targetGroups","sharedLiberty","successPoint"].some(key=>Object.prototype.hasOwnProperty.call(item,key));
}
function normalize(raw){
 const item={
  ...raw,
  boardSize:19,
  familyId:DOUBLE_ATARI_FAMILY.familyId,
  familyVersion:DOUBLE_ATARI_FAMILY.familyVersion,
  frameworkVersion:FRAMEWORK_VERSION,
  scoringContractVersion:DOUBLE_ATARI_FAMILY.scoringContractVersion,
  evidenceTaxonomyVersion:EVIDENCE_TAXONOMY_VERSION,
  immediatePolicyVersion:IMMEDIATE_POLICY_VERSION,
  delayedPolicyVersion:DELAY_POLICY_VERSION,
  minimumDelayMs:MIN_DELAY_MS,
  pairHypothesisVersion:DOUBLE_ATARI_FAMILY.pairHypothesisVersion,
  kcHypothesisId:DOUBLE_ATARI_FAMILY.kcHypothesisId,
  kcHypothesisVersion:DOUBLE_ATARI_FAMILY.kcHypothesisVersion,
  kcStatus:DOUBLE_ATARI_FAMILY.kcStatus,
  constructValidated:false,
  sourceReviewId:DOUBLE_ATARI_FAMILY.sourceReviewId,
  provenance:{type:"project_synthetic",license:"project_original",public:true},
  prompt:(raw.playerColor===Go.BLACK?"黑":"白")+"棋下。盤上有兩串彼此分開的對方棋。請直接在全盤找出一手，讓這兩串棋同時各只剩一口氣；這一手本身不能立即提子。",
  positionFingerprint:null
 };
 item.positionFingerprint=positionFingerprint(item);
 return Object.freeze(item);
}
const items=Object.freeze(rawItems.map(normalize));

function validateV2Item(item){
 if(!item||item.frameworkVersion!==FRAMEWORK_VERSION||item.familyId!==DOUBLE_ATARI_FAMILY.familyId||item.familyVersion!==DOUBLE_ATARI_FAMILY.familyVersion)return"v2_item_identity_invalid";
 if(item.scoringContractVersion!==DOUBLE_ATARI_FAMILY.scoringContractVersion||item.evidenceTaxonomyVersion!==EVIDENCE_TAXONOMY_VERSION)return"v2_item_version_invalid";
 if(!["practice","process_check","delayed_process_check"].includes(item.role)||item.boardSize!==19||![Go.BLACK,Go.WHITE].includes(item.playerColor))return"v2_item_metadata_invalid";
 if(item.kcHypothesisId!==DOUBLE_ATARI_FAMILY.kcHypothesisId||item.kcHypothesisVersion!==DOUBLE_ATARI_FAMILY.kcHypothesisVersion||item.kcStatus!=="not_promoted"||item.constructValidated!==false)return"v2_item_hypothesis_invalid";
 if(!item.provenance||item.provenance.type!=="project_synthetic"||item.provenance.license!=="project_original"||item.provenance.public!==true)return"v2_item_provenance_invalid";
 if(forbiddenAnswerField(item))return"v2_item_answer_injection_forbidden";
 if(item.role==="delayed_process_check"&&item.anchorItemId!=="double-atari-fullboard-process-v1")return"v2_item_anchor_invalid";
 try{Go.boardFromStones(item.stones,19);}catch{return"v2_item_stones_invalid";}
 const opponent=item.playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
 const board=Go.boardFromStones(item.stones,19);
 if(uniqueGroups(board,opponent).some(group=>group.liberties.length===1))return"v2_item_opponent_pre_atari_forbidden";
 const success=successfulPointsForDoubleAtari(item);
 if(success.length!==1)return"v2_item_success_not_unique";
 const scored=doubleAtariScore(item,success[0]);
 if(!scored.correct||scored.newlyAtariCount!==2||scored.capturedCount!==0)return"v2_item_scoring_invalid";
 if(positionFingerprint(item)!==item.positionFingerprint)return"v2_item_fingerprint_mismatch";
 return null;
}
function validateAll(){
 const ids=new Set(),fingerprints=new Set(),descriptors=new Set();
 for(const item of items){
  const error=validateV2Item(item);if(error)return{ok:false,error,itemId:item.itemId};
  if(ids.has(item.itemId))return{ok:false,error:"v2_duplicate_item_id",itemId:item.itemId};
  if(fingerprints.has(item.positionFingerprint))return{ok:false,error:"v2_duplicate_position",itemId:item.itemId};
  const descriptor=JSON.stringify(doubleAtariSurfaceDescriptor(item));
  if(descriptors.has(descriptor))return{ok:false,error:"v2_surface_descriptor_reused",itemId:item.itemId};
  ids.add(item.itemId);fingerprints.add(item.positionFingerprint);descriptors.add(descriptor);
 }
 return{ok:true};
}
function immediateItems(){return items.filter(item=>item.role!=="delayed_process_check");}
function delayedItems(){return items.filter(item=>item.role==="delayed_process_check");}
function itemById(itemId){return items.find(item=>item.itemId===itemId)||null;}
function familyById(familyId){
 if(familyId===DOUBLE_ATARI_FAMILY.familyId)return DOUBLE_ATARI_FAMILY;
 if(familyId===LEGACY_URGENT_FAMILY.familyId)return LEGACY_URGENT_FAMILY;
 return null;
}
function scoreResponse(familyId,item,point){
 if(familyId===DOUBLE_ATARI_FAMILY.familyId)return doubleAtariScore(item,point);
 if(familyId===LEGACY_URGENT_FAMILY.familyId)return Legacy.scoreResponse(item,point);
 return{legal:false,correct:false,error:"family_unknown"};
}
function successfulPoints(familyId,item){
 if(familyId===DOUBLE_ATARI_FAMILY.familyId)return successfulPointsForDoubleAtari(item);
 if(familyId===LEGACY_URGENT_FAMILY.familyId)return Legacy.successfulPoints(item);
 return[];
}

const api={
 FRAMEWORK_VERSION,EVIDENCE_TAXONOMY_VERSION,IMMEDIATE_POLICY_VERSION,DELAY_POLICY_VERSION,MIN_DELAY_MS,
 DOUBLE_ATARI_FAMILY,LEGACY_URGENT_FAMILY,items,immediateItems,delayedItems,itemById,familyById,
 positionFingerprint,doubleAtariScore,doubleAtariSurfaceDescriptor,sameDoubleAtariSurface,
 scoreResponse,successfulPoints,validateV2Item,validateAll
};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedComparableFrameworkV2=api;
})(typeof window!=="undefined"?window:globalThis);
