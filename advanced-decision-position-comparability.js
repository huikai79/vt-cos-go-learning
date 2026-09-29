(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.GoAdvancedDecisionPositionComparability=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="advanced-decision-position-comparability-v1";
  const RELATION=Object.freeze({
    SAME_POSITION:"SAME_POSITION",
    SURFACE_EQUIVALENT:"SURFACE_EQUIVALENT",
    DISTINCT_UNCLASSIFIED:"DISTINCT_UNCLASSIFIED",
    INVALID:"INVALID"
  });
  const TRANSFER_LEVEL=Object.freeze({T0:"T0",T1:"T1"});

  function fail(...errors){
    return{ok:false,relation:RELATION.INVALID,transferLevel:null,errors:errors.flat().filter(Boolean),eligibleForT2:false,needsFamilyContract:false};
  }
  function pointOk(p,n){
    return Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<n&&p[1]>=0&&p[1]<n;
  }
  function normalizeStones(stones,n){
    if(!Array.isArray(stones))return{ok:false,error:"stones must be an array"};
    const seen=new Set(),out=[];
    for(const s of stones){
      if(!Array.isArray(s)||s.length!==3||![1,2].includes(s[2])||!pointOk(s.slice(0,2),n))return{ok:false,error:"stone invalid"};
      const key=s[0]+","+s[1];
      if(seen.has(key))return{ok:false,error:"stone overlap"};
      seen.add(key);out.push([s[0],s[1],s[2]]);
    }
    out.sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2]);
    return{ok:true,stones:out};
  }
  function validatePosition(p){
    if(!p||typeof p!=="object")return fail("position missing");
    const n=p.boardSize;
    if(!Number.isInteger(n)||n<2||n>52)return fail("boardSize invalid");
    if(![1,2].includes(p.playerColor))return fail("playerColor invalid");
    if(typeof p.rulesContractVersion!=="string"||!p.rulesContractVersion)return fail("rulesContractVersion missing");
    const current=normalizeStones(p.stones,n);if(!current.ok)return fail(current.error);
    const ko=normalizeStones(p.koPreviousStones||[],n);if(!ko.ok)return fail("koPreviousStones invalid");
    return{ok:true,position:{boardSize:n,playerColor:p.playerColor,rulesContractVersion:p.rulesContractVersion,stones:current.stones,koPreviousStones:ko.stones}};
  }
  function transformPoint([x,y],n,index){
    const m=n-1;
    switch(index){
      case 0:return[x,y];
      case 1:return[m-y,x];
      case 2:return[m-x,m-y];
      case 3:return[y,m-x];
      case 4:return[m-x,y];
      case 5:return[x,m-y];
      case 6:return[y,x];
      case 7:return[m-y,m-x];
      default:return null;
    }
  }
  function transformStones(stones,n,index,colorSwap){
    return stones.map(([x,y,c])=>{
      const p=transformPoint([x,y],n,index);
      return[p[0],p[1],colorSwap?(c===1?2:1):c];
    }).sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2]);
  }
  function sameArray(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function exactSame(a,b){
    return a.boardSize===b.boardSize
      &&a.playerColor===b.playerColor
      &&a.rulesContractVersion===b.rulesContractVersion
      &&sameArray(a.stones,b.stones)
      &&sameArray(a.koPreviousStones,b.koPreviousStones);
  }
  function compare(sourceInput,candidateInput){
    const sa=validatePosition(sourceInput);if(!sa.ok)return sa;
    const cb=validatePosition(candidateInput);if(!cb.ok)return cb;
    const a=sa.position,b=cb.position;
    if(a.boardSize!==b.boardSize)return fail("boardSize mismatch");
    if(a.rulesContractVersion!==b.rulesContractVersion)return fail("rules contract mismatch");

    if(exactSame(a,b)){
      return{
        ok:true,relation:RELATION.SAME_POSITION,transferLevel:TRANSFER_LEVEL.T0,
        transform:{symmetry:"identity",colorSwap:false},
        eligibleForT2:false,needsFamilyContract:false,errors:[]
      };
    }

    for(let symmetry=0;symmetry<8;symmetry+=1){
      for(const colorSwap of [false,true]){
        const player=colorSwap?(a.playerColor===1?2:1):a.playerColor;
        if(player!==b.playerColor)continue;
        const stones=transformStones(a.stones,a.boardSize,symmetry,colorSwap);
        const ko=transformStones(a.koPreviousStones,a.boardSize,symmetry,colorSwap);
        if(sameArray(stones,b.stones)&&sameArray(ko,b.koPreviousStones)){
          return{
            ok:true,relation:RELATION.SURFACE_EQUIVALENT,transferLevel:TRANSFER_LEVEL.T1,
            transform:{symmetry,colorSwap},
            eligibleForT2:false,needsFamilyContract:false,errors:[]
          };
        }
      }
    }

    return{
      ok:true,relation:RELATION.DISTINCT_UNCLASSIFIED,transferLevel:null,
      transform:null,eligibleForT2:false,needsFamilyContract:true,errors:[],
      reason:"different_position_requires_versioned_family_or_kc_contract"
    };
  }

  return Object.freeze({
    version:VERSION,RELATION,TRANSFER_LEVEL,compare,validatePosition,transformPoint
  });
});
