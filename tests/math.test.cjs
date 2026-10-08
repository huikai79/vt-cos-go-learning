const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "math.html"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const record = fs.readFileSync(path.join(root, "research", "go-math-explore-v1.md"), "utf8");

test("圍棋 × 數學頁維持 Explore-only，不接 learner runtime", () => {
  assert.match(html, /探索圍棋 · 圍棋 × 數學/);
  assert.match(html, /本頁不寫入學習進度、不更新能力模型或複習排程/);
  assert.doesNotMatch(html, /src="(?:app|scheduler|learner-progress|learning-metrics|practice-events|live-evidence)\.js/);
  assert.doesNotMatch(html, /localStorage/);
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/gi)].map((match) => match[1]);
  assert.deepEqual(scripts, ["back-to-top.js?v=back-to-top-v1"]);
  assert.match(record, /learner_runtime_authority: none/);
  assert.match(record, /promotion_decision: do_not_promote_to_core/);
});

test("數學探索頁不把形式數學或認知共通機制升格成數學學習成效", () => {
  assert.match(html, /目前不能這樣宣稱/);
  assert.match(html, /目前不宣稱本站能提升一般數學能力/);
  assert.match(html, /目前還沒有足夠的強因果證據支持「單純學圍棋 → 廣泛數學提升」/);
  assert.match(html, /不能自行補成「圍棋 → 空間能力 → 數學」這條因果鏈/);
});

test("HKBU 七人質性研究明示不是學習者轉移效果實測", () => {
  assert.match(html, /七位同時熟悉數學與圍棋者的敘事式多重個案研究/);
  assert.match(html, /不是對學習者轉移效果的實測/);
  assert.match(record, /不能當成 learner outcome 的 transfer effect size/);
});

test("數學探索頁保留主要直接證據與限制證據", () => {
  for (const marker of [
    "圍棋中的活棋",
    "圍棋官子的平均值與溫度搜尋",
    "圍棋是多項式空間困難問題",
    "圍棋布局、中盤、官子階段之認知能力",
    "空間訓練與數學表現統合分析",
    "認知訓練的近距離與遠距轉移"
  ]) assert.ok(html.includes(marker), marker);
  assert.match(html, /本頁來源最後查核：2026-09-29/);
});

test("首頁只提供低優先 Explore 入口，不改三個 Core 路徑", () => {
  assert.ok(home.includes('href="math.html"'));
  assert.match(home, /href="math\.html">圍棋與數學/);
  assert.equal((home.match(/class="intro-path-card/g) || []).length, 3);
});

test("所有數學探索外部新分頁連結使用 noreferrer", () => {
  const externalTargets = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(externalTargets.length >= 8);
  assert.ok(externalTargets.every((tag) => /rel="[^"]*noreferrer[^"]*"/.test(tag)));
});


test("一般讀者文案不散落研究英文術語", () => {
  for (const phrase of [
    "spatial training",
    "cognitive-training",
    "far transfer",
    "transfer effect",
    "variation search",
    "conditional reasoning",
    "meta-analysis",
    "controlled pre-post studies",
    "publication bias",
    "placebo",
    "Go-only",
    "Go + Bridge",
    "Math-only",
    "Research/Content Evidence",
    "Learner Evidence"
  ]) {
    assert.equal(html.includes(phrase), false, `math.html 不應直接顯示：${phrase}`);
  }
  assert.match(html, /PSPACE-hard/);
});
