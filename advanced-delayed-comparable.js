(function(root){"use strict";

const Go=root.GoCore;
const ComparableEvents=root.GoAdvancedComparablePositionEvents;
const Contract=root.GoAdvancedDelayedComparableContract;
const Events=root.GoAdvancedDelayedComparableEvents;
const Policy=root.GoAdvancedDelayedComparablePolicy;
if(!Go||!ComparableEvents||!Contract||!Events||!Policy)return;

const $=(id)=>document.getElementById(id);
const sessionId="delayed-comparable-session-"+Date.now().toString(36);
let counter=0;
let currentItem=null;
let attemptId=null;
let responseCount=0;
let firstCorrect=null;
let cursor=[9,9];
let presentationMeta=null;

function uid(prefix){counter+=1;return prefix+"-"+Date.now().toString(36)+"-"+counter;}
function iso(ms){return new Date(ms).toISOString();}
function nowMs(){return Date.now();}
function boardMap(item){return new Map(item.stones.map(([x,y,c])=>[x+","+y,c]));}
function formatWhen(value){
 try{return new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
 catch{return String(value);}
}
function common(item,occurredMs){
 return{
  eventId:"",
  sessionId,
  attemptId,
  itemId:item.itemId,
  itemVersion:item.itemVersion,
  pairId:item.pairId,
  pairVersion:item.pairVersion,
  pairHypothesisVersion:item.pairHypothesisVersion,
  anchorItemId:item.anchorItemId,
  anchorEventId:presentationMeta.anchorEventId,
  anchorOccurredAt:presentationMeta.anchorOccurredAt,
  dueAt:presentationMeta.dueAt,
  positionFingerprint:item.positionFingerprint,
  kcHypothesisId:item.kcHypothesisId,
  kcHypothesisVersion:item.kcHypothesisVersion,
  scoringContractVersion:item.scoringContractVersion,
  evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,
  retrievalPolicyVersion:item.retrievalPolicyVersion,
  minimumDelayMs:item.minimumDelayMs,
  actualDelayMs:occurredMs-Date.parse(presentationMeta.anchorOccurredAt),
  occurredAt:iso(occurredMs)
 };
}
function append(type,extra={}){
 const occurredMs=nowMs();
 const base=common(currentItem,occurredMs);
 base.eventId=uid(type);
 return Events.append(localStorage,{...base,type,...extra});
}
function renderBoard(mark=null){
 const container=$("delayed-comparable-board");if(!container||!currentItem)return;
 const n=19,w=570,pad=22,pitch=(w-pad*2)/(n-1),map=boardMap(currentItem),parts=[];
 parts.push('<svg viewBox="0 0 '+w+' '+w+'" role="img" aria-label="19 路延後全盤判斷棋盤">','<rect class="decision-bg" width="'+w+'" height="'+w+'" rx="10"/>');
 for(let i=0;i<n;i++){const q=pad+i*pitch;parts.push('<line class="decision-grid" x1="'+pad+'" y1="'+q+'" x2="'+(w-pad)+'" y2="'+q+'"/>','<line class="decision-grid" x1="'+q+'" y1="'+pad+'" x2="'+q+'" y2="'+(w-pad)+'"/>');}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const cx=pad+x*pitch,cy=pad+y*pitch,color=map.get(x+","+y);
  if(color)parts.push('<circle class="'+(color===1?"decision-black":"decision-white")+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.38)+'"/>');
  else parts.push('<circle class="decision-hit" data-delayed-x="'+x+'" data-delayed-y="'+y+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.42)+'"/>');
  if(mark&&mark[0]===x&&mark[1]===y)parts.push('<circle class="decision-candidate" cx="'+cx+'" cy="'+cy+'" r="9"/>');
 }
 const [cx,cy]=cursor,kx=pad+cx*pitch,ky=pad+cy*pitch;
 parts.push('<circle class="advanced-comparable-cursor" cx="'+kx+'" cy="'+ky+'" r="12"/>');
 parts.push("</svg>");
 container.innerHTML=parts.join("");
}
function readStores(){
 const comparable=ComparableEvents.read(localStorage);
 const delayed=Events.read(localStorage);
 if(!comparable.ok||!delayed.ok)return{ok:false};
 return{ok:true,comparable:comparable.store,delayed:delayed.store};
}
function statusText(status){
 if(status.status===Policy.STATUS.WAITING_FOR_ANCHOR)return"先完成前面的不同局面檢查。";
 if(status.status===Policy.STATUS.WAITING_FOR_DELAY)return"還沒到時間；"+formatWhen(status.dueAt)+" 之後再回來。";
 if(status.status===Policy.STATUS.WAITING_FOR_PREVIOUS)return"時間條件已記錄；先完成前一個延後局面。";
 if(status.status===Policy.STATUS.DUE)return"已到時間，可以開始。";
 if(status.status===Policy.STATUS.IN_PROGRESS)return"已開始，繼續完成這個局面。";
 if(status.status===Policy.STATUS.COMPLETED)return"已完成。";
 return"目前無法判定這題是否可開始。";
}
function render(){
 const list=$("delayed-comparable-list"),summary=$("delayed-comparable-summary");
 if(!list||!summary)return;
 const stores=readStores();
 if(!stores.ok){summary.textContent="目前無法讀取延後練習紀錄。";list.innerHTML="";return;}
 const rows=[];
 let dueCount=0,completedCount=0,waitingCount=0;
 for(const item of Contract.items){
  const status=Policy.statusForItem(stores.comparable,stores.delayed,item,nowMs());
  if(status.ok&&status.status===Policy.STATUS.DUE)dueCount++;
  if(status.ok&&status.status===Policy.STATUS.COMPLETED)completedCount++;
  if(status.ok&&[Policy.STATUS.WAITING_FOR_ANCHOR,Policy.STATUS.WAITING_FOR_DELAY,Policy.STATUS.WAITING_FOR_PREVIOUS].includes(status.status))waitingCount++;
  const disabled=!(status.ok&&[Policy.STATUS.DUE,Policy.STATUS.IN_PROGRESS].includes(status.status));
  rows.push('<button type="button" class="decision-replay-item" data-delayed-item="'+item.itemId+'" '+(disabled?'disabled':'')+'>'+
    '<strong>延後局面 '+(rows.length+1)+'</strong><span>'+statusText(status)+'</span></button>');
 }
 list.innerHTML=rows.join("");
 summary.textContent=completedCount===Contract.items.length
  ?"兩個延後局面都已完成。"
  :dueCount>0
   ?"有 "+dueCount+" 個延後局面現在可以做。"
   :waitingCount>0
    ?"延後局面會在前一個檢查完成至少 24 小時後開放。"
    :"目前沒有可開始的延後局面。";
}
function restoreOrStart(item){
 const stores=readStores();if(!stores.ok)return;
 const status=Policy.statusForItem(stores.comparable,stores.delayed,item,nowMs());
 if(!status.ok){$("delayed-comparable-feedback").textContent="這題的時間紀錄目前不一致，因此不開始。";return;}
 if(status.status===Policy.STATUS.IN_PROGRESS){
  const active=Events.activeAttempt(stores.delayed,item.itemId);
  if(!active)return;
  currentItem=item;attemptId=active.attemptId;presentationMeta={
   anchorEventId:active.presented.anchorEventId,
   anchorOccurredAt:active.presented.anchorOccurredAt,
   dueAt:active.presented.dueAt,
   minimumDelayMs:active.presented.minimumDelayMs
  };
  responseCount=active.responses.length;
  firstCorrect=active.responses.length?active.responses[0].correct:null;
 }else if(status.status===Policy.STATUS.DUE){
  currentItem=item;attemptId=uid("delayed-attempt");responseCount=0;firstCorrect=null;
  presentationMeta=status.presentationMetadata;
  const occurred=nowMs();
  const base=common(item,occurred);base.eventId=uid("delayed_presented");
  const saved=Events.append(localStorage,{...base,type:"delayed_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
  if(!saved.ok){$("delayed-comparable-feedback").textContent="這題無法建立作答紀錄，所以暫時不開始。";return;}
 }else return;

 cursor=[9,9];
 $("delayed-comparable-workspace").hidden=false;
 $("delayed-comparable-side").textContent=(item.playerColor===1?"黑":"白")+"棋下";
 $("delayed-comparable-prompt").textContent=item.prompt;
 $("delayed-comparable-feedback").textContent=responseCount
   ?"繼續完成這個局面。第一次作答已經保存，不會因重試而改寫。"
   :"這個局面和前面不同，而且已經隔了一段時間。先自己掃描全盤，再直接落子。";
 $("delayed-comparable-next").disabled=true;
 renderBoard();
 render();
}
function handlePoint(point){
 if(!currentItem)return;
 const score=Contract.scoreResponse(currentItem,point);
 const type=responseCount===0?"delayed_first":"delayed_retry";
 const saved=append(type,{point:point.slice(),legal:score.legal,correct:score.correct,hintUsed:false});
 if(!saved.ok){$("delayed-comparable-feedback").textContent="這次落子沒有成功保存，請不要把它當成已記錄的作答。";return;}
 if(responseCount===0)firstCorrect=score.correct;
 responseCount+=1;
 renderBoard(point);
 if(score.correct){
  const completed=append("delayed_completed",{firstCorrect:firstCorrect===true,eventualCorrect:true,attempts:responseCount});
  if(!completed.ok){$("delayed-comparable-feedback").textContent="這手已解除危險，但完成紀錄沒有成功保存。";return;}
  $("delayed-comparable-feedback").textContent="這手讓那串棋脫離立即被提的危險。這次紀錄會保留實際相隔時間與第一次作答，但仍只是公開的延後再判。";
  $("delayed-comparable-next").disabled=false;
  render();
  return;
 }
 $("delayed-comparable-feedback").textContent=score.legal
  ?"這手可以下，但那串棋仍處在只剩一氣的立即危險中。第一次作答已保存，可以再找。"
  :(score.reason||"這手依目前規則不能下；第一次作答仍已保存，可以再試。");
}
function nextDue(){
 const stores=readStores();if(!stores.ok)return;
 const next=Contract.items.find(item=>{
  const status=Policy.statusForItem(stores.comparable,stores.delayed,item,nowMs());
  return status.ok&&[Policy.STATUS.DUE,Policy.STATUS.IN_PROGRESS].includes(status.status);
 });
 if(next)restoreOrStart(next);
 else{
  currentItem=null;$("delayed-comparable-workspace").hidden=true;render();
 }
}

$("delayed-comparable-list").addEventListener("click",event=>{const button=event.target.closest("[data-delayed-item]");if(button&&!button.disabled){const item=Contract.itemById(button.dataset.delayedItem);if(item)restoreOrStart(item);}});
$("delayed-comparable-board").addEventListener("click",event=>{const hit=event.target.closest("[data-delayed-x]");if(hit)handlePoint([Number(hit.dataset.delayedX),Number(hit.dataset.delayedY)]);});
$("delayed-comparable-board").addEventListener("keydown",event=>{
 if(!currentItem)return;
 let [x,y]=cursor,handled=true;
 if(event.key==="ArrowLeft")x=Math.max(0,x-1);else if(event.key==="ArrowRight")x=Math.min(18,x+1);else if(event.key==="ArrowUp")y=Math.max(0,y-1);else if(event.key==="ArrowDown")y=Math.min(18,y+1);else if(event.key==="Enter"||event.key===" "){handlePoint(cursor.slice());}else handled=false;
 if(handled){event.preventDefault();cursor=[x,y];renderBoard();}
});
$("delayed-comparable-next").addEventListener("click",nextDue);

render();
root.GoAdvancedDelayedComparable={render,restoreOrStart};
})(typeof window!=="undefined"?window:globalThis);
