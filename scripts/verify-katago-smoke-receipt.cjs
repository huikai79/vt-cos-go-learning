#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Receipt = require("../katago-smoke-receipt.cjs");

const root = path.resolve(__dirname, "..");
const target = path.resolve(process.argv[2] || path.join(root, ".local-evidence", "katago-smoke-receipt.json"));

let receipt;
try {
  receipt = JSON.parse(fs.readFileSync(target, "utf8"));
} catch (error) {
  process.stderr.write("FAIL: cannot read KataGo smoke receipt: " + error.message + "\n");
  process.exit(1);
}

const error = Receipt.verifyAgainstRepository(receipt, root);
if (error) {
  process.stderr.write("FAIL: " + error + "\n");
  process.exit(1);
}

const comparison = receipt.comparisonResult;
const learner = comparison.candidates.find((item) => item.role === "learner_first");
const original = comparison.candidates.find((item) => item.role === "original_game");
process.stdout.write(
  "PASS: real KataGo receipt verified; engine=" + receipt.engine.version +
  "; model=" + receipt.engine.modelName +
  "; visits=" + comparison.maxVisits +
  "; learnerOrder=" + learner.order +
  "; originalOrder=" + original.order + "\n"
);
