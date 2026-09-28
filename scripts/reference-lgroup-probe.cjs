"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const Adapter = require("../classic-geometry-reference-html-sgf.js");

const SOURCE_URL = "https://tsumego.com/15362";
const OUTPUT = process.argv[2] || "lgroup-reference-receipt.json";

function sha256(text) {
  return "sha256:" + crypto.createHash("sha256").update(text,"utf8").digest("hex");
}

function assert(condition,message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "vt-cos-go-learning-reference-research/1.0"
    },
    redirect: "follow"
  });
  assert(response.ok, "source fetch failed: HTTP " + response.status);
  const html = await response.text();

  assert(/The L Group/.test(html), "source identity missing: The L Group");
  assert(/32\/46/.test(html), "source identity missing: 32/46");
  assert(/Black to kill/.test(html), "source claim missing: Black to kill");

  const embedded = Adapter.extractEmbeddedSgf(html);
  assert(embedded.ok, "embedded SGF unavailable: " + embedded.errors.join("; "));
  const setup = Adapter.parseSetupGeometry(embedded.sgf);
  assert(setup.ok, "SGF setup parse unavailable: " + setup.errors.join("; "));

  const receipt = {
    schemaVersion: "classic-reference-source-receipt-v1",
    authority: "reference_source_receipt_only",
    sourceId: "tsumego-hero-lgroup-32",
    sourceLocator: SOURCE_URL,
    sourceDigest: sha256(html),
    evidenceChain: "tsumego-hero-lgroup-collection-252",
    collectionId: "252",
    collectionTitle: "The L Group",
    problemLabel: "32/46",
    pageClaim: "Black to kill",
    embeddedSgfParsed: true,
    setupGeometryParsed: true,
    embeddedSgfOccurrences: embedded.occurrences,
    comparisonContractId: null,
    geometryRepresentation: "unassigned",
    geometryPersisted: false,
    rawSourcePersisted: false,
    canonicalPromotionAllowed: false,
    rightsStatus: "unknown_reference_only",
    capturedAt: new Date().toISOString()
  };

  const serialized = JSON.stringify(receipt,null,2) + "\n";
  for (const forbidden of ["points","stones","shapeSignature","contextSignature","fingerprint","rawGeometry","rawObservation","sgf"]) {
    assert(!serialized.includes('"' + forbidden + '"'), "receipt leaked forbidden key: " + forbidden);
  }
  fs.mkdirSync(require("node:path").dirname(OUTPUT),{recursive:true});
  fs.writeFileSync(OUTPUT,serialized,"utf8");
  console.log("sanitized reference receipt written");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
