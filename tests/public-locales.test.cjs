"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const manifest=require("../site-locales.json");
const audit=require("../scripts/audit-public-locales.cjs");
test("all site language targets are declared but incomplete languages remain blocked",()=>{
 assert.equal(manifest.defaultLocale,"zh-Hant-TW");
 assert.deepEqual(manifest.locales.map(x=>x.id),["zh-Hant-TW","en","ko-KR","ms-MY","th-TH","id-ID","de-DE"]);
 assert.equal(manifest.locales.filter(x=>x.publishable).length,1);
 assert.equal(manifest.promotionGate.noSilentFallback,true);
 assert.equal(manifest.promotionGate.requiresUserReleaseApproval,true);
});
test("all public HTML entrypoints inventoried and no claimed full-site target locale",()=>{
 const report=audit.validate(audit.inventory());
 assert.equal(report.totalPages,11);
 assert.equal(report.manifestTrackedPages,true);
 assert.ok(report.jsReviewCandidates.some(x=>x.file==="app.js"));
 assert.ok(report.jsReviewCandidates.some(x=>x.file==="live-game-page.js"));
 assert.ok(report.jsReviewCandidates.some(x=>x.file==="classic-shapes.js"));
 for(const p of report.pages)assert.ok(p.staticTextCount>0,p.file);
});
test("editorial policy preserves item/scorer authority while requiring native authoring",()=>{
 const src=fs.readFileSync(path.join(root,"PUBLIC_LOCALE_AUTHORING.md"),"utf8");
 for(const locale of ["en","ko-KR","ms-MY","th-TH","id-ID","de-DE"])assert.ok(src.includes(locale),locale);
 assert.match(src,/literal Chinese→English/);
 assert.match(src,/pre-answer/);
 assert.match(src,/Go board geometry/);
 assert.match(src,/first response/);
});