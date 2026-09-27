const test = require("node:test");
const assert = require("node:assert/strict");
const Adapter = require("../classic-geometry-reference-html-sgf.js");
const Oracle = require("../classic-geometry-reference-oracle.js");

const sgf = "(;GM[1]FF[4]SZ[19]PL[B]AB[aa][ba][ca][cb]AW[da][db])";
const encoded = JSON.stringify(sgf);
const html = `
<html><script>
options.sgf2 = ${encoded};
function jsCreateDownloadFile(){
  var blob = new Blob([${encoded}], {type:"sgf"});
}
</script></html>`;

function input(overrides={}) {
  return {
    html,
    sourceId:"reference-page",
    sourceLocator:"https://example.invalid/problem/1",
    evidenceChain:"reference-chain",
    candidateConceptId:"candidate-l-shape",
    targetColor:"black",
    corner:"top-left",
    ...overrides
  };
}

const candidate = {
  points:[[5,5],[6,5],[7,5],[7,6]],
  context:{boardContext:"corner",boundary:["left","top"],toPlay:"black",role:"defender_group"}
};

test("從 HTML 的 options.sgf2 / Blob 只接受同一份 JSON SGF literal", () => {
  const result=Adapter.extractEmbeddedSgf(html);
  assert.equal(result.ok,true);
  assert.equal(result.sgf,sgf);
  assert.equal(result.occurrences,2);
});

test("embedded SGF 有衝突時 fail closed，不挑其中一份", () => {
  const conflicting = `<script>
    options.sgf2 = ${JSON.stringify(sgf)};
    new Blob([${JSON.stringify("(;GM[1]SZ[19]AB[aa])")}]);
  </script>`;
  const result=Adapter.extractEmbeddedSgf(conflicting);
  assert.equal(result.ok,false);
  assert.ok(result.errors.some((error)=>/conflicting/.test(error)));
});

test("adapter 不 eval 任意 JavaScript，只解析 JSON string literal", () => {
  global.__REFERENCE_ORACLE_PWNED__ = false;
  const hostile = `<script>
    options.sgf2 = (global.__REFERENCE_ORACLE_PWNED__ = true, ${JSON.stringify(sgf)});
  </script>`;
  const result=Adapter.extractEmbeddedSgf(hostile);
  assert.equal(result.ok,false);
  assert.equal(global.__REFERENCE_ORACLE_PWNED__,false);
  delete global.__REFERENCE_ORACLE_PWNED__;
});

test("SGF root setup 支援 19 路 AB/AW/PL，但壓縮座標 fail closed", () => {
  const parsed=Adapter.parseSetupGeometry(sgf);
  assert.equal(parsed.ok,true);
  assert.equal(parsed.boardSize,19);
  assert.equal(parsed.toPlay,"black");
  assert.equal(parsed.stones.filter((stone)=>stone.color==="black").length,4);
  assert.equal(parsed.stones.filter((stone)=>stone.color==="white").length,2);

  const compressed=Adapter.parseSetupGeometry("(;GM[1]SZ[19]AB[aa:bb])");
  assert.equal(compressed.ok,false);
  assert.ok(compressed.errors.some((error)=>/compressed/.test(error)));
});

test("target color 的最近角部連通塊可轉成 reference-only observation", () => {
  const result=Adapter.buildObservationFromHtml(input());
  assert.equal(result.ok,true);
  assert.equal(result.observation.licenseStatus,"reference_only");
  assert.equal(result.observation.method,"sgf_parse");
  assert.equal(result.observation.deterministicSource,true);
  assert.deepEqual(result.observation.points.sort(),[[0,0],[1,0],[2,0],[2,1]].sort());
  assert.deepEqual(result.observation.context.boundary,["top","left"]);
  assert.equal(result.metadata.sourceDigest.startsWith("sha256:"),true);
});

test("角部 group selector 同距同大小時必須拒絕猜測", () => {
  const ambiguousSgf="(;GM[1]SZ[19]AB[ba][ab])";
  const ambiguousHtml=`<script>options.sgf2 = ${JSON.stringify(ambiguousSgf)};</script>`;
  const result=Adapter.buildObservationFromHtml(input({html:ambiguousHtml}));
  assert.equal(result.ok,false);
  assert.ok(result.errors.some((error)=>/ambiguous/.test(error)));
});

test("reference oracle 最終只輸出 sanitized report，不洩漏 SGF/points/fingerprint", () => {
  const result=Adapter.runSanitizedReferenceOracle({...input(),candidate});
  assert.equal(result.ok,true);
  assert.equal(result.status,Oracle.STATUS.REFERENCE_MATCH);
  assert.equal(result.report.authority,"reference_oracle_only");
  assert.equal(result.report.canonicalPromotionAllowed,false);
  assert.equal(Oracle.validatePersistableReport(result.report).ok,true);
  const serialized=JSON.stringify(result);
  assert.equal(serialized.includes(sgf),false);
  for (const key of Oracle.FORBIDDEN_PERSISTED_KEYS) {
    assert.equal(serialized.includes('"'+key+'"'),false,key);
  }
});

test("context 不同時 strict oracle 仍回 DIFFERENT，不因 shape 同形放寬", () => {
  const wrong={
    points:[[5,5],[6,5],[7,5],[7,6]],
    context:{boardContext:"corner",boundary:["right","top"],toPlay:"black",role:"defender_group"}
  };
  const result=Adapter.runSanitizedReferenceOracle({...input(),candidate:wrong,requireContext:true});
  assert.equal(result.ok,true);
  assert.equal(result.status,Oracle.STATUS.REFERENCE_DIFFERENT);
  assert.equal(result.report.sameShape,true);
  assert.equal(result.report.sameContext,false);
});

test("HTML 大小有上限，避免 authoring adapter 變成任意內容 sink", () => {
  const result=Adapter.extractEmbeddedSgf("x".repeat(Adapter.MAX_HTML_BYTES+1));
  assert.equal(result.ok,false);
  assert.ok(result.errors.some((error)=>/size limit/.test(error)));
});
