"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ASSET_PATHS } = require("../formal-teaching-candidate.cjs");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const releaseManifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));

const referenced = [...html.matchAll(/<img\\b[^>]*\\bsrc="(assets\\/homepage\\/[^"?]+)(?:\\?[^"]*)?"/g)]
  .map((match) => match[1]);
const uniqueReferenced = [...new Set(referenced)].sort();

assert.ok(uniqueReferenced.length > 0, "homepage should reference at least one image asset");

function expectedMagic(assetPath, bytes) {
  if (/\\.png$/i.test(assetPath)) {
    return bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (/\\.webp$/i.test(assetPath)) {
    return bytes.length >= 12
      && bytes.toString("ascii", 0, 4) === "RIFF"
      && bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return true;
}

for (const assetPath of uniqueReferenced) {
  const absolute = path.join(root, assetPath);
  assert.ok(fs.existsSync(absolute), `homepage image is missing: ${assetPath}`);
  const bytes = fs.readFileSync(absolute);
  assert.ok(bytes.length > 100, `homepage image is unexpectedly small: ${assetPath}`);
  assert.ok(expectedMagic(assetPath, bytes), `homepage image has an invalid file signature: ${assetPath}`);
}

const candidateHomepageAssets = ASSET_PATHS.filter((assetPath) => assetPath.startsWith("assets/homepage/")).sort();
const releaseHomepageAssets = releaseManifest.publicFiles
  .filter((assetPath) => assetPath.startsWith("assets/homepage/"))
  .sort();

assert.deepEqual(
  candidateHomepageAssets,
  uniqueReferenced,
  "formal teaching candidate homepage assets must exactly match the images referenced by index.html"
);
assert.deepEqual(
  releaseHomepageAssets,
  uniqueReferenced,
  "release manifest homepage assets must exactly match the images referenced by index.html"
);

console.log(`PASS: homepage image integrity (${uniqueReferenced.length} referenced assets)`);
