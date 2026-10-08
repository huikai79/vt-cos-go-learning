"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const PROTOCOL_ID = "go-formal-teaching-candidate-v1";
const ASSET_SET_VERSION = 16;
const ASSET_PATHS = Object.freeze([
  "index.html",
  "styles.css",
  "experience-system.css",
  "homepage-experience.js",
  "assets/homepage/hero-atmosphere.svg",
  "assets/homepage/philosophy-growth-v59.webp",
  "assets/homepage/philosophy-capability-v59.webp",
  "assets/homepage/footer-landscape.svg",
  "assets/homepage/stage-basic.webp",
  "assets/homepage/stage-local.webp",
  "assets/homepage/stage-global.webp",
  "assets/homepage/evidence-first.webp",
  "assets/homepage/evidence-feedback.webp",
  "assets/homepage/evidence-delayed.webp",
  "assets/homepage/evidence-new-shape.webp",
  "go.js",
  "content.js",
  "phase2-foundation-bank.js",
  "phase2-life-death-bank.js",
  "phase2-content.js",
  "evidence-taxonomy.js",
  "phase4-content.js",
  "sgf.js",
  "scheduler.js",
  "trial.js",
  "learning-metrics.js",
  "practice-events.js",
  "live-evidence.js",
  "learner-progress.js",
  "app.js"
]);
function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function normalizeText(value) {
  return String(value).replace(/\r\n/g, "\n");
}
function fnv1a32Js16(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
function canonicalAssetBytes(assetPath, content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
  if (/\.(?:webp|png|jpe?g|gif|avif)$/i.test(assetPath)) return bytes;
  return Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
}
function gitBlobSha(content, assetPath = "") {
  const bytes = canonicalAssetBytes(assetPath, content);
  const header = Buffer.from("blob " + bytes.length + "\0", "utf8");
  return crypto.createHash("sha1").update(header).update(bytes).digest("hex");
}
function fingerprintEntries(entries) {
  const material = entries.map(({ path: assetPath, content }) =>
    assetPath + "\0" + gitBlobSha(content, assetPath) + "\0"
  ).join("");
  return "fnv1a32-js16-" + fnv1a32Js16(material).toString(16).padStart(8, "0");
}
function readAssetEntries(rootDir = __dirname, assetPaths = ASSET_PATHS) {
  return assetPaths.map((assetPath) => ({
    path: assetPath,
    content: fs.readFileSync(path.join(rootDir, assetPath))
  }));
}
function currentFingerprint(rootDir = __dirname, assetPaths = ASSET_PATHS) {
  return fingerprintEntries(readAssetEntries(rootDir, assetPaths));
}
function sameStringArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}
function evaluateManifest(manifest, rootDir = __dirname) {
  const errors = [];
  if (!manifest || manifest.schemaVersion !== 1 || manifest.protocolId !== PROTOCOL_ID) {
    errors.push("formal teaching candidate schema 或 protocol 不符");
  }
  if (!manifest || manifest.assetSetVersion !== ASSET_SET_VERSION) {
    errors.push("formal teaching candidate asset set version 不符");
  }
  if (!manifest || !nonEmpty(manifest.candidateId)) {
    errors.push("formal teaching candidate id 缺失");
  }
  if (!manifest || !sameStringArray(manifest.assetPaths, ASSET_PATHS)) {
    errors.push("formal teaching candidate asset 清單不符");
  }
  let computedFingerprint = null;
  try {
    computedFingerprint = currentFingerprint(rootDir);
  } catch (error) {
    errors.push("無法重算 formal teaching candidate fingerprint: " + error.message);
  }
  if (!manifest || !nonEmpty(manifest.assetFingerprint) || manifest.assetFingerprint !== computedFingerprint) {
    errors.push("formal teaching candidate fingerprint 已與目前 critical learner surface 不一致");
  }
  return {
    valid: errors.length === 0,
    candidateId: manifest && manifest.candidateId,
    assetFingerprint: manifest && manifest.assetFingerprint,
    computedFingerprint,
    assetSetVersion: ASSET_SET_VERSION,
    assetPaths: [...ASSET_PATHS],
    errors
  };
}
module.exports = {
  PROTOCOL_ID,
  ASSET_SET_VERSION,
  ASSET_PATHS,
  normalizeText,
  fnv1a32Js16,
  canonicalAssetBytes,
  gitBlobSha,
  fingerprintEntries,
  readAssetEntries,
  currentFingerprint,
  evaluateManifest
};
if (require.main === module) {
  try {
    const manifestPath = path.join(__dirname, "formal-teaching-candidate.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const result = evaluateManifest(manifest, __dirname);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write("無法驗證 formal teaching candidate: " + error.message + "\n");
    process.exitCode = 2;
  }
}
