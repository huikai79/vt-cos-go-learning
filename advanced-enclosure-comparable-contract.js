(function(root){"use strict";

const Go=typeof require==="function"&&typeof module!=="undefined"?require("./go.js"):root.GoCore;
const Fixtures=typeof require==="function"&&typeof module!=="undefined"?require("./enclosure-capture-fixtures.js"):root.GoEnclosureCaptureFixtures;
if(!Go||!Fixtures)return;

const CONTRACT_VERSION="advanced-enclosure-comparable-contract-v1";
const FAMILY_VERSION="enclosure-capture-family-v1";
const SCORING_CONTRACT_VERSION="enclosure-capture-two-step-rules-v1";
const EVIDENCE_TAXONOMY_VERSION="advanced-enclosure-comparable-evidence-v1";
const PRESENTATION_POLICY_VERSION="advanced-enclosure-fixed-sequence-v1";
const KC_HYPOTHESIS_ID="enclosure-capture-kc";
const KC_HYPOTHESIS_VERSION="enclosure-capture-kc-v1";
const DAY_MS=24*60*60*1000;
const MIN_DELAY_24H_MS=DAY_MS;
const MIN_DELAY_7D_MS=7*DAY_MS;

const plans=[
 {fixtureId:"enclosure-center-single-v1",itemId:"enclosure-fullboard-practice-v1",role:"practice",offset:[2,2],swap:false,delayMs:0,variationAxes:["center","single-stone-target","black-to-play","upper-left-region","global-distractors"]},
 {fixtureId:"enclosure-center-chain-v1",itemId:"enclosure-fullboard-process-v1",role:"process_check",offset:[10,8],swap:true,delayMs:0,variationAxes:["center","two-stone-target","white-to-play","right-center-region","global-distractors"]},
 {fixtureId:"enclosure-edge-single-v1",itemId:"enclosure-fullboard-delayed-24h-v1",role:"delayed_24h_process_check",offset:[8,0],swap:false,delayMs:MIN_DELAY_24H_MS,variationAxes:["edge","single-stone-target","black-to-play","top-edge-region","global-distractors"]},
 {fixtureId:"enclosure-edge-chain-v1",itemId:"enclosure-fullboard-delayed-7d-v1",role:"delayed_7d_process_check",offset:[12,0],swap:true,delayMs:MIN_DELAY_7D_MS,variationAxes:["edge","two-stone-target","white-to-play","top-right-edge-region","global-distractors"]}
];

function fixtureById(id){return Fixtures.fixtures.find(item=>item.id===id)||null;}
function swapColor(color){return color===Go.BLACK?Go.WHITE:color===Go.WHITE?Go.BLACK:color;}
function tx(point,offset){return[point[0]+offset[0],point[1]+offset[1]];}
function transformStone(stone,offset,swap){return[stone[0]+offset[0],stone[1]+offset[1],swap?swapColor(stone[2]):stone[2]];}
function distractors(playerColor,index){
 const opponent=playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
 const sets=[
  [[15,15,playerColor],[16,15,opponent],[3,16,playerColor],[4,16,opponent]],
  [[2,15,playerColor],[3,15,opponent],[15,3,playerColor],[15,4,opponent]],
  [[15,15,playerColor],[14,15,opponent],[3,10,playerColor],[4,10,opponent]],
  [[3,15,playerColor],[4,15,opponent],[8,10,playerColor],[9,10,opponent]]
 ];
 return sets[index].map(stone=>stone.slice());
}
function fingerprint(item){
 const payload={familyId:item.familyId,role:item.role,playerColor:item.playerColor,stones:[...item.stones].sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2])};
 let h=0x811c9dc5,text=JSON.stringify(payload);
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
 return"enclosure-v1-"+h.toString(16).padStart(8,"0");
}
function buildItem(plan,index){
 const fixture=fixtureById(plan.fixtureId);
 if(!fixture)throw new Error("missing enclosure fixture "+plan.fixtureId);
 const playerColor=plan.swap?Go.WHITE:Go.BLACK;
 const item={
  itemId:plan.itemId,itemVersion:plan.itemId,familyId:"enclosure_capture",familyVersion:FAMILY_VERSION,role:plan.role,
  fixtureId:fixture.id,fixtureVersion:fixture.version,boardSize:19,playerColor,
  stones:[...fixture.setupStones.map(stone=>transformStone(stone,plan.offset,plan.swap)),...distractors(playerColor,index)],
  trackedPoint:tx(fixture.targetPoint,plan.offset),
  supportPoint:tx(fixture.supportPoint,plan.offset),
  cutMove:tx(fixture.cutMove,plan.offset),
  forcedExtension:tx(fixture.forcedExtension,plan.offset),
  finishMove:tx(fixture.finishMove,plan.offset),
  expectedTargetSizeBefore:fixture.expectedTargetSizeBefore,
  expectedCapturedCount:fixture.expectedCapturedCount,
  variationAxes:plan.variationAxes.slice(),
  contractVersion:CONTRACT_VERSION,scoringContractVersion:SCORING_CONTRACT_VERSION,evidenceTaxonomyVersion:EVIDENCE_TAXONOMY_VERSION,
  presentationPolicyVersion:PRESENTATION_POLICY_VERSION,kcHypothesisId:KC_HYPOTHESIS_ID,kcHypothesisVersion:KC_HYPOTHESIS_VERSION,kcStatus:"not_promoted",constructValidated:false,
  anchorItemId:plan.role.startsWith("delayed_")?"enclosure-fullboard-process-v1":null,minimumDelayMs:plan.delayMs,
  provenance:{type:"project_synthetic_from_rules_fixture",fixtureCatalogVersion:Fixtures.version,license:"project_original",public:true},
  prompt:(playerColor===Go.BLACK?"黑":"白")+"棋下。先自己掃描全盤；第一手要先切斷對方和援兵的連接，對方沿唯一氣延長後，再走第二手完成局部提子。",
  positionFingerprint:null
 };
 item.positionFingerprint=fingerprint(item);
 return Object.freeze(item);
}
const items=Object.freeze(plans.map(buildItem));

