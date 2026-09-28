const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Oracle = require("../classic-geometry-reference-oracle.js");

const receiptPath = path.join(__dirname, "..", "research", "reference-receipts", "tsumego-hero-lgroup-15362.json");
const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));

test("真實 L Group source receipt 只證明來源可重現，不含 geometry authority", () => {
  assert.equal(receipt.schemaVersion, "classic-reference-source-receipt-v1");
  assert.equal(receipt.authority, "reference_source_receipt_only");
  assert.equal(receipt.sourceId, "tsumego-hero-lgroup-32");
  assert.equal(receipt.collectionTitle, "The L Group");
  assert.equal(receipt.problemLabel, "32/46");
  assert.equal(receipt.pageClaim, "Black to kill");
  assert.equal(receipt.embeddedSgfParsed, true);
  assert.equal(receipt.setupGeometryParsed, true);
  assert.equal(receipt.comparisonContractId, null);
  assert.equal(receipt.geometryRepresentation, "unassigned");
  assert.equal(receipt.geometryPersisted, false);
  assert.equal(receipt.rawSourcePersisted, false);
  assert.equal(receipt.canonicalPromotionAllowed, false);
  assert.equal(receipt.rightsStatus, "unknown_reference_only");
});

test("source receipt 禁止保存第三方 SGF、座標、stones 或 fingerprint", () => {
  const serialized = JSON.stringify(receipt);
  for (const key of [
    "points","stones","shapeSignature","contextSignature","fingerprint",
    "signature","rawGeometry","rawObservation","sgf"
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(receipt, key), false, key);
    assert.equal(serialized.includes('"'+key+'"'), false, key);
  }
});

test("沒有 comparisonContractId 的 source receipt 不能偽裝成 reference oracle report", () => {
  const fakeReport = {
    schemaVersion: "classic-reference-oracle-report-v1",
    authority: "reference_oracle_only",
    status: Oracle.STATUS.REFERENCE_MATCH,
    sourceId: receipt.sourceId,
    sourceLocator: receipt.sourceLocator,
    sourceDigest: receipt.sourceDigest,
    evidenceChain: receipt.evidenceChain,
    candidateConceptId: "l-group-v1",
    comparisonContractId: receipt.comparisonContractId,
    requireContext: true,
    sameShape: true,
    sameContext: true,
    canonicalPromotionAllowed: false
  };
  const checked = Oracle.validatePersistableReport(fakeReport);
  assert.equal(checked.ok, false);
  assert.ok(checked.errors.some((error) => /comparisonContractId missing/.test(error)));
});

test("同一 Tsumego Hero collection 的其他題不得假裝第二條獨立 evidence chain", () => {
  const first = {
    schemaVersion: "classic-reference-oracle-report-v1",
    authority: "reference_oracle_only",
    status: Oracle.STATUS.REFERENCE_MATCH,
    sourceId: "tsumego-hero-lgroup-32",
    sourceLocator: "https://tsumego.com/15362",
    sourceDigest: "sha256:first",
    evidenceChain: "tsumego-hero-lgroup-collection-252",
    candidateConceptId: "l-group-v1",
    comparisonContractId: "corner-defender-connected-group-v1",
    requireContext: true,
    sameShape: true,
    sameContext: true,
    canonicalPromotionAllowed: false
  };
  const secondSameChain = {
    ...first,
    sourceId: "tsumego-hero-lgroup-other",
    sourceLocator: "https://tsumego.com/other",
    sourceDigest: "sha256:second"
  };
  const aggregate = Oracle.aggregatePersistableReports([first, secondSameChain]);
  assert.equal(aggregate.ok, false);
  assert.equal(aggregate.status, Oracle.STATUS.INSUFFICIENT);
  assert.equal(aggregate.independentEvidenceUnits, 1);
});
