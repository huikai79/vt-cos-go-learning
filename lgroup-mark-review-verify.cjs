"use strict";
const fs=require("node:fs");
const path=require("node:path");
const protocol=require("./research/review-protocols/lgroup-mark-semantics-v1.json");

function validTimestamp(value){ return typeof value==="string" && Number.isFinite(Date.parse(value)); }
function nonEmpty(value){ return typeof value==="string" && value.trim().length>0; }

function verifyReceipt(receipt){
  const errors=[];
  if(!receipt || typeof receipt!=="object") return {receiptValid:false,decisive:false,judgment:null,errors:["receipt must be an object"]};
  if(receipt.schemaVersion!==1) errors.push("schemaVersion invalid");
  if(receipt.protocolId!==protocol.protocolId) errors.push("protocolId invalid");
  if(receipt.draft!==false) errors.push("draft receipt cannot change evidence state");
  if(!validTimestamp(receipt.reviewedAt)) errors.push("reviewedAt invalid");
  const reviewer=receipt.reviewer||{};
  if(!nonEmpty(reviewer.code) || reviewer.code.trim().length<3) errors.push("reviewer code missing");
  if(!nonEmpty(reviewer.experience) || reviewer.experience.trim().length<5) errors.push("reviewer experience missing");
  for(const assertion of protocol.requiredReviewerAssertions){
    if(reviewer[assertion]!==true) errors.push(assertion+" must be true");
  }
  if(!receipt.source
    || receipt.source.sourceId!==protocol.source.sourceId
    || receipt.source.sourceDigest!==protocol.source.sourceDigest) errors.push("source identity/digest mismatch");
  if(!protocol.allowedJudgments.includes(receipt.judgment)) errors.push("judgment invalid");
  if(!nonEmpty(receipt.evidenceNotes)) errors.push("evidenceNotes required");
  if(!nonEmpty(receipt.sourceEvidenceReference)) errors.push("sourceEvidenceReference required");
  if(receipt.claimBoundaryConfirmed!==true) errors.push("claim boundary not confirmed");
  if(receipt.canonicalPromotionAllowed!==false) errors.push("canonical promotion must remain false");

  const receiptValid=errors.length===0;
  return {
    protocolId:protocol.protocolId,
    receiptValid,
    judgment:receiptValid ? receipt.judgment : null,
    decisive:receiptValid && ["marks_define_named_l_core","marks_have_other_semantics"].includes(receipt.judgment),
    evidenceAction:receiptValid
      ? protocol.promotionBoundary[receipt.judgment]
      : "no evidence-state change",
    canonicalPromotionAllowed:false,
    errors
  };
}

module.exports={verifyReceipt,protocol};

if(require.main===module){
  const receiptPath=process.argv[2];
  if(!receiptPath){
    process.stderr.write("Usage: node lgroup-mark-review-verify.cjs <receipt.json>\n");
    process.exitCode=2;
  }else{
    try{
      const receipt=JSON.parse(fs.readFileSync(path.resolve(receiptPath),"utf8"));
      const result=verifyReceipt(receipt);
      process.stdout.write(JSON.stringify(result,null,2)+"\n");
      if(!result.receiptValid) process.exitCode=1;
    }catch(error){
      process.stderr.write("Unable to verify receipt: "+error.message+"\n");
      process.exitCode=2;
    }
  }
}
