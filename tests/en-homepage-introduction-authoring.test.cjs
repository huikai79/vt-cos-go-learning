"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const draft = require("../locales/en/homepage-introduction-draft.json");
test("Homepage English first-pass strings are source-traced and explicitly blocked", () => {
 const source = fs.readFileSync(path.join(root, "index.html"), "utf8");
 assert.equal(draft.locale, "en");
 assert.equal(draft.status, "candidate-not-runtime");
 assert.ok(Object.keys(draft.items).length >= 35);
 for(const [id, item] of Object.entries(draft.items)) {
   const origin = item.sourceFile === "homepage-experience.js" ? fs.readFileSync(path.join(root, "homepage-experience.js"), "utf8") : source;
   assert.ok(origin.includes(item.source), id + " source drift");
   assert.ok(item.text.trim(), id + " missing candidate");
   assert.doesNotMatch(item.text, /[\u3400-\u9fff]/u, id);
   assert.equal(item.review, "candidate");
 }
 const homepage = fs.readFileSync(path.join(root, "homepage-experience.js"), "utf8");
 assert.doesNotMatch(homepage, /homepage-introduction-draft/);
 const index = source;
 assert.doesNotMatch(index, /homepage-introduction-draft/);
 assert.equal(require("../site-locales.json").locales.find(x=>x.id==="en").publishable,false);
});
test("Preview candidate does not claim assessment or evidence validity", () => {
 for(const key of ["hero-intro","preview-synthetic","entry-explainer","catalog-count","method-caveat"]) {
  assert.ok(Object.hasOwn(draft.items,key));
 }
 assert.match(draft.items["hero-intro"].text, /does not count/);
 assert.match(draft.items["preview-synthetic"].text, /does not change/);
 assert.match(draft.items["catalog-count"].text, /not measured/);
 assert.equal(draft.review.nativeEnglish, "pending");
 assert.equal(draft.review.readerUsability, "not_measured");
});

test("Homepage preview dynamic strings are sourced separately and do not alter evidence", () => {
 const js = fs.readFileSync(path.join(root, "homepage-experience.js"), "utf8");
 const required = ["preview-live-after", "preview-live-before", "preview-first-choice", "preview-result"];
 for(const key of required) assert.ok(draft.items[key], key);
 assert.equal(draft.items["preview-live-after"].sourceFile, "homepage-experience.js");
 assert.equal(draft.items["preview-live-before"].sourceFile, "homepage-experience.js");
 assert.match(js, /toggle\.setAttribute\("aria-pressed", String\(showingResult\)\)/);
 assert.doesNotMatch(js, /learnerState|recordLiveResponse|saveTrial/);
 assert.match(draft.items["preview-live-before"].text, /Nothing was added/);
});
test("Homepage candidate covers FAQ, explicit gate and evidence limitations", () => {
 const keys = Object.keys(draft.items);
 assert.ok(keys.length >= 120);
 for(const key of ["faq-rules-q","faq-rank-a","faq-time-a","research-status-caveat","research-backup-caveat","final-cta-heading"]) assert.ok(draft.items[key], key);
 assert.match(draft.items["faq-rank-a"].text, /No rank conversion/);
 assert.match(draft.items["research-status-caveat"].text, /disabled/);
 assert.match(draft.items["research-backup-caveat"].text, /separate export/);
});
