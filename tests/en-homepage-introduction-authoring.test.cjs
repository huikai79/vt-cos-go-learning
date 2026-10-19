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
   assert.ok(source.includes(item.source), id + " source drift");
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
