const test=require("node:test");
const assert=require("node:assert/strict");
const Go=require("../go.js");
const Semeai=require("../semeai-liberty-structure-fixtures.js");

test("semeai liberty structure catalog 以四個 bounded fixtures 驗眼形、公氣與增氣",()=>{
  assert.equal(Semeai.CONTRACT_ID,"semeai-liberty-structure-v1");
  assert.equal(Semeai.STATUS,"teaching_candidate");
  assert.equal(Semeai.fixtures.length,4);
  const result=Semeai.validateAll();
  assert.equal(result.ok,true,result.errors.join("\n"));
});

test("一眼不是無條件勝負規則：同樣一眼對無眼可出現相反 bounded result",()=>{
  const advantage=Semeai.fixtures.find(item=>item.kind==="eye_structure");
  const negative=Semeai.fixtures.find(item=>item.kind==="negative_eye_rule");
  const a=Semeai.facts(advantage),n=Semeai.facts(negative);
  assert.equal(a.blackEyes.length,1);
  assert.equal(a.whiteEyes.length,0);
  assert.equal(n.blackEyes.length,1);
  assert.equal(n.whiteEyes.length,0);
  assert.equal(Semeai.boundedWinner(a.board,Go.WHITE,advantage.blackSeed,advantage.whiteSeed),Go.BLACK);
  assert.equal(Semeai.boundedWinner(n.board,Go.WHITE,negative.blackSeed,negative.whiteSeed),Go.WHITE);
});

test("增氣 fixture 反證只顧緊對方氣：先增加己方氣可改變 bounded race result",()=>{
  const item=Semeai.fixtures.find(entry=>entry.kind==="increase_liberties");
  const state=Semeai.facts(item);
  assert.equal(state.black.liberties.length,2);
  assert.equal(state.white.liberties.length,3);

  const increase=Go.playMove(state.board,item.increaseMove[0],item.increaseMove[1],Go.BLACK);
  assert.equal(increase.legal,true);
  assert.equal(increase.captured.length,0);
  assert.equal(Go.groupAt(increase.board,item.blackSeed[0],item.blackSeed[1]).liberties.length,4);
  assert.equal(Semeai.boundedWinner(increase.board,Go.WHITE,item.blackSeed,item.whiteSeed),Go.BLACK);

  const attack=Go.playMove(state.board,item.directAttackMove[0],item.directAttackMove[1],Go.BLACK);
  assert.equal(attack.legal,true);
  assert.equal(attack.captured.length,0);
  assert.equal(Semeai.boundedWinner(attack.board,Go.WHITE,item.blackSeed,item.whiteSeed),Go.WHITE);
});

test("bounded solver 不被升格成通用 semeai authority",()=>{
  assert.equal("mastery" in Semeai,false);
  assert.equal("schedulerEligible" in Semeai,false);
  assert.equal("formalEligible" in Semeai,false);
});
