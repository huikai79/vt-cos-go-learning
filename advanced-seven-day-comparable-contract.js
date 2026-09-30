(function(root){"use strict";
const Go=typeof require==="function"&&typeof module!=="undefined"?require("./go.js"):root.GoCore;
const Framework=typeof require==="function"&&typeof module!=="undefined"?require("./advanced-comparable-framework-v2.js"):root.GoAdvancedComparableFrameworkV2;
if(!Go||!Framework)return;
const CONTRACT_VERSION="advanced-seven-day-comparable-contract-v1";
const POLICY_VERSION="advanced-seven-day-fixed-v1";
const EVIDENCE_TAXONOMY_VERSION="advanced-seven-day-comparable-evidence-v1";
const MIN_DELAY_MS=7*24*60*60*1000;
const raw={
 itemId:"double-atari-fullboard-delayed-7d-v1",itemVersion:"double-atari-fullboard-delayed-7d-v1",role:"delayed_7d_process_check",playerColor:Go.WHITE,
 stones:[
  [5,5,Go.BLACK],[4,5,Go.WHITE],[5,4,Go.WHITE],
  [7,5,Go.BLACK],[7,6,Go.BLACK],[7,7,Go.BLACK],
  [8,5,Go.WHITE],[6,6,Go.WHITE],[8,6,Go.WHITE],[6,7,Go.WHITE],[8,7,Go.WHITE],[7,4,Go.WHITE],
  [15,15,Go.WHITE],[14,15,Go.BLACK],[3,14,Go.WHITE],[4,14,Go.BLACK]
 ],
 variationAxes:["single-plus-three-targets","white-to-play","center-left-local","larger-target-contrast","global-distractors"]
};
function fingerprint(item){return"seven-day-"+Framework.positionFingerprint(item);}
const item=Object.freeze({
 ...raw,boardSize:19,familyId:Framework.DOUBLE_ATARI_FAMILY.familyId,familyVersion:Framework.DOUBLE_ATARI_FAMILY.familyVersion,
 contractVersion:CONTRACT_VERSION,scoringContractVersion:Framework.DOUBLE_ATARI_FAMILY.scoringContractVersion,evidenceTaxonomyVersion:EVIDENCE_TAXONOMY_VERSION,
 retrievalPolicyVersion:POLICY_VERSION,minimumDelayMs:MIN_DELAY_MS,anchorItemId:"double-atari-fullboard-process-v1",requiredPriorItemId:"double-atari-fullboard-delayed-v1",
 pairHypothesisVersion:Framework.DOUBLE_ATARI_FAMILY.pairHypothesisVersion,kcHypothesisId:Framework.DOUBLE_ATARI_FAMILY.kcHypothesisId,kcHypothesisVersion:Framework.DOUBLE_ATARI_FAMILY.kcHypothesisVersion,kcStatus:"not_promoted",constructValidated:false,
 provenance:{type:"project_synthetic",license:"project_original",public:true},prompt:"白棋下。先自己掃描全盤，找出一手讓兩串彼此分開的黑棋同時各只剩一口氣；這一手本身不能立即提子。",positionFingerprint:null
});
const mutable={...item};mutable.positionFingerprint=fingerprint(mutable);const ITEM=Object.freeze(mutable);
function validateItem(value){
 if(!value||value.contractVersion!==CONTRACT_VERSION||value.familyId!==Framework.DOUBLE_ATARI_FAMILY.familyId||value.role!=="delayed_7d_process_check")return"seven_day_item_identity_invalid";
 if(value.retrievalPolicyVersion!==POLICY_VERSION||value.minimumDelayMs!==MIN_DELAY_MS||value.anchorItemId!=="double-atari-fullboard-process-v1"||value.requiredPriorItemId!=="double-atari-fullboard-delayed-v1")return"seven_day_item_policy_invalid";
 if(value.kcStatus!=="not_promoted"||value.constructValidated!==false)return"seven_day_item_hypothesis_invalid";
 if(["answer","correctMove","expectedMove","solution","targetGroups","sharedLiberty"].some(key=>Object.prototype.hasOwnProperty.call(value,key)))return"seven_day_item_answer_injection_forbidden";
 try{Go.boardFromStones(value.stones,19);}catch{return"seven_day_item_stones_invalid";}
 const successes=Framework.successfulPoints(value.familyId,value);if(successes.length!==1)return"seven_day_item_success_not_unique";
 const scored=Framework.scoreResponse(value.familyId,value,successes[0]);if(!scored.correct||scored.newlyAtariCount!==2||scored.capturedCount!==0)return"seven_day_item_scoring_invalid";
 if(fingerprint(value)!==value.positionFingerprint)return"seven_day_item_fingerprint_mismatch";
 const existing=Framework.items.map(existing=>JSON.stringify(Framework.doubleAtariSurfaceDescriptor(existing)));
 if(existing.includes(JSON.stringify(Framework.doubleAtariSurfaceDescriptor(value))))return"seven_day_item_surface_descriptor_reused";
 return null;
}
function scoreResponse(point){return Framework.scoreResponse(ITEM.familyId,ITEM,point);}
function successfulPoints(){return Framework.successfulPoints(ITEM.familyId,ITEM);}
const api={CONTRACT_VERSION,POLICY_VERSION,EVIDENCE_TAXONOMY_VERSION,MIN_DELAY_MS,item:ITEM,validateItem,scoreResponse,successfulPoints};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.GoAdvancedSevenDayComparableContract=api;
})(typeof window!=="undefined"?window:globalThis);
