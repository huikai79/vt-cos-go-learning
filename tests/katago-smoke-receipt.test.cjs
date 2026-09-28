const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Receipt = require("../katago-smoke-receipt.cjs");
const Comparison = require("../decision-comparison.js");

const root = path.resolve(__dirname, "..");

function baseReceipt() {
  const request = {
    contractVersion: Comparison.REQUEST_VERSION,
    comparisonContractVersion: Comparison.COMPARISON_CONTRACT_VERSION,
    requestId: "receipt-fixture",
    sourceId: "sgf-fixture",
    positionFingerprint: "position-fixture",
    boardSize: 19,
    toPlay: 1,
    rules: "japanese",
    komi: 6.5,
    maxVisits: 100,
    analysisPVLen: 8,
    historyMode: "root_setup_plus_moves",
    initialStones: [],
    moves: [
      { color: 1, type: "play", point: [15, 3] },
      { color: 2, type: "play", point: [3, 3] }
    ],
    candidates: [
      { role: "learner_first", point: [4, 4] },
      { role: "original_game", point: [16, 15] }
    ],
    authority: "bounded_search_estimate_only",
    formalEligible: false
  };
  return {
    schemaVersion: Receipt.SCHEMA_VERSION,
    receiptVersion: Receipt.RECEIPT_VERSION,
    status: "PASS",
    generatedAt: "2026-09-29T01:02:03.1234567Z",
    platform: "windows",
    repositoryCommit: "a".repeat(40),
    contractFiles: Receipt.contractFileHashes(root),
    engine: {
      version: "1.18.1",
      executableName: "katago.exe",
      executableSha256: "1".repeat(64),
      configName: "analysis.cfg",
      configSha256: "2".repeat(64),
      modelName: "model.bin.gz",
      modelSha256: "3".repeat(64)
    },
    runtime: {
      powershellVersion: "7.5.0",
      nodeVersion: "v22.0.0",
      osVersion: "Microsoft Windows NT 10.0.26100.0"
    },
    moveResult: {
      type: "play",
      point: [4, 4],
      providerVersion: Receipt.MOVE_PROVIDER_VERSION,
      model: "model.bin.gz"
    },
    comparisonRequest: request,
    comparisonResult: {
      resultVersion: Comparison.RESULT_VERSION,
      comparisonContractVersion: Comparison.COMPARISON_CONTRACT_VERSION,
      requestId: request.requestId,
      sourceId: request.sourceId,
      positionFingerprint: request.positionFingerprint,
      boardSize: 19,
      rules: "japanese",
      komi: 6.5,
      maxVisits: 100,
      analysisPVLen: 8,
      searchScope: "root_allow_moves_only",
      authority: "bounded_search_estimate_only",
      formalEligible: false,
      providerVersion: Receipt.COMPARISON_PROVIDER_VERSION,
      engineVersion: "1.18.1",
      model: "model.bin.gz",
      candidates: [
        { role: "learner_first", point: [4, 4], order: 0, visits: 62, scoreLead: 1.2, winrate: 0.54, pv: ["E15", "Q10"] },
        { role: "original_game", point: [16, 15], order: 1, visits: 38, scoreLead: 0.3, winrate: 0.51, pv: ["R4", "C10"] }
      ]
    }
  };
}

test("real KataGo smoke receipt accepts a complete PASS artifact bound to current contracts", () => {
  const receipt = baseReceipt();
  assert.equal(Receipt.validateReceipt(receipt), null);
  assert.equal(Receipt.verifyAgainstRepository(receipt, root), null);
});

test("receipt rejects unknown engine version and mismatched model metadata", () => {
  const unknown = baseReceipt();
  unknown.engine.version = "unknown";
  unknown.comparisonResult.engineVersion = "unknown";
  assert.equal(Receipt.validateReceipt(unknown), "katago_smoke_engine_version_unknown");

  const mismatch = baseReceipt();
  mismatch.comparisonResult.model = "other.bin.gz";
  assert.equal(Receipt.validateReceipt(mismatch), "katago_smoke_model_mismatch");
});

test("receipt rejects forbidden learning inference fields in engine result", () => {
  for (const [key, value] of [["correct", true], ["mastery", 0.9], ["transferLevel", "T3"]]) {
    const receipt = baseReceipt();
    receipt.comparisonResult[key] = value;
    assert.equal(Receipt.validateReceipt(receipt), "katago_smoke_forbidden_inference_present", key);
  }
});

test("receipt rejects stale contract hashes", () => {
  const receipt = baseReceipt();
  receipt.contractFiles["decision-comparison.js"] = "f".repeat(64);
  assert.equal(Receipt.verifyAgainstRepository(receipt, root), "katago_smoke_receipt_stale:decision-comparison.js");
});

test("receipt rejects malformed comparison identity instead of accepting a visually plausible result", () => {
  const receipt = baseReceipt();
  receipt.comparisonResult.positionFingerprint = "other-position";
  assert.match(Receipt.validateReceipt(receipt), /^katago_smoke_comparison_result_invalid:comparison_result_identity_mismatch$/);
});
