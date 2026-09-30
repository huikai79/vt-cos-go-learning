(function(root){"use strict";

const Go=root.GoCore,Contract=root.GoAdvancedEnclosureComparableContract,Events=root.GoAdvancedEnclosureComparableEvents,Policy=root.GoAdvancedEnclosureComparablePolicy;
if(!Go||!Contract||!Events||!Policy)return;
const $=id=>document.getElementById(id);
const sessionId="enclosure-comparable-session-"+Date.now().toString(36);
let counter=0,currentItem=null,presentationId=null,decisionIndex=0,responseCounts=[0,0],firstCorrect=[null,null],board=null,timingMeta=null,cursor=[9,9];

function uid(prefix){counter+=1;return prefix+"-"+Date.now().toString(36)+"-"+counter;}
function nowMs(){return Date.now();}
function iso(ms){return new Date(ms).toISOString();}
function cloneBoard(value){return value.map(row=>row.slice());}
function boardFromItem(item){return Go.boardFromStones(item.stones,item.boardSize);}
function timingForEvent(ms){
 if(!currentItem||currentItem.minimumDelayMs===0)return{anchorEventId:null,anchorOccurredAt:null,dueAt:null,actualDelayMs:0};
 return{anchorEventId:timingMeta.anchorEventId,anchorOccurredAt:timingMeta.anchorOccurredAt,dueAt:timingMeta.dueAt,actualDelayMs:ms-Date.parse(timingMeta.anchorOccurredAt)};
}
function base(type,extra={}){
 const ms=nowMs(),timing=timingForEvent(ms);
 return{eventId:uid(type),sessionId,presentationId,itemId:currentItem.itemId,occurredAt:iso(ms),type,decisionIndex:null,point:null,legal:null,correct:null,hintUsed:false,eligibilityDeclaredBeforeResponse:false,hintAvailable:false,forced:false,decisionFirstCorrect:null,decisionAttempts:null,eventualCorrect:null,...timing,...extra};
}
function append(type,extra={}){return Events.append(localStorage,base(type,extra));}
function applyCanonicalCutAndExtension(){
 const initial=boardFromItem(currentItem);
 const cut=Go.playMove(initial,currentItem.cutMove[0],currentItem.cutMove[1],currentItem.playerColor);
 if(!cut.legal)return false;
 const opponent=currentItem.playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
 const ext=Go.playMove(cut.board,currentItem.forcedExtension[0],currentItem.forcedExtension[1],opponent,{previousBoard:initial});
 if(!ext.legal)return false;
 board=ext.board;return true;
}
function itemLabel(item){
 if(item.role==="practice")return"練習局面";
 if(item.role==="process_check")return"換個局面再判斷";
 if(item.role==="delayed_24h_process_check")return"隔一天再換局面";
 return"隔七天再換局面";
}
function formatWhen(value){try{return new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}catch{return String(value);}}
function statusText(status){
 if(!status.ok)return"目前無法判定是否可開始。";
 if(status.status===Policy.STATUS.LOCKED)return"先完成前一個局面。";
 if(status.status===Policy.STATUS.WAITING_FOR_DELAY)return"還沒到時間；"+formatWhen(status.dueAt)+" 之後再回來。";
 if(status.status===Policy.STATUS.READY)return"可以開始。";
 if(status.status===Policy.STATUS.IN_PROGRESS)return"已開始，繼續完成。";
 if(status.status===Policy.STATUS.COMPLETED)return"已完成。";
 return"目前無法判定是否可開始。";
}
function renderBoard(mark=null){
 const container=$("enclosure-comparable-board");if(!container||!currentItem||!board)return;
 const n=19,w=570,pad=22,pitch=(w-pad*2)/(n-1),parts=['<svg viewBox="0 0 '+w+' '+w+'" role="img" aria-label="19 路包圍吃子全盤棋盤">','<rect class="decision-bg" width="'+w+'" height="'+w+'" rx="10"/>'];
 for(let i=0;i<n;i++){const q=pad+i*pitch;parts.push('<line class="decision-grid" x1="'+pad+'" y1="'+q+'" x2="'+(w-pad)+'" y2="'+q+'"/>','<line class="decision-grid" x1="'+q+'" y1="'+pad+'" x2="'+q+'" y2="'+(w-pad)+'"/>');}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const cx=pad+x*pitch,cy=pad+y*pitch,color=board[y][x];
  if(color)parts.push('<circle class="'+(color===Go.BLACK?"decision-black":"decision-white")+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.38)+'"/>');
  else parts.push('<circle class="decision-hit" data-enclosure-x="'+x+'" data-enclosure-y="'+y+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.42)+'"/>');
  if(mark&&mark[0]===x&&mark[1]===y)parts.push('<circle class="decision-candidate" cx="'+cx+'" cy="'+cy+'" r="9"/>');
 }
 const [cx,cy]=cursor,kx=pad+cx*pitch,ky=pad+cy*pitch;parts.push('<circle class="advanced-comparable-cursor" cx="'+kx+'" cy="'+ky+'" r="12"/>',"</svg>");
 container.innerHTML=parts.join("");
}
function readStore(){const r=Events.read(localStorage);return r.ok?r.store:null;}
function renderList(){
 const list=$("enclosure-comparable-list"),summary=$("enclosure-comparable-summary");if(!list||!summary)return;
 const store=readStore();if(!store){list.innerHTML="";summary.textContent="目前無法讀取包圍吃子練習紀錄。";return;}
 const rows=[];let completed=0;
 for(const item of Contract.orderedItems()){
  const status=Policy.statusFor(store,item,nowMs());if(status.ok&&status.status===Policy.STATUS.COMPLETED)completed++;
  const disabled=!(status.ok&&[Policy.STATUS.READY,Policy.STATUS.IN_PROGRESS].includes(status.status));
  rows.push('<button type="button" class="decision-replay-item" data-enclosure-item="'+item.itemId+'" '+(disabled?'disabled':'')+'><strong>'+itemLabel(item)+'</strong><span>'+statusText(status)+'</span></button>');
 }
 list.innerHTML=rows.join("");summary.textContent=completed?("已完成 "+completed+" / 4 個局面。"):"尚未開始這組多手全盤判斷。";
}
function restore(item,store){
 const events=Events.eventsForItem(store,item.itemId),presented=events.find(e=>e.type==="enclosure_presented");if(!presented)return false;
 currentItem=item;presentationId=presented.presentationId;timingMeta={anchorEventId:presented.anchorEventId,anchorOccurredAt:presented.anchorOccurredAt,dueAt:presented.dueAt};
 const opponent=events.find(e=>e.type==="enclosure_opponent_move");
 decisionIndex=opponent?1:0;
 responseCounts=[0,1].map(d=>events.filter(e=>["enclosure_move_first","enclosure_move_retry"].includes(e.type)&&e.decisionIndex===d).length);
 firstCorrect=[0,1].map(d=>{const e=events.find(e=>e.type==="enclosure_move_first"&&e.decisionIndex===d);return e?e.correct:null;});
 board=boardFromItem(item);if(opponent&&!applyCanonicalCutAndExtension())return false;
 return true;
}
function begin(item){
 const store=readStore();if(!store)return;
 const status=Policy.statusFor(store,item,nowMs());if(!status.ok)return;
 if(status.status===Policy.STATUS.IN_PROGRESS){
  if(!restore(item,store))return;
 }else if(status.status===Policy.STATUS.READY){
  currentItem=item;presentationId=uid("enclosure-presentation");decisionIndex=0;responseCounts=[0,0];firstCorrect=[null,null];board=boardFromItem(item);cursor=[9,9];
  timingMeta=status.presentationMetadata||{anchorEventId:null,anchorOccurredAt:null,dueAt:null};
  const shown=append("enclosure_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false});if(!shown.ok)return;
  const decision=append("enclosure_decision_presented",{decisionIndex:0});if(!decision.ok)return;
 }else return;
 $("enclosure-comparable-workspace").hidden=false;
 $("enclosure-comparable-role").textContent=itemLabel(item);
 $("enclosure-comparable-side").textContent=(item.playerColor===Go.BLACK?"黑":"白")+"棋下";
 $("enclosure-comparable-prompt").textContent=item.prompt;
 $("enclosure-comparable-feedback").textContent=responseCounts[decisionIndex]
  ?"繼續完成這一步；第一次作答已保存，不會因重試改寫。"
  :decisionIndex===0?"第一步先找切斷點。":"對方已沿唯一一口氣延長；現在找第二手完成局部提子。";
 $("enclosure-comparable-next").disabled=true;renderBoard();renderList();
}
function handlePoint(point){
 if(!currentItem||!board)return;
 const score=decisionIndex===0?Contract.scoreCut(currentItem,point):Contract.scoreFinish(currentItem,point);
 const type=responseCounts[decisionIndex]===0?"enclosure_move_first":"enclosure_move_retry";
 const saved=append(type,{decisionIndex,point:point.slice(),legal:score.legal,correct:score.correct,hintUsed:false});if(!saved.ok){$("enclosure-comparable-feedback").textContent="這次落子沒有成功保存。";return;}
 if(responseCounts[decisionIndex]===0)firstCorrect[decisionIndex]=score.correct;responseCounts[decisionIndex]+=1;
 renderBoard(point);
 if(!score.correct){
  $("enclosure-comparable-feedback").textContent=score.legal?"這手可以下，但還沒有完成目前這一步的棋盤條件。第一次作答已保存，可以再找。":(score.reason||"這手依目前規則不能下；第一次作答仍已保存。");
  return;
 }
 if(decisionIndex===0){
  const initial=boardFromItem(currentItem),cut=Go.playMove(initial,currentItem.cutMove[0],currentItem.cutMove[1],currentItem.playerColor),opponent=currentItem.playerColor===Go.BLACK?Go.WHITE:Go.BLACK;
  const ext=Go.playMove(cut.board,currentItem.forcedExtension[0],currentItem.forcedExtension[1],opponent,{previousBoard:initial});
  if(!cut.legal||!ext.legal){$("enclosure-comparable-feedback").textContent="規則重播失敗，這題暫停。";return;}
  const forced=append("enclosure_opponent_move",{decisionIndex:0,point:currentItem.forcedExtension.slice(),forced:true});if(!forced.ok)return;
  board=ext.board;decisionIndex=1;
  const nextDecision=append("enclosure_decision_presented",{decisionIndex:1});if(!nextDecision.ok)return;
  $("enclosure-comparable-feedback").textContent="你先切斷了連接。對方只有一口氣可以延長；現在再下第二手完成局部提子。";renderBoard();return;
 }
 const state=Contract.boardAfterForcedExtension(currentItem),finish=Go.playMove(state.board,currentItem.finishMove[0],currentItem.finishMove[1],currentItem.playerColor,{previousBoard:state.previousBoard});
 if(!finish.legal){$("enclosure-comparable-feedback").textContent="規則重播失敗，這題暫停。";return;}
 board=finish.board;
 const completed=append("enclosure_completed",{decisionFirstCorrect:[firstCorrect[0]===true,firstCorrect[1]===true],decisionAttempts:responseCounts.slice(),eventualCorrect:true});if(!completed.ok)return;
 $("enclosure-comparable-feedback").textContent="兩步都完成：先切斷援兵，再利用對方唯一延長後仍只剩一氣的局面完成提子。這仍只是公開練習／流程檢查。";
 $("enclosure-comparable-next").disabled=false;renderBoard(currentItem.finishMove);renderList();
}
function next(){
 const store=readStore();if(!store)return;const found=Policy.nextAvailable(store,nowMs());
 if(found.ok&&found.item)begin(found.item);else{currentItem=null;$("enclosure-comparable-workspace").hidden=true;renderList();}
}
$("enclosure-comparable-list").addEventListener("click",event=>{const button=event.target.closest("[data-enclosure-item]");if(button&&!button.disabled){const item=Contract.itemById(button.dataset.enclosureItem);if(item)begin(item);}});
$("enclosure-comparable-board").addEventListener("click",event=>{const hit=event.target.closest("[data-enclosure-x]");if(hit)handlePoint([Number(hit.dataset.enclosureX),Number(hit.dataset.enclosureY)]);});
$("enclosure-comparable-board").addEventListener("keydown",event=>{if(!currentItem)return;let[x,y]=cursor,handled=true;if(event.key==="ArrowLeft")x=Math.max(0,x-1);else if(event.key==="ArrowRight")x=Math.min(18,x+1);else if(event.key==="ArrowUp")y=Math.max(0,y-1);else if(event.key==="ArrowDown")y=Math.min(18,y+1);else if(event.key==="Enter"||event.key===" "){handlePoint(cursor.slice());}else handled=false;if(handled){event.preventDefault();cursor=[x,y];renderBoard();}});
$("enclosure-comparable-next").addEventListener("click",next);
renderList();
root.GoAdvancedEnclosureComparable={renderList,begin};
})(typeof window!=="undefined"?window:globalThis);
