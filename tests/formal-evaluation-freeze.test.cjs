const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const Freeze=require("../formal-evaluation-freeze.cjs");
const Eval=require("../formal-evaluation-verify.cjs");

const sha=v=>crypto.createHash("sha256").update(v).digest("hex");
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"go-private-freeze-"));
  fs.mkdirSync(path.join(root,"items"));
  fs.writeFileSync(path.join(root,"items","a.json"),JSON.stringify({synthetic:true,id:"a"}));
  fs.writeFileSync(path.join(root,"items","b.json"),JSON.stringify({synthetic:true,id:"b"}));
  return {
    root,
    draft:{
      schemaVersion:1,
      protocolId:Freeze.DRAFT_PROTOCOL_ID,
      poolId:"synthetic-pool",
      poolVersion:"v1",
      scoringContractVersion:"score-v1",
      evidenceTaxonomyVersion:"evidence-v1",
      items:[
        {itemId:"a",relativePath:"items/a.json"},
        {itemId:"b",relativePath:"items/b.json"}
      ]
    }
  };
}
const clean=f=>fs.rmSync(f.root,{recursive:true,force:true});

test("freeze builder 由實際 private item bytes 計算 hash 並立即通過既有 verifier",()=>{
  const f=fixture();
  try{
    const r=Freeze.freezePrivateManifest(f.draft,f.root,{now:"2026-09-29T12:00:00.000Z"});
    assert.equal(r.valid,true,r.errors.join("; "));
    assert.equal(r.manifest.protocolId,Eval.PROTOCOL_ID);
    assert.equal(r.manifest.frozenBeforeOutcomes,true);
    assert.equal(r.manifest.exposureStatus,"never_public_never_presented");
    assert.equal(r.manifest.useCategory,"independent_evaluation");
    assert.equal(r.manifest.adaptationPolicy,"no_same_round_updates");
    assert.equal(r.manifest.qualificationPolicy,"locked_before_outcomes");
    assert.equal(r.manifest.items[0].sha256,sha(fs.readFileSync(path.join(f.root,"items/a.json"))));
    assert.equal(r.verification.valid,true);
  }finally{clean(f);}
});

test("draft 不得預填 hash 或治理宣告",()=>{
  const f=fixture();
  try{
    f.draft.items[0].sha256="a".repeat(64);
    f.draft.frozenBeforeOutcomes=true;
    const r=Freeze.freezePrivateManifest(f.draft,f.root);
    assert.equal(r.valid,false);
    assert.match(r.errors.join(" "),/sha256/);
    assert.match(r.errors.join(" "),/frozenBeforeOutcomes/);
  }finally{clean(f);}
});

test("已有 outcomes 時不得事後補凍結",()=>{
  const f=fixture();
  try{
    fs.mkdirSync(path.join(f.root,Freeze.OUTCOMES_DIR));
    fs.writeFileSync(path.join(f.root,Freeze.OUTCOMES_DIR,"batch-01.json"),"{}");
    const r=Freeze.freezePrivateManifest(f.draft,f.root);
    assert.equal(r.valid,false);
    assert.match(r.errors.join(" "),/outcomes 已存在/);
  }finally{clean(f);}
});

test("重複 itemId 或 relativePath fail closed",()=>{
  const f=fixture();
  try{
    f.draft.items.push({itemId:"a",relativePath:"items/a.json"});
    const r=Freeze.freezePrivateManifest(f.draft,f.root);
    assert.equal(r.valid,false);
    assert.match(r.errors.join(" "),/重複 itemId/);
    assert.match(r.errors.join(" "),/同一 relativePath/);
  }finally{clean(f);}
});

test("writeFrozenManifest 使用 exclusive create，frozen manifest 不得覆寫",()=>{
  const f=fixture();
  try{
    const draftPath=path.join(f.root,"draft.json"),outPath=path.join(f.root,"manifest.json");
    fs.writeFileSync(draftPath,JSON.stringify(f.draft));
    const first=Freeze.writeFrozenManifest({draftPath,privateRoot:f.root,outPath});
    assert.equal(first.valid,true);
    assert.ok(fs.existsSync(outPath));
    assert.throws(()=>Freeze.writeFrozenManifest({draftPath,privateRoot:f.root,outPath}),/不得覆寫/);
  }finally{clean(f);}
});

test("draft 與 output 都必須位於 private root 內",()=>{
  const f=fixture();
  const outside=path.join(os.tmpdir(),"freeze-draft-"+Date.now()+".json");
  try{
    fs.writeFileSync(outside,JSON.stringify(f.draft));
    assert.throws(()=>Freeze.writeFrozenManifest({draftPath:outside,privateRoot:f.root,outPath:path.join(f.root,"manifest.json")}),/private root/);
    fs.writeFileSync(path.join(f.root,"draft.json"),JSON.stringify(f.draft));
    assert.throws(()=>Freeze.writeFrozenManifest({draftPath:path.join(f.root,"draft.json"),privateRoot:f.root,outPath:path.join(os.tmpdir(),"outside-manifest.json")}),/private root/);
  }finally{fs.rmSync(outside,{force:true});clean(f);}
});

test("symlink item 不得被 freeze builder 接受",()=>{
  const f=fixture();
  const outside=path.join(os.tmpdir(),"freeze-outside-"+Date.now()+".json");
  try{
    fs.writeFileSync(outside,"outside");
    const link=path.join(f.root,"items","link.json");
    try{fs.symlinkSync(outside,link);}catch(error){if(process.platform==="win32"&&/privilege|EPERM/i.test(String(error)))return;throw error;}
    f.draft.items=[{itemId:"link",relativePath:"items/link.json"}];
    const r=Freeze.freezePrivateManifest(f.draft,f.root);
    assert.equal(r.valid,false);
    assert.match(r.errors.join(" "),/symbolic link|real path/);
  }finally{fs.rmSync(outside,{force:true});clean(f);}
});
