const test=require("node:test");
const assert=require("node:assert/strict");
const Verifier=require("../lgroup-mark-review-verify.cjs");

function receipt(overrides={}){
  return {
    schemaVersion:1,
    protocolId:"lgroup-mark-semantics-review-v1",
    draft:false,
    reviewedAt:"2026-09-29T01:00:00Z",
    reviewer:{
      code:"reviewer-a",
      experience:"Go content reviewer",
      humanReviewer:true,
      independentOfPriorExtraction:true,
      sourceOpenedDirectly:true,
      reviewedSourceContextNotOnlyScreenshot:true
    },
    source:{
      sourceId:"igocompany-corner-l-shape-2024",
      sourceDigest:"sha256:15fa3b991b35ce391c6628232d94d09bb5d5a1d0e289789fdfce754f0c58f2ab"
    },
    judgment:"unclear_from_source",
    evidenceNotes:"The article labels the position, but the surrounding text does not explicitly define the boxes.",
    sourceEvidenceReference:"original article first L-shape image and surrounding paragraph",
    claimBoundaryConfirmed:true,
    canonicalPromotionAllowed:false,
    ...overrides
  };
}

test("valid unclear review keeps evidence non-decisive",()=>{
  const r=Verifier.verifyReceipt(receipt());
  assert.equal(r.receiptValid,true);
  assert.equal(r.judgment,"unclear_from_source");
  assert.equal(r.decisive,false);
  assert.match(r.evidenceAction,/keep NEEDS_HUMAN_REVIEW/);
});

test("verified mark semantics can be decisive research evidence but never canonical promotion",()=>{
  const r=Verifier.verifyReceipt(receipt({
    judgment:"marks_define_named_l_core",
    evidenceNotes:"Original source context explicitly explains that the boxes identify the named L-shape core."
  }));
  assert.equal(r.receiptValid,true);
  assert.equal(r.decisive,true);
  assert.equal(r.canonicalPromotionAllowed,false);
});

test("source digest mismatch fails closed",()=>{
  const r=Verifier.verifyReceipt(receipt({source:{sourceId:"igocompany-corner-l-shape-2024",sourceDigest:"sha256:different"}}));
  assert.equal(r.receiptValid,false);
  assert.match(r.errors.join(" "),/source identity\/digest mismatch/);
});

test("non-human or non-independent review cannot change evidence state",()=>{
  const base=receipt();
  base.reviewer.humanReviewer=false;
  base.reviewer.independentOfPriorExtraction=false;
  const r=Verifier.verifyReceipt(base);
  assert.equal(r.receiptValid,false);
  assert.equal(r.decisive,false);
});

test("draft receipt cannot change evidence state",()=>{
  const r=Verifier.verifyReceipt(receipt({draft:true,judgment:"marks_define_named_l_core"}));
  assert.equal(r.receiptValid,false);
  assert.equal(r.decisive,false);
});
