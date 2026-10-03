(function(root){"use strict";
const Go=root.GoCore,Contract=root.GoAdvancedSevenDayComparableContract,Events=root.GoAdvancedSevenDayComparableEvents,Policy=root.GoAdvancedSevenDayComparablePolicy,Immediate=root.GoAdvancedComparableEventsV2,Delayed24=root.GoAdvancedDelayedComparableEventsV2;
if(!Go||!Contract||!Events||!Policy||!Immediate||!Delayed24)return;
const $=id=>document.getElementById(id);
const sessionId="seven-day-comparable-session-"+Date.now().toString(36);
let counter=0,attemptId=null,responseCount=0,firstCorrect=null,cursor=[9,9],timingMeta=null;
function uid(prefix){counter+=1;return prefix+"-"+Date.now().toString(36)+"-"+counter;}
function nowMs(){return Date.now();}
function iso(ms){return new Date(ms).toISOString();}
function readStores(){const i=Immediate.read(localStorage),d=Delayed24.read(localStorage),s=Events.read(localStorage);return i.ok&&d.ok&&s.ok?{ok:true,immediate:i.store,delayed24:d.store,seven:s.store}:{ok:false};}
function formatWhen(v){try{return new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v));}catch{return String(v);}}
function statusText(status){
 if(!status.ok)return"目前無法判定是否可開始。";
 if(status.status===Policy.STATUS.WAITING_FOR_ANCHOR)return"先完成前面的不同局面檢查。";
 if(status.status===Policy.STATUS.WAITING_FOR_24H)return"先完成至少隔一天的新局面檢查。";
 if(status.status===Policy.STATUS.WAITING_FOR_DELAY)return"還沒到七天；"+formatWhen(status.dueAt)+" 之後再回來。";
 if(status.status===Policy.STATUS.DUE)return"已到七天，可以開始。";
 if(status.status===Policy.STATUS.IN_PROGRESS)return"已開始，繼續完成。";
 if(status.status===Policy.STATUS.COMPLETED)return"已完成。";
 return"目前無法判定是否可開始。";
}
function renderBoard(mark=null){
 const item=Contract.item,container=$("seven-day-comparable-board");if(!container)return;
 const board=Go.boardFromStones(item.stones,19),n=19,w=570,pad=22,pitch=(w-pad*2)/(n-1),parts=['<svg viewBox="0 0 '+w+' '+w+'" role="img" aria-label="19 路七天後全盤判斷棋盤">','<rect class="decision-bg" width="'+w+'" height="'+w+'" rx="10"/>'];
 for(let i=0;i<n;i++){const q=pad+i*pitch;parts.push('<line class="decision-grid" x1="'+pad+'" y1="'+q+'" x2="'+(w-pad)+'" y2="'+q+'"/>','<line class="decision-grid" x1="'+q+'" y1="'+pad+'" x2="'+q+'" y2="'+(w-pad)+'"/>');}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const cx=pad+x*pitch,cy=pad+y*pitch,color=board[y][x];if(color)parts.push('<circle class="'+(color===Go.BLACK?"decision-black":"decision-white")+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.38)+'"/>');else parts.push('<circle class="decision-hit" data-seven-day-x="'+x+'" data-seven-day-y="'+y+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.42)+'"/>');if(mark&&mark[0]===x&&mark[1]===y)parts.push('<circle class="decision-candidate" cx="'+cx+'" cy="'+cy+'" r="9"/>');}
 const [cx,cy]=cursor,kx=pad+cx*pitch,ky=pad+cy*pitch;parts.push('<circle class="advanced-comparable-cursor" cx="'+kx+'" cy="'+ky+'" r="12"/>',"</svg>");container.innerHTML=parts.join("");
}
function render(){
 const stores=readStores(),button=$("seven-day-comparable-start"),summary=$("seven-day-comparable-summary");if(!button||!summary)return;
 if(!stores.ok){button.disabled=true;summary.textContent="目前無法讀取七天後練習紀錄。";return;}
 const status=Policy.statusFor(stores.immediate,stores.delayed24,stores.seven,nowMs());
 button.disabled=!(status.ok&&[Policy.STATUS.DUE,Policy.STATUS.IN_PROGRESS].includes(status.status));button.textContent=status.status===Policy.STATUS.IN_PROGRESS?"繼續七天後局面":"開始七天後局面";
 summary.textContent=statusText(status);
}
function common(type,extra={}){
 const ms=nowMs();return{eventId:uid(type),sessionId,attemptId,itemId:Contract.item.itemId,anchorEventId:timingMeta.anchorEventId,anchorOccurredAt:timingMeta.anchorOccurredAt,dueAt:timingMeta.dueAt,minimumDelayMs:Contract.MIN_DELAY_MS,actualDelayMs:ms-Date.parse(timingMeta.anchorOccurredAt),occurredAt:iso(ms),type,...extra};
}
function begin(){
 const stores=readStores();if(!stores.ok)return;const status=Policy.statusFor(stores.immediate,stores.delayed24,stores.seven,nowMs());if(!status.ok)return;
 const active=Events.activeAttempt(stores.seven);
 if(active){attemptId=active.attemptId;responseCount=active.responses.length;firstCorrect=active.responses.length?active.responses[0].correct:null;timingMeta={anchorEventId:active.presented.anchorEventId,anchorOccurredAt:active.presented.anchorOccurredAt,dueAt:active.presented.dueAt};}
 else if(status.status===Policy.STATUS.DUE){attemptId=uid("seven-day-attempt");responseCount=0;firstCorrect=null;timingMeta=status.presentationMetadata;const saved=Events.append(localStorage,common("seven_day_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false}));if(!saved.ok)return;}else return;
 $("seven-day-comparable-workspace").hidden=false;$("seven-day-comparable-prompt").textContent=Contract.item.prompt;$("seven-day-comparable-feedback").textContent=responseCount?"繼續完成這個局面；第一次作答已保存。":"這是新的七天後局面。先自己掃描全盤，再直接落子。";renderBoard();render();
}
function handle(point){
 if(!attemptId)return;const score=Contract.scoreResponse(point),type=responseCount===0?"seven_day_first":"seven_day_retry";
 const saved=Events.append(localStorage,common(type,{point:point.slice(),legal:score.legal,correct:score.correct,hintUsed:false}));if(!saved.ok){$("seven-day-comparable-feedback").textContent="這次落子沒有成功保存。";return;}
 if(responseCount===0)firstCorrect=score.correct;responseCount+=1;renderBoard(point);
 if(score.correct){const done=Events.append(localStorage,common("seven_day_completed",{firstCorrect:firstCorrect===true,eventualCorrect:true,attempts:responseCount}));if(!done.ok)return;$("seven-day-comparable-feedback").textContent="這手同時限制了兩串棋。系統保留七天後的實際相隔時間與第一次作答；這仍是公開延後再判。";render();return;}
 $("seven-day-comparable-feedback").textContent=score.legal?"這手可以下，但沒有同時讓恰好兩串分離的對方棋各只剩一口氣。第一次作答已保存，可以再找。":(score.reason||"這手依目前規則不能下。");
}
$("seven-day-comparable-start").addEventListener("click",begin);
$("seven-day-comparable-board").addEventListener("click",event=>{const hit=event.target.closest("[data-seven-day-x]");if(hit)handle([Number(hit.dataset.sevenDayX),Number(hit.dataset.sevenDayY)]);});
$("seven-day-comparable-board").addEventListener("keydown",event=>{let[x,y]=cursor,handled=true;if(event.key==="ArrowLeft")x=Math.max(0,x-1);else if(event.key==="ArrowRight")x=Math.min(18,x+1);else if(event.key==="ArrowUp")y=Math.max(0,y-1);else if(event.key==="ArrowDown")y=Math.min(18,y+1);else if(event.key==="Enter"||event.key===" "){handle(cursor.slice());}else handled=false;if(handled){event.preventDefault();cursor=[x,y];renderBoard();}});
render();
root.GoAdvancedSevenDayComparable={render,begin};
})(typeof window!=="undefined"?window:globalThis);
