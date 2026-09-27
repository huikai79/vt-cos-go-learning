const test = require("node:test");
const assert = require("node:assert/strict");
const Oracle = require("../classic-geometry-reference-oracle.js");
const Extraction = require("../classic-geometry-extraction.js");

function observation(overrides={}) {
  return {
    id:"obs-1",
    sourceId:"external-reference",
    sourceLocator:"Diagram 1",
    sourceDigest:"sha256:external-v1",
    method:Extraction.METHOD.MANUAL_TRANSCRIPTION,
    licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
    reviewStatus:Extraction.REVIEW_STATUS.DRAFT,
    reviewKey:"local-review-a",
    boardSize:9,
    points:[[0,0],[1,0],[0,1]],
    stones:[],
    context:{boardContext:"corner",boundary:["top","left"],toPlay:"black",role:"defender_group"},
    ...overrides
  };
}

function metadata(overrides={}) {
  return {
    sourceId:"external-reference",
    sourceLocator:"Diagram 1",
    sourceDigest:"sha256:external-v1",
    evidenceChain:"reference-chain-a",
    candidateConceptId:"candidate-a",
    ...overrides
  };
}

const candidate={
  points:[[4,4],[5,4],[4,5]],
  context:{boardContext:"corner",boundary:["left","top"],toPlay:"black",role:"defender_group"}
};

test("reference-only/unknown rights observation 可在記憶中比對，但永遠不能 canonical promote", () => {
  const result=Oracle.runReferenceOracle({observation:observation(),candidate,metadata:metadata(),requireContext:true});
  assert.equal(result.ok,true);
  assert.equal(result.status,Oracle.STATUS.REFERENCE_MATCH);
  assert.equal(result.canonicalPromotionAllowed,false);
  assert.equal(result.persistable.canonicalPromotionAllowed,false);
  assert.equal(result.persistable.authority,"reference_oracle_only");
  assert.equal(Oracle.validatePersistableReport(result.persistable).ok,true);
});

test("persistable oracle report 不得帶座標、stones、signature 或 fingerprint", () => {
  const result=Oracle.runReferenceOracle({observation:observation(),candidate,metadata:metadata()});
  const serialized=JSON.stringify(result.persistable);
  for (const key of Oracle.FORBIDDEN_PERSISTED_KEYS) {
    assert.equal(serialized.includes('"'+key+'"'),false,key);
  }
  assert.equal(Object.prototype.hasOwnProperty.call(result.persistable,"points"),false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.persistable,"stones"),false);
});

test("private comparison 可有 fingerprint 細節，但不能通過 persistable validator", () => {
  const result=Oracle.runReferenceOracle({observation:observation(),candidate,metadata:metadata()});
  assert.ok(result.privateComparison.left.shapeSignature);
  const contaminated={...result.persistable,shapeSignature:result.privateComparison.left.shapeSignature};
  const checked=Oracle.validatePersistableReport(contaminated);
  assert.equal(checked.ok,false);
  assert.ok(checked.errors.some((error)=>/geometry or fingerprint/.test(error)));
});

test("oracle metadata 與 observation provenance 不一致時 fail closed", () => {
  const result=Oracle.runReferenceOracle({
    observation:observation(),
    candidate,
    metadata:metadata({sourceDigest:"sha256:different"})
  });
  assert.equal(result.ok,false);
  assert.equal(result.status,Oracle.STATUS.INVALID);
  assert.equal(result.persistable,null);
});

test("context mismatch 應回 REFERENCE_DIFFERENT，不得只靠 shape match 升格", () => {
  const wrongContext={
    points:[[0,0],[1,0],[0,1]],
    context:{boardContext:"center",boundary:[],toPlay:"black",role:"defender_group"}
  };
  const strict=Oracle.runReferenceOracle({observation:observation(),candidate:wrongContext,metadata:metadata(),requireContext:true});
  assert.equal(strict.status,Oracle.STATUS.REFERENCE_DIFFERENT);
  assert.equal(strict.persistable.sameShape,true);
  assert.equal(strict.persistable.sameContext,false);

  const shapeOnly=Oracle.runReferenceOracle({observation:observation(),candidate:wrongContext,metadata:metadata(),requireContext:false});
  assert.equal(shapeOnly.status,Oracle.STATUS.REFERENCE_MATCH);
  assert.equal(shapeOnly.persistable.requireContext,false);
});

