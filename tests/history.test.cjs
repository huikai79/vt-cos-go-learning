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


test("巡將圍棋、關羽刮骨與原爆棋都有 claim-near source", () => {
  assert.ok(html.includes("ART001844106"), "Sunjang institutional-history source");
  assert.ok(html.includes("https://ctext.org/sanguozhi/36"), "Guan Yu primary text");
  assert.ok(html.includes("https://www.nihonkiin.or.jp/teach/history/history03.html"), "atomic-bomb game official history");
});


test("17→19 路與七十二的敘述不把數字巧合升格為改盤因果", () => {
  assert.match(html, /棋局縱橫，各十七道|棋局縱橫各十七道/);
  assert.match(html, /19² − 17² = 72.*今天做的算術比較/s);
  assert.match(html, /古籍的「七十二」指 19 路棋盤的外周交叉點數/);
  assert.match(html, /兩個 72 不能當成同一條歷史因果證據/);
});

test("歷史來源頁明示傳世文本限制、查核日期，且不保留未實質支撐頁面敘述的裝飾性來源", () => {
  assert.match(html, /古籍連結證明的是「現存傳世文本／引文如何記載」/);
  assert.match(html, /本頁來源最後查核：2026-09-27/);
  assert.doesNotMatch(html, /唐代圍棋子材料分析/);
});

test("所有新分頁外部連結都使用 noreferrer，歷史頁沒有 runtime script", () => {
  const externalTargets = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(externalTargets.length >= 10);
  assert.ok(externalTargets.every((tag) => /rel="[^"]*noreferrer[^"]*"/.test(tag)));
  assert.doesNotMatch(html, /<script\b/i);
  assert.match(html, /history\.css\?v=history-explore-v2/);
});

test("歷史頁小字配色維持一般文字 AA 對比安全值", () => {
  const css = fs.readFileSync(path.join(root, "history.css"), "utf8");
  assert.match(css, /\.history-brand small\{font-size:\.75rem;color:#53675a\}/);
  assert.match(css, /\.question-number\{font-size:\.82rem;font-weight:900;color:#52685a\}/);
  assert.match(css, /\.compare-head\{font-size:\.82rem;font-weight:850;color:#52685a;background:#eef3eb\}/);
  assert.match(css, /footer\{padding:24px;color:#53675a/);
});
