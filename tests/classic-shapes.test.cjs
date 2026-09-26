const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { problems } = require("../content.js");
const Catalog = require("../classic-shapes-catalog.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "classic-shapes.html"), "utf8");
const js = fs.readFileSync(path.join(root, "classic-shapes.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(root, "classic-shapes-catalog.js"), "utf8");

test("經典眼形探索只重用既有 practice 題，不建立第二套答案來源", () => {
  const ids = ["u4-m01", "u4-m02", "u4-m03", "u4-m05"];
  for (const id of ids) {
    const problem = problems.find((item) => item.id === id);
    assert.ok(problem, id);
    assert.equal(problem.pool, "練習", id);
    assert.match(js, new RegExp(id));
  }
  assert.doesNotMatch(js, /localStorage|scheduler|formalEligible|evaluationRole/);
});

test("探索頁明示 practice-only，名稱在互動腳本解答後揭示", () => {
  assert.match(html, /只作練習，不寫入 KC、排程、T2／T3 或正式評量/);
  assert.match(html, /先自己找急所，再揭曉棋形名稱/);
  assert.match(js, /直三/);
  assert.match(js, /名稱是記憶鉤子/);
  assert.match(js, /\$\("classic-reveal"\)\.hidden = true/);
});

test("探索頁提供鍵盤落子與相似反例層", () => {
  assert.match(html, /方向鍵移動，Enter 或 Space 落子/);
  assert.match(html, /相似但不同/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /Enter/);
});


test("世界名型圖鑑把精確別名、分類對應與待核對分開", () => {
  assert.equal(Catalog.version, "world-classic-shapes-v1");
  assert.ok(Catalog.entries.every(Catalog.validateEntry));
  const bentFour = Catalog.entries.find((entry) => entry.id === "bent-four-corner-v1");
  assert.equal(bentFour.rulesetSensitive, true);
  assert.notEqual(bentFour.practiceStatus, "playable_existing_contract");
  assert.ok(bentFour.aliases.some((alias) => alias.locale === "ja-JP" && alias.name === "隅の曲り四目" && alias.relationType === "exact-established-name"));
  assert.ok(bentFour.aliases.some((alias) => alias.locale === "en" && alias.name === "Bent Four in the Corner"));
  const carpenter = Catalog.entries.find((entry) => entry.id === "carpenters-square-v1");
  assert.ok(carpenter.aliases.some((alias) => alias.name === "一合マス"));
  assert.ok(carpenter.aliases.some((alias) => alias.name === "Carpenter's Square"));
});

test("未完成幾何核對的中文俗稱不冒充跨語精確同義詞", () => {
  for (const id of ["knife-five-candidate-v1", "plum-five-candidate-v1", "grape-six-candidate-v1", "big-pigs-mouth-candidate-v1", "small-pigs-mouth-candidate-v1", "golden-chicken-candidate-v1"]) {
    const entry = Catalog.entries.find((item) => item.id === id);
    assert.equal(entry.reviewStatus, Catalog.REVIEW.NEEDS_REVIEW, id);
    assert.equal(entry.practiceStatus, "catalog_candidate_only", id);
  }
  const knife = Catalog.entries.find((entry) => entry.id === "knife-five-candidate-v1");
  const grape = Catalog.entries.find((entry) => entry.id === "grape-six-candidate-v1");
  assert.equal(knife.aliases.some((alias) => alias.name === "Bulky Five"), false);
  assert.equal(grape.aliases.some((alias) => alias.name === "Rabbity Six"), false);
});

test("多語圖鑑不新增第二套可評分答案或 learner evidence", () => {
  const playable = Catalog.entries.filter((entry) => entry.practiceStatus === "playable_existing_contract");
  assert.deepEqual(playable.map((entry) => entry.id), ["straight-three-v1"]);
  assert.doesNotMatch(catalogSource, /localStorage|scheduler|mastery|formalEligible\s*:\s*true/);
  assert.match(html, /多語圖鑑 · 不評分/);
  assert.match(html, /待核對/);
});
