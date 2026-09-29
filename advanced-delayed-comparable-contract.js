(function(root){"use strict";

const Go=typeof require==="function"&&typeof module!=="undefined"?require("./go.js"):root.GoCore;
const Comparable=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-position-contract.js"):root.GoAdvancedComparablePositionContract;
if(!Go||!Comparable)return;

const CONTRACT_VERSION="advanced-delayed-comparable-contract-v1";
const RETRIEVAL_POLICY_VERSION="advanced-delayed-fixed-24h-v1";
const EVIDENCE_TAXONOMY_VERSION="advanced-delayed-comparable-evidence-v1";
const MIN_DELAY_MS=24*60*60*1000;

const rawItems=[
 {
  itemId:"urgent-rescue-a-delayed",
  itemVersion:"urgent-rescue-a-delayed-v1",
  pairId:"urgent-rescue-pair-a",
  anchorItemId:"urgent-rescue-a-process",
  playerColor:Go.BLACK,
  stones:[
   [8,10,Go.BLACK],[8,11,Go.BLACK],[8,12,Go.BLACK],[8,13,Go.BLACK],
   [7,10,Go.WHITE],[9,10,Go.WHITE],[7,11,Go.WHITE],[9,11,Go.WHITE],
   [7,12,Go.WHITE],[9,12,Go.WHITE],[7,13,Go.WHITE],[9,13,Go.WHITE],[8,14,Go.WHITE],
   [3,3,Go.BLACK],[15,15,Go.BLACK],[14,3,Go.BLACK],
   [4,3,Go.WHITE],[15,14,Go.WHITE],[13,3,Go.WHITE]
  ],
  variationAxes:["group_size","group_topology","player_color","board_region","global_distractors"]
 },
 {
  itemId:"urgent-rescue-b-delayed",
  itemVersion:"urgent-rescue-b-delayed-v1",
  pairId:"urgent-rescue-pair-b",
  anchorItemId:"urgent-rescue-b-process",
  playerColor:Go.WHITE,
  stones:[
   [10,4,Go.WHITE],[11,4,Go.WHITE],[10,5,Go.WHITE],[11,5,Go.WHITE],
   [10,3,Go.BLACK],[11,3,Go.BLACK],[9,4,Go.BLACK],[9,5,Go.BLACK],
   [12,4,Go.BLACK],[10,6,Go.BLACK],[11,6,Go.BLACK],
   [3,3,Go.WHITE],[16,16,Go.WHITE],[4,14,Go.WHITE],
   [4,3,Go.BLACK],[15,16,Go.BLACK],[4,13,Go.BLACK]
  ],
  variationAxes:["group_size","group_topology","edge_context","player_color","board_region","global_distractors"]
 }
];

function fingerprint(item){
 return"delayed-"+Comparable.positionFingerprint(item);
}
function normalize(raw){
 const pair=Comparable.pairById(raw.pairId);
 if(!pair)throw new Error("unknown comparable pair");
 const item={
  ...raw,
  boardSize:19,
  role:"delayed_process_check",
  contractVersion:CONTRACT_VERSION,
  scoringContractVersion:Comparable.SCORING_CONTRACT_VERSION,
  evidenceTaxonomyVersion:EVIDENCE_TAXONOMY_VERSION,
  retrievalPolicyVersion:RETRIEVAL_POLICY_VERSION,
  minimumDelayMs:MIN_DELAY_MS,
  pairVersion:pair.pairVersion,
  pairHypothesisVersion:pair.pairHypothesisVersion,
  kcHypothesisId:Comparable.KC_HYPOTHESIS_ID,
  kcHypothesisVersion:Comparable.KC_HYPOTHESIS_VERSION,
  constructValidated:false,
  provenance:{type:"project_synthetic",license:"project_original",public:true},
  prompt:(raw.playerColor===Go.BLACK?"黑":"白")+"棋下。先自己掃描全盤，找出唯一只剩一氣的己方棋串，再下出能讓它脫離立即被提危險的一手。",
  positionFingerprint:null
 };
 item.positionFingerprint=fingerprint(item);
 return Object.freeze(item);
}
const items=Object.freeze(rawItems.map(normalize));

function forbiddenAnswerField(item){
 return["answer","correctMove","expectedMove","solution","rescuePoint","targetAnchor"].some(key=>Object.prototype.hasOwnProperty.call(item,key));
}
function validateItem(item){
 if(!item||item.contractVersion!==CONTRACT_VERSION||item.role!=="delayed_process_check")return"delayed_item_contract_invalid";
 if(item.boardSize!==19||![Go.BLACK,Go.WHITE].includes(item.playerColor))return"delayed_item_metadata_invalid";
 if(item.scoringContractVersion!==Comparable.SCORING_CONTRACT_VERSION||item.evidenceTaxonomyVersion!==EVIDENCE_TAXONOMY_VERSION)return"delayed_item_version_invalid";
 if(item.retrievalPolicyVersion!==RETRIEVAL_POLICY_VERSION||item.minimumDelayMs!==MIN_DELAY_MS)return"delayed_item_policy_invalid";
 if(item.kcHypothesisId!==Comparable.KC_HYPOTHESIS_ID||item.kcHypothesisVersion!==Comparable.KC_HYPOTHESIS_VERSION||item.constructValidated!==false)return"delayed_item_kc_hypothesis_invalid";
 if(!item.provenance||item.provenance.type!=="project_synthetic"||item.provenance.license!=="project_original"||item.provenance.public!==true)return"delayed_item_provenance_invalid";
 if(forbiddenAnswerField(item))return"delayed_item_answer_injection_forbidden";
 const pair=Comparable.pairById(item.pairId);
 if(!pair||pair.pairVersion!==item.pairVersion||pair.pairHypothesisVersion!==item.pairHypothesisVersion)return"delayed_item_pair_identity_invalid";
 if(pair.target.itemId!==item.anchorItemId)return"delayed_item_anchor_invalid";
 if(!Array.isArray(item.variationAxes)||item.variationAxes.length<3)return"delayed_item_variation_axes_insufficient";
 try{Go.boardFromStones(item.stones,19);}catch{return"delayed_item_stones_invalid";}
 const urgent=Comparable.urgentGroup(item);
 if(!urgent||urgent.liberties.length!==1)return"delayed_item_requires_exactly_one_own_atari_group";
 const successes=Comparable.successfulPoints(item);
 if(successes.length!==1)return"delayed_item_success_not_unique";
 if(fingerprint(item)!==item.positionFingerprint)return"delayed_item_fingerprint_mismatch";
 for(const prior of [pair.source,pair.target]){
  if(item.positionFingerprint==="delayed-"+prior.positionFingerprint)return"delayed_item_position_reused";
  if(Comparable.sameSurfaceClass(item,prior))return"delayed_item_surface_too_equivalent";
 }
 return null;
}
function validateAll(){
 const ids=new Set(),fingerprints=new Set();
 for(const item of items){
  const error=validateItem(item);if(error)return{ok:false,error,itemId:item.itemId};
  if(ids.has(item.itemId))return{ok:false,error:"duplicate_delayed_item_id",itemId:item.itemId};
  if(fingerprints.has(item.positionFingerprint))return{ok:false,error:"duplicate_delayed_position",itemId:item.itemId};
  ids.add(item.itemId);fingerprints.add(item.positionFingerprint);
 }
 return{ok:true};
}
function itemById(itemId){return items.find(item=>item.itemId===itemId)||null;}
function itemForPair(pairId){return items.find(item=>item.pairId===pairId)||null;}
function scoreResponse(item,point){return Comparable.scoreResponse(item,point);}
function successfulPoints(item){return Comparable.successfulPoints(item);}

const api={CONTRACT_VERSION,RETRIEVAL_POLICY_VERSION,EVIDENCE_TAXONOMY_VERSION,MIN_DELAY_MS,items,itemById,itemForPair,scoreResponse,successfulPoints,validateItem,validateAll};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedDelayedComparableContract=api;
})(typeof window!=="undefined"?window:globalThis);
