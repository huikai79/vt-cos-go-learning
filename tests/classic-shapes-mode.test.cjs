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

test("回到頁首不應切換圖鑑模式，圖鑑深連結應進入正確模式",()=>{
  assert.equal(Mode.modeFromHash("#page-top",Mode.MODES.ATLAS),Mode.MODES.ATLAS);
  assert.equal(Mode.modeFromHash("#classic-atlas-title",Mode.MODES.PRACTICE),Mode.MODES.ATLAS);
  assert.equal(Mode.modeFromHash("#classic-practice-mode-title",Mode.MODES.ATLAS),Mode.MODES.PRACTICE);
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

test("applyMode 實際只顯示選定 panel，並同步 aria-current 與 skip link",()=>{
  const attrs=(initial={})=>({
    dataset:{...initial},
    hidden:false,
    map:new Map(),
    setAttribute(k,v){this.map.set(k,v);},
    removeAttribute(k){this.map.delete(k);}
  });
  const practicePanel=attrs({classicModePanel:"practice"});
  const atlasPanel=attrs({classicModePanel:"atlas"});
  const practiceLink=attrs({classicModeLink:"practice"});
  const atlasLink=attrs({classicModeLink:"atlas"});
  const skip={href:"",textContent:""};
  const doc={
    body:{dataset:{}},
    querySelectorAll(selector){
      if(selector==="[data-classic-mode-panel]") return [practicePanel,atlasPanel];
      if(selector==="[data-classic-mode-link]") return [practiceLink,atlasLink];
      return [];
    },
    querySelector(selector){ return selector===".skip-link" ? skip : null; },
    getElementById(){ return null; }
  };

  const mode=Mode.applyMode(doc,"#atlas");
  assert.equal(mode,Mode.MODES.ATLAS);
  assert.equal(doc.body.dataset.classicMode,"atlas");
  assert.equal(practicePanel.hidden,true);
  assert.equal(atlasPanel.hidden,false);
  assert.equal(practiceLink.map.has("aria-current"),false);
  assert.equal(atlasLink.map.get("aria-current"),"page");
  assert.equal(skip.href,"#classic-atlas-title");
  assert.equal(skip.textContent,"跳到世界名型對照");
});

test("首屏初始化不聚焦題目；明確切題才移動焦點",()=>{
  const advanced=fs.readFileSync(path.join(root,"advanced.js"),"utf8");
  const advancedHtml=fs.readFileSync(path.join(root,"advanced.html"),"utf8");
  const classicHtml=fs.readFileSync(path.join(root,"classic-shapes.html"),"utf8");
  assert.match(advanced,/function renderExperience\(\{ focusTitle = false \} = \{\}\)/);
  assert.match(advanced,/if \(focusTitle\) \$\("advanced-title"\)\.focus\(\)/);
  assert.match(advanced,/renderExperience\(\{ focusTitle: true \}\)/);
  assert.match(shapesSource,/function render\(\{ focusTitle = false \} = \{\}\)/);
  assert.match(shapesSource,/if \(focusTitle\) \$\("classic-title"\)\.focus\(\)/);
  assert.match(shapesSource,/render\(\{ focusTitle: true \}\)/);
  assert.match(advancedHtml,/href="#advanced-sequence-title">棋盤作答<\/a>/);
  assert.match(advancedHtml,/href="#decision-review-title">完整棋局複盤<\/a>/);
  assert.doesNotMatch(advancedHtml,/href="#advanced-title">讀棋與手筋練習<\/a>/);
  assert.doesNotMatch(classicHtml,/href="#classic-practice-mode-title">選擇棋形<\/a>/);
  assert.doesNotMatch(advanced,/scrollRestoration\s*=|scrollTo\(0,\s*0\)/);
  assert.doesNotMatch(shapesSource,/scrollRestoration\s*=|scrollTo\(0,\s*0\)/);
});
