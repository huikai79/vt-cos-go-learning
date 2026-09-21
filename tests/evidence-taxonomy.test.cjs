const test = require("node:test");
const assert = require("node:assert/strict");
const EvidenceTaxonomy = require("../evidence-taxonomy.js");
const { fixedApplicationProbes } = require("../phase4-content.js");

test("v2 將 T3 分成 standardized 與 live context", () => {
  assert.equal(EvidenceTaxonomy.CURRENT_VERSION, 2);
  assert.deepEqual(EvidenceTaxonomy.descriptor.t3Contexts, ["standardized", "live"]);

  const standardized = EvidenceTaxonomy.classify({
    evidenceTaxonomyVersion: 2,
    transferLevel: "T3",
    evaluationContext: "standardized"
  });
  assert.equal(standardized.compatibleWithCurrentT3, true);
  assert.equal(standardized.evaluationContext, "standardized");

  const live = EvidenceTaxonomy.classify({
    evidenceTaxonomyVersion: 2,
    transferLevel: "T3",
    evaluationContext: "live"
  });
  assert.equal(live.compatibleWithCurrentT3, true);
  assert.equal(live.evaluationContext, "live");
});

test("legacy T3 保持 live-only 語義，不偷偷重寫歷史", () => {
  const legacy = EvidenceTaxonomy.classify({ transferLevel: "T3" });
  assert.equal(legacy.version, 1);
  assert.equal(legacy.transferLevel, "T3");
  assert.equal(legacy.evaluationContext, "live");
  assert.equal(legacy.legacyCategory, "legacy_t3_live");
});

test("legacy fixed_local_probe 不被回溯升格成 T3", () => {
  const legacy = EvidenceTaxonomy.classify({ transferLevel: "fixed_local_probe" });
  assert.equal(legacy.version, 1);
  assert.equal(legacy.transferLevel, null);
  assert.equal(legacy.evaluationContext, "standardized");
  assert.equal(legacy.compatibleWithCurrentT3, false);
  assert.equal(legacy.legacyCategory, "fixed_local_probe");
});

test("現行固定應用探測明示 taxonomy v2 與 standardized T3", () => {
  assert.ok(fixedApplicationProbes.length > 0);
  for (const probe of fixedApplicationProbes) {
    assert.equal(probe.evidenceTaxonomyVersion, 2);
    assert.equal(probe.transferLevel, "T3");
    assert.equal(probe.evaluationContext, "standardized");
    assert.equal(EvidenceTaxonomy.classify(probe).compatibleWithCurrentT3, true);
  }
});
