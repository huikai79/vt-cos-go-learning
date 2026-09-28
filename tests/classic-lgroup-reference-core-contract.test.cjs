const test=require("node:test");
const assert=require("node:assert/strict");
const Contract=require("../classic-lgroup-reference-core-contract.js");

test("直接標示的整組四子 L tetromino 可形成 research core MATCH",()=>{
  const r=Contract.evaluate({
    points:[[4,4],[5,4],[6,4],[6,5]],
    selectionBasis:Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP,
    labelScope:Contract.LABEL_SCOPE.TARGET_GROUP,
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(r.ok,true);
  assert.equal(r.status,Contract.STATUS.MATCH);
  assert.equal(r.decisive,true);
  assert.equal(r.canonicalPromotionAllowed,false);
});

test("直四不是 L core",()=>{
  const r=Contract.evaluate({
    points:[[0,0],[1,0],[2,0],[3,0]],
    selectionBasis:Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP,
    labelScope:Contract.LABEL_SCOPE.TARGET_GROUP,
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(r.status,Contract.STATUS.DIFFERENT);
  assert.equal(r.sameCoreShape,false);
});

test("較大的未標記 group 不得偷偷挑四子湊 L core",()=>{
  const longL=[[0,4],[1,4],[2,4],[3,4],[3,3],[3,2],[3,1],[3,0]];
  const whole=Contract.evaluate({
    points:longL,
    selectionBasis:Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP,
    labelScope:Contract.LABEL_SCOPE.TARGET_GROUP,
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(whole.status,Contract.STATUS.DIFFERENT);

  const invented=Contract.evaluate({
    points:[[2,4],[3,4],[3,3],[3,2]],
    selectionBasis:"inferred_subset",
    labelScope:Contract.LABEL_SCOPE.MARKED_SUBSET,
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(invented.ok,false);
  assert.equal(invented.status,Contract.STATUS.INVALID);
});

test("source-native marks 若語義未經覆核只能 supporting，不能 decisive",()=>{
  const pending=Contract.evaluate({
    points:[[2,2],[2,3],[3,3],[4,3]],
    selectionBasis:Contract.SELECTION_BASIS.SOURCE_NATIVE_MARKED_SUBSET,
    labelScope:Contract.LABEL_SCOPE.MARKED_SUBSET,
    sourceDirectlyLabelsLGroup:true,
    markedSubsetSemanticsReviewed:false
  });
  assert.equal(pending.status,Contract.STATUS.NEEDS_HUMAN_REVIEW);
  assert.equal(pending.decisive,false);

  const reviewed=Contract.evaluate({
    points:[[2,2],[2,3],[3,3],[4,3]],
    selectionBasis:Contract.SELECTION_BASIS.SOURCE_NATIVE_MARKED_SUBSET,
    labelScope:Contract.LABEL_SCOPE.MARKED_SUBSET,
    sourceDirectlyLabelsLGroup:true,
    markedSubsetSemanticsReviewed:true
  });
  assert.equal(reviewed.status,Contract.STATUS.MATCH);
  assert.equal(reviewed.decisive,true);
});

test("來源沒有直接把 observation 綁到 L Group 時 fail closed",()=>{
  const r=Contract.evaluate({
    points:[[0,0],[1,0],[2,0],[2,1]],
    selectionBasis:Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP,
    labelScope:Contract.LABEL_SCOPE.TARGET_GROUP,
    sourceDirectlyLabelsLGroup:false
  });
  assert.equal(r.ok,false);
  assert.equal(r.status,Contract.STATUS.INVALID);
});


test("position-only label 不得被算成 core DIFFERENT",()=>{
  const r=Contract.evaluate({
    points:[[0,0],[1,0],[2,0],[3,0],[3,1],[3,2]],
    selectionBasis:Contract.SELECTION_BASIS.ENTIRE_TARGET_GROUP,
    labelScope:Contract.LABEL_SCOPE.POSITION_ONLY,
    sourceDirectlyLabelsLGroup:true
  });
  assert.equal(r.ok,false);
  assert.equal(r.status,Contract.STATUS.NEEDS_HUMAN_REVIEW);
  assert.equal(r.decisive,false);
});