function samePoint(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a[0]===b[0]&&a[1]===b[1];}
function boardFor(item){return Go.boardFromStones(item.stones,item.boardSize);}
function groupAt(board,point){return Go.groupAt(board,point[0],point[1]);}
function scoreCut(item,point){
 let board;try{board=boardFor(item);}catch{return{legal:false,correct:false,error:"board_invalid"};}
 const before=groupAt(board,item.trackedPoint),support=groupAt(board,item.supportPoint);
 if(!before||!support||before.color!==support.color||before.color===item.playerColor)return{legal:false,correct:false,error:"fixture_identity_invalid"};
 if(before.stones.length!==item.expectedTargetSizeBefore||before.liberties.length!==2)return{legal:false,correct:false,error:"target_precondition_invalid"};
 const move=Go.playMove(board,point[0],point[1],item.playerColor);
 if(!move.legal)return{legal:false,correct:false,reason:move.reason||"illegal_move"};
 if(move.captured.length!==0)return{legal:true,correct:false,error:"cut_must_not_capture"};
 const after=groupAt(move.board,item.trackedPoint);
 return{
  legal:true,
  correct:samePoint(point,item.cutMove)&&Boolean(after)&&after.liberties.length===1&&samePoint(after.liberties[0],item.forcedExtension),
  libertiesAfter:after?after.liberties.length:null,
  forcedExtension:after&&after.liberties.length===1?after.liberties[0].slice():null
 };
}
function boardAfterForcedExtension(item){
 const board=boardFor(item);
 const cut=Go.playMove(board,item.cutMove[0],item.cutMove[1],item.playerColor);
 if(!cut.legal)return{ok:false,error:"canonical_cut_illegal"};
 const opponent=item.playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
 const extension=Go.playMove(cut.board,item.forcedExtension[0],item.forcedExtension[1],opponent,{previousBoard:board});
 if(!extension.legal)return{ok:false,error:"canonical_extension_illegal"};
 const target=groupAt(extension.board,item.trackedPoint);
 if(!target||target.liberties.length!==1||!samePoint(target.liberties[0],item.finishMove))return{ok:false,error:"canonical_extension_not_forced"};
 return{ok:true,board:extension.board,previousBoard:cut.board};
}
function scoreFinish(item,point){
 const state=boardAfterForcedExtension(item);if(!state.ok)return{legal:false,correct:false,error:state.error};
 const move=Go.playMove(state.board,point[0],point[1],item.playerColor,{previousBoard:state.previousBoard});
 if(!move.legal)return{legal:false,correct:false,reason:move.reason||"illegal_move"};
 return{legal:true,correct:samePoint(point,item.finishMove)&&move.captured.length===item.expectedCapturedCount,capturedCount:move.captured.length};
}
function canonicalReplay(item){
 const cut=scoreCut(item,item.cutMove);if(!cut.legal||!cut.correct)return{ok:false,error:"canonical_cut_failed"};
 const state=boardAfterForcedExtension(item);if(!state.ok)return state;
 const finish=scoreFinish(item,item.finishMove);if(!finish.legal||!finish.correct)return{ok:false,error:"canonical_finish_failed"};
 return{ok:true,cut,finish};
}
function forbiddenAnswerField(item){
 return["answer","correctMove","expectedMove","solution"].some(key=>Object.prototype.hasOwnProperty.call(item,key));
}
function validateItem(item){
 if(!item||item.contractVersion!==CONTRACT_VERSION||item.familyId!=="enclosure_capture"||item.familyVersion!==FAMILY_VERSION)return"enclosure_item_identity_invalid";
 if(item.scoringContractVersion!==SCORING_CONTRACT_VERSION||item.evidenceTaxonomyVersion!==EVIDENCE_TAXONOMY_VERSION||item.presentationPolicyVersion!==PRESENTATION_POLICY_VERSION)return"enclosure_item_version_invalid";
 if(!["practice","process_check","delayed_24h_process_check","delayed_7d_process_check"].includes(item.role)||item.boardSize!==19||![Go.BLACK,Go.WHITE].includes(item.playerColor))return"enclosure_item_metadata_invalid";
 if(item.kcHypothesisId!==KC_HYPOTHESIS_ID||item.kcHypothesisVersion!==KC_HYPOTHESIS_VERSION||item.kcStatus!=="not_promoted"||item.constructValidated!==false)return"enclosure_item_hypothesis_invalid";
 if(forbiddenAnswerField(item))return"enclosure_item_answer_injection_forbidden";
 if(!Array.isArray(item.variationAxes)||item.variationAxes.length<4)return"enclosure_item_variation_axes_insufficient";
 if(!item.provenance||item.provenance.type!=="project_synthetic_from_rules_fixture"||item.provenance.license!=="project_original"||item.provenance.public!==true)return"enclosure_item_provenance_invalid";
 if(item.role.startsWith("delayed_")&&item.anchorItemId!=="enclosure-fullboard-process-v1")return"enclosure_item_anchor_invalid";
 if(item.role==="delayed_24h_process_check"&&item.minimumDelayMs!==MIN_DELAY_24H_MS)return"enclosure_item_24h_delay_invalid";
 if(item.role==="delayed_7d_process_check"&&item.minimumDelayMs!==MIN_DELAY_7D_MS)return"enclosure_item_7d_delay_invalid";
 if(!item.role.startsWith("delayed_")&&item.minimumDelayMs!==0)return"enclosure_item_immediate_delay_invalid";
 try{boardFor(item);}catch{return"enclosure_item_stones_invalid";}
 const fixture=fixtureById(item.fixtureId);if(!fixture||fixture.version!==item.fixtureVersion)return"enclosure_item_fixture_invalid";
 if(fingerprint(item)!==item.positionFingerprint)return"enclosure_item_fingerprint_mismatch";
 const replay=canonicalReplay(item);if(!replay.ok)return"enclosure_item_canonical_replay_invalid:"+replay.error;
 return null;
}
function validateAll(){
 const ids=new Set(),fingerprints=new Set();
 for(const item of items){
  const error=validateItem(item);if(error)return{ok:false,error,itemId:item.itemId};
  if(ids.has(item.itemId))return{ok:false,error:"enclosure_duplicate_item_id",itemId:item.itemId};
  if(fingerprints.has(item.positionFingerprint))return{ok:false,error:"enclosure_duplicate_position",itemId:item.itemId};
  ids.add(item.itemId);fingerprints.add(item.positionFingerprint);
 }
 return{ok:true};
}
function itemById(itemId){return items.find(item=>item.itemId===itemId)||null;}
function orderedItems(){return items.slice();}
function immediateItems(){return items.filter(item=>item.minimumDelayMs===0);}
function delayedItems(){return items.filter(item=>item.minimumDelayMs>0);}

const api={CONTRACT_VERSION,FAMILY_VERSION,SCORING_CONTRACT_VERSION,EVIDENCE_TAXONOMY_VERSION,PRESENTATION_POLICY_VERSION,KC_HYPOTHESIS_ID,KC_HYPOTHESIS_VERSION,DAY_MS,MIN_DELAY_24H_MS,MIN_DELAY_7D_MS,items,itemById,orderedItems,immediateItems,delayedItems,scoreCut,boardAfterForcedExtension,scoreFinish,canonicalReplay,validateItem,validateAll};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedEnclosureComparableContract=api;
})(typeof window!=="undefined"?window:globalThis);
