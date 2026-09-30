(function(root){"use strict";

const Go=root.GoCore;
const Framework=root.GoAdvancedComparableFrameworkV2;
const Events=root.GoAdvancedComparableEventsV2;
const DelayedEvents=root.GoAdvancedDelayedComparableEventsV2;
const DelayedPolicy=root.GoAdvancedDelayedComparablePolicyV2;
if(!Go||!Framework||!Events||!DelayedEvents||!DelayedPolicy)return;

const $=(id)=>document.getElementById(id);
const sessionId="comparable-v2-session-"+Date.now().toString(36);
let counter=0;
let currentItem=null;
let currentMode=null;
let attemptId=null;
let responseCount=0;
let firstCorrect=null;
let cursor=[9,9];
let delayedMeta=null;

function uid(prefix){counter+=1;return prefix+"-"+Date.now().toString(36)+"-"+counter;}
function nowMs(){return Date.now();}
function iso(ms){return new Date(ms).toISOString();}
function formatWhen(value){
 try{return new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
 catch{return String(value);}
}
function boardMap(item){return new Map(item.stones.map(([x,y,c])=>[x+","+y,c]));}
function renderBoard(mark=null){
 const container=$("comparable-v2-board");if(!container||!currentItem)return;
 const n=19,w=570,pad=22,pitch=(w-pad*2)/(n-1),map=boardMap(currentItem),parts=[];
 parts.push('<svg viewBox="0 0 '+w+' '+w+'" role="img" aria-label="19 路全盤判斷棋盤">','<rect class="decision-bg" width="'+w+'" height="'+w+'" rx="10"/>');
 for(let i=0;i<n;i++){const q=pad+i*pitch;parts.push('<line class="decision-grid" x1="'+pad+'" y1="'+q+'" x2="'+(w-pad)+'" y2="'+q+'"/>','<line class="decision-grid" x1="'+q+'" y1="'+pad+'" x2="'+q+'" y2="'+(w-pad)+'"/>');}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const cx=pad+x*pitch,cy=pad+y*pitch,color=map.get(x+","+y);
  if(color)parts.push('<circle class="'+(color===1?"decision-black":"decision-white")+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.38)+'"/>');
  else parts.push('<circle class="decision-hit" data-comparable-v2-x="'+x+'" data-comparable-v2-y="'+y+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.42)+'"/>');
  if(mark&&mark[0]===x&&mark[1]===y)parts.push('<circle class="decision-candidate" cx="'+cx+'" cy="'+cy+'" r="9"/>');
 }
 const [cx,cy]=cursor,kx=pad+cx*pitch,ky=pad+cy*pitch;
 parts.push('<circle class="advanced-comparable-cursor" cx="'+kx+'" cy="'+ky+'" r="12"/>');
 parts.push("</svg>");
 container.innerHTML=parts.join("");
}
function readStores(){
 const immediate=Events.read(localStorage),delayed=DelayedEvents.read(localStorage);
 return immediate.ok&&delayed.ok?{ok:true,immediate:immediate.store,delayed:delayed.store}:{ok:false};
}
function itemLabel(item){
 if(item.role==="practice")return"練習局面";
 if(item.role==="process_check")return"換個局面再判斷";
 return"隔一天再換局面";
}
function delayedStatusText(status){
 if(!status.ok)return"目前無法判定是否可開始。";
 if(status.status===DelayedPolicy.STATUS.WAITING_FOR_ANCHOR)return"先完成前面的新局面檢查。";
 if(status.status===DelayedPolicy.STATUS.WAITING_FOR_DELAY)return"還沒到時間；"+formatWhen(status.dueAt)+" 之後再回來。";
 if(status.status===DelayedPolicy.STATUS.DUE)return"已到時間，可以開始。";
 if(status.status===DelayedPolicy.STATUS.IN_PROGRESS)return"已開始，繼續完成這個局面。";
 if(status.status===DelayedPolicy.STATUS.COMPLETED)return"已完成。";
 return"目前無法判定是否可開始。";
}
function renderList(){
 const list=$("comparable-v2-list"),summary=$("comparable-v2-summary");
 if(!list||!summary)return;
 const stores=readStores();
 if(!stores.ok){list.innerHTML="";summary.textContent="目前無法讀取這組練習紀錄。";return;}
 const immediate=Framework.immediateItems(),done=Events.completedItemIds(stores.immediate),rows=[];
 immediate.forEach((item,index)=>{
  const locked=index>0&&!done.has(immediate[index-1].itemId);
  rows.push('<button type="button" class="decision-replay-item" data-comparable-v2-item="'+item.itemId+'" '+(locked?'disabled':'')+'>'+
    '<strong>局面 '+(index+1)+' · '+itemLabel(item)+'</strong>'+
    '<span>'+(done.has(item.itemId)?"已完成":locked?"完成前一題後開放":"可以開始")+'</span></button>');
 });
 const delayed=Framework.delayedItems()[0];
 const dstatus=DelayedPolicy.statusFor(stores.immediate,stores.delayed,delayed?nowMs():0);
 if(delayed){
  const disabled=!(dstatus.ok&&[DelayedPolicy.STATUS.DUE,DelayedPolicy.STATUS.IN_PROGRESS].includes(dstatus.status));
  rows.push('<button type="button" class="decision-replay-item" data-comparable-v2-delayed="'+delayed.itemId+'" '+(disabled?'disabled':'')+'>'+
   '<strong>局面 3 · '+itemLabel(delayed)+'</strong><span>'+delayedStatusText(dstatus)+'</span></button>');
 }
 list.innerHTML=rows.join("");
 const completed=done.size+(dstatus.ok&&dstatus.status===DelayedPolicy.STATUS.COMPLETED?1:0);
 summary.textContent=completed?("已完成 "+completed+" / 3 個局面。"):"尚未開始這組全盤判斷。";
 if(root.GoAdvancedSevenDayComparable&&typeof root.GoAdvancedSevenDayComparable.render==="function")root.GoAdvancedSevenDayComparable.render();
}
function showWorkspace(item,mode){
 currentItem=item;currentMode=mode;cursor=[9,9];
 $("comparable-v2-workspace").hidden=false;
 $("comparable-v2-role").textContent=itemLabel(item);
 $("comparable-v2-side").textContent=(item.playerColor===Go.BLACK?"黑":"白")+"棋下";
 $("comparable-v2-prompt").textContent=item.prompt;
 $("comparable-v2-feedback").textContent=mode==="delayed"
  ?"這是新的全盤局面，而且已經和前一次檢查隔了一段時間。先自己掃描，再直接落子。"
  :"先自己掃描全盤，再直接落子；完成前不會顯示這類棋形的名稱。";
 $("comparable-v2-next").disabled=true;
 renderBoard();
}
function startImmediate(item){
 const stores=readStores();if(!stores.ok)return;
 const active=Events.activeAttempt(stores.immediate,item.itemId);
 if(active){
  attemptId=active.attemptId;responseCount=active.responses.length;firstCorrect=active.responses.length?active.responses[0].correct:null;
  showWorkspace(item,"immediate");
  $("comparable-v2-feedback").textContent=responseCount?"繼續完成這個局面；第一次作答已保存，不會因重試改寫。":"先自己掃描全盤，再直接落子。";
  return;
 }
 attemptId=uid("comparable-v2-attempt");responseCount=0;firstCorrect=null;
 const saved=Events.append(localStorage,{eventId:uid("comparable_presented"),sessionId,attemptId,itemId:item.itemId,itemVersion:item.itemVersion,occurredAt:iso(nowMs()),type:"comparable_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 if(!saved.ok){$("comparable-v2-feedback").textContent="這題無法建立作答紀錄，所以暫時不開始。";return;}
 showWorkspace(item,"immediate");renderList();
}
function startDelayed(item){
 const stores=readStores();if(!stores.ok)return;
 const status=DelayedPolicy.statusFor(stores.immediate,stores.delayed,nowMs());
 if(!status.ok)return;
 const active=DelayedEvents.activeAttempt(stores.delayed);
 if(active){
  attemptId=active.attemptId;responseCount=active.responses.length;firstCorrect=active.responses.length?active.responses[0].correct:null;
  delayedMeta={anchorEventId:active.presented.anchorEventId,anchorOccurredAt:active.presented.anchorOccurredAt,dueAt:active.presented.dueAt,minimumDelayMs:active.presented.minimumDelayMs};
  showWorkspace(item,"delayed");
  $("comparable-v2-feedback").textContent=responseCount?"繼續完成這個局面；第一次作答已保存，不會因重試改寫。":"這是新的延後局面。先自己掃描，再直接落子。";
  return;
 }
 if(status.status!==DelayedPolicy.STATUS.DUE)return;
 attemptId=uid("comparable-v2-delayed-attempt");responseCount=0;firstCorrect=null;delayedMeta=status.presentationMetadata;
 const ms=nowMs();
 const saved=DelayedEvents.append(localStorage,{
  eventId:uid("delayed_presented"),sessionId,attemptId,itemId:item.itemId,
  anchorEventId:delayedMeta.anchorEventId,anchorOccurredAt:delayedMeta.anchorOccurredAt,dueAt:delayedMeta.dueAt,
  minimumDelayMs:delayedMeta.minimumDelayMs,actualDelayMs:ms-Date.parse(delayedMeta.anchorOccurredAt),
  occurredAt:iso(ms),type:"delayed_presented",eligibilityDeclaredBeforeResponse:true,hintAvailable:false
 });
 if(!saved.ok){$("comparable-v2-feedback").textContent="這題無法建立延後作答紀錄，所以暫時不開始。";return;}
 showWorkspace(item,"delayed");renderList();
}
function appendImmediate(type,extra){
 return Events.append(localStorage,{eventId:uid(type),sessionId,attemptId,itemId:currentItem.itemId,itemVersion:currentItem.itemVersion,occurredAt:iso(nowMs()),type,...extra});
}
function appendDelayed(type,extra){
 const ms=nowMs();
 return DelayedEvents.append(localStorage,{
  eventId:uid(type),sessionId,attemptId,itemId:currentItem.itemId,
  anchorEventId:delayedMeta.anchorEventId,anchorOccurredAt:delayedMeta.anchorOccurredAt,dueAt:delayedMeta.dueAt,
  minimumDelayMs:delayedMeta.minimumDelayMs,actualDelayMs:ms-Date.parse(delayedMeta.anchorOccurredAt),
  occurredAt:iso(ms),type,...extra
 });
}
function handlePoint(point){
 if(!currentItem)return;
 const score=Framework.scoreResponse(currentItem.familyId,currentItem,point);
 const first=responseCount===0,type=currentMode==="delayed"?(first?"delayed_first":"delayed_retry"):(first?"comparable_first":"comparable_retry");
 const saved=currentMode==="delayed"
  ?appendDelayed(type,{point:point.slice(),legal:score.legal,correct:score.correct,hintUsed:false})
  :appendImmediate(type,{point:point.slice(),legal:score.legal,correct:score.correct,hintUsed:false});
 if(!saved.ok){$("comparable-v2-feedback").textContent="這次落子沒有成功保存，請不要把它當成已記錄的作答。";return;}
 if(first)firstCorrect=score.correct;
 responseCount+=1;renderBoard(point);
 if(score.correct){
  const completed=currentMode==="delayed"
   ?appendDelayed("delayed_completed",{firstCorrect:firstCorrect===true,eventualCorrect:true,attempts:responseCount})
   :appendImmediate("comparable_completed",{firstCorrect:firstCorrect===true,eventualCorrect:true,attempts:responseCount});
  if(!completed.ok){$("comparable-v2-feedback").textContent="這手符合條件，但完成紀錄沒有成功保存。";return;}
  $("comparable-v2-feedback").textContent=currentMode==="delayed"
   ?"這一手讓兩串彼此分開的棋同時各只剩一氣。這種結構常稱「雙打吃」。這次只保留延後流程檢查紀錄，不作正式能力判定。"
   :"這一手讓兩串彼此分開的棋同時各只剩一氣，而且沒有立即提子。這種結構常稱「雙打吃」。";
  $("comparable-v2-next").disabled=false;renderList();return;
 }
 if(!score.legal){
  $("comparable-v2-feedback").textContent=score.reason||score.error||"這手依目前規則不能下；第一次作答仍已保存，可以再試。";
 }else if(score.error==="immediate_capture_not_allowed"){
  $("comparable-v2-feedback").textContent="這手直接提子了；本題要找的是不立即提子、卻同時讓兩串棋各只剩一氣的一手。第一次作答已保存。";
 }else if(score.newlyAtariCount===3){
  $("comparable-v2-feedback").textContent="這手同時壓到三串棋，不是本題設定的兩串結構。第一次作答已保存，可以再找。";
 }else{
  $("comparable-v2-feedback").textContent="這手沒有同時讓恰好兩串彼此分開的棋各只剩一氣。第一次作答已保存，可以再找。";
 }
}
function next(){
 const stores=readStores();if(!stores.ok)return;
 const nextImmediate=Events.nextItem(stores.immediate);
 if(nextImmediate){startImmediate(nextImmediate);return;}
 const delayed=Framework.delayedItems()[0],status=DelayedPolicy.statusFor(stores.immediate,stores.delayed,nowMs());
 if(delayed&&status.ok&&[DelayedPolicy.STATUS.DUE,DelayedPolicy.STATUS.IN_PROGRESS].includes(status.status)){startDelayed(delayed);return;}
 currentItem=null;$("comparable-v2-workspace").hidden=true;renderList();
}

$("comparable-v2-list").addEventListener("click",event=>{
 const immediate=event.target.closest("[data-comparable-v2-item]");
 if(immediate&&!immediate.disabled){const item=Framework.itemById(immediate.dataset.comparableV2Item);if(item)startImmediate(item);return;}
 const delayed=event.target.closest("[data-comparable-v2-delayed]");
 if(delayed&&!delayed.disabled){const item=Framework.itemById(delayed.dataset.comparableV2Delayed);if(item)startDelayed(item);}
});
$("comparable-v2-board").addEventListener("click",event=>{const hit=event.target.closest("[data-comparable-v2-x]");if(hit)handlePoint([Number(hit.dataset.comparableV2X),Number(hit.dataset.comparableV2Y)]);});
$("comparable-v2-board").addEventListener("keydown",event=>{
 if(!currentItem)return;
 let [x,y]=cursor,handled=true;
 if(event.key==="ArrowLeft")x=Math.max(0,x-1);else if(event.key==="ArrowRight")x=Math.min(18,x+1);else if(event.key==="ArrowUp")y=Math.max(0,y-1);else if(event.key==="ArrowDown")y=Math.min(18,y+1);else if(event.key==="Enter"||event.key===" "){handlePoint(cursor.slice());}else handled=false;
 if(handled){event.preventDefault();cursor=[x,y];renderBoard();}
});
$("comparable-v2-next").addEventListener("click",next);

renderList();
root.GoAdvancedComparableV2={renderList,startImmediate,startDelayed};
})(typeof window!=="undefined"?window:globalThis);
