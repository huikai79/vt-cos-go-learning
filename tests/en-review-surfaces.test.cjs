"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const A=require("../scripts/audit-en-review-surfaces.cjs");
const root=path.resolve(__dirname,"..");
const input=(stem,file)=>{
 const draft=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 const html=fs.readFileSync(path.join(root,stem+".html"),"utf8");
 const js=fs.readFileSync(path.join(root,stem+".js"),"utf8");
 return {draft,html,js};
};
test("both independent review English source-bound candidates cover static/dynamic text but have zero release authority",()=>{
 const reports=A.run(root);
 assert.deepEqual(reports.map(x=>x.page),["r1-review.html","lesson-content-review.html"]);
 assert.ok(reports.every(x=>x.staticText>=15&&x.attributes>=3&&x.dynamic>=17&&!x.errors.length));
 assert.ok(reports.every(x=>!x.runtimeEligible&&x.formalTeaching==="BLOCKED"&&x.formalEvaluation==="BLOCKED"));
 assert.ok(reports.every(x=>x.goReview==="PENDING"&&x.nativeReview==="PENDING"&&x.learningEffect==="NOT_MEASURED"));
 for(const [stem,file] of A.PAGES){
  const {draft,html,js}=input(stem,file);
  assert.equal(draft.publishable,false);
  assert.equal(draft.status,"candidate-not-runtime");
  assert.ok(draft.notAuthored.length>0);
  assert.doesNotMatch(html,/review-surface-draft\.json/);
  assert.doesNotMatch(js,/review-surface-draft\.json/);
 }
});
test("new/changed HTML copy, changed JS source, omitted dynamic message and missing variable all fail closed",()=>{
 const [stem,file]=A.PAGES[0],{draft,html,js}=input(stem,file);
 const newHtml=html.replace("</main>","<p>有新的注意事項</p></main>");
 assert.ok(A.audit(stem,draft,newHtml,js).errors.some(e=>e.includes("source Git blob")));
 assert.ok(A.audit(stem,draft,newHtml,js).errors.some(e=>e.includes("static text")));
 const moreJs=js+"\nconst newNotice='不要把草稿當完成';";
 const changed=A.audit(stem,draft,html,moreJs);
 assert.ok(changed.errors.some(e=>e.includes("source Git blob")));
 assert.ok(changed.errors.some(e=>e.includes("uncovered Chinese")));
 const missing=structuredClone(draft);missing.dynamic.splice(3,1);
 assert.ok(A.audit(stem,missing,html,js).errors.some(e=>e.includes("uncovered")||e.includes("source")));
 const noVariable=structuredClone(draft);noVariable.dynamic[0].text="Select a board position";
 assert.ok(A.audit(stem,noVariable,html,js).errors.some(e=>e.includes("placeholder")));
});
test("cannot silently rename JSON receipt, invent independent review or enable English runtime",()=>{
 const [stem,file]=A.PAGES[1],{draft,html,js}=input(stem,file);
 const rename=structuredClone(draft);
 rename.dynamic.find(x=>x.id==="finalFilename").text="new-receipt.json";
 assert.ok(A.audit(stem,rename,html,js).errors.some(e=>e.includes("filename")));
 const falseReview=structuredClone(draft);falseReview.review.goContent="approved";
 assert.ok(A.audit(stem,falseReview,html,js).errors.some(e=>e.includes("candidate-only")));
 const promote=structuredClone(draft);promote.publishable=true;promote.status="ready";
 assert.ok(A.audit(stem,promote,html,js).errors.some(e=>e.includes("candidate-only")));
});
