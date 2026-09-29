(function(root){"use strict";

const Go=root.GoCore;
const ReviewEvents=root.GoAdvancedDecisionReviewEvents;
const Events=root.GoAdvancedDecisionReplayEvents;
if(!Go||!ReviewEvents||!Events)return;

const $=(id)=>document.getElementById(id);
const sessionId="decision-replay-session-"+Date.now().toString(36);
let counter=0;
let current=null;
let attemptId=null;
let answers=0;
let revealed=false;
let firstPoint=null;
let firstLegal=null;

function uid(prefix){counter+=1;return prefix+"-"+Date.now().toString(36)+"-"+counter;}
function now(){return new Date().toISOString();}
function samePoint(a,b){return Boolean(a&&b&&a[0]===b[0]&&a[1]===b[1]);}
function stonesFromBoard(board){
 const stones=[];
 if(!Array.isArray(board))return stones;
 board.forEach((row,y)=>Array.isArray(row)&&row.forEach((color,x)=>{if(color===1||color===2)stones.push([x,y,color]);}));
 return stones;
}
function common(queueEvent){
 return{
  eventId:"",
  sessionId,
  replayId:queueEvent.replayId,
  sourceReviewId:queueEvent.sourceReviewId,
  sourceExperienceId:queueEvent.sourceExperienceId,
  sourceExperienceVersion:queueEvent.sourceExperienceVersion,
  sourceId:queueEvent.sourceId,
  sourcePositionVersion:queueEvent.sourcePositionVersion,
  positionFingerprint:queueEvent.positionFingerprint,
  candidateSetVersion:queueEvent.candidateSetVersion,
  sourceScoringContractVersion:queueEvent.sourceScoringContractVersion,
  sourceEvidenceTaxonomyVersion:queueEvent.sourceEvidenceTaxonomyVersion,
  rulesContractVersion:queueEvent.rulesContractVersion,
  replayContractVersion:Events.REPLAY_CONTRACT_VERSION,
  replayScoringContractVersion:Events.REPLAY_SCORING_CONTRACT_VERSION,
  replayEvidenceTaxonomyVersion:Events.REPLAY_EVIDENCE_TAXONOMY_VERSION,
  boardSize:19,
  occurredAt:now()
 };
}
function appendFor(queueEvent,type,extra={}){
 const base=common(queueEvent);
 base.eventId=uid(type);
 return Events.append(localStorage,{...base,type,...extra});
}
function sourceRevealFor(exp){
 const review=ReviewEvents.read(localStorage);
 if(!review.ok)return{ok:false,error:"replay_source_review_store_unavailable"};
 const event=[...review.store.events].reverse().find(item=>
  item.type==="original_revealed"&&
  item.reviewId===exp.id&&
  item.sourceId===exp.source.sourceId&&
  item.positionFingerprint===exp.source.positionFingerprint
 );
 if(!event)return{ok:false,error:"replay_source_not_revealed"};
 if(!samePoint(event.originalMove,exp.originalMove))return{ok:false,error:"replay_source_reveal_mismatch"};
 return{ok:true,event};
}
function queueFromExperience(exp){
 if(!exp||exp.boardSize!==19||!exp.source)return{ok:false,error:"replay_experience_invalid"};
 const sourceReveal=sourceRevealFor(exp);if(!sourceReveal.ok)return sourceReveal;
 const replayId="decision-replay-"+exp.id;
 const existingRead=Events.read(localStorage);
 if(!existingRead.ok)return existingRead;
 const existing=Events.findQueued(existingRead.store,replayId);
 if(existing){renderList();return{ok:true,existing:true,event:existing};}
 const queueEvent={
  ...common({
   replayId,
   sourceReviewId:exp.id,
   sourceExperienceId:exp.id,
   sourceExperienceVersion:exp.version,
   sourceId:exp.source.sourceId,
   sourcePositionVersion:exp.sourcePositionVersion,
   positionFingerprint:exp.source.positionFingerprint,
   candidateSetVersion:exp.candidateSetVersion,
   sourceScoringContractVersion:exp.scoringContractVersion,
   sourceEvidenceTaxonomyVersion:exp.evidenceTaxonomyVersion,
   rulesContractVersion:exp.rulesContractVersion
  }),
  eventId:uid("replay_queued"),
  type:"replay_queued",
  sourceRevealEventId:sourceReveal.event.eventId,
  sourceOriginalExposed:true,
  playerColor:exp.playerColor,
  moveNumber:exp.source.moveNumber,
  nodeIndex:exp.source.nodeIndex,
  stones:exp.stones.map(stone=>stone.slice()),
  koPreviousStones:stonesFromBoard(exp.koPreviousBoard),
  originalMove:exp.originalMove.slice()
 };
 const saved=Events.append(localStorage,queueEvent);
 if(saved.ok)renderList();
 return saved;
}
function renderList(){
 const list=$("decision-replay-list"),summary=$("decision-replay-summary");
 if(!list||!summary)return;
 const r=Events.read(localStorage);
 if(!r.ok){
  summary.textContent="重做清單目前無法讀取。";
  list.innerHTML="";
  return;
 }
 const items=Events.queuedReplays(r.store);
 summary.textContent=items.length?("已保存 "+items.length+" 個已曝光局面；重做仍只算同一局面的練習。"):"尚未加入局面。先完成上方複盤並顯示原棋譜著手，再加入稍後重做。";
 list.innerHTML=items.map(item=>
  '<button type="button" class="decision-replay-item" data-replay-id="'+item.replayId+'">'+
   '<strong>原局第 '+item.moveNumber+' 手 · '+(item.playerColor===1?"黑":"白")+'棋</strong>'+
   '<span>同一局面重做 · 已看過原棋譜著手</span>'+
  '</button>'
 ).join("");
}
function renderBoard(candidate=null,original=null){
 const container=$("decision-replay-board");if(!container||!current)return;
 const size=19,width=570,pad=22,pitch=(width-pad*2)/(size-1);
 const stoneMap=new Map(current.stones.map(([x,y,color])=>[x+","+y,color]));
 const parts=['<svg viewBox="0 0 '+width+' '+width+'" role="img" aria-label="19 路已曝光局面重做棋盤">','<rect class="decision-bg" width="'+width+'" height="'+width+'" rx="10"/>'];
 for(let i=0;i<size;i+=1){
  const q=pad+i*pitch;
  parts.push('<line class="decision-grid" x1="'+pad+'" y1="'+q+'" x2="'+(width-pad)+'" y2="'+q+'"/>');
  parts.push('<line class="decision-grid" x1="'+q+'" y1="'+pad+'" x2="'+q+'" y2="'+(width-pad)+'"/>');
 }
 for(let y=0;y<size;y+=1)for(let x=0;x<size;x+=1){
  const cx=pad+x*pitch,cy=pad+y*pitch,color=stoneMap.get(x+","+y);
  if(color)parts.push('<circle class="'+(color===1?"decision-black":"decision-white")+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.38)+'"/>');
  else if(!revealed)parts.push('<circle class="decision-hit" data-replay-x="'+x+'" data-replay-y="'+y+'" cx="'+cx+'" cy="'+cy+'" r="'+Math.max(7,pitch*.42)+'"/>');
  if(candidate&&candidate[0]===x&&candidate[1]===y)parts.push('<circle class="decision-candidate" cx="'+cx+'" cy="'+cy+'" r="9"/>');
  if(original&&original[0]===x&&original[1]===y)parts.push('<rect class="decision-original" x="'+(cx-9)+'" y="'+(cy-9)+'" width="18" height="18" rx="2"/>');
 }
 parts.push("</svg>");
 container.innerHTML=parts.join("");
}
function startReplay(replayId){
 const r=Events.read(localStorage);
 if(!r.ok)return;
 const item=Events.findQueued(r.store,replayId);if(!item)return;
 const nextAttempt=uid("replay_attempt");
 const presented=appendFor(item,"replay_presented",{attemptId:nextAttempt,originalMove:null,originalExposed:false});
 if(!presented.ok){
  $("decision-replay-feedback").textContent="這次重做無法建立紀錄，因此沒有開始；原本清單仍然保留。";
  return;
 }
 current=item;
 attemptId=nextAttempt;
 answers=0;
 revealed=false;
 firstPoint=null;
 firstLegal=null;
 $("decision-replay-workspace").hidden=false;
 $("decision-replay-reveal").disabled=true;
 $("decision-replay-meta").textContent="原局第 "+item.moveNumber+" 手 · 輪到"+(item.playerColor===1?"黑":"白")+"棋 · 原棋譜著手暫時隱藏";
 $("decision-replay-feedback").textContent="這是你已經看過原棋譜著手的同一局面。先再選一手；這次只是重做同一局面，不會當成新局面表現。";
 renderBoard();
}
function handleBoardClick(event){
 const hit=event.target.closest("[data-replay-x]");
 if(!hit||!current||revealed)return;
 const point=[Number(hit.dataset.replayX),Number(hit.dataset.replayY)];
 const board=Go.boardFromStones(current.stones,19);
 const previousBoard=current.koPreviousStones.length?Go.boardFromStones(current.koPreviousStones,19):null;
 const result=Go.playMove(board,point[0],point[1],current.playerColor,{previousBoard});
 const type=answers===0?"replay_candidate_first":"replay_candidate_retry";
 const saved=appendFor(current,type,{attemptId,point,legal:result.legal,originalMove:null,matchesOriginal:null,originalExposed:false});
 if(!saved.ok){
  $("decision-replay-feedback").textContent="這次選擇無法保存，因此不會被當成首答或重試。";
  return;
 }
 answers+=1;
 if(type==="replay_candidate_first"){
  firstPoint=point.slice();
  firstLegal=result.legal;
  $("decision-replay-reveal").disabled=false;
 }
 renderBoard(point,null);
 $("decision-replay-feedback").textContent=result.legal
  ?"這次候選已保存。你可以顯示原棋譜著手，也可以再想一手。"
  :"這個位置依目前規則不能下；第一次選擇仍已保留，你可以再試另一手。";
}
function revealOriginal(){
 if(!current||!firstPoint||revealed)return;
 const same=samePoint(firstPoint,current.originalMove);
 const saved=appendFor(current,"replay_original_revealed",{attemptId,originalMove:current.originalMove.slice(),firstCandidateMatchesOriginal:same,firstCandidateLegal:firstLegal===true,originalExposed:true});
 if(!saved.ok){
  $("decision-replay-feedback").textContent="原棋譜著手揭露無法保存，因此這次先不顯示。";
  return;
 }
 revealed=true;
 renderBoard(firstPoint,current.originalMove);
 $("decision-replay-reveal").disabled=true;
 $("decision-replay-meta").textContent="原局第 "+current.moveNumber+" 手 · 原棋譜著手已顯示 · 同一局面重做";
 if(firstLegal===false){
  $("decision-replay-feedback").textContent="你的第一次選擇依規則不能下。原棋譜著手已顯示；這仍只是已曝光局面的重做。";
 }else if(same){
  $("decision-replay-feedback").textContent="這次第一候選和原棋譜著手相同。因為這個局面先前已看過原棋譜著手，所以不能把它當成你已會在新局面運用的證據。";
 }else{
  $("decision-replay-feedback").textContent="這次第一候選和原棋譜著手不同。這不是錯手判定；同一局面的重做只用來再次整理你的判斷。";
 }
}

const list=$("decision-replay-list");
if(list)list.addEventListener("click",event=>{const button=event.target.closest("[data-replay-id]");if(button)startReplay(button.dataset.replayId);});
const board=$("decision-replay-board");if(board)board.addEventListener("click",handleBoardClick);
const reveal=$("decision-replay-reveal");if(reveal)reveal.addEventListener("click",revealOriginal);
renderList();

root.GoAdvancedDecisionReplay={queueFromExperience,renderList,startReplay};
})(typeof window!=="undefined"?window:globalThis);
