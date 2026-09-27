const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "history.html"), "utf8");

test("歷史探索頁維持獨立閱讀，不接 learner state 或評量管線", () => {
  assert.match(html, /Explore Go · 圍棋歷史與典故/);
  assert.match(html, /不影響核心課程進度、KC、排程或正式評量/);
  assert.doesNotMatch(html, /src="app\.js/);
  assert.doesNotMatch(html, /src="scheduler\.js/);
  assert.doesNotMatch(html, /src="learner-progress\.js/);
  assert.doesNotMatch(html, /localStorage/);
});

test("歷史探索頁明示六種證據狀態並保留未知", () => {
  for (const label of ["確證", "高度可信", "有爭議", "傳說", "研究假說", "未知"]) {
    assert.ok(html.includes(">" + label + "<"), label);
  }
  assert.match(html, /誰最先創造 19 路、是否因棋理平衡或曆法宇宙觀而改盤，目前仍未知/);
  assert.match(html, /數字吻合.*不能證明/s);
});

test("歷史探索頁不把堯傳說或孫策棋譜升格為硬史實", () => {
  assert.match(html, /堯造圍棋是重要的起源傳說/);
  assert.match(html, /現存宋代傳下的 19 路棋譜不能直接等同三國原局/);
  assert.doesNotMatch(html, /堯帝發明圍棋已有四千年/);
});

test("歷史探索頁至少連回主要學習入口與主要來源", () => {
  for (const href of ["index.html", "index.html#core", "advanced.html", "classic-shapes.html"]) {
    assert.ok(html.includes('href="' + href + '"'), href);
  }
  for (const host of ["ctext.org", "chnmus.net", "idp.bl.uk", "kci.go.kr", "nihonkiin.or.jp", "mpiwg-berlin.mpg.de"]) {
    assert.ok(html.includes(host), host);
  }
});


test("首頁以低優先級入口連到歷史探索，不改 Core／Advanced 兩張主入口", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(home.includes('href="history.html"'));
  assert.match(home, /歷史與典故另外讀，不擋住你的學習主線/);
  assert.equal((home.match(/class="course-entry-card/g) || []).length, 2);
});
