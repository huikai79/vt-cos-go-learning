(function(root){"use strict";

const Go=root.GoCore;
const Contract=root.GoAdvancedComparablePositionContract;
const Events=root.GoAdvancedComparablePositionEvents;
if(!Go||!Contract||!Events)return;

const $=(id)=>document.getElementById(id);
const sessionId="comparable-session-"+Date.now().toString(36);
let counter=0;
let currentItem=null;
let attemptId=null;
let responseCount=0;
let firstCorrect=null;
let cursor=[9,9];

function uid(prefix){counter+=1;return prefix+"-"+Date.now().toString(36)+"-"+counter;}
function now(){return new Date().toISOString();}
function common(item){
 return{
  eventId:"",
  sessionId,
  attemptId,
  pairId:item.pairId,
  pairVersion:item.pairVersion,
  pairHypothesisVersion:item.pairHypothesisVersion,
  itemId:item.itemId,
  itemVersion:item.itemVersion,
  itemRole:item.role,
  positionFingerprint:item.positionFingerprint,
  scoringContractVersion:item.scoringContractVersion,
  evidenceTaxonomyVersion:item.evidenceTaxonomyVersion,
  selectionPolicyVersion:item.pairPolicyVersion,
  occurredAt:now()
 };
}
function append(type,extra={}){
 const base=common(currentItem);base.eventId=uid(type);
 return Events.append(localStorage,{...base,type,...extra});
}
function boardMap(item){return new Map(item.stones.map(([x,y,c])=>[x+","+y,c]));}
function renderBoard(mark=null){
 const container=$("comparable-board");if(!container||!currentItem)return;
 const n=19,w=570,pad=22,pitch=(w-pad*2)/(n-1),map=boardMap(currentItem),parts=[];
 parts.push('<svg viewBox="0 0 '+w+' '+w+'" role="img" aria-label="19 路全盤判斷棋盤">','<rect class="decision-bg" width="'+w+'" height="'+w+'" rx="10"/>');
 for(let i=0;i<n;i++){const q=pad+i*pitch;parts.push('<line class="decision-grid" x1="'+pad+'" y1="'+q+'" x2="'+(w-pad)+'" y2="'+q+'"/>','<line class="decision-grid" x1="'+q+'" y1="'+pad+'" x2="'+q+'" y2="'+(w-pad)+'"/>');}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const cx=pad+x*pitch,cy=pad+y*pitch,color=map.get(x+","+y);
  if(color)parts.push('<circle class="'+(color===1?"decision-black":"decision-white")+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.38)+'"/>');
  else parts.push('<circle class="decision-hit" data-comparable-x="'+x+'" data-comparable-y="'+y+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.42)+'"/>');
  if(mark&&mark[0]===x&&mark[1]===y)parts.push('<circle class="decision-candidate" cx="'+cx+'" cy="'+cy+'" r="9"/>');
 }
 const [cx,cy]=cursor;const kx=pad+cx*pitch,ky=pad+cy*pitch;
 parts.push('<circle class="advanced-comparable-cursor" cx="'+kx+'" cy="'+ky+'" r="12"/>');
 parts.push("</svg>");
 container.innerHTML=parts.join("");
}
function statusLabel(item){return item.role==="practice"?"練習局面":"換個局面再判斷";}
function renderProgress(){
 const r=Events.read(localStorage),summary=$("comparable-summary"),list=$("comparable-list");
 if(!r.ok){summary.textContent="目前無法讀取這區的練習紀錄。";list.innerHTML="";return;}
 const done=Events.completedItemIds(r.store);
 const items=Contract.itemOrder();
 summary.textContent=done.size?("已完成 "+done.size+" / "+items.length+" 個全盤判斷局面。"):"尚未開始這組全盤判斷。";
 list.innerHTML=items.map((item,index)=>{
  const completed=done.has(item.itemId),locked=index>0&&!done.has(items[index-1].itemId);
  return '<button type="button" class="decision-replay-item" data-comparable-item="'+item.itemId+'" '+(locked?'disabled':'')+'>'+
   '<strong>局面 '+(index+1)+' · '+statusLabel(item)+'</strong>'+
   '<span>'+(completed?"已完成":locked?"完成前一題後開放":"可以開始")+'</span>'+
  '</button>';
 }).join("");
}
function startItem(itemId){
 const item=Contract.itemById(itemId);if(!item)return;
 const r=Events.read(localStorage);if(!r.ok)return;
 const order=Contract.itemOrder(),index=order.findIndex(x=>x.itemId===itemId);
 if(index>0&&!Events.completedItemIds(r.store).has(order[index-1].itemId))return;
 currentItem=item;attemptId=uid("comparable-attempt");responseCount=0;firstCorrect=null;cursor=[9,9];
 const presented=append("comparable_presented",{eligibilityDeclaredBeforeResponse:true,hintAvailable:false});
 if(!presented.ok){$("comparable-feedback").textContent="這題無法建立作答紀錄，所以暫時不開始。";return;}
 $("comparable-workspace").hidden=false;
 $("comparable-role").textContent=statusLabel(item);
 $("comparable-side").textContent=(item.playerColor===1?"黑":"白")+"棋下";
 $("comparable-prompt").textContent=item.prompt;
 $("comparable-feedback").textContent="先自己掃描全盤，再直接落子。這裡只判斷是否解除立即被提的危險，不判斷全盤最佳手。";
 $("comparable-next").disabled=true;
 renderBoard();
}
function handlePoint(point){
 if(!currentItem)return;
 const score=Contract.scoreResponse(currentItem,point);
 const type=responseCount===0?"comparable_first":"comparable_retry";
 const saved=append(type,{point:point.slice(),legal:score.legal,correct:score.correct,hintUsed:false});
 if(!saved.ok){$("comparable-feedback").textContent="這次落子沒有成功保存，請不要把它當成已記錄的作答。";return;}
 if(responseCount===0)firstCorrect=score.correct;
 responseCount+=1;
 renderBoard(point);
 if(score.correct){
  const completed=append("comparable_completed",{firstCorrect:firstCorrect===true,eventualCorrect:true,attempts:responseCount});
  if(!completed.ok){$("comparable-feedback").textContent="這手已解除危險，但完成紀錄沒有成功保存。";return;}
  $("comparable-feedback").textContent=currentItem.role==="process_check"
   ?"這手讓那串棋脫離只剩一氣的危險。這是公開的新局面檢查，只用來觀察你能否在不同盤面再次找到同一類處理。"
   :"這手讓那串棋脫離只剩一氣的危險。先記住判斷順序：找唯一只剩一氣的己方棋串，再看哪一手能讓它增加到至少兩氣。";
  $("comparable-next").disabled=false;
  renderProgress();
  return;
 }
 if(!score.legal){
  $("comparable-feedback").textContent=score.reason||"這手依目前規則不能下；第一次作答仍已保存，可以再試。";
 }else{
  $("comparable-feedback").textContent="這手可以下，但那串棋仍處在只剩一氣的立即危險中。第一次作答已保存，你可以再找。";
 }
}
function next(){
 const r=Events.read(localStorage);if(!r.ok)return;
 const item=Events.nextItem(r.store);
 if(item)startItem(item.itemId);
 else{
  currentItem=null;
  $("comparable-workspace").hidden=true;
  $("comparable-summary").textContent="這組全盤判斷已完成。公開題只記為練習或換形再判，不會被當成正式未見評量。";
 }
}
$("comparable-list").addEventListener("click",event=>{const button=event.target.closest("[data-comparable-item]");if(button&&!button.disabled)startItem(button.dataset.comparableItem);});
$("comparable-board").addEventListener("click",event=>{const hit=event.target.closest("[data-comparable-x]");if(hit)handlePoint([Number(hit.dataset.comparableX),Number(hit.dataset.comparableY)]);});
$("comparable-board").addEventListener("keydown",event=>{
 if(!currentItem)return;
 let [x,y]=cursor,handled=true;
 if(event.key==="ArrowLeft")x=Math.max(0,x-1);else if(event.key==="ArrowRight")x=Math.min(18,x+1);else if(event.key==="ArrowUp")y=Math.max(0,y-1);else if(event.key==="ArrowDown")y=Math.min(18,y+1);else if(event.key==="Enter"||event.key===" "){handlePoint(cursor.slice());}else handled=false;
 if(handled){event.preventDefault();cursor=[x,y];renderBoard();}
});
$("comparable-next").addEventListener("click",next);

renderProgress();
root.GoAdvancedComparablePosition={startItem,renderProgress};
})(typeof window!=="undefined"?window:globalThis);
