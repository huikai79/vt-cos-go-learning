(function(root){"use strict";
 const Exporter=root.GoAdvancedEvidenceExport;
 if(!Exporter)return;
 const button=document.getElementById("advanced-export-evidence");
 const status=document.getElementById("advanced-export-status");
 if(!button)return;

 function download(text,filename){
  const blob=new Blob([text],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 button.addEventListener("click",()=>{
  try{
   const bundle=Exporter.buildBundle(localStorage);
   download(JSON.stringify(bundle,null,2),"悟之一手_進階練習原始事件.json");
   if(status){
    status.textContent=bundle.complete
     ?"已匯出進階練習原始事件。這份檔案只作備份與分析，不代表正式評量。"
     :"已匯出目前可讀取的進階資料，但部分事件流損壞或無法分析；請保留這份檔案，錯誤已明列在 errors。";
   }
  }catch(error){
   if(status)status.textContent="目前無法建立進階練習備份；既有本機資料沒有被修改。";
  }
 });
})(typeof window!=="undefined"?window:globalThis);
