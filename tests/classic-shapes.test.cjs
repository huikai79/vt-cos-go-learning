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
  assert.match(html, /圖鑑不是能力證據/);
  assert.match(html, /只有已存在 scoring contract 的直三練習可互動/);
  assert.match(html, /名稱仍在作答後才揭示/);
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
  assert.equal(Catalog.version, "world-classic-shapes-v2");
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

test("中文名稱身分與描述性翻譯保持分離", () => {
  const S = Catalog.ZH_NAME_STATUS;
  const knife = Catalog.entries.find((entry) => entry.id === "knife-five-candidate-v1");
  const grape = Catalog.entries.find((entry) => entry.id === "grape-six-candidate-v1");
  const carpenter = Catalog.entries.find((entry) => entry.id === "carpenters-square-v1");
  const lGroup = Catalog.entries.find((entry) => entry.id === "l-group-v1");
  const lPlusOne = Catalog.entries.find((entry) => entry.id === "l-plus-one-group-v1");
  const tripod = Catalog.entries.find((entry) => entry.id === "tripod-group-v1");
  assert.equal(knife.zhNameStatus, S.ESTABLISHED_ALIAS);
  assert.equal(knife.aliases.some((alias) => alias.name === "Bulky Five"), true);
  assert.equal(knife.practiceStatus, "catalog_candidate_only");
  assert.equal(grape.zhNameStatus, S.NEEDS_REVIEW);
  assert.equal(grape.aliases.some((alias) => alias.name === "Rabbity Six"), false);
  assert.equal(carpenter.zhNameStatus, S.NEEDS_REVIEW);
  assert.equal(carpenter.preferredZhTW, null);
  assert.ok(carpenter.zhAliases.some((alias) => alias.name === "斗方"));
  assert.equal(carpenter.teachingTranslation, "木匠方");
  for (const entry of [lGroup, lPlusOne, tripod]) {
    assert.equal(entry.zhNameStatus, S.NO_ESTABLISHED_NAME_FOUND, entry.id);
    assert.equal(entry.preferredZhTW, null, entry.id);
    assert.ok(entry.teachingTranslation, entry.id);
  }
});

test("多語圖鑑不新增第二套可評分答案或 learner evidence", () => {
  const playable = Catalog.entries.filter((entry) => entry.practiceStatus === "playable_existing_contract");
  assert.deepEqual(playable.map((entry) => entry.id), ["straight-three-v1"]);
  assert.doesNotMatch(catalogSource, /localStorage|scheduler|mastery|formalEligible\s*:\s*true/);
  assert.match(html, /多語圖鑑 · 不評分/);
  assert.match(html, /待核對/);
});


test("韓文術語有來源層級且不因次級來源升格為 verified", () => {
  const bentFour = Catalog.entries.find((entry) => entry.id === "bent-four-corner-v1");
  const flowerSix = Catalog.entries.find((entry) => entry.id === "flower-six-v1");
  const koBent = bentFour.aliases.find((alias) => alias.locale === "ko-KR");
  const koFlower = flowerSix.aliases.find((alias) => alias.locale === "ko-KR");
  assert.equal(koBent.name, "귀곡사");
  assert.equal(koBent.reviewStatus, Catalog.REVIEW.PARTIAL);
  assert.equal(koFlower.name, "매화6궁");
  assert.equal(koFlower.reviewStatus, Catalog.REVIEW.PARTIAL);
  assert.ok(bentFour.sources.some((source) => source.sourceTier === "community_secondary"));
});
