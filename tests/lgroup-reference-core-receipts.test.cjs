const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Contract=require("../classic-lgroup-reference-core-contract.js");

const root=path.resolve(__dirname,"..");
const load=(name)=>JSON.parse(fs.readFileSync(path.join(root,"research/reference-receipts",name),"utf8"));
const bga=load("bga-bgj116-lgroup-core-v1.json");
const ogs=load("ogs-antontobi-lgroup-core-v1.json");
const jp=load("igocompany-corner-l-core-v1.json");
const aggregate=load("lgroup-core-aggregate-2026-09-29.json");

const forbidden=["points","stones","normalizedPoints","shapeSignature","contextSignature","fingerprint","signature","rawGeometry","rawObservation","sgf"];
function sanitized(value){
  const text=JSON.stringify(value);
  for(const key of forbidden) assert.equal(text.includes('"'+key+'"'),false,key);
}

test("core hypothesis source receipts 不保存來源幾何",()=>{
  for(const receipt of [bga,ogs,jp]){
    assert.equal(receipt.geometryPersisted,false);
    assert.equal(receipt.rawSourcePersisted,false);
    assert.equal(receipt.canonicalPromotionAllowed,false);
    assert.equal(receipt.rightsStatus,"reference_only");
    assert.equal(receipt.comparisonContractId,Contract.COMPARISON_CONTRACT_ID);
    sanitized(receipt);
  }
});

test("BGA 是 seed，OGS 是一條 independent decisive MATCH",()=>{
  assert.equal(bga.selectionBasis,Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP);
  assert.equal(bga.contractStatus,Contract.STATUS.MATCH);
  assert.equal(ogs.selectionBasis,Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP);
  assert.equal(ogs.contractStatus,Contract.STATUS.MATCH);
  assert.equal(aggregate.candidateDependentEvidenceChains.includes(bga.evidenceChain),true);
  assert.deepEqual(aggregate.independentDecisiveEvidenceChains,[ogs.evidenceChain]);
  assert.equal(aggregate.independentDecisiveEvidenceUnits,1);
  assert.equal(aggregate.status,"INSUFFICIENT");
  assert.equal(aggregate.canonicalPromotionAllowed,false);
});

test("日本來源的 source-native marks 未經語義覆核，不得算第二張 decisive vote",()=>{
  assert.equal(jp.selectionBasis,Contract.SELECTION_BASIS.SOURCE_NATIVE_MARKED_SUBSET);
  assert.equal(jp.selectionInterpretationReviewed,false);
  assert.equal(jp.contractStatus,Contract.STATUS.NEEDS_HUMAN_REVIEW);
  assert.deepEqual(aggregate.supportingNonDecisiveEvidenceChains,[jp.evidenceChain]);
  assert.equal(aggregate.supportingNonDecisiveEvidenceUnits,1);
});

test("Tsumego 15362 的較大未標記 defender group 不屬此 core contract eligibility",()=>{
  const result=Contract.evaluate({
    points:[[0,4],[1,4],[2,4],[3,4],[3,3],[3,2],[3,1],[3,0]],
    selectionBasis:Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP,
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(result.status,Contract.STATUS.DIFFERENT);
  assert.equal(result.decisive,true);
  const invented=Contract.evaluate({
    points:[[2,4],[3,4],[3,3],[3,2]],
    selectionBasis:"inferred_subset",
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(invented.status,Contract.STATUS.INVALID);
});
