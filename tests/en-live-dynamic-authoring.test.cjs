"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const candidate = require("../live-game-locale-view.js");
test("English Live Game candidate is not available to live runtime", () => {
  assert.throws(() => candidate.createView(), { code: "LOCALE_COPY_BLOCKED" });
  assert.throws(() => candidate.createView({ approved: true, publishable: true }), { code: "LOCALE_COPY_BLOCKED" });
  const manifest = require("../site-locales.json");
  assert.equal(manifest.locales.find(x => x.id === "en").publishable, false);
  const html = fs.readFileSync(path.join(__dirname, "../live-game.html"), "utf8");
  assert.doesNotMatch(html, /live-game-locale-view\.js/);
});
test("preview covers normal, error, scoring, SGF, recovery and accessibility branches", () => {
  const view = candidate.createView({ preview: true });
  const required = ["computerTurn", "humanTurn", "occupied", "illegal", "unknownMove", "providerFailure",
    "providerTestFailure", "pass", "bothPass", "resign", "undo", "markDead", "scorePreview",
    "scoreUnknown", "resume", "storageFailure", "eventFailure", "recoveryCopy", "recoveryFailed",
    "sgfImport", "sgfWrongSize", "sgfReadFailure", "sgfParseFailure", "sgfExport",
    "sgfExportFailure", "boardPlaying", "boardScoring", "boardFinished", "scoringPoint", "unknown"];
  for (const key of required) assert.ok(Object.hasOwn(candidate.messages, key), key);
  assert.match(view.text("humanTurn", { color: "Black" }), /Black to play/);
  assert.match(view.text("scoringPoint", { coord: "D4", color: "White" }), /dead-stone mark/);
  assert.match(view.text("scorePreview", { color: "White", points: 2.5 }), /preview only.*2.5/i);
  assert.match(view.text("sgfWrongSize", { size: 19 }), /19×19/);
  assert.throws(() => view.text("missing"), { code: "LOCALE_COPY_BLOCKED" });
  assert.throws(() => view.text("sgfImport"), { code: "LOCALE_COPY_BLOCKED" });
  assert.throws(() => view.text("sgfImport", { filename: {} }), { code: "LOCALE_COPY_BLOCKED" });
});
test("candidate copy is isolated from game authority and does not invent success on failure", () => {
  const keys = Object.keys(candidate.messages);
  assert.ok(keys.length >= 35);
  for (const text of Object.values(candidate.messages)) assert.doesNotMatch(text, /[\u3400-\u9fff]/u);
  for (const key of ["providerFailure", "scoreUnknown", "storageFailure", "eventFailure",
    "sgfParseFailure", "sgfExportFailure", "unknown"]) {
    assert.doesNotMatch(candidate.messages[key], /successfully (saved|scored|played)|mastered/i);
  }
  assert.equal(Object.hasOwn(candidate, "game"), false);
  assert.equal(Object.hasOwn(candidate, "scoring"), false);
  assert.equal(Object.hasOwn(candidate, "events"), false);
});
