(function(){
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const labels={w1:'W1 · 入口',w2:'W2 · 找題',w3:'W3 · 作答',w4:'W4 · 揭形',w5:'W5 · 對照',w6:'W6 · 圖鑑'};
  function openView(id,focus=true){
    $$('[data-view-panel]').forEach(panel=>{panel.hidden=panel.id!==id;});
    $$('[role="tab"]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.view===id)));
    $('#review-current').textContent=labels[id];
    if(focus) $(`#tab-${id}`).focus();
  }
  $$('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>openView(tab.dataset.view,false)));
  $$('[data-open-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.openView)));

  const pathCopy={
    vital:['找第一個急所','從可落子的 bounded first-move 題開始；共有 7 組現行入口。'],
    status:['判斷活與死','先看四目眼是否有兩個互不干擾的做眼點；目前是狀態判斷，不要求落子。'],
    read:['讀一小段變化','只進入已由規則重播的三手主要分支與 sealed 條件；未知分支保持未知。'],
    contrast:['混合辨形','交錯兩種既有題族，名稱在回答後才揭示；完成不產生遷移分數。']
  };
  $$('[data-path]').forEach(button=>button.addEventListener('click',()=>{
    $$('[data-path]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
    const [title,copy]=pathCopy[button.dataset.path];$('#path-outcome-title').textContent=title;$('#path-outcome-copy').textContent=copy;
  }));

  const baseCatalog=[
    {id:'straight',type:'vital',shape:'三點直形',title:'三點眼空 · 找中央',scope:'第一手＋相似反例',count:4},
    {id:'bent',type:'vital',shape:'三點 L 形',title:'L 形三點 · 找彎點',scope:'第一手',count:4},
    {id:'four',type:'status',shape:'四點眼空',title:'四目眼 · 判斷狀態',scope:'活／死判斷',count:6},
    {id:'pyramid',type:'vital',shape:'四點 T 形',title:'T 形四點 · 找中心',scope:'第一手',count:4},
    {id:'cross',type:'vital',shape:'五點十字',title:'十字五點 · 找中心',scope:'第一手',count:4},
    {id:'bulky',type:'vital',shape:'五點折形',title:'五點折形 · 找共同急所',scope:'第一手',count:4},
    {id:'read',type:'read',shape:'五點短讀',title:'守方 A／B · 補另一點',scope:'三手主分支',count:3},
    {id:'reduction',type:'read',shape:'五點縮眼',title:'零外氣 · 縮成四目',scope:'限定條件',count:2},
    {id:'flower',type:'vital',shape:'六點眼空',title:'六點結構 · 找共同急所',scope:'第一手',count:4},
    {id:'golden',type:'vital',shape:'雙重氣緊',title:'一路立 · 驗兩側禁入',scope:'規則機制',count:4},
    {id:'pig',type:'vital',shape:'角部來源局面',title:'角部 J 形 · 來源案例',scope:'單一 case 旋轉',count:4},
    {id:'contrast',type:'contrast',shape:'混合五點',title:'兩種五點 · 名稱隱藏',scope:'交錯練習',count:6}
  ];
  let catalogItems=baseCatalog.slice(),catalogFilter='all',catalogPage=0;const pageSize=12;
  const typeName={vital:'找急所',status:'判狀態',read:'短讀',contrast:'混合辨形'};
  function renderCatalog(){
    const matches=catalogItems.filter(item=>catalogFilter==='all'||item.type===catalogFilter);const pages=Math.max(1,Math.ceil(matches.length/pageSize));catalogPage=Math.min(catalogPage,pages-1);const visible=matches.slice(catalogPage*pageSize,(catalogPage+1)*pageSize);
    $('#practice-catalog').innerHTML=visible.map((item,index)=>`<article class="practice-card" data-catalog-id="${item.id}"><div class="card-top"><span>${typeName[item.type]}</span><span>${String(catalogPage*pageSize+index+1).padStart(2,'0')}</span></div><h3>${item.title}</h3><p>${item.shape}；正式名稱依原 reveal policy 顯示。</p><div class="card-foot"><b>${item.scope}</b><span>${item.count} 題</span></div></article>`).join('');
    $$('.practice-card').forEach(card=>{card.tabIndex=0;card.setAttribute('role','button');card.addEventListener('click',()=>openView('w3'));card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openView('w3');}});});
    $('#catalog-result-count').textContent=String(matches.length);$('#catalog-page').textContent=`${String(catalogPage+1).padStart(2,'0')} / ${String(pages).padStart(2,'0')}`;$('#catalog-prev').disabled=catalogPage===0;$('#catalog-next').disabled=catalogPage>=pages-1;$('#catalog-scale-note').textContent=`第 ${catalogPage+1} / ${pages} 頁 · DOM 只保留當頁 ${visible.length} 筆`;
  }
  $$('.filter-chip').forEach(button=>button.addEventListener('click',()=>{catalogFilter=button.dataset.filter;catalogPage=0;$$('.filter-chip').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});renderCatalog();}));
  $('#catalog-prev').addEventListener('click',()=>{catalogPage=Math.max(0,catalogPage-1);renderCatalog();});$('#catalog-next').addEventListener('click',()=>{catalogPage+=1;renderCatalog();});renderCatalog();

  let firstMove=null;
  $$('.intersection-choice').forEach(button=>button.addEventListener('click',()=>{
    if(!firstMove){firstMove=button.dataset.move;button.classList.add('first');$('#first-response').textContent=`${firstMove} · 已保留`;}
    else button.classList.add('retry');
    if(button.dataset.correct==='true'){
      button.classList.add('correct');$('#practice-player').dataset.state='corrected';$('#practice-feedback').innerHTML=firstMove===button.dataset.move?'<b>第一手符合這題的共同急所。</b><br>下一步才會揭示名稱與這個答案能代表的範圍。':'<b>完成修正。</b><br>第一反應仍保留；這次答對不會回寫成首答正確。';$('#practice-next').disabled=false;
    }else{$('#practice-player').dataset.state='retry';$('#practice-feedback').innerHTML='<b>這個點沒有同時接觸最多眼位。</b><br>沿著每個空點數相鄰連接，再試一次。';}
  }));
  $('#practice-hint').addEventListener('click',()=>{$('#practice-feedback').innerHTML='<b>提示：</b>不要看棋盤座標；逐點數它和其他眼位的相鄰連接。';});

  $('#reveal-shape').addEventListener('click',()=>{
    $('#reveal-demo').dataset.revealed='true';$('#revealed-name').textContent='梅花五';$('#revealed-alias').textContent='Cross Five／Crossed Five · 名稱是記憶鉤子，不是 scoring source。';$('#reveal-shape').textContent='名稱與範圍已揭示';$('#reveal-shape').disabled=true;
  });

  $$('[data-contrast-answer]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.contrastAnswer==='correct'){$('#contrast-demo').dataset.answered='true';$('#contrast-demo').classList.add('contrast-demo-complete');$('#contrast-family').textContent='刀把五 · degree-3';$('#contrast-feedback').innerHTML='<span>原題族 contract 回傳</span><b>這一題第一手正確</b><p>現在才揭示：本題是刀把五，轉折中心的 degree=3；下一題會換成不同拓樸。</p>';$('.locked-action').disabled=false;$('.locked-action').textContent='進入下一個中性題號 →';}else{$('#contrast-feedback').innerHTML='<span>原題族 contract 回傳</span><b>這個點不是共同急所</b><p>第一反應已留下；請比較每一點的相鄰數，再試一次。</p>';}
  }));

  const atlasData=[
    {id:'cross',status:'playable',title:'梅花五',alias:'Cross Five · Crossed Five',badge:'已有 bounded 練習',name:'跨語名稱有來源；Evidence Chain 去重。',geometry:'五點十字同構；中心 degree-4。',practice:'只核對第一手共同急所。',warning:'名稱核對不等於完整答案樹或正式評量。'},
    {id:'bent4',status:'reference',title:'盤角曲四',alias:'Bent Four in the Corner · 隅の曲り四目',badge:'規則敏感 · 只供查閱',name:'名稱對照已有來源。',geometry:'角部條件與規則處理必須一起看。',practice:'目前沒有單一固定答案練習。',warning:'未指定規則與 phase 前，不能硬給同一結果。'},
    {id:'carpenter',status:'reference',title:'斗方',alias:"Carpenter's Square · 一合マス · 金櫃角",badge:'變化契約待建立',name:'多個名稱的地區偏好仍未完全解決。',geometry:'已有相關資料；canonical coordinates 尚未升格。',practice:'只供圖鑑查閱。',warning:'名稱相近不代表與 L Group 或小曲尺同一棋形。'},
    {id:'ruler',status:'unknown',title:'小曲尺',alias:'中文候選概念',badge:'棋形仍待核對',name:'歷史資料顯示名稱有多種用法。',geometry:'目前回傳 INSUFFICIENT_GEOMETRY_EVIDENCE。',practice:'不可成為可評分題。',warning:'未知保持未知；不強迫在 L Group 與斗方間二選一。'},
    {id:'lgroup',status:'reference',title:'L Group',alias:'隅のL字型 · 작은 됫박형',badge:'只供查閱',name:'日／韓名稱有來源；未找到固定中文專名。',geometry:'與 Carpenter 只記 related_unresolved。',practice:'目前沒有 rules-backed practice contract。',warning:'「尚未找到」不是「名稱不存在」的證明。'},
    {id:'golden',status:'playable',title:'金雞獨立',alias:'一路立 · double shortage of liberties',badge:'已有規則機制練習',name:'名稱與機制關係分開保存。',geometry:'這是 tesuji mechanism，不是 static nakade。',practice:'驗一路立後兩側皆不能直接下。',warning:'不能與五目中手共用 scorer。'}
  ];
  let atlasFilter='all';
  function renderAtlas(){const query=$('#atlas-search').value.trim().toLowerCase();const matches=atlasData.filter(item=>(atlasFilter==='all'||item.status===atlasFilter)&&(`${item.title} ${item.alias}`.toLowerCase().includes(query)));$('#atlas-results').innerHTML=matches.map((item,index)=>`<button type="button" class="atlas-result ${index===0?'active':''}" data-atlas-id="${item.id}"><span>${item.status==='playable'?'可練':item.status==='unknown'?'待核對':'查閱'}</span><div><b>${item.title}</b><small>${item.alias}</small></div></button>`).join('')||'<p>沒有符合的圖鑑項目。</p>';$$('[data-atlas-id]').forEach(button=>button.addEventListener('click',()=>selectAtlas(button.dataset.atlasId,button)));if(matches[0])selectAtlas(matches[0].id,$('[data-atlas-id]'));}
  function selectAtlas(id,button){const item=atlasData.find(entry=>entry.id===id);if(!item)return;$$('[data-atlas-id]').forEach(node=>node.classList.toggle('active',node===button));$('#atlas-detail-status').textContent=item.badge;$('#atlas-detail-title').textContent=item.title;$('#atlas-detail-alias').textContent=item.alias;$('#atlas-name-state').textContent=item.name;$('#atlas-geometry-state').textContent=item.geometry;$('#atlas-practice-state').textContent=item.practice;$('#atlas-warning span').textContent=item.warning;$('#atlas-practice-link').disabled=item.status!=='playable';$('#atlas-practice-link').textContent=item.status==='playable'?'前往已有練習 →':'目前只供查閱';}
  $('#atlas-search').addEventListener('input',renderAtlas);$$('.atlas-filter').forEach(button=>button.addEventListener('click',()=>{atlasFilter=button.dataset.atlasFilter;$$('.atlas-filter').forEach(node=>{const active=node===button;node.classList.toggle('active',active);node.setAttribute('aria-pressed',String(active));});renderAtlas();}));renderAtlas();
  $('#atlas-results').addEventListener('click',event=>{if(event.target.closest('[data-atlas-id]')&&matchMedia('(max-width: 760px)').matches){$('#atlas-shell').dataset.detailOpen='true';}});
  $('#atlas-back').addEventListener('click',()=>{$('#atlas-shell').dataset.detailOpen='false';requestAnimationFrame(()=>$('#atlas-results .atlas-result.active')?.focus());});

  $('#motion-demo').addEventListener('click',()=>{const target=$('.review-view:not([hidden]) .primary-action:not(:disabled)')||$('.review-view:not([hidden])');target.classList.remove('signature-pulse');void target.offsetWidth;target.classList.add('signature-pulse');});
  window.ClassicCandidate={
    simulateCatalog(count){catalogItems=Array.from({length:count},(_,index)=>({...baseCatalog[index%baseCatalog.length],id:`scale-${index+1}`,title:`呈現壓力測試 ${String(index+1).padStart(3,'0')}`,count:1}));catalogFilter='all';catalogPage=0;renderCatalog();return{total:catalogItems.length,rendered:$$('.practice-card').length,pages:Math.ceil(catalogItems.length/pageSize)};},
    resetCatalog(){catalogItems=baseCatalog.slice();catalogFilter='all';catalogPage=0;renderCatalog();},openView
  };
})();
