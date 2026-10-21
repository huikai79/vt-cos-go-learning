"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const draft = require("../locales/en/homepage-introduction-draft.json");
function scan() {
 const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
 const js = fs.readFileSync(path.join(root, "homepage-experience.js"), "utf8");
 const start = html.indexOf('<section class="site-introduction"');
 const end = html.indexOf('<div class="content-wrap">', start);
 if (start < 0 || end <= start) throw Error("Homepage introduction bounds changed");
 const intro = html.slice(start, end);
 const normalize = s => s.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
 const segments = [...new Set(intro.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, "\n")
   .split("\n").map(normalize).filter(s => /[\u3400-\u9fff]/u.test(s)))];
 const attrs = [...new Map([...intro.matchAll(/\b(aria-label|title|alt|placeholder|data-fresh-label|data-return-label)="([^"]+)"/g)]
   .filter(m => /[\u3400-\u9fff]/u.test(m[2])).map(m => [m[1] + ":" + normalize(m[2]), {attribute:m[1],text:normalize(m[2])}])).values()];
 const candidates = Object.entries(draft.items).map(([id,x]) => ({id, source:normalize(x.source), text:x.text, sourceFile:x.sourceFile || "index.html"}));
 const matches = text => candidates.some(x => x.source === text && x.sourceFile === "index.html");
 const missingText = segments.filter(s => !matches(s));
 const missingAttributes = attrs.filter(x => !matches(x.text));
 const stale = candidates.filter(x => !(x.sourceFile === "homepage-experience.js" ? js : html).includes(x.source));
 const missingTarget = candidates.filter(x => typeof x.text !== "string" || !x.text.trim() || /[\u3400-\u9fff]/u.test(x.text));
 const dynamicKeys = ["preview-live-after", "preview-live-before"];
 const missingDynamic = dynamicKeys.filter(id => !draft.items[id] || draft.items[id].sourceFile !== "homepage-experience.js");
 return {status:"candidate-only",locale:draft.locale,sourceTextSegments:segments.length,sourceAttributes:attrs.length,candidateEntries:candidates.length,
  missingText,missingAttributes,stale:stale.map(x=>x.id),missingTarget:missingTarget.map(x=>x.id),missingDynamic};
}
function validate(report) {
 if (draft.status !== "candidate-not-runtime") throw Error("Homepage candidate may not be promoted by audit");
 if (report.missingText.length || report.missingAttributes.length || report.stale.length || report.missingTarget.length || report.missingDynamic.length)
  throw Error("Homepage candidate coverage incomplete: " + JSON.stringify(report));
 return report;
}
if (require.main === module) {
 const report = scan();
 if (process.argv.includes("--json")) process.stdout.write(JSON.stringify(report,null,2)+"\n");
 else process.stdout.write("Homepage candidate inventory: "+report.candidateEntries+" entries, "+report.sourceTextSegments+" source segments; missing "+report.missingText.length+" text / "+report.missingAttributes.length+" attributes.\n");
 validate(report);
}
module.exports = {scan,validate};
