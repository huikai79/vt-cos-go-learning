"use strict";
const crypto=require("node:crypto"),fs=require("node:fs"),path=require("node:path");
const PROTOCOL_ID="go-private-unseen-evaluation-v1";
const REQUIRED_DECLARATIONS=Object.freeze({exposureStatus:"never_public_never_presented",useCategory:"independent_evaluation",adaptationPolicy:"no_same_round_updates",qualificationPolicy:"locked_before_outcomes"});
const nonEmpty=v=>typeof v==="string"&&v.trim().length>0, validTimestamp=v=>typeof v==="string"&&Number.isFinite(Date.parse(v));
const sha256=b=>crypto.createHash("sha256").update(b).digest("hex");
function inside(root,target){const r=path.relative(root,target);return r&&!r.startsWith("..")&&!path.isAbsolute(r);}
function verifyPrivateManifest(manifest,privateRoot){
 const errors=[];if(!manifest||typeof manifest!=="object")return{valid:false,errors:["private manifest 必須是物件"]};
 if(manifest.schemaVersion!==1)errors.push("schemaVersion 不符");if(manifest.protocolId!==PROTOCOL_ID)errors.push("protocolId 不符");
 if(!nonEmpty(manifest.poolId)||!nonEmpty(manifest.poolVersion))errors.push("poolId／poolVersion 不完整");
 if(!validTimestamp(manifest.frozenAt))errors.push("frozenAt 必須是有效時間");if(manifest.frozenBeforeOutcomes!==true)errors.push("private pool 必須在看結果前凍結");
 for(const [k,v] of Object.entries(REQUIRED_DECLARATIONS))if(manifest[k]!==v)errors.push(`${k} 必須為 ${v}`);
 if(!nonEmpty(manifest.scoringContractVersion))errors.push("缺 scoringContractVersion");if(!nonEmpty(manifest.evidenceTaxonomyVersion))errors.push("缺 evidenceTaxonomyVersion");
 if(!Array.isArray(manifest.items)||manifest.items.length===0)errors.push("private pool 至少需要一題");
 const root=path.resolve(privateRoot||"."),ids=new Set(),filesSeen=new Set(),verifiedItems=[];
 for(const item of Array.isArray(manifest.items)?manifest.items:[]){
  if(!item||!nonEmpty(item.itemId)||!nonEmpty(item.relativePath)||!/^[a-f0-9]{64}$/.test(String(item.sha256||""))){errors.push("item identity／relativePath／sha256 不完整");continue;}
  if(ids.has(item.itemId))errors.push(`重複 itemId: ${item.itemId}`);ids.add(item.itemId);
  const target=path.resolve(root,item.relativePath);if(!inside(root,target)){errors.push(`private item 路徑逃出 private root: ${item.itemId}`);continue;}
  if(filesSeen.has(target))errors.push(`多個 item 指向同一檔案: ${item.relativePath}`);filesSeen.add(target);
  if(!fs.existsSync(target)){errors.push(`private item 不存在: ${item.itemId}`);continue;}
  const stat=fs.lstatSync(target);if(stat.isSymbolicLink()){errors.push(`private item 不得使用 symbolic link: ${item.itemId}`);continue;}
  if(!stat.isFile()){errors.push(`private item 不是一般檔案: ${item.itemId}`);continue;}
  const realRoot=fs.realpathSync(root),realTarget=fs.realpathSync(target);if(!inside(realRoot,realTarget)){errors.push(`private item real path 逃出 private root: ${item.itemId}`);continue;}
  const actual=sha256(fs.readFileSync(target));if(actual!==item.sha256)errors.push(`private item hash 不符: ${item.itemId}`);
  verifiedItems.push({itemId:item.itemId,relativePath:item.relativePath,sha256:actual});
 }
 const canonical={protocolId:manifest.protocolId,poolId:manifest.poolId,poolVersion:manifest.poolVersion,frozenAt:manifest.frozenAt,frozenBeforeOutcomes:manifest.frozenBeforeOutcomes,...REQUIRED_DECLARATIONS,scoringContractVersion:manifest.scoringContractVersion,evidenceTaxonomyVersion:manifest.evidenceTaxonomyVersion,items:verifiedItems};
 return{valid:errors.length===0&&Array.isArray(manifest.items)&&verifiedItems.length===manifest.items.length,errors,protocolId:manifest.protocolId,poolId:manifest.poolId,poolVersion:manifest.poolVersion,itemCount:verifiedItems.length,manifestFingerprint:sha256(Buffer.from(JSON.stringify(canonical),"utf8"))};
}
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),"utf8"));
module.exports={PROTOCOL_ID,REQUIRED_DECLARATIONS,verifyPrivateManifest};
if(require.main===module){const a=process.argv.slice(2),v=f=>{const i=a.indexOf(f);return i>=0?a[i+1]:null;};try{const m=v("--manifest"),r=v("--private-root");if(!m||!r)throw new Error("需要 --manifest 與 --private-root");const out=verifyPrivateManifest(readJson(m),r);process.stdout.write(JSON.stringify(out,null,2)+"\n");if(!out.valid)process.exitCode=1;}catch(e){process.stderr.write("無法驗證 private evaluation pool："+e.message+"\n");process.exitCode=2;}}