test("同 evidenceChain 的多網址/多 digest 只算一個 evidence unit", () => {
  const a=Oracle.runReferenceOracle({observation:observation(),candidate,metadata:metadata({sourceLocator:"Mirror A",sourceDigest:"sha256:a"})});
  const b=Oracle.runReferenceOracle({
    observation:observation({sourceLocator:"Mirror B",sourceDigest:"sha256:b"}),
    candidate,
    metadata:metadata({sourceLocator:"Mirror B",sourceDigest:"sha256:b"})
  });
  // first report must have matching observation provenance, so recreate a correctly
  const a2=Oracle.runReferenceOracle({
    observation:observation({sourceLocator:"Mirror A",sourceDigest:"sha256:a"}),
    candidate,
    metadata:metadata({sourceLocator:"Mirror A",sourceDigest:"sha256:a"})
  });
  assert.equal(a.ok,false);
  assert.equal(a2.ok,true);
  assert.equal(b.ok,true);
  const aggregate=Oracle.aggregatePersistableReports([a2.persistable,b.persistable]);
  assert.equal(aggregate.ok,false);
  assert.equal(aggregate.status,Oracle.STATUS.INSUFFICIENT);
  assert.equal(aggregate.independentEvidenceUnits,1);
});

test("兩條獨立 evidence chain 一致只形成 reference support，不得 canonical promote", () => {
  const a=Oracle.runReferenceOracle({observation:observation(),candidate,metadata:metadata({evidenceChain:"chain-a"})});
  const b=Oracle.runReferenceOracle({
    observation:observation({sourceId:"source-b",sourceDigest:"sha256:b"}),
    candidate,
    metadata:metadata({sourceId:"source-b",sourceDigest:"sha256:b",evidenceChain:"chain-b"})
  });
  assert.equal(a.ok,true);
  assert.equal(b.ok,true);
  const aggregate=Oracle.aggregatePersistableReports([a.persistable,b.persistable]);
  assert.equal(aggregate.ok,true);
  assert.equal(aggregate.status,Oracle.STATUS.CONSISTENT_REFERENCE_SUPPORT);
  assert.equal(aggregate.direction,Oracle.STATUS.REFERENCE_MATCH);
  assert.equal(aggregate.independentEvidenceUnits,2);
  assert.equal(aggregate.canonicalPromotionAllowed,false);
});

test("獨立 reference oracles 衝突時不得選邊", () => {
  const match=Oracle.runReferenceOracle({observation:observation(),candidate,metadata:metadata({evidenceChain:"chain-a"})});
  const differentCandidate={
    points:[[0,0],[1,0],[2,0]],
    context:{boardContext:"corner",boundary:["top","left"],toPlay:"black",role:"defender_group"}
  };
  const diff=Oracle.runReferenceOracle({
    observation:observation({sourceId:"source-b",sourceDigest:"sha256:b"}),
    candidate:differentCandidate,
    metadata:metadata({sourceId:"source-b",sourceDigest:"sha256:b",evidenceChain:"chain-b"})
  });
  assert.equal(match.status,Oracle.STATUS.REFERENCE_MATCH);
  assert.equal(diff.status,Oracle.STATUS.REFERENCE_DIFFERENT);
  const aggregate=Oracle.aggregatePersistableReports([match.persistable,diff.persistable]);
  assert.equal(aggregate.ok,false);
  assert.equal(aggregate.status,Oracle.STATUS.CONFLICTING_REFERENCE_ORACLES);
  assert.equal(aggregate.canonicalPromotionAllowed,false);
});
