const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Oracle = require("../classic-geometry-reference-oracle.js");

const root=path.resolve(__dirname,"..");
const bga=JSON.parse(fs.readFileSync(path.join(root,"research/reference-receipts/bga-bgj116-lgroup-figure1.json"),"utf8"));
const tsumego=JSON.parse(fs.readFileSync(path.join(root,"research/reference-receipts/tsumego-hero-lgroup-15362-oracle-v3.json"),"utf8"));
const aggregateReceipt=JSON.parse(fs.readFileSync(path.join(root,"research/reference-receipts/lgroup-defender-aggregate-2026-09-29.json"),"utf8"));

const forbidden=["points","stones","normalizedPoints","shapeSignature","contextSignature","fingerprint","signature","rawGeometry","rawObservation","sgf"];

function assertSanitized(value){
  const serialized=JSON.stringify(value);
  for(const key of forbidden){
    assert.equal(serialized.includes('"'+key+'"'),false,key);
  }
}

test("BGA Figure 1 receipt 只保存 provenance 與 representation，不保存來源幾何",()=>{
  assert.equal(bga.authority,"reference_source_receipt_only");
  assert.equal(bga.structuredObservationAvailable,true);
  assert.equal(bga.extractionMethod,"manual_transcription");
  assert.equal(bga.reviewStatus,"draft");
  assert.equal(bga.geometryPersisted,false);
  assert.equal(bga.rawSourcePersisted,false);
  assert.equal(bga.rightsStatus,"reference_only");
  assert.equal(bga.canonicalPromotionAllowed,false);
  assert.equal(bga.comparisonContractId,"corner-defender-connected-group-normalized-v3");
  assertSanitized(bga);
});

test("Tsumego Hero v3 report 是合法 sanitized REFERENCE_DIFFERENT",()=>{
  const checked=Oracle.validatePersistableReport(tsumego);
  assert.equal(checked.ok,true,checked.errors.join("; "));
  assert.equal(tsumego.status,Oracle.STATUS.REFERENCE_DIFFERENT);
  assert.equal(tsumego.sameShape,false);
  assert.equal(tsumego.sameContext,true);
  assert.equal(tsumego.canonicalPromotionAllowed,false);
  assertSanitized(tsumego);
});

test("BGA seed chain 被排除後只剩一條 independent decisive evidence，aggregate 必須 INSUFFICIENT",()=>{
  const seed={
    schemaVersion:"classic-reference-oracle-report-v1",
    authority:"reference_oracle_only",
    status:Oracle.STATUS.REFERENCE_MATCH,
    sourceId:bga.sourceId,
    sourceLocator:bga.sourceLocator,
    sourceDigest:bga.sourceDigest,
    evidenceChain:bga.evidenceChain,
    candidateConceptId:bga.candidateSeedId,
    comparisonContractId:bga.comparisonContractId,
    requireContext:true,
    sameShape:true,
    sameContext:true,
    canonicalPromotionAllowed:false
  };
  const aggregate=Oracle.aggregatePersistableReports(
    [seed,tsumego],
    {candidateDependentEvidenceChains:[bga.evidenceChain]}
  );
  assert.equal(aggregate.ok,false);
  assert.equal(aggregate.status,Oracle.STATUS.INSUFFICIENT);
  assert.equal(aggregate.independentEvidenceUnits,1);
  assert.equal(aggregate.decisiveEvidenceUnits,1);
  assert.equal(aggregate.excludedCandidateDependentEvidenceUnits,1);
  assert.equal(aggregate.canonicalPromotionAllowed,false);

  assert.equal(aggregateReceipt.status,aggregate.status);
  assert.equal(aggregateReceipt.independentEvidenceUnits,aggregate.independentEvidenceUnits);
  assert.equal(aggregateReceipt.decisiveEvidenceUnits,aggregate.decisiveEvidenceUnits);
  assert.equal(aggregateReceipt.excludedCandidateDependentEvidenceUnits,aggregate.excludedCandidateDependentEvidenceUnits);
  assertSanitized(aggregateReceipt);
});

test("REFERENCE_DIFFERENT 在此只否定 seed geometry 等價，不得被解讀為否定 L Group family label",()=>{
  assert.match(aggregateReceipt.interpretation,/does not negate either source's L Group labeling/);
  assert.equal(aggregateReceipt.canonicalPromotionAllowed,false);
});
