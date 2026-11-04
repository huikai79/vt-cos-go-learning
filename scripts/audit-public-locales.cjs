"use strict";
// Public-localization audit only. Does not mutate learner state, source items or scoring.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const locales = require("../site-locales.json");
const manifest = require("../release-manifest.json");
function inventory() {
 const pages = locales.publicPages.map(file => {
  const html = fs.readFileSync(path.join(root,file),"utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/gi)].map(m=>m[1].split("?")[0]);
  const attributes = [...html.matchAll(/\b(?:aria-label|title|placeholder|alt)=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>x.trim());
  const visibleSegments = html.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<!--[^]*?-->/g," ").replace(/<[^>]+>/g,"\n").split(/\n+/).map(s=>s.trim()).filter(Boolean);
  return {file,scriptCount:scripts.length,scripts,staticTextCount:visibleSegments.length,attributeCount:attributes.length,requiresLocalization:true};
 });
 const referencedJs = [...new Set(pages.flatMap(p=>p.scripts))].filter(p=>p.endsWith(".js")&&fs.existsSync(path.join(root,p)));
 const dynamic = referencedJs.map(file => {
  const code=fs.readFileSync(path.join(root,file),"utf8");
  const cjk=(code.match(/[\u3400-\u9fff]/g)||[]).length;
  return {file,cjkCharacters:cjk,reviewRequired:cjk>0,notes:"Candidates only; no claim that each occurrence is learner-visible"};
 }).filter(r=>r.reviewRequired);
 return {schemaVersion:1,sourceSha:locales.sourceRef,totalPages:pages.length,pages,jsReviewCandidates:dynamic,requiredLocaleCoverage:locales.locales.map(l=>({locale:l.id,status:l.status,publishable:l.publishable,allPagesTranslated:l.id==="zh-Hant-TW"})),manifestTrackedPages:pages.every(p=>manifest.publicFiles.includes(p.file))};
}
function validate(result){
 if(result.totalPages!==11)throw Error("Unexpected public page count; review inventory");
 if(!result.manifestTrackedPages)throw Error("Untracked public page");
 const target=result.requiredLocaleCoverage.filter(x=>x.locale!=="zh-Hant-TW");
 if(target.some(x=>x.publishable))throw Error("Do not advertise incomplete site locales");
 const required=new Set(["en","ko-KR","ms-MY","th-TH","id-ID","de-DE"]);
 for(const item of target)required.delete(item.locale);
 if(required.size)throw Error("Missing locale target: "+[...required].join(", "));
 return result;
}
if(require.main===module){const data=validate(inventory());if(process.argv.includes("--json"))process.stdout.write(JSON.stringify(data,null,2)+"\n");else process.stdout.write("Public localization inventory: "+data.totalPages+" pages; "+data.jsReviewCandidates.length+" dynamic JS review candidates; target locales blocked until full coverage.\n");}
module.exports={inventory,validate};