const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Mode=require("../classic-shapes-mode.js");

const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"classic-shapes.html"),"utf8");
const css=fs.readFileSync(path.join(root,"classic-shapes.css"),"utf8");
const modeSource=fs.readFileSync(path.join(root,"classic-shapes-mode.js"),"utf8");
const shapesSource=fs.readFileSync(path.join(root,"classic-shapes.js"),"utf8");

test("世界名型館預設進 practice，#atlas 才切圖鑑",()=>{
  assert.equal(Mode.modeFromHash(""),Mode.MODES.PRACTICE);
  assert.equal(Mode.modeFromHash("#practice"),Mode.MODES.PRACTICE);
  assert.equal(Mode.modeFromHash("#atlas"),Mode.MODES.ATLAS);
  assert.equal(Mode.modeFromHash("#bent-three-practice-title"),Mode.MODES.PRACTICE);
});

test("practice 與 atlas 是同頁 sibling modes，不再靠長頁捲動抵達",()=>{
  assert.match(html,/data-classic-mode-link="practice"/);
  assert.match(html,/data-classic-mode-link="atlas"/);
  assert.match(html,/id="practice"[^>]*data-classic-mode-panel="practice"/);
  assert.match(html,/id="atlas"[^>]*data-classic-mode-panel="atlas"/);
  assert.ok(html.indexOf('data-classic-mode-panel="practice"') < html.indexOf('data-classic-mode-panel="atlas"'));
  assert.match(css,/\.classic-mode-panel\[hidden\]\{display:none!important\}/);
});

test("圖鑑可直接深連結，練習仍提供描述性快速導覽",()=>{
  assert.match(html,/href="#atlas"[^>]*data-classic-mode-link="atlas"/);
  for(const hash of [
    "#straight-three-track-title",
    "#bent-three-practice-title",
    "#four-space-status-title",
    "#pyramid-four-practice-title",
    "#cross-practice-title",
    "#bulky-practice-title",
    "#flower-six-practice-title",
    "#golden-chicken-practice-title",
    "#big-pigs-mouth-practice-title",
    "#contrast-practice-title"
  ]){
    assert.ok(html.includes('href="'+hash+'"'),hash);
  }
});

test("模式切換是純 URL/UI state，不寫 learner state 或 local storage",()=>{
  assert.doesNotMatch(modeSource,/localStorage|sessionStorage|learner|scheduler|formalEligible|mastery/);
  assert.match(modeSource,/location\.hash/);
  assert.match(modeSource,/hashchange/);
});

test("既有練習揭名與 scoring script 不被模式路由改寫",()=>{
  assert.match(shapesSource,/\$\("classic-reveal"\)\.hidden = true/);
  assert.match(shapesSource,/名稱是記憶鉤子/);
  assert.doesNotMatch(modeSource,/classic-reveal|correctMove|formalEligible|mastery/);
});

test("窄版模式與練習快速導覽可降為單欄",()=>{
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.classic-mode-nav\{grid-template-columns:1fr\}/);
  assert.match(css,/@media\(max-width:390px\)[\s\S]*\.classic-practice-jumps\{grid-template-columns:1fr\}/);
});
