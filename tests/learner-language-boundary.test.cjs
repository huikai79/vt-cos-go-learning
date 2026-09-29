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
