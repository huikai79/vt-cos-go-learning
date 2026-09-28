const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "global-go-observatory.html"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const record = fs.readFileSync(path.join(root, "research", "global-go-observatory-v1.md"), "utf8");

test("全球圍棋觀察頁分開不同人口口徑，不製造單一世界總榜", () => {
  assert.match(html, /這四種數字不能互相替代/);
  assert.match(html, /只有資料來源與定義足夠接近時，才適合直接排序/);
  assert.match(html, /2025 歐洲 EGD 年度活躍棋手 Top 10/);
  assert.match(html, /以下不是排名/);
  assert.doesNotMatch(html, /世界第一|全球第一|最強圍棋國/);
});

test("同源 EGD 排名與關鍵國家數字有明確口徑", () => {
  for (const marker of ["1,021", "924", "437", "353", "309", "242", "233", "217", "196", "186"]) {
    assert.match(html, new RegExp(marker.replace(",", ",")), marker);
  }
  assert.match(html, /約 200 萬／年/);
  assert.match(html, /約 883 萬/);
  assert.match(html, /28,800/);
  assert.match(html, /&gt; 3,000／年/);
  assert.match(html, /&gt; 200 萬/);
  assert.match(html, /馬來西亞[\s\S]*?現況未知/);
});

test("研究頁不載入 learner runtime，也不取得學習評分 authority", () => {
  assert.doesNotMatch(html, /src="(?:app|scheduler|learner-progress|learning-metrics|practice-events|live-evidence)\.js/);
  assert.match(html, /公開研究頁，不進入學習評分/);
  assert.match(html, /不會寫入本站的學習進度、KC、複習排程、評分或正式評量/);
  assert.match(record, /learner_runtime_authority: none/);
  assert.match(record, /Research → Teaching Promotion decision/);
  assert.match(record, /\*\*不升格。\*\*/);
});

test("UNKNOWN 不被搜尋缺口改寫成零，且首頁提供低干擾入口", () => {
  assert.match(html, /UNKNOWN 不是 0/);
  assert.match(html, /本輪未找到可與上述國家直接比較的現行全國玩家／學員總數/);
  assert.match(index, /href="global-go-observatory\.html">全球觀察<\/a>/);
});

test("公開來源保留 locator，且研究紀錄保存不支持範圍", () => {
  for (const domain of ["europeangodatabase.eu", "news.cn", "kbaduk.or.kr", "jpc-net.jp", "weiqi.org.tw", "weiqi.org.sg", "thaigo.org", "ffg.jeudego.org", "weiqi.org.my"]) {
    assert.match(html, new RegExp(domain.replaceAll(".", "\\.")), domain);
  }
  assert.match(record, /\| 支持 \| 不支持 \|/);
  assert.match(record, /第一版不建立加權總分/);
});
