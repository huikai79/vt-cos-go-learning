const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const cases={
 "history.html":["evidence","questions","origin","board-size","cosmology","rules","stories","transitions","frontier","sources"],
 "math.html":["boundary","questions","formal-math","cognition","transfer","bridge","mapping","sources"],
 "global-go-observatory.html":["metrics-title","europe-title","profiles-title","method-title","sources-title"]
};
for(const [filename,ids] of Object.entries(cases)){
 test(filename+" has one accessible TOC with valid anchors and an article wrapper",()=>{
   const html=fs.readFileSync(path.join(root,filename),"utf8");
   assert.match(html,/<main id="[^"]+" class="reading-layout">/);
   assert.match(html,/class="reading-article"/);
   assert.ok(html.indexOf('class="reading-toc-rail"') < html.indexOf('class="reading-article"'),"keyboard TOC must precede article");
   assert.equal((html.match(/class="reading-toc-rail"/g)||[]).length,1);
   assert.match(html,/<details class="reading-toc-panel" open>/);
   assert.match(html,/<nav class="reading-toc-links" aria-label="本頁目錄">/);
   assert.match(html,/reading-toc\.css\?v=reading-toc-v1/);
   assert.match(html,/reading-toc\.js\?v=reading-toc-v1/);
   assert.doesNotMatch(html,/class="explore-reading-index"/);
   for(const id of ids){
     assert.match(html,new RegExp('href="#'+id+'"'),filename+" TOC missing "+id);
     assert.ok(html.includes('id="'+id+'"'),filename+" destination missing "+id);
   }
 });
}
test("reading TOC has mobile disclosure, live position and no learner-state writes",()=>{
 const css=fs.readFileSync(path.join(root,"reading-toc.css"),"utf8");
 const js=fs.readFileSync(path.join(root,"reading-toc.js"),"utf8");
 assert.match(css,/position:sticky/);
 assert.match(css,/reading-toc-rail\{[^}]*order:2/);
 assert.match(css,/@media\(max-width:1199px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/scroll-margin-top/);
 assert.match(js,/aria-current/);
 assert.match(js,/hashchange/);
 assert.match(js,/toc\.open = false/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|scheduler|scoring|formalEligible|fetch\(/);
 assert.doesNotMatch(js,/scrollTo\(|scrollRestoration/);
});
