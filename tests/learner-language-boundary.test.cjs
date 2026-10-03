const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(name) {
  return fs.readFileSync(path.join(__dirname, "..", name), "utf8");
}

function visibleHtmlText(name) {
  return read(name)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<code\b[\s\S]*?<\/code>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

test("learner-facing HTML 不重新暴露內部研究／工程禁詞", () => {
  const pages = [
    "index.html",
    "advanced.html",
    "classic-shapes.html",
    "global-go-observatory.html",
    "history.html",
    "math.html",
    "live-game.html"
  ];
  const forbidden = [
    /\bpractice-only\b/i,
    /\bResearch Evidence\b/i,
    /\bcurrent truth\b/i,
    /\bUNKNOWN\b/,
    /\bexact source case\b/i,
    /\bupstream regression\b/i,
    /\bexpected move\b/i,
    /\badjacency\b/i,
    /\bKC\b/,
    /T2\s*[／/]\s*T3/,
    /\btransfer 證據\b/i
  ];
  for (const page of pages) {
    const text = visibleHtmlText(page);
    for (const pattern of forbidden) {
      assert.doesNotMatch(text, pattern, `${page} 不應把 ${pattern} 暴露給一般讀者`);
    }
  }
});

test("棋譜複盤不用『原著』指稱棋譜著手", () => {
  for (const file of ["index.html", "content.js", "advanced.html", "advanced-decision-review.js", "app.js"]) {
    assert.doesNotMatch(read(file), /原著/, `${file} 應使用「原棋譜／原棋譜著手」`);
  }
});

test("已知 runtime 語境外洩片語不得回歸", () => {
  const classic = read("classic-shapes.js");
  for (const phrase of ["六點 adjacency", "exact source case", "upstream regression", "expected move", "補另一個 A/B 點", "換一條 A/B 應手再讀"]) {
    assert.equal(classic.includes(phrase), false, `classic-shapes.js 不應重新出現：${phrase}`);
  }

  const app = read("app.js");
  for (const phrase of [
    "實戰練習紀錄無法讀取（${result.error}）",
    "實戰證據無法讀取（${result.error}）",
    "實戰紀錄讀取失敗（${liveResult.error}）",
    "Enter／Space",
    "固定應用探測已完成"
  ]) {
    assert.equal(app.includes(phrase), false, `app.js 不應重新出現：${phrase}`);
  }

  const live = read("live-game-page.js");
  assert.equal(live.includes("電腦對手目前無法取得下一手（${error.message}）"), false);
  assert.equal(live.includes("實戰學習紀錄沒有成功保存（${liveEvidenceFailure}）"), false);
  assert.equal(live.includes("練習事件未保存（${practiceEventFailure}）"), false);
});

test("必要外部名稱與跨語圍棋名稱仍可保留", () => {
  const live = visibleHtmlText("live-game.html");
  assert.match(live, /KataGo/);
  assert.match(live, /SGF/);
  const classic = visibleHtmlText("classic-shapes.html");
  assert.match(classic, /Bent Three/);
  assert.match(classic, /Pyramid Four/);
  const observatory = visibleHtmlText("global-go-observatory.html");
  assert.match(observatory, /European Go Database/);
  assert.match(observatory, /EGD/);
});

test("任務類型與題內流程分層，延後任務不冒充 formal unseen 或綁死隔日", () => {
  const index = read("index.html");
  const app = read("app.js");

  assert.match(index, /<strong>課程<\/strong><small>短講與核心課程<\/small>/);
  assert.match(index, /<strong>練習<\/strong><small>新題、錯題與立即換形<\/small>/);
  assert.match(index, /<strong>到期複習<\/strong><small>到期原題重新判斷<\/small>/);
  assert.match(index, /<strong>延後再判<\/strong><small>間隔後換局面再判<\/small>/);
  assert.match(index, /<strong>局面應用<\/strong><small>低線索局面中應用<\/small>/);
  assert.match(index, /id="sidebar-current-task-label">課程<\/strong>/);
  assert.match(index, /id="sidebar-question-phase">先看懂<\/strong>/);
  assert.match(index, /<summary>認識任務類型<\/summary>/);
  assert.doesNotMatch(index, /task-type-dot|sidebar-task-type-[0-4]/);
  assert.match(index, /id="learning-stage-badge" role="status" aria-live="polite" aria-atomic="true"/);
  assert.doesNotMatch(index, /class="sidebar-current-task"[^>]+role="status"/);
  assert.match(index, /學習循環說明/);
  assert.match(index, /不是每題都要依序走完的目前進度/);
  assert.match(index, /<strong>比較與修正<\/strong><small>核對理由或重新計算<\/small>/);
  assert.doesNotMatch(app, /activeStep|stageLabel|learning-step-\$\{index\}/);
  assert.match(index, /<strong>隔時再判<\/strong><small>原題複習或換形判斷<\/small>/);
  assert.match(index, /這是任務類型，不是能力等級/);
  assert.doesNotMatch(index, /<strong>S[1-5] /);
  assert.match(index, /優先安排尚未練過的變形/);
  assert.match(index, /換一個不同的棋形/);
  assert.doesNotMatch(index, /隔日換形再測|優先安排未見變形|換一個沒見過的棋形/);

  assert.match(app, /用這批延後棋形完成首答/);
  assert.match(app, /改用尚未練過的變形確認規則/);
  assert.match(app, /到期原題重新判斷/);
  assert.match(app, /selectionReason === "scheduled_review_due"/);
  assert.match(app, /evaluationBatch\.role === "followup"/);
  assert.match(app, /mode === "local_sgf"/);
  assert.match(app, /state\.lessonIntroPending[\s\S]*?index: 0, label: "課程"[\s\S]*?index: 1, label: "練習"/);
  assert.match(app, /提示後待作答/);
  assert.match(app, /state\.solved[\s\S]*?比較理由/);
  assert.match(app, /state\.wrongThisTurn > 0[\s\S]*?完成修正/);
  assert.match(app, /state\.answersThisTurn > 0[\s\S]*?修正重算/);
  assert.match(app, /日後仍要用不同棋形與局面應用驗證/);
  assert.doesNotMatch(app, /用未見新棋形|改用未見變形|未見新棋形與局面應用驗證/);
});

test("相關頁只同步適用任務，不把獨立頁冒充 Core 進度", () => {
  const advanced = read("advanced.html");
  const advancedRuntime = [
    "advanced-comparable-position.js",
    "advanced-delayed-comparable.js",
    "advanced-comparable-v2.js",
    "advanced-enclosure-comparable.js",
    "advanced-seven-day-comparable.js"
  ].map(read).join("\n");
  const classic = read("classic-shapes.html");
  const live = read("live-game.html");

  assert.match(advanced, /aria-label="目前任務：練習"/);
  assert.match(advanced, /獨立於核心課程進度/);
  assert.equal((advanced.match(/class="task-type-chip">延後再判/g) || []).length, 2);
  assert.match(classic, /aria-label="目前任務：練習"/);
  assert.match(classic, /不影響核心課程進度/);
  assert.match(live, /aria-label="目前任務：練習"/);
  assert.match(live, /棋盤尺寸不代表已進入局面應用/);
  assert.doesNotMatch(`${advanced}${classic}${live}`, /目前任務：課程|目前任務：到期複習/);
  assert.doesNotMatch(`${advanced}\n${advancedRuntime}`, /流程檢查/);
  assert.match(advanced, /練習與換形再判/);
  assert.match(advanced, /固定間隔的公開延後再判/);
  assert.match(advancedRuntime, /公開的延後再判|公開延後再判/);
});

test("v70 三層語意修復工作包明確列出 P0 到 P5 且全部有工程完成狀態", () => {
  const audit = read("UI_UX_AUDIT.md");
  const v70 = audit.split("## 2026-10-03｜Learning Task Context v69")[0];
  for (let priority = 0; priority <= 5; priority += 1) {
    assert.match(v70, new RegExp(`\\| P${priority} \\|[^\\n]+\\| COMPLETE \\|`));
  }
  assert.match(v70, /P0–P5 是 v70 三層語意修復工作包/);
  assert.match(v70, /v69 同名項目保留為歷史紀錄/);
});
