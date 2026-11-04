"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const audit = require("../scripts/audit-english-homepage.cjs");
const draft = require("../locales/en/homepage-introduction-draft.json");
test("all Chinese homepage intro text and accessibility attributes have source-exact English candidates", () => {
 const result = audit.validate(audit.scan());
 assert.equal(result.locale, "en");
 assert.equal(result.status, "candidate-only");
 assert.ok(result.candidateEntries >= 150);
 assert.ok(result.sourceTextSegments >= 130);
 assert.equal(result.missingText.length, 0);
 assert.equal(result.missingAttributes.length, 0);
 assert.equal(result.stale.length, 0);
 assert.equal(result.missingDynamic.length, 0);
});
test("English homepage remains unavailable and the audit rejects adverse results", () => {
 const site = require("../site-locales.json");
 assert.equal(site.locales.find(x => x.id === "en").publishable, false);
 assert.equal(draft.status, "candidate-not-runtime");
 assert.throws(() => audit.validate({...audit.scan(), missingText:["new unexplained text"]}), /coverage incomplete/);
 assert.throws(() => audit.validate({...audit.scan(), missingAttributes:[{attribute:"aria-label",text:"untested"}]}), /coverage incomplete/);
 assert.throws(() => audit.validate({...audit.scan(), stale:["hero-title"]}), /coverage incomplete/);
});
