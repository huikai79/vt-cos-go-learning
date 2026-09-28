"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const Comparison = require("./decision-comparison.js");

const RECEIPT_VERSION = "katago-windows-smoke-receipt-v1";
const SCHEMA_VERSION = 1;
const CONTRACT_FILES = Object.freeze([
  "katago-bridge.cjs",
  "decision-comparison.js",
  "katago-comparison-adapter.cjs",
  "katago-smoke-receipt.cjs",
  "tests/katago-bridge-smoke.ps1"
]);
const MOVE_PROVIDER_VERSION = "katago-gtp-bridge-v1";
const COMPARISON_PROVIDER_VERSION = "katago-analysis-comparison-v1";

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}
function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}
function isIsoDate(value) {
  return typeof value === "string" &&
    /(Z|[+-]\d{2}:\d{2})$/i.test(value) &&
    Number.isFinite(Date.parse(value));
}
function repositoryCommit(rootDir) {
  const result = spawnSync("git", ["-C", path.resolve(rootDir || "."), "rev-parse", "HEAD"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error("katago_smoke_repository_commit_unavailable");
  const value = String(result.stdout || "").trim();
  if (!/^[a-f0-9]{40}$/i.test(value)) throw new Error("katago_smoke_repository_commit_invalid");
  return value.toLowerCase();
}
function contractFileHashes(rootDir) {
  const root = path.resolve(rootDir || ".");
  const result = {};
  for (const relativePath of CONTRACT_FILES) {
    const filePath = path.join(root, relativePath);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error("katago_smoke_contract_file_missing:" + relativePath);
    result[relativePath] = sha256File(filePath);
  }
  return result;
}
function hasForbiddenInference(value) {
  if (!value || typeof value !== "object") return false;
  for (const key of ["correct", "mastery", "transferLevel"]) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  }
  if (Array.isArray(value)) return value.some(hasForbiddenInference);
  return Object.values(value).some(hasForbiddenInference);
}
function validateContractFiles(contractFiles) {
  if (!contractFiles || typeof contractFiles !== "object" || Array.isArray(contractFiles)) return "katago_smoke_contract_files_invalid";
  const keys = Object.keys(contractFiles).sort();
  const expected = [...CONTRACT_FILES].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) return "katago_smoke_contract_files_invalid";
  if (!keys.every((key) => isSha256(contractFiles[key]))) return "katago_smoke_contract_hash_invalid";
  return null;
}
function validateReceipt(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return "katago_smoke_receipt_invalid";
  if (receipt.schemaVersion !== SCHEMA_VERSION || receipt.receiptVersion !== RECEIPT_VERSION) return "katago_smoke_receipt_version_invalid";
  if (receipt.status !== "PASS") return "katago_smoke_receipt_not_pass";
  if (!isIsoDate(receipt.generatedAt)) return "katago_smoke_generated_at_invalid";
  if (receipt.platform !== "windows") return "katago_smoke_platform_invalid";
  if (typeof receipt.repositoryCommit !== "string" || !/^[a-f0-9]{40}$/i.test(receipt.repositoryCommit)) return "katago_smoke_repository_commit_invalid";

  const contractError = validateContractFiles(receipt.contractFiles);
  if (contractError) return contractError;

  const engine = receipt.engine;
  if (!engine || typeof engine !== "object") return "katago_smoke_engine_missing";
  for (const key of ["version", "executableName", "configName", "modelName"]) {
    if (typeof engine[key] !== "string" || !engine[key].trim()) return "katago_smoke_engine_metadata_missing";
  }
  if (/^unknown$/i.test(engine.version.trim())) return "katago_smoke_engine_version_unknown";
  for (const key of ["executableSha256", "configSha256", "modelSha256"]) {
    if (!isSha256(engine[key])) return "katago_smoke_engine_hash_invalid";
  }

  const runtime = receipt.runtime;
  if (!runtime || typeof runtime !== "object") return "katago_smoke_runtime_missing";
  for (const key of ["powershellVersion", "nodeVersion", "osVersion"]) {
    if (typeof runtime[key] !== "string" || !runtime[key].trim()) return "katago_smoke_runtime_metadata_missing";
  }

  const moveResult = receipt.moveResult;
  if (!moveResult || typeof moveResult !== "object") return "katago_smoke_move_result_missing";
  if (moveResult.providerVersion !== MOVE_PROVIDER_VERSION) return "katago_smoke_move_provider_invalid";
  if (!["play", "pass", "resign"].includes(moveResult.type)) return "katago_smoke_move_action_invalid";
  if (moveResult.type === "play") {
    if (!Array.isArray(moveResult.point) || moveResult.point.length !== 2 || !moveResult.point.every((value) => Number.isInteger(value) && value >= 0 && value < 9)) return "katago_smoke_move_point_invalid";
  } else if (moveResult.point !== null) {
    return "katago_smoke_move_point_invalid";
  }
  if (typeof moveResult.model !== "string" || !moveResult.model) return "katago_smoke_move_model_missing";

  const request = receipt.comparisonRequest;
  const requestError = Comparison.validateRequest(request);
  if (requestError) return "katago_smoke_comparison_request_invalid:" + requestError;
  if (request.authority !== "bounded_search_estimate_only" || request.formalEligible !== false) return "katago_smoke_comparison_request_authority_invalid";

  const result = receipt.comparisonResult;
  const resultError = Comparison.validateResult(result, request);
  if (resultError) return "katago_smoke_comparison_result_invalid:" + resultError;
  if (result.providerVersion !== COMPARISON_PROVIDER_VERSION) return "katago_smoke_comparison_provider_invalid";
  if (result.engineVersion !== engine.version) return "katago_smoke_engine_version_mismatch";
  if (result.model !== engine.modelName || moveResult.model !== engine.modelName) return "katago_smoke_model_mismatch";
  if (hasForbiddenInference(result)) return "katago_smoke_forbidden_inference_present";

  return null;
}
function verifyAgainstRepository(receipt, rootDir) {
  const error = validateReceipt(receipt);
  if (error) return error;
  let currentCommit;
  let currentHashes;
  try {
    currentCommit = repositoryCommit(rootDir);
    currentHashes = contractFileHashes(rootDir);
  } catch (error) {
    return error.message || "katago_smoke_repository_verification_failed";
  }
  if (receipt.repositoryCommit.toLowerCase() !== currentCommit) return "katago_smoke_receipt_commit_mismatch";
  for (const relativePath of CONTRACT_FILES) {
    if (receipt.contractFiles[relativePath] !== currentHashes[relativePath]) return "katago_smoke_receipt_stale:" + relativePath;
  }
  return null;
}

module.exports = {
  RECEIPT_VERSION,
  SCHEMA_VERSION,
  CONTRACT_FILES,
  MOVE_PROVIDER_VERSION,
  COMPARISON_PROVIDER_VERSION,
  sha256File,
  repositoryCommit,
  contractFileHashes,
  validateReceipt,
  verifyAgainstRepository
};
