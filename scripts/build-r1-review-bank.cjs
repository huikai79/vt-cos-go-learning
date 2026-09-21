"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ReviewVerifier = require("../r1-review-verify.cjs");

function buildBank() {
  return {
    schemaVersion: 1,
    protocolId: ReviewVerifier.PROTOCOL_ID,
    contentFingerprint: ReviewVerifier.fingerprint(ReviewVerifier.reviewItems),
    population: ReviewVerifier.population,
    reviewItems: ReviewVerifier.reviewItems.map((problem) => ({
      id: problem.id,
      prompt: problem.prompt,
      focus: problem.focus,
      stones: problem.stones
    }))
  };
}

function serializeBank(bank = buildBank()) {
  return `(function (root) {\n  "use strict";\n  const bank = ${JSON.stringify(bank, null, 2)};\n  if (typeof module !== "undefined" && module.exports) module.exports = bank;\n  if (root) root.GoR1ReviewBank = bank;\n})(typeof window !== "undefined" ? window : globalThis);\n`;
}

module.exports = { buildBank, serializeBank };

if (require.main === module) {
  const outputPath = path.resolve(__dirname, "..", "r1-review-bank.js");
  fs.writeFileSync(outputPath, serializeBank(), "utf8");
  process.stdout.write(`Wrote ${outputPath}\n`);
}
