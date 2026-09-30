"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const Eval=require("./formal-evaluation-verify.cjs");

const DRAFT_PROTOCOL_ID="go-private-unseen-evaluation-freeze-draft-v1";
const OUTCOMES_DIR="outcomes";

const nonEmpty=v=>typeof v==="string"&&v.trim().length>0;
const validTimestamp=v=>typeof v==="string"&&Number.isFinite(Date.parse(v));
const sha256=b=>crypto.createHash("sha256").update(b).digest("hex");
function inside(root,target){const r=path.relative(root,target);return r&&!r.startsWith("..")&&!path.isAbsolute(r);}

function safeFile(root,relativePath){
  const errors=[];
  if(!nonEmpty(relativePath)||path.isAbsolute(relativePath))return{valid:false,errors:["relativePath 必須是 private root 內的相對路徑"]};
  const lexical=path.resolve(root,relativePath);
  if(!inside(root,lexical))return{valid:false,errors:["private item 路徑逃出 private root"]};
  if(!fs.existsSync(lexical))return{valid:false,errors:["private item 不存在"]};
  const stat=fs.lstatSync(lexical);
  if(stat.isSymbolicLink())return{valid:false,errors:["private item 不得使用 symbolic link"]};
  if(!stat.isFile())return{valid:false,errors:["private item 必須是檔案"]};
  const realRoot=fs.realpathSync(root),realTarget=fs.realpathSync(lexical);
  if(!inside(realRoot,realTarget))errors.push("private item real path 逃出 private root");
  return{valid:errors.length===0,errors,target:lexical,realTarget};
}

function outcomeFiles(privateRoot){
  const dir=path.join(privateRoot,OUTCOMES_DIR);
  if(!fs.existsSync(dir))return[];
  const found=[];
  const walk=current=>{
    for(const name of fs.readdirSync(current)){
      const p=path.join(current,name),stat=fs.lstatSync(p);
      if(stat.isSymbolicLink()){found.push(p);continue;}
      if(stat.isDirectory())walk(p);else found.push(p);
    }
  };
  walk(dir);
  return found;
}

function freezePrivateManifest(draft,privateRoot,{now}={}){
  const errors=[];
  const root=path.resolve(privateRoot||".");
  if(!fs.existsSync(root)||!fs.statSync(root).isDirectory())return{valid:false,errors:["private root 不存在或不是目錄"]};
  if(!draft||typeof draft!=="object")return{valid:false,errors:["freeze draft 必須是物件"]};
  if(draft.schemaVersion!==1)errors.push("draft schemaVersion 不符");
  if(draft.protocolId!==DRAFT_PROTOCOL_ID)errors.push("draft protocolId 不符");
  for(const field of ["poolId","poolVersion","scoringContractVersion","evidenceTaxonomyVersion"])if(!nonEmpty(draft[field]))errors.push("缺 "+field);
  for(const field of ["frozenAt","frozenBeforeOutcomes",...Object.keys(Eval.REQUIRED_DECLARATIONS)])if(Object.prototype.hasOwnProperty.call(draft,field))errors.push("draft 不得預先指定 "+field);
  if(!Array.isArray(draft.items)||draft.items.length===0)errors.push("draft 至少需要一題");
  const outcomes=outcomeFiles(root);
  if(outcomes.length)errors.push("private outcomes 已存在，禁止事後凍結 evaluation pool");

  const ids=new Set(),paths=new Set(),items=[];
  for(const item of Array.isArray(draft.items)?draft.items:[]){
    if(!item||!nonEmpty(item.itemId)||!nonEmpty(item.relativePath)){errors.push("draft item identity／relativePath 不完整");continue;}
    if(Object.prototype.hasOwnProperty.call(item,"sha256"))errors.push("draft item 不得預先指定 sha256: "+item.itemId);
    if(ids.has(item.itemId))errors.push("重複 itemId: "+item.itemId);ids.add(item.itemId);
    const key=path.normalize(item.relativePath);
    if(paths.has(key))errors.push("多個 item 指向同一 relativePath: "+item.relativePath);paths.add(key);
    const safe=safeFile(root,item.relativePath);
    if(!safe.valid){errors.push(...safe.errors.map(e=>item.itemId+": "+e));continue;}
    items.push({itemId:item.itemId,relativePath:item.relativePath,sha256:sha256(fs.readFileSync(safe.target))});
  }

  const frozenAt=now||new Date().toISOString();
  if(!validTimestamp(frozenAt))errors.push("freeze timestamp 無效");
  if(errors.length)return{valid:false,errors};

  const manifest={
    schemaVersion:1,
    protocolId:Eval.PROTOCOL_ID,
    poolId:draft.poolId,
    poolVersion:draft.poolVersion,
    frozenAt,
    frozenBeforeOutcomes:true,
    ...Eval.REQUIRED_DECLARATIONS,
    scoringContractVersion:draft.scoringContractVersion,
    evidenceTaxonomyVersion:draft.evidenceTaxonomyVersion,
    items
  };
  const verification=Eval.verifyPrivateManifest(manifest,root);
  return{valid:verification.valid,errors:verification.errors,manifest,verification};
}

function writeFrozenManifest({draftPath,privateRoot,outPath}){
  const root=path.resolve(privateRoot||".");
  const draftFile=safeFile(root,path.relative(root,path.resolve(draftPath||"")));
  if(!draftFile.valid)throw new Error("draft 必須是 private root 內的普通檔案："+draftFile.errors.join("; "));
  const out=path.resolve(outPath||"");
  if(!inside(root,out))throw new Error("manifest output 必須位於 private root 內");
  if(fs.existsSync(out))throw new Error("manifest 已存在；frozen pool 不得覆寫");
  const draft=JSON.parse(fs.readFileSync(draftFile.target,"utf8"));
  const frozen=freezePrivateManifest(draft,root);
  if(!frozen.valid)throw new Error(frozen.errors.join("; "));
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(frozen.manifest,null,2)+"\n",{flag:"wx",mode:0o600});
  const persisted=JSON.parse(fs.readFileSync(out,"utf8"));
  const verification=Eval.verifyPrivateManifest(persisted,root);
  if(!verification.valid){fs.rmSync(out,{force:true});throw new Error("寫入後 manifest 驗證失敗："+verification.errors.join("; "));}
  return{
    valid:true,
    protocolId:verification.protocolId,
    poolId:verification.poolId,
    poolVersion:verification.poolVersion,
    itemCount:verification.itemCount,
    manifestFingerprint:verification.manifestFingerprint,
    frozenAt:persisted.frozenAt,
    frozenBeforeOutcomes:persisted.frozenBeforeOutcomes,
    privateDataPersistedToPublicRepo:false
  };
}

function readArg(args,flag){const i=args.indexOf(flag);return i>=0?args[i+1]:null;}

module.exports={DRAFT_PROTOCOL_ID,OUTCOMES_DIR,freezePrivateManifest,writeFrozenManifest};

if(require.main===module){
  const args=process.argv.slice(2);
  try{
    const draftPath=readArg(args,"--draft"),privateRoot=readArg(args,"--private-root"),outPath=readArg(args,"--out");
    if(!draftPath||!privateRoot||!outPath)throw new Error("需要 --draft、--private-root 與 --out");
    const result=writeFrozenManifest({draftPath,privateRoot,outPath});
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
  }catch(error){
    process.stderr.write("無法凍結 private evaluation pool："+error.message+"\n");
    process.exitCode=1;
  }
}
