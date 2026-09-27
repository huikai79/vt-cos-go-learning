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
  assert.match(html, /兩個 72 不能當成同一條歷史因果證據/);
});

test("歷史探索頁不把堯傳說或孫策棋譜升格為硬史實", () => {
  assert.match(html, /堯造圍棋是重要的起源傳說/);
  assert.match(html, /《忘憂清樂集》所收 19 路棋譜則是後世傳本.*不能直接等同三國原局/s);
  assert.doesNotMatch(html, /堯帝發明圍棋已有四千年/);
});

test("歷史探索頁至少連回主要學習入口與主要來源", () => {
  for (const href of ["index.html", "index.html#core", "advanced.html", "classic-shapes.html"]) {
    assert.ok(html.includes('href="' + href + '"'), href);
  }
  for (const host of ["wenwu.hebei.gov.cn", "ctext.org", "chnmus.net", "idp.bl.uk", "kci.go.kr", "nihonkiin.or.jp", "mpiwg-berlin.mpg.de"]) {
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
  assert.ok(html.includes("https://www.nihonkiin.or.jp/special/100anniversary/kishi_select/17.html"), "atomic-bomb game official history");
});


test("17→19 路與七十二的敘述不把數字巧合升格為改盤因果", () => {
  assert.match(html, /東漢陽嘉元年（132）.*石棋盤.*17 道/s);
  assert.match(html, /《文選》李善注保存邯鄲淳《藝經》「棋局縱橫，各十七道」/);
  assert.match(html, /19² − 17² = 72.*今天做的算術比較/s);
  assert.match(html, /《棋經十三篇》的「外周七十二路」指 19 路棋盤外周交叉點數/);
  assert.match(html, /兩個 72 不能當成同一條歷史因果證據/);
});

test("歷史來源頁明示傳世文本限制、查核日期，且不保留未實質支撐頁面敘述的裝飾性來源", () => {
  assert.match(html, /古籍連結證明的是「現存傳世文本／引文如何記載」/);
  assert.match(html, /本頁來源最後查核：2026-09-28/);
  assert.doesNotMatch(html, /唐代圍棋子材料分析/);
});

test("所有新分頁外部連結都使用 noreferrer，歷史頁沒有 runtime script", () => {
  const externalTargets = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(externalTargets.length >= 10);
  assert.ok(externalTargets.every((tag) => /rel="[^"]*noreferrer[^"]*"/.test(tag)));
  assert.doesNotMatch(html, /<script\b/i);
  assert.match(html, /history\.css\?v=history-explore-v4/);
});

test("歷史頁所有已知小字與 evidence badge 維持一般文字 AA 對比安全值", () => {
  const css = fs.readFileSync(path.join(root, "history.css"), "utf8");
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const raw = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((offset) => parseInt(raw.slice(offset, offset + 2), 16));
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const ratio = (foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  const checks = [
    ["brand small", "#53675a", "#fbfcf8"],
    ["hero/section kicker", "#466c50", "#f4f6f0"],
    ["section kicker on card", "#466c50", "#fbfcf8"],
    ["badge grid helper", "#607364", "#ffffff"],
    ["confirmed badge", "#275c38", "#dceee1"],
    ["strong badge", "#426240", "#e6efe3"],
    ["debated badge", "#765819", "#fff0cb"],
    ["legend badge", "#775032", "#f2e4d7"],
    ["hypothesis badge", "#4e527a", "#e5e7f4"],
    ["unknown badge", "#5e625f", "#e8e9e8"],
    ["question number", "#52685a", "#ffffff"],
    ["detail text", "#566d5c", "#ffffff"],
    ["timeline helper", "#5b705f", "#ffffff"],
    ["compare head", "#52685a", "#eef3eb"],
    ["story/frontier helper", "#5a705f", "#f9faf7"],
    ["source helper", "#5f7162", "#ffffff"],
    ["cta kicker", "#bcd0c0", "#21392d"],
    ["cta helper", "#d3e0d5", "#21392d"],
    ["footer", "#53675a", "#f4f6f0"]
  ];
  for (const [label, foreground, background] of checks) {
    assert.ok(ratio(foreground, background) >= 4.5, `${label}: ${ratio(foreground, background).toFixed(2)}`);
  }
  assert.match(css, /\.history-kicker,\.section-head>span\{[^}]*color:#466c50/);
  assert.match(css, /\.source-list span\{[^}]*color:#5f7162/);
});

test("歷史頁尊重 prefers-reduced-motion", () => {
  const css = fs.readFileSync(path.join(root, "history.css"), "utf8");
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}\}/);
});


test("孫策呂範的對弈傳文與後世十九路棋譜分開處理", () => {
  assert.ok(html.includes("https://ctext.org/taiping-yulan/753/zh"));
  assert.match(html, /只支持對弈敘事，不直接驗證後世 19 路棋譜/);
  assert.match(html, /《忘憂清樂集》所收 19 路棋譜則是後世傳本.*不能直接等同三國原局/s);
});

test("原爆棋使用可直接支撐再開與終局時間的日本棋院官方頁", () => {
  assert.ok(html.includes("https://www.nihonkiin.or.jp/special/100anniversary/kishi_select/17.html"));
  assert.match(html, /約 10:30 再開、約 16:00 終局/);
});


test("歷史 HTML 不得把 escaped newline 當可見文字帶進來源清單", () => {
  assert.equal(html.includes("\\n"), false);
});


test("History Explore learner-facing version metadata 一致為 v4", () => {
  assert.match(html, /history\.css\?v=history-explore-v4/);
  assert.match(html, /歷史探索 v4/);
  assert.doesNotMatch(html, /歷史探索 v1|歷史探索 v2|歷史探索 v3/);
});


test("孫策呂範棋譜真實性以後世 attribution 與質疑呈現，不冒充三國同期棋譜", () => {
  assert.match(html, /《江表傳》的對弈傳文今可見《太平御覽》轉引/);
  assert.match(html, /「所下とされる」棋譜/);
  assert.ok(html.includes("https://ctext.org/wiki.pl?chapter=496456&amp;if=gb"));
  assert.match(html, /疑是後人假託/);
});


test("History Explore v4 不保留泛用來源入口，改用實際 claim-near source", () => {
  assert.doesNotMatch(html, /href="https:\/\/ctext\.org\/"\s/);
  assert.ok(html.includes("https://ctext.org/mengzi/gaozi-i"));
  assert.ok(html.includes("chapter=578656"));
  assert.ok(html.includes("node=91622"));
});

test("手機 header 即使隱藏進階導覽，頁面仍保留直接回進階訓練的 CTA", () => {
  assert.match(html, /href="advanced\.html">回進階訓練<\/a>/);
});

test("History Explore v4 以望都 132 年作 17 路主要物質錨點，且不誇大為原位或最早", () => {
  assert.ok(html.includes("https://wenwu.hebei.gov.cn/system/2023/10/16/030257948.shtml"));
  assert.match(html, /132｜東漢望都/);
  assert.match(html, /墓中出土石棋盤，盤面縱橫各 17 道/);
  assert.doesNotMatch(html, /原位考古出土/);
  assert.doesNotMatch(html, /已知最早的 17 路棋盤/);
});

test("History Explore v4 將南朝棋學寫成品評與編纂活動，不升格為現代制度化教育", () => {
  assert.match(html, /圍棋州邑/);
  assert.match(html, /登格 278 人/);
  assert.match(html, /宮廷棋手品評與棋書編纂活動相當成熟/);
  assert.doesNotMatch(html, /棋學高度制度化/);
  assert.match(html, /《棋勢》《棋圖勢》《棋九品序錄》《圍棋品》《棋法》/);
  assert.match(html, /不能據此假定 17→19 的答案一定就在失傳書中/);
});

test("History Explore v4 用角曲四呈現技術知識再現，但拒絕完整傳承鏈", () => {
  assert.match(html, /角旁曲四，局竟乃亡/);
  assert.match(html, /角盤曲四，局終乃亡/);
  assert.match(html, /征、劫、持/);
  assert.match(html, /不足以證明一條不中斷的完整傳承鏈/);
});

test("History Explore v4 的 17 路古局缺口維持 scoped negative claim", () => {
  assert.match(html, /目前查核範圍內，尚未確認可可靠重建的早期 17 路實戰局面/);
  assert.match(html, /本頁目前查核的主要考古、棋史與傳世棋譜來源中/);
  assert.match(html, /不代表這類證據不存在/);
});

test("《讀曲歌》只作南朝歌辭傳統的 17 路補充，不綁定 440 年", () => {
  assert.match(html, /南朝《讀曲歌》傳統中另保存「方局十七道」/);
  assert.match(html, /不能因此把含「方局十七道」的那一首精確定年為 440 年/);
  assert.doesNotMatch(html, /440 年仍確定使用17路/);
});
