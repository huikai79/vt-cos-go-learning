const test=require("node:test");
const assert=require("node:assert/strict");
const C=require("../advanced-decision-position-comparability.js");

function pos(overrides={}){
  return{
    boardSize:19,
    playerColor:1,
    rulesContractVersion:"go-core-simple-ko-v1",
    stones:[[3,3,1],[4,3,2],[10,8,1]],
    koPreviousStones:[[3,3,1],[4,3,2]],
    ...overrides
  };
}
function transformPosition(p,symmetry,colorSwap=false){
  const swap=c=>colorSwap?(c===1?2:1):c;
  return{
    boardSize:p.boardSize,
    playerColor:swap(p.playerColor),
    rulesContractVersion:p.rulesContractVersion,
    stones:p.stones.map(([x,y,c])=>{const q=C.transformPoint([x,y],p.boardSize,symmetry);return[q[0],q[1],swap(c)];}),
    koPreviousStones:p.koPreviousStones.map(([x,y,c])=>{const q=C.transformPoint([x,y],p.boardSize,symmetry);return[q[0],q[1],swap(c)];})
  };
}

test("exact same position 只能是 T0",()=>{
  const r=C.compare(pos(),pos());
  assert.equal(r.ok,true);
  assert.equal(r.relation,C.RELATION.SAME_POSITION);
  assert.equal(r.transferLevel,"T0");
  assert.equal(r.eligibleForT2,false);
});

test("旋轉、鏡射與同步換色只分類為 T1",()=>{
  for(let symmetry=0;symmetry<8;symmetry+=1){
    const transformed=transformPosition(pos(),symmetry,symmetry%2===1);
    const r=C.compare(pos(),transformed);
    if(symmetry===0){
      assert.equal(r.relation,C.RELATION.SAME_POSITION);
      assert.equal(r.transferLevel,"T0");
    }else{
      assert.equal(r.relation,C.RELATION.SURFACE_EQUIVALENT);
      assert.equal(r.transferLevel,"T1");
    }
    assert.equal(r.eligibleForT2,false);
  }
});

test("不同棋形不得自動升成 T2，只能 DISTINCT_UNCLASSIFIED",()=>{
  const different=pos({stones:[[3,3,1],[4,3,2],[11,8,1]]});
  const r=C.compare(pos(),different);
  assert.equal(r.ok,true);
  assert.equal(r.relation,C.RELATION.DISTINCT_UNCLASSIFIED);
  assert.equal(r.transferLevel,null);
  assert.equal(r.needsFamilyContract,true);
  assert.equal(r.eligibleForT2,false);
});

test("ko 前局面不同時不得因目前 stones 相同而算 T0/T1",()=>{
  const differentKo=pos({koPreviousStones:[[3,3,1]]});
  const r=C.compare(pos(),differentKo);
  assert.equal(r.relation,C.RELATION.DISTINCT_UNCLASSIFIED);
  assert.equal(r.transferLevel,null);
});

test("只換棋色但沒有同步換 player 與 stones 不得算表面等價",()=>{
  const broken=pos({playerColor:2});
  const r=C.compare(pos(),broken);
  assert.equal(r.relation,C.RELATION.DISTINCT_UNCLASSIFIED);
});

test("rules contract 不一致時 fail closed，不做跨規則可比性推論",()=>{
  const r=C.compare(pos(),pos({rulesContractVersion:"other-rules-v1"}));
  assert.equal(r.ok,false);
  assert.equal(r.relation,C.RELATION.INVALID);
  assert.match(r.errors.join(" "),/rules contract mismatch/);
});

test("壞 snapshot fail closed",()=>{
  const overlap=pos({stones:[[3,3,1],[3,3,2]]});
  assert.equal(C.compare(pos(),overlap).ok,false);
  const badColor=pos({playerColor:3});
  assert.equal(C.compare(pos(),badColor).ok,false);
});
