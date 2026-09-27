const test = require("node:test");
const assert = require("node:assert/strict");
const Geometry = require("../classic-geometry-fingerprint.js");
const Evidence = require("../classic-geometry-evidence.js");
const Ontology = require("../classic-shapes-ontology.js");
const Pyramid = require("../classic-pyramid-four-contract.js");
const Cross = require("../classic-cross-five-contract.js");
const Flower = require("../classic-flower-six-contract.js");

test("shape fingerprint 對平移、旋轉、鏡射保持不變", () => {
  const seed = [[0,0],[1,0],[0,1],[1,1],[2,1]];
  const shifted = seed.map(([x,y]) => [x+7,y+4]);
  const rotated = seed.map(([x,y]) => [-y,x]);
  const mirrored = seed.map(([x,y]) => [-x,y]);

  const a = Geometry.canonicalShapeSignature(seed);
  assert.equal(a.ok,true);
  assert.equal(Geometry.canonicalShapeSignature(shifted).signature,a.signature);
  assert.equal(Geometry.canonicalShapeSignature(rotated).signature,a.signature);
  assert.equal(Geometry.canonicalShapeSignature(mirrored).signature,a.signature);
});

test("不同 polyomino 不得因 normalization 被錯誤合併", () => {
  const bulky = [[0,0],[1,0],[0,1],[1,1],[2,1]];
  const cross = Cross.CROSS_BASE;
  const pyramid = Pyramid.PYRAMID_BASE;

  const bulkySig = Geometry.canonicalShapeSignature(bulky).signature;
  const crossSig = Geometry.canonicalShapeSignature(cross).signature;
  const pyramidSig = Geometry.canonicalShapeSignature(pyramid).signature;

  assert.notEqual(bulkySig,crossSig);
  assert.notEqual(bulkySig,pyramidSig);
  assert.notEqual(crossSig,pyramidSig);
});

test("同 shape 但 corner/context 不同時可要求 fail closed", () => {
  const points = [[0,0],[1,0],[0,1],[1,1]];
  const center = { points, context:{boardContext:"center",boundary:[],role:"shape"} };
  const corner = { points, context:{boardContext:"corner",boundary:["top","left"],role:"shape"} };

  const strict = Geometry.compare(center,corner,{requireContext:true});
  assert.equal(strict.sameShape,true);
  assert.equal(strict.sameContext,false);
  assert.equal(strict.status,Geometry.STATUS.DIFFERENT);

  const shapeOnly = Geometry.compare(center,corner,{requireContext:false});
  assert.equal(shapeOnly.status,Geometry.STATUS.MATCH);
});

test("已驗證 practice contract 可產生穩定 geometry fingerprints", () => {
  const byConcept = new Map(Evidence.records.filter((record) => record.conceptId).map((record) => [record.conceptId,record]));
  assert.equal(
    Geometry.canonicalShapeSignature(byConcept.get("pyramid-four-v1").points).signature,
    Geometry.canonicalShapeSignature(Pyramid.PYRAMID_BASE).signature
  );
  assert.equal(
    Geometry.canonicalShapeSignature(byConcept.get("plum-five-candidate-v1").points).signature,
    Geometry.canonicalShapeSignature(Cross.CROSS_BASE).signature
  );
  assert.equal(
    Geometry.canonicalShapeSignature(byConcept.get("flower-six-v1").points).signature,
    Geometry.canonicalShapeSignature(Flower.FLOWER_SIX_BASE).signature
  );
});

test("geometry evidence registry 的 external source 必須可追溯到 ontology source", () => {
  for (const record of Evidence.records) {
    if (record.sourceType === "internal_contract") continue;
    assert.ok(Ontology.sources[record.sourceId], record.id + " missing ontology source");
  }
});

test("名稱或文字死活敘述不能被 fingerprint engine 補成棋形", () => {
  const nameOnly = Evidence.records.find((record) => record.id === "small-ruler-legacy-name-only-v1");
  const lText = Evidence.records.find((record) => record.id === "badukworld-l-group-text-only-v1");
  const carpenterDiagramPending = Evidence.records.find((record) => record.id === "badukworld-carpenter-diagram-pending-v1");

  for (const record of [nameOnly,lText,carpenterDiagramPending]) {
    const result = Geometry.fingerprint(record);
    assert.equal(result.ok,false,record.id);
    assert.equal(result.status,Geometry.STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE,record.id);
    assert.equal(result.fingerprint,null,record.id);
  }
});

test("小曲尺 ambiguity 在沒有座標前必須保持 unresolved", () => {
  const observation = Evidence.records.find((record) => record.id === "small-ruler-legacy-name-only-v1");
  const carpenter = Evidence.records.find((record) => record.id === "badukworld-carpenter-diagram-pending-v1");
  const lGroup = Evidence.records.find((record) => record.id === "badukworld-l-group-text-only-v1");

  const result = Geometry.resolveCandidates(observation,[
    {conceptId:"carpenters-square-v1",geometry:carpenter},
    {conceptId:"l-group-v1",geometry:lGroup}
  ],{requireContext:true});

  assert.equal(result.ok,false);
  assert.equal(result.status,Geometry.STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE);
  assert.deepEqual(result.matches,[]);
  assert.deepEqual(result.nonMatches,[]);
  assert.deepEqual(result.unresolved.sort(),["carpenters-square-v1","l-group-v1"].sort());
});

test("缺點、重複點與非整數座標都 fail closed", () => {
  assert.equal(Geometry.canonicalShapeSignature([]).status,Geometry.STATUS.INVALID_GEOMETRY);
  assert.equal(Geometry.canonicalShapeSignature([[0,0],[0,0]]).status,Geometry.STATUS.INVALID_GEOMETRY);
  assert.equal(Geometry.canonicalShapeSignature([[0,0],[1.5,0]]).status,Geometry.STATUS.INVALID_GEOMETRY);
});
