(function(root,factory){"use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.GoFormalTeachingEvidenceCollector=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
 const PROTOCOL_ID="go-formal-teaching-evidence-v2";
 const R1_CONTENT_FINGERPRINT="fnv1a32-c34ef6a4";
 const CANDIDATE_ID="formal-teaching-candidate-2026-10-07-c";
 const CANDIDATE_FINGERPRINT="fnv1a32-js16-5d0ca9e4";
 const CRITICAL_TASKS=["start_course","complete_board_answer","recover_after_wrong_answer","reload_and_resume","export_learning_data"];
 const TASK_LABELS={start_course:"開始課程",complete_board_answer:"完成棋盤作答",recover_after_wrong_answer:"答錯後自行恢復並繼續",reload_and_resume:"重新整理後繼續",export_learning_data:"匯出學習資料"};
 const ACCESSIBILITY_CHECKS=["keyboard_only","screen_reader_spot_check","zoom_200","viewport_320"];
 const ACCESS_LABELS={keyboard_only:"只用鍵盤完成主要流程",screen_reader_spot_check:"螢幕閱讀器 spot check",zoom_200:"200% 文字縮放",viewport_320:"320px viewport"};
 function lines(value){return String(value||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);}
 function participantTemplate(code){return{participantCode:code,targetNovice:false,tasks:Object.fromEntries(CRITICAL_TASKS.map(task=>[task,false])),blockingIssues:[],evidenceReference:null,candidateId:CANDIDATE_ID,candidateFingerprint:CANDIDATE_FINGERPRINT};}
 function buildEvidence({participants,accessibilityChecks,accessibilityReference,accessibilityBlockingIssues,completedAt=new Date().toISOString()}){
  const normalized=participants.map(p=>({...participantTemplate(p.participantCode),...p,tasks:{...participantTemplate("").tasks,...p.tasks},blockingIssues:Array.isArray(p.blockingIssues)?p.blockingIssues:[]}));
  const allTarget=normalized.length>=3&&normalized.every(p=>p.targetNovice===true);
  const aggregateTasks=Object.fromEntries(CRITICAL_TASKS.map(task=>[task,normalized.length>=3&&normalized.every(p=>p.tasks&&p.tasks[task]===true)]));
  const usabilityBlockers=normalized.reduce((n,p)=>n+p.blockingIssues.length,0);
  const accessibility={...Object.fromEntries(ACCESSIBILITY_CHECKS.map(check=>[check,false])),...(accessibilityChecks||{})};
  return{
   schemaVersion:2,protocolId:PROTOCOL_ID,r1ContentFingerprint:R1_CONTENT_FINGERPRINT,candidateId:CANDIDATE_ID,candidateFingerprint:CANDIDATE_FINGERPRINT,
   usability:{candidateId:CANDIDATE_ID,candidateFingerprint:CANDIDATE_FINGERPRINT,completedAt,participantCount:normalized.length,participantsAreTargetNovices:allTarget,criticalTasks:aggregateTasks,openBlockingIssues:usabilityBlockers,evidenceReference:normalized.every(p=>p.evidenceReference)?`participant-evidence:${normalized.map(p=>p.participantCode).join(",")}`:null,participants:normalized},
   accessibility:{candidateId:CANDIDATE_ID,candidateFingerprint:CANDIDATE_FINGERPRINT,completedAt,checks:accessibility,openBlockingIssues:(accessibilityBlockingIssues||[]).length,evidenceReference:accessibilityReference||null},
   formalEvaluation:{privateUnexposedHoldoutEstablished:false,r1bComparabilityEstablished:false,evidenceReference:null}
  };
 }
 function validateReady(evidence){
  const errors=[],u=evidence.usability,a=evidence.accessibility;
  if(u.participantCount<3)errors.push("至少需要三位參與者");
  if(new Set(u.participants.map(p=>p.participantCode)).size!==u.participants.length||u.participants.some(p=>!p.participantCode))errors.push("participant code 必須非空且唯一");
  for(const p of u.participants){
   if(p.targetNovice!==true)errors.push(`${p.participantCode||"未命名參與者"} 不是已確認 target novice`);
   for(const task of CRITICAL_TASKS)if(!p.tasks[task])errors.push(`${p.participantCode||"未命名參與者"} 未完成 ${TASK_LABELS[task]}`);
   if(p.blockingIssues.length)errors.push(`${p.participantCode||"未命名參與者"} 有 blocking issue`);
   if(!p.evidenceReference)errors.push(`${p.participantCode||"未命名參與者"} 缺 evidence reference`);
  }
  for(const check of ACCESSIBILITY_CHECKS)if(a.checks[check]!==true)errors.push(`accessibility 未通過：${ACCESS_LABELS[check]}`);
  if(a.openBlockingIssues!==0)errors.push("accessibility 有 blocking issue");
  if(!a.evidenceReference)errors.push("accessibility 缺 evidence reference");
  return{ok:errors.length===0,errors};
 }
 function init(document){
  const participants=document.getElementById("participants");if(!participants)return;
  document.getElementById("candidate-id").textContent=CANDIDATE_ID;document.getElementById("candidate-fingerprint").textContent=CANDIDATE_FINGERPRINT;document.getElementById("r1-fingerprint").textContent=R1_CONTENT_FINGERPRINT;
  participants.innerHTML=[1,2,3].map(n=>`<section class="participant" data-index="${n-1}"><h2>Target novice ${n}</h2><label>匿名 participant code<input class="code" type="text" placeholder="例如 novice-0${n}"></label><label class="check"><input class="target" type="checkbox"><span>已確認符合 target novice 定義</span></label><div class="checks">${CRITICAL_TASKS.map(task=>`<label class="check"><input type="checkbox" data-task="${task}"><span>${TASK_LABELS[task]}</span></label>`).join("")}</div><label>證據引用<input class="reference" type="text" placeholder="例如 local-report/novice-0${n}"></label><label>Blocking issues（每行一項；沒有就留空）<textarea class="blockers"></textarea></label></section>`).join("");
  document.getElementById("accessibility-checks").innerHTML=ACCESSIBILITY_CHECKS.map(check=>`<label class="check"><input type="checkbox" data-access="${check}"><span>${ACCESS_LABELS[check]}</span></label>`).join("");
  function collect(){
   const ps=[...participants.querySelectorAll(".participant")].map(section=>({participantCode:section.querySelector(".code").value.trim(),targetNovice:section.querySelector(".target").checked,tasks:Object.fromEntries(CRITICAL_TASKS.map(task=>[task,section.querySelector(`[data-task="${task}"]`).checked])),blockingIssues:lines(section.querySelector(".blockers").value),evidenceReference:section.querySelector(".reference").value.trim()||null,candidateId:CANDIDATE_ID,candidateFingerprint:CANDIDATE_FINGERPRINT}));
   const checks=Object.fromEntries(ACCESSIBILITY_CHECKS.map(check=>[check,document.querySelector(`[data-access="${check}"]`).checked]));
   return buildEvidence({participants:ps,accessibilityChecks:checks,accessibilityReference:document.getElementById("accessibility-reference").value.trim()||null,accessibilityBlockingIssues:lines(document.getElementById("accessibility-blockers").value)});
  }
  function download(payload,name){const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.getElementById("export-draft").addEventListener("click",()=>{download(collect(),"正式教學真人證據草稿.json");document.getElementById("message").textContent="草稿已匯出；草稿內容仍須由 teaching-gate verifier 判定。";});
  document.getElementById("export-final").addEventListener("click",()=>{const evidence=collect(),ready=validateReady(evidence);if(!ready.ok){document.getElementById("message").textContent="尚不能匯出完成回條："+ready.errors.join("；");return;}download(evidence,"正式教學真人證據.json");document.getElementById("message").textContent="完成回條已匯出；請與 R1a、19 課外審回條一起交由 teaching-gate-verify.cjs 驗證。";});
 }
 if(typeof document!=="undefined")document.addEventListener("DOMContentLoaded",()=>init(document));
 return Object.freeze({PROTOCOL_ID,R1_CONTENT_FINGERPRINT,CANDIDATE_ID,CANDIDATE_FINGERPRINT,CRITICAL_TASKS,ACCESSIBILITY_CHECKS,buildEvidence,validateReady,init});
});
