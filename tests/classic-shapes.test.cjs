const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { problems } = require("../content.js");
const Ontology = require("../classic-shapes-ontology.js");
const Catalog = require("../classic-shapes-catalog.js");
const Go = require("../go.js");
const Practice = require("../classic-shape-practice.js");
const PracticeContract = require("../classic-shape-practice-contract.js");
const ShortRead = require("../classic-shape-read.js");
const ShortReadContract = require("../classic-shape-read-contract.js");
const Reduction = require("../classic-shape-reduction.js");
const ReductionContract = require("../classic-shape-reduction-contract.js");
const CrossFive = require("../classic-cross-five-practice.js");
const CrossFiveContract = require("../classic-cross-five-contract.js");
const PyramidFour = require("../classic-pyramid-four-practice.js");
const PyramidFourContract = require("../classic-pyramid-four-contract.js");
const FlowerSix = require("../classic-flower-six-practice.js");
const FlowerSixContract = require("../classic-flower-six-contract.js");
const GoldenChicken = require("../classic-golden-chicken-practice.js");
const GoldenChickenContract = require("../classic-golden-chicken-contract.js");
const BigPigsMouth = require("../classic-big-pigs-mouth-practice.js");
const BigPigsMouthContract = require("../classic-big-pigs-mouth-contract.js");
const Contrast = require("../classic-contrast-practice.js");
const ContrastContract = require("../classic-contrast-contract.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "classic-shapes.html"), "utf8");
const js = fs.readFileSync(path.join(root, "classic-shapes.js"), "utf8");
const ontologySource = fs.readFileSync(path.join(root, "classic-shapes-ontology.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(root, "classic-shapes-catalog.js"), "utf8");
const css = fs.readFileSync(path.join(root, "classic-shapes.css"), "utf8");

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
  assert.match(html, /刀把五、梅花五與花六各有 bounded nakade practice/);
  assert.match(html, /金雞獨立走 rules-backed tesuji mechanism contract/);
  assert.match(html, /名稱仍在作答後才揭示|名稱放到第一手之後/);
  assert.match(js, /直三/);
  assert.match(js, /名稱是記憶鉤子/);
  assert.match(js, /\$\("classic-reveal"\)\.hidden = true/);
});

test("探索頁提供鍵盤落子與相似反例層", () => {
  assert.match(html, /方向鍵移動，Enter 或 Space 落子/);
  assert.match(html, /4 直三 · 相似反例/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /Enter/);
});


test("ontology v2 是 canonical source，catalog entries 只由 adapter 衍生", () => {
  assert.equal(Ontology.version, "classic-shape-ontology-v2");
  assert.equal(Catalog.ontologyVersion, Ontology.version);
  assert.ok(Ontology.concepts.every(Ontology.validateConcept));
  assert.deepEqual(Catalog.entries.map((entry) => entry.id), Ontology.concepts.map((concept) => concept.id));
  assert.doesNotMatch(catalogSource, /const\s+entries\s*=\s*\[/);
  assert.match(catalogSource, /Ontology\.concepts\.map\(toLegacyEntry\)/);
  assert.match(html, /classic-shapes-ontology\.js\?v=classic-shape-ontology-v2/);
  assert.ok(html.indexOf("classic-shapes-ontology.js") < html.indexOf("classic-shapes-catalog.js"));
});

test("來源網址不等於獨立 Evidence Chain", () => {
  assert.equal(Ontology.sources.go4goChinese.evidenceChain, "yeefan-chinese-terms");
  assert.equal(Ontology.sources.yeefanChineseTerms.evidenceChain, "yeefan-chinese-terms");
  const grape = Ontology.concepts.find((concept) => concept.id === "grape-six-candidate-v1");
  const negative = grape.negativeMappings.find((item) => item.name === "Rabbity Six");
  assert.ok(negative);
  assert.match(negative.reason, /同一術語 Evidence Chain/);
});

test("names ontology、entityType、geometryIdentity 與 legacy 中文 UI 欄位分離", () => {
  const T = Ontology.ENTITY_TYPE;
  const carpenter = Ontology.concepts.find((concept) => concept.id === "carpenters-square-v1");
  const smallPig = Ontology.concepts.find((concept) => concept.id === "small-pigs-mouth-candidate-v1");
  const golden = Ontology.concepts.find((concept) => concept.id === "golden-chicken-candidate-v1");
  const bent = Ontology.concepts.find((concept) => concept.id === "bent-four-corner-v1");

  assert.equal(carpenter.entityType, T.CORNER_LIFE_DEATH_FAMILY);
  assert.ok(carpenter.names.some((item) => item.name === "金柜角"));
  assert.ok(carpenter.names.some((item) => item.name === "斗方"));
  assert.ok(carpenter.nameResearch.some((item) => item.locale === "zh-TW" && item.status === "regional_preference_unresolved"));

  assert.ok(smallPig.names.some((item) => item.name === "Tripod Group with Extra Leg"));
  assert.ok(smallPig.negativeMappings.some((item) => item.name === "Tripod Group" && item.status === "blocked_pending_geometry"));

  assert.equal(golden.entityType, T.TESUJI_MECHANISM);
  assert.ok(golden.names.some((item) => item.name === "double shortage of liberties" && item.relationToCanonical === Ontology.RELATION.MECHANISM_EQUIVALENT));
  assert.ok(golden.negativeMappings.some((item) => item.name === "static nakade shape"));

  assert.equal(bent.entityType, T.RULES_SENSITIVE_POSITION);
  assert.ok(bent.rulesetBehavior.length >= 2);
  const bentLegacy = Catalog.entries.find((entry) => entry.id === bent.id);
  assert.equal(bentLegacy.rulesetSensitive, true);
  assert.deepEqual(bentLegacy.rulesetBehavior, bent.rulesetBehavior);
});

test("未找到固定中文名是有日期與搜尋範圍的負面查核，不是不存在宣告", () => {
  for (const id of ["l-group-v1","l-plus-one-group-v1","tripod-group-v1"]) {
    const concept = Ontology.concepts.find((item) => item.id === id);
    const research = concept.nameResearch.find((item) => item.locale === "zh");
    assert.equal(research.status, Ontology.NAME_STATUS.NO_ESTABLISHED_NAME_FOUND, id);
    assert.equal(research.reviewedAt, "2026-09-27", id);
    assert.ok(research.searchScope.includes("zh-TW"), id);
    const legacy = Catalog.entries.find((item) => item.id === id);
    assert.equal(legacy.preferredZhTW, null, id);
    assert.match(legacy.zhNameNote, /尚未找到可確認的固定中文名稱/);
    assert.match(legacy.zhNameNote, /不是不存在的證明/);
  }
});

test("梅花五英文異名與 Long L 外氣條件保留，不被正規化掉", () => {
  const plum = Ontology.concepts.find((concept) => concept.id === "plum-five-candidate-v1");
  assert.ok(plum.names.some((item) => item.name === "Cross Five"));
  assert.ok(plum.names.some((item) => item.name === "Crossed Five"));

  const longL = Ontology.concepts.find((concept) => concept.id === "long-l-group-v1");
  const tight = longL.names.find((item) => item.name === "緊帶鉤");
  const loose = longL.names.find((item) => item.name === "寬帶鉤");
  assert.equal(tight.condition.outsideLiberties, "without");
  assert.equal(loose.condition.outsideLiberties, "with");
  assert.equal(longL.geometryIdentity.conditions.outsideLiberties, "variation_axis_required");
});

test("世界名型圖鑑把精確別名、分類對應與待核對分開", () => {
  assert.equal(Catalog.version, "world-classic-shapes-v11");
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
  const plum = Catalog.entries.find((entry) => entry.id === "plum-five-candidate-v1");
  const carpenter = Catalog.entries.find((entry) => entry.id === "carpenters-square-v1");
  const lGroup = Catalog.entries.find((entry) => entry.id === "l-group-v1");
  const lPlusOne = Catalog.entries.find((entry) => entry.id === "l-plus-one-group-v1");
  const tripod = Catalog.entries.find((entry) => entry.id === "tripod-group-v1");
  const longL = Catalog.entries.find((entry) => entry.id === "long-l-group-v1");
  assert.equal(knife.zhNameStatus, S.ESTABLISHED_ALIAS);
  assert.equal(knife.aliases.some((alias) => alias.name === "Bulky Five"), true);
  assert.equal(knife.practiceStatus, "playable_bounded_vital_point_short_read_and_sealed_reduction_contract");
  assert.equal(plum.zhNameStatus, S.ESTABLISHED_ALIAS);
  assert.equal(plum.practiceStatus, "playable_bounded_center_vital_point_contract");
  assert.ok(plum.aliases.some((alias) => alias.name === "Cross Five"));
  assert.equal(grape.zhNameStatus, S.NEEDS_REVIEW);
  assert.equal(grape.aliases.some((alias) => alias.name === "Rabbity Six"), false);
  assert.equal(carpenter.zhNameStatus, S.ESTABLISHED_ALIAS);
  assert.equal(carpenter.preferredZhTW, null);
  assert.equal(carpenter.preferenceBasis, "unresolved");
  assert.equal(carpenter.displayName, "一合マス／Carpenter's Square");
  assert.ok(carpenter.zhAliases.some((alias) => alias.name === "金櫃角"));
  assert.ok(carpenter.zhAliases.some((alias) => alias.name === "斗方"));
  assert.equal(carpenter.teachingTranslation, "木匠方");
  for (const entry of [lGroup, lPlusOne, tripod]) {
    assert.equal(entry.zhNameStatus, S.NO_ESTABLISHED_NAME_FOUND, entry.id);
    assert.equal(entry.preferredZhTW, null, entry.id);
    assert.ok(entry.teachingTranslation, entry.id);
  }
  assert.equal(longL.zhNameStatus, S.ESTABLISHED_ALIAS);
  assert.equal(longL.preferredZhTW, "帶鉤");
  assert.ok(longL.zhAliases.some((alias) => alias.name === "緊帶鉤"));
  assert.ok(longL.zhAliases.some((alias) => alias.name === "寬帶鉤"));
});

test("多語圖鑑不新增第二套可評分答案或 learner evidence", () => {
  const playable = Catalog.entries.filter((entry) => entry.practiceStatus.startsWith("playable_"));
  assert.deepEqual(playable.map((entry) => entry.id).sort(), ["big-pigs-mouth-candidate-v1", "flower-six-v1", "golden-chicken-candidate-v1", "knife-five-candidate-v1", "plum-five-candidate-v1", "pyramid-four-v1", "straight-three-v1"]);
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


test("刀把五四個 variant 通過 geometry + rules bounded contract", () => {
  assert.equal(Practice.version, "classic-shape-practice-v1");
  assert.equal(Practice.scoringContractVersion, PracticeContract.CONTRACT_VERSION);
  assert.equal(Practice.items.length, 4);
  const all = PracticeContract.validateAll(Practice.items, Go);
  assert.equal(all.ok, true, all.errors.join("; "));
  for (const item of Practice.items) {
    const derived = PracticeContract.deriveVitalPoint(item.eyeSpace);
    assert.deepEqual(derived, item.vitalPoint, item.id);
    const scored = PracticeContract.score(item, item.vitalPoint, Go);
    assert.equal(scored.ok, true, item.id);
    assert.equal(scored.correct, true, item.id);
    assert.equal(scored.status, "CORRECT", item.id);
  }
});

test("刀把五 contract 對錯誤 geometry、錯誤急所與非急所首答 fail closed", () => {
  const seed = Practice.items[0];
  const wrongGeometry = {
    ...seed,
    id: "wrong-geometry",
    eyeSpace: [[2,2],[3,2],[4,2],[2,3],[4,3]]
  };
  assert.equal(PracticeContract.validateItem(wrongGeometry, Go).ok, false);

  const wrongVital = { ...seed, id: "wrong-vital", vitalPoint: [2,2] };
  assert.equal(PracticeContract.validateItem(wrongVital, Go).ok, false);

  const wrongMove = seed.eyeSpace.find((point) => point[0] !== seed.vitalPoint[0] || point[1] !== seed.vitalPoint[1]);
  const result = PracticeContract.score(seed, wrongMove, Go);
  assert.equal(result.ok, true);
  assert.equal(result.correct, false);
  assert.equal(result.status, "INCORRECT");
});

test("刀把五 UI 明示 bounded vital-point 範圍，不把四題升格 mastery", () => {
  assert.match(html, /刀把五：找共同急所/);
  assert.match(html, /只判第一手是否落在 geometry contract 推導出的唯一共同急所/);
  assert.match(html, /不宣稱完整死活答案樹/);
  assert.match(js, /GoClassicShapePracticeContract/);
  assert.match(js, /不代表 mastery 或完整死活已驗證/);
});


test("刀把五 A/B short-read 三個 variant 由幾何推導 pair 並由 rules replay", () => {
  assert.equal(ShortRead.version, "classic-shape-read-v1");
  assert.equal(ShortRead.scoringContractVersion, ShortReadContract.CONTRACT_VERSION);
  assert.equal(ShortRead.items.length, 3);
  const all = ShortReadContract.validateAll(ShortRead.items, { Go, PracticeContract });
  assert.equal(all.ok, true, all.errors.join("; "));
  for (const item of ShortRead.items) {
    const pair = ShortReadContract.deriveReplyPair(item.baseItem, PracticeContract);
    assert.equal(pair.length, 2, item.id);
    assert.ok(pair.some((point) => ShortReadContract.samePoint(point, item.defenderReply)), item.id);
    assert.deepEqual(ShortReadContract.complement(pair, item.defenderReply), item.attackerFollowup, item.id);
    const scored = ShortReadContract.scoreFollowup(item, item.attackerFollowup, { Go, PracticeContract });
    assert.equal(scored.ok, true, item.id);
    assert.equal(scored.correct, true, item.id);
  }
});

test("刀把五 short-read 對非 A/B 回應、錯誤 complement 與舊座標 fail closed", () => {
  const seed = ShortRead.items[0];
  const pair = ShortReadContract.deriveReplyPair(seed.baseItem, PracticeContract);
  const outside = seed.baseItem.eyeSpace.find((point) => !pair.some((candidate) => ShortReadContract.samePoint(candidate, point)) && !ShortReadContract.samePoint(point, seed.baseItem.vitalPoint));
  const badDefender = { ...seed, id: "bad-defender", defenderReply: outside };
  assert.equal(ShortReadContract.validateItem(badDefender, { Go, PracticeContract }).ok, false);

  const badFollow = { ...seed, id: "bad-follow", attackerFollowup: seed.defenderReply };
  assert.equal(ShortReadContract.validateItem(badFollow, { Go, PracticeContract }).ok, false);

  const mirror = ShortRead.items.find((item) => item.variantId === "short-read-mirror");
  assert.ok(mirror);
  assert.notDeepEqual(mirror.attackerFollowup, seed.attackerFollowup);
  const staleSeedMove = ShortReadContract.scoreFollowup(mirror, seed.attackerFollowup, { Go, PracticeContract });
  assert.equal(staleSeedMove.ok, true);
  assert.equal(staleSeedMove.correct, false);
});

test("刀把五 short-read UI 明示只覆蓋 A/B 主分支，未列分支保持 UNKNOWN", () => {
  assert.match(html, /刀把五：A\/B 互補短讀/);
  assert.match(html, /只判來源支持的 A\/B 互補主分支/);
  assert.match(html, /未列分支保持 UNKNOWN/);
  assert.match(js, /GoClassicShapeReadContract/);
  assert.match(js, /未列分支仍是 UNKNOWN/);
});


test("刀把五 sealed reduction 兩個 variant 在零外氣條件下都收束成 square four", () => {
  assert.equal(Reduction.version, "classic-shape-reduction-v1");
  assert.equal(Reduction.scoringContractVersion, ReductionContract.CONTRACT_VERSION);
  assert.equal(Reduction.items.length, 2);
  const all = ReductionContract.validateAll(Reduction.items, { Go, PracticeContract });
  assert.equal(all.ok, true, all.errors.join("; "));
  for (const item of Reduction.items) {
    const validation = ReductionContract.validateItem(item, { Go, PracticeContract });
    assert.equal(validation.ok, true, item.id);
    assert.equal(validation.reductionPoints.length, 3, item.id);
    const result = ReductionContract.finalize(item, validation.reductionPoints, { Go, PracticeContract });
    assert.equal(result.ok, true, item.id);
    assert.equal(result.complete, true, item.id);
    assert.equal(result.status, "SQUARE_FOUR_REACHED", item.id);
    assert.equal(result.result.sealedBefore, true, item.id);
    assert.equal(result.result.forcedCapture, true, item.id);
    assert.equal(result.result.capturedInner.length, 4, item.id);
    assert.deepEqual(result.result.defenderLiberties, [validation.capturePoint], item.id);
    assert.deepEqual(
      result.result.result ? result.result.result : undefined,
      undefined
    );
  }
});

test("sealed reduction 三顆縮眼子的次序可交換，但不能下突出 capture point", () => {
  const item = Reduction.items[0];
  const validation = ReductionContract.validateItem(item, { Go, PracticeContract });
  assert.equal(validation.ok, true);
  const [a,b,c] = validation.reductionPoints;
  for (const order of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]]) {
    const result = ReductionContract.finalize(item, order, { Go, PracticeContract });
    assert.equal(result.complete, true, order.map(String).join(" -> "));
  }
  const wrong = ReductionContract.scoreNext(item, [], validation.capturePoint, { Go, PracticeContract });
  assert.equal(wrong.ok, true);
  assert.equal(wrong.correct, false);
});

test("有外氣時 sealed reduction 不得錯報 forced capture 或 square-four terminal", () => {
  const item = Reduction.items[0];
  const validation = ReductionContract.validateItem(item, { Go, PracticeContract });
  assert.equal(validation.ok, true);
  const open = ReductionContract.replay(item, validation.reductionPoints, { Go, PracticeContract }, { sealed:false });
  assert.equal(open.ok, true);
  assert.equal(open.sealedBefore, false);
  assert.equal(open.forcedCapture, false);
  assert.equal(open.squareFourReached, false);
});


test("sealed reduction UI 明示零外氣前提與 square-four terminal", () => {
  assert.match(html, /刀把五：手抜き後如何縮成方四/);
  assert.match(html, /守方整串無外氣/);
  assert.match(html, /若有外氣，本 contract 直接判定不適用/);
  assert.match(html, /提四子 → 方四/);
  assert.match(js, /GoClassicShapeReductionContract/);
  assert.match(js, /其他應手與有外氣局面仍是 UNKNOWN/);
});


test("梅花五四個 variant 通過 cross-five geometry + rules bounded contract", () => {
  assert.equal(CrossFive.version, "cross-five-practice-v1");
  assert.equal(CrossFive.scoringContractVersion, CrossFiveContract.CONTRACT_VERSION);
  assert.equal(CrossFive.items.length, 4);
  const all = CrossFiveContract.validateAll(CrossFive.items, { Go, PracticeContract });
  assert.equal(all.ok, true, all.errors.join("; "));
  for (const item of CrossFive.items) {
    const center = CrossFiveContract.deriveCenter(item.eyeSpace, PracticeContract);
    assert.deepEqual(center, item.vitalPoint, item.id);
    const scored = CrossFiveContract.score(item, item.vitalPoint, { Go, PracticeContract });
    assert.equal(scored.ok, true, item.id);
    assert.equal(scored.correct, true, item.id);
    assert.equal(scored.status, "CORRECT", item.id);
  }
});

test("梅花五 contract 對非十字幾何、錯誤中心與平移後舊座標 fail closed", () => {
  const seed = CrossFive.items[0];
  const wrongGeometry = {
    ...seed,
    id: "cross-wrong-geometry",
    eyeSpace: [[2,2],[3,2],[4,2],[2,3],[3,3]]
  };
  assert.equal(CrossFiveContract.validateItem(wrongGeometry, { Go, PracticeContract }).ok, false);

  const wrongVital = { ...seed, id: "cross-wrong-vital", vitalPoint: [3,2] };
  assert.equal(CrossFiveContract.validateItem(wrongVital, { Go, PracticeContract }).ok, false);

  const shifted = CrossFive.items.find((item) => item.variantId === "defend-left-shift");
  assert.ok(shifted);
  assert.notDeepEqual(shifted.vitalPoint, seed.vitalPoint);
  const stale = CrossFiveContract.score(shifted, seed.vitalPoint, { Go, PracticeContract });
  assert.equal(stale.ok, true);
  assert.equal(stale.correct, false);
});

test("梅花五 UI 明示棋形中央而非棋盤中央，且不升格完整答案樹", () => {
  assert.match(html, /梅花五：不要找棋盤中央，要找棋形中央/);
  assert.match(html, /唯一的 degree-4 中心/);
  assert.match(html, /不宣稱完整五目中手答案樹/);
  assert.match(js, /GoCrossFiveContract/);
  assert.match(js, /不代表完整五目中手答案樹或 mastery/);
});


test("contrast practice 交錯兩個 family，且不複製答案欄位", () => {
  assert.equal(Contrast.version, "classic-contrast-practice-v1");
  assert.equal(Contrast.scoringContractVersion, ContrastContract.CONTRACT_VERSION);
  assert.equal(Contrast.rounds.length, 6);
  const deps = {
    Go,
    BulkyPractice: Practice,
    BulkyContract: PracticeContract,
    CrossPractice: CrossFive,
    CrossContract: CrossFiveContract
  };
  const all = ContrastContract.validateAll(Contrast.rounds, deps);
  assert.equal(all.ok, true, all.errors.join("; "));
  assert.equal(all.familyCounts["bulky-five"], 3);
  assert.equal(all.familyCounts["cross-five"], 3);
  for (const round of Contrast.rounds) {
    for (const field of ContrastContract.FORBIDDEN_FIELDS) {
      assert.equal(Object.prototype.hasOwnProperty.call(round, field), false, round.id + " duplicates " + field);
    }
  }
});

test("contrast scoring 完全委託原 family contract", () => {
  const deps = {
    Go,
    BulkyPractice: Practice,
    BulkyContract: PracticeContract,
    CrossPractice: CrossFive,
    CrossContract: CrossFiveContract
  };
  for (const round of Contrast.rounds) {
    const resolved = ContrastContract.resolveSource(round, deps);
    assert.ok(resolved, round.id);
    const source = resolved.item;
    const direct = round.sourceType === "bulky-five"
      ? PracticeContract.score(source, source.vitalPoint, Go)
      : CrossFiveContract.score(source, source.vitalPoint, { Go, PracticeContract });
    const delegated = ContrastContract.score(round, source.vitalPoint, deps);
    assert.equal(direct.ok, true, round.id);
    assert.equal(direct.correct, true, round.id);
    assert.equal(delegated.ok, true, round.id);
    assert.equal(delegated.correct, direct.correct, round.id);
    assert.equal(delegated.sourceItemId, source.id, round.id);
  }
});

test("contrast contract 對連續同 family、缺 source 與偷偷塞答案 fail closed", () => {
  const deps = {
    Go,
    BulkyPractice: Practice,
    BulkyContract: PracticeContract,
    CrossPractice: CrossFive,
    CrossContract: CrossFiveContract
  };
  const duplicatedFamily = Contrast.rounds.map((round) => ({ ...round }));
  duplicatedFamily[1] = { ...duplicatedFamily[0], id: "contrast-bad-repeat", sourceItemId: "bulky-five-attack-mirror-v1" };
  assert.equal(ContrastContract.validateAll(duplicatedFamily, deps).ok, false);

  const missing = { ...Contrast.rounds[0], id: "contrast-missing", sourceItemId: "missing-item" };
  assert.equal(ContrastContract.validateRound(missing, deps).ok, false);

  const leaked = { ...Contrast.rounds[0], id: "contrast-leaked", vitalPoint: [3,3] };
  assert.equal(ContrastContract.validateRound(leaked, deps).ok, false);
});

test("contrast UI 首答前隱藏 family，答後才揭示，且不宣稱 transfer", () => {
  assert.match(html, /刀把五 vs 梅花五：混合辨形/);
  assert.match(html, /作答前不顯示名稱/);
  assert.match(html, /contrast layer 不保存答案/);
  assert.match(html, /答對只代表這一題第一手正確，不代表 transfer 或 mastery/);
  assert.match(js, /\$\("contrast-reveal"\)\.hidden=true/);
  assert.match(js, /不代表已證明跨 family transfer/);
});


test("直三首屏明示單題落子操作，且 shared grid-area 不得把題幹卡擠走", () => {
  assert.match(html, /這是單題落子練習，不是自由對局/);
  assert.match(html, /請在棋盤空點下 1 手/);
  assert.match(html, /錯答與正答都會立即顯示回饋/);
  assert.match(html, /9 × 9 單題落子練習/);
  assert.match(css, /\.classic-grid\{display:grid;grid-template-areas:"question board"/);
  assert.match(css, /\.bulky-practice-grid\{display:grid;grid-template-areas:"question board"/);
});

test("直三棋盤已有棋子與游標圈不再造成無反應點擊", () => {
  assert.match(js, /function initialClassicCursor/);
  assert.match(js, /class="stone-black classic-occupied"/);
  assert.match(js, /class="stone-white classic-occupied"/);
  assert.match(js, /這裡已有棋子。先找眼空或邊界中的可落子點。/);
  assert.match(css, /classic-cursor-ring\{[^}]*pointer-events:none/);
});


test("四段探索明確只屬於直三，不冒充所有名型共用流程", () => {
  assert.match(html, /直三專用 · 4 段探索/);
  assert.match(html, /下面四格只屬於直三/);
  assert.match(html, /其他名型依各自 geometry／scoring contract 安排，不固定套用這四步/);
  assert.match(html, /1 直三 · 找急所/);
  assert.match(html, /2 直三 · 換方向/);
  assert.match(html, /3 直三 · 換攻方/);
  assert.match(html, /4 直三 · 相似反例/);
  assert.match(html, /aria-label="直三專用探索進度"/);
});


test("花六四個 variant 通過 Rabbity Six geometry + rules bounded contract", () => {
  assert.equal(FlowerSix.version, "flower-six-practice-v1");
  assert.equal(FlowerSix.scoringContractVersion, FlowerSixContract.CONTRACT_VERSION);
  assert.equal(FlowerSix.items.length, 4);
  const all = FlowerSixContract.validateAll(FlowerSix.items, { Go, PracticeContract });
  assert.equal(all.ok, true, all.errors.join("; "));
  for (const item of FlowerSix.items) {
    const vital = FlowerSixContract.deriveVitalPoint(item.eyeSpace, PracticeContract);
    assert.deepEqual(vital, item.vitalPoint, item.id);
    const scored = FlowerSixContract.score(item, item.vitalPoint, { Go, PracticeContract });
    assert.equal(scored.ok, true, item.id);
    assert.equal(scored.correct, true, item.id);
    assert.equal(scored.status, "CORRECT", item.id);
  }
});

test("花六 contract 對錯誤六點幾何、錯誤急所與位移後舊座標 fail closed", () => {
  const seed = FlowerSix.items[0];
  const wrongGeometry = {
    ...seed,
    id: "flower-six-wrong-geometry",
    eyeSpace: [[2,2],[3,2],[4,2],[2,3],[3,3],[4,3]]
  };
  assert.equal(FlowerSixContract.validateItem(wrongGeometry, { Go, PracticeContract }).ok, false);

  const wrongVital = { ...seed, id: "flower-six-wrong-vital", vitalPoint: [3,3] };
  assert.equal(FlowerSixContract.validateItem(wrongVital, { Go, PracticeContract }).ok, false);

  const shifted = FlowerSix.items.find((item) => item.variantId === "attack-shift");
  assert.ok(shifted);
  assert.notDeepEqual(shifted.vitalPoint, seed.vitalPoint);
  const stale = FlowerSixContract.score(shifted, seed.vitalPoint, { Go, PracticeContract });
  assert.equal(stale.ok, true);
  assert.equal(stale.correct, false);
});

test("花六 catalog 與 UI 區分 Rabbity Six geometry 和仍待核對的葡萄六名稱", () => {
  const flower = Catalog.entries.find((entry) => entry.id === "flower-six-v1");
  const grape = Catalog.entries.find((entry) => entry.id === "grape-six-candidate-v1");
  assert.equal(flower.practiceStatus, "playable_bounded_vital_point_contract");
  assert.ok(flower.aliases.some((alias) => alias.locale === "en" && alias.name === "Rabbity Six" && alias.reviewStatus === Catalog.REVIEW.VERIFIED));
  assert.ok(flower.sources.some((source) => source.sourceTier === "primary_research"));
  assert.equal(grape.practiceStatus, "catalog_candidate_only");
  assert.equal(grape.aliases.some((alias) => alias.name === "Rabbity Six"), false);
  assert.match(html, /花六／Rabbity Six：找兩個「耳朵」的根部/);
  assert.match(html, /「葡萄六」仍保持待核對，不直接合併/);
  assert.match(html, /不宣稱完整六目中手長變化或 12 手吃淨答案樹/);
  assert.match(js, /GoFlowerSixContract/);
  assert.match(js, /不代表完整六目中手長變化、mastery 或 transfer/);
});


test("金雞獨立四個 variant 通過 rules-backed 雙重氣緊機制", () => {
  assert.equal(GoldenChicken.version, "golden-chicken-practice-v1");
  assert.equal(GoldenChicken.scoringContractVersion, GoldenChickenContract.CONTRACT_VERSION);
  assert.equal(GoldenChicken.items.length, 4);
  const all = GoldenChickenContract.validateAll(GoldenChicken.items, Go);
  assert.equal(all.ok, true, all.errors.join("; "));

  for (const item of GoldenChicken.items) {
    const validation = GoldenChickenContract.validateItem(item, Go);
    assert.equal(validation.ok, true, validation.errors.join("; "));
    const { position, mechanism } = validation;
    const before = Go.groupAt(mechanism.boardBefore, position.anchor[0], position.anchor[1]);
    const after = Go.groupAt(mechanism.boardAfterDescent, position.descent[0], position.descent[1]);
    assert.deepEqual(before.liberties, [position.descent]);
    assert.equal(after.liberties.length, 2);
    assert.equal(mechanism.noEntryChecks.length, 2);
    assert.ok(mechanism.noEntryChecks.every((check) => check.opponentLegal === false));
    assert.ok(mechanism.noEntryChecks.every((check) => check.playerCaptureLegal && check.capturedByPlayer === 2));
    assert.equal(GoldenChickenContract.score(item, position.descent, Go).correct, true);
  }
});

test("金雞獨立 contract 對錯棋形、錯答案與舊座標 fail closed", () => {
  const seed = GoldenChicken.items[0];
  const seedValidation = GoldenChickenContract.validateItem(seed, Go);
  const wrongSetup = seedValidation.position.setupStones.filter((_, index) => index !== 2);
  const wrongPosition = { ...seedValidation.position, setupStones: wrongSetup };
  const wrongGeometry = GoldenChickenContract.validateMechanism(wrongPosition, Go);
  assert.equal(wrongGeometry.ok, false);

  let legalWrong = null;
  const board = Go.boardFromStones(seedValidation.position.setupStones, seed.boardSize);
  for (let y=0; y<seed.boardSize && !legalWrong; y+=1) for (let x=0; x<seed.boardSize && !legalWrong; x+=1) {
    if (x === seedValidation.position.descent[0] && y === seedValidation.position.descent[1]) continue;
    const result = Go.playMove(board, x, y, seedValidation.position.playerColor);
    if (result.legal) legalWrong = [x,y];
  }
  assert.ok(legalWrong);
  assert.equal(GoldenChickenContract.score(seed, legalWrong, Go).correct, false);

  const rotated = GoldenChicken.items.find((item) => item.variantId === "black-right");
  const rotatedPosition = GoldenChickenContract.materializeItem(rotated);
  assert.notDeepEqual(rotatedPosition.descent, GoldenChickenContract.BASE_DESCENT);
  const stale = GoldenChickenContract.score(rotated, GoldenChickenContract.BASE_DESCENT, Go);
  assert.equal(stale.correct, false);

  const leaked = { ...seed, id:"golden-leaked-answer", answer:GoldenChickenContract.BASE_DESCENT };
  assert.equal(GoldenChickenContract.validateItem(leaked, Go).ok, false);
});

test("金雞獨立 catalog 與 UI 保留 tesuji/nakade authority boundary", () => {
  const entry = Catalog.entries.find((item) => item.id === "golden-chicken-candidate-v1");
  assert.equal(entry.practiceStatus, "playable_rules_backed_tesuji_mechanism_contract");
  assert.equal(entry.category, "tesuji");
  assert.ok(entry.sources.some((source) => source.label.includes("中央棋院")));
  assert.ok(entry.sources.some((source) => source.label.includes("Sensei")));
  assert.equal(entry.entityType, Catalog.ENTITY_TYPE.TESUJI_MECHANISM);
  assert.equal(entry.geometryIdentity.contractVersion, "classic-golden-chicken-mechanism-v1");
  assert.ok(entry.negativeMappings.some((item) => item.name === "static nakade shape"));
  assert.match(html, /不是大眼中手，是雙重氣緊手筋/);
  assert.match(html, /不和刀把五、梅花五、花六共用 nakade geometry contract/);
  assert.match(js, /GoGoldenChickenContract/);
  assert.doesNotMatch(require("node:fs").readFileSync(require("node:path").join(root,"classic-golden-chicken-contract.js"),"utf8"), /https?:\/\/.*\.(png|jpg|jpeg|sgf)/i);
});


test("大豬嘴 source-case 四個 variant 綁定 exact MIT regression position", () => {
  assert.equal(BigPigsMouth.version, "big-pigs-mouth-source-practice-v1");
  assert.equal(BigPigsMouth.scoringContractVersion, BigPigsMouthContract.CONTRACT_VERSION);
  assert.equal(BigPigsMouth.items.length, 4);
  const all = BigPigsMouthContract.validateAll(BigPigsMouth.items, Go);
  assert.equal(all.ok, true, all.errors.join("; "));

  const seed = BigPigsMouth.items[0];
  const position = BigPigsMouthContract.materializeItem(seed);
  assert.equal(position.setupStones.length, 51);
  assert.deepEqual(position.expectedMove, [16,18]);
  const scored = BigPigsMouthContract.score(seed, position.expectedMove, Go);
  assert.equal(scored.ok, true);
  assert.equal(scored.correct, true);
  assert.equal(scored.scope, "exact_source_position_first_move_only");
});

test("大豬嘴 source-case 對錯棋形、錯答案與旋轉後舊座標 fail closed", () => {
  const seed = BigPigsMouth.items[0];
  const seedPosition = BigPigsMouthContract.materializeItem(seed);
  const wrongGeometry = seedPosition.setupStones.slice(1);
  assert.equal(BigPigsMouthContract.validatePosition(wrongGeometry).ok, false);

  const board = Go.boardFromStones(seedPosition.setupStones, seed.boardSize);
  let wrongMove = null;
  for (let y=0; y<seed.boardSize && !wrongMove; y+=1) for (let x=0; x<seed.boardSize && !wrongMove; x+=1) {
    if (BigPigsMouthContract.samePoint([x,y], seedPosition.expectedMove)) continue;
    if (Go.playMove(board,x,y,Go.WHITE).legal) wrongMove=[x,y];
  }
  assert.ok(wrongMove);
  assert.equal(BigPigsMouthContract.score(seed, wrongMove, Go).correct, false);

  const rotated = BigPigsMouth.items.find((item) => item.variantId === "source-rot90");
  const rotatedPosition = BigPigsMouthContract.materializeItem(rotated);
  assert.notDeepEqual(rotatedPosition.expectedMove, BigPigsMouthContract.BASE_EXPECTED_MOVE);
  assert.equal(BigPigsMouthContract.score(rotated, BigPigsMouthContract.BASE_EXPECTED_MOVE, Go).correct, false);

  const leaked = { ...seed, id:"big-pig-leaked-answer", answer:BigPigsMouthContract.BASE_EXPECTED_MOVE };
  assert.equal(BigPigsMouthContract.validateItem(leaked, Go).ok, false);
});

test("大豬嘴 catalog/UI 明示 source-case 與 family generalization 分離", () => {
  const entry = Catalog.entries.find((item) => item.id === "big-pigs-mouth-candidate-v1");
  assert.equal(entry.practiceStatus, "playable_source_case_first_move_contract");
  assert.ok(entry.aliases.some((alias) => alias.name === "J Group"));
  assert.ok(entry.sources.some((source) => source.sourceTier === "oss_regression"));
  assert.equal(entry.geometryIdentity.kind, "source_position_plus_unresolved_family");
  assert.equal(entry.geometryIdentity.conditions.familyGeometry, "pending");
  assert.match(html, /大豬嘴／J Group：先限定在一個可追溯實戰 case/);
  assert.match(html, /完整 19×19 source position 才是本 contract 的 canonical identity/);
  assert.match(html, /不宣稱 R1 是所有大豬嘴／J Group 的共同答案/);
  assert.match(js, /GoBigPigsMouthSourceCaseContract/);
  assert.match(js, /標準 family geometry、主要 variation 與一般化仍是 UNKNOWN/);
});

test("大豬嘴 source-case 有 MIT provenance notice，不把上游 SGF 當本站自有題庫", () => {
  const notice = fs.readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
  assert.match(notice, /bood\/go-test/);
  assert.match(notice, /Copyright \(c\) 2018 Bood Qian/);
  assert.match(notice, /MIT License/);
  assert.match(notice, /does \*\*not\*\* claim.*canonical geometry/i);
  const contractSource = fs.readFileSync(path.join(root, "classic-big-pigs-mouth-contract.js"), "utf8");
  assert.match(contractSource, /SOURCE_LICENSE/);
  assert.match(contractSource, /source-case scoped/);
});


test("丁四四個 variant 由 T geometry 推導唯一 degree-3 急所", () => {
  assert.equal(PyramidFour.version, "pyramid-four-practice-v1");
  assert.equal(PyramidFour.scoringContractVersion, PyramidFourContract.CONTRACT_VERSION);
  assert.equal(PyramidFour.items.length, 4);
  const all = PyramidFourContract.validateAll(PyramidFour.items, { Go, PracticeContract });
  assert.equal(all.ok, true, all.errors.join("; "));
  for (const item of PyramidFour.items) {
    assert.equal(Object.prototype.hasOwnProperty.call(item, "vitalPoint"), false, item.id);
    const validation = PyramidFourContract.validateItem(item, { Go, PracticeContract });
    assert.equal(validation.ok, true, validation.errors.join("; "));
    const derived = PyramidFourContract.deriveCenter(item.eyeSpace, PracticeContract);
    assert.deepEqual(validation.vitalPoint, derived, item.id);
    const scored = PyramidFourContract.score(item, derived, { Go, PracticeContract });
    assert.equal(scored.ok, true, item.id);
    assert.equal(scored.correct, true, item.id);
  }
});

test("丁四 contract 對錯 geometry、偷塞答案與位移後舊座標 fail closed", () => {
  const seed = PyramidFour.items[0];
  const wrongGeometry = { ...seed, id:"pyramid-wrong-geometry", eyeSpace:[[2,2],[3,2],[4,2],[5,2]] };
  assert.equal(PyramidFourContract.validateItem(wrongGeometry, { Go, PracticeContract }).ok, false);

  const leaked = { ...seed, id:"pyramid-leaked-answer", vitalPoint:[3,3] };
  assert.equal(PyramidFourContract.validateItem(leaked, { Go, PracticeContract }).ok, false);

  const shifted = PyramidFour.items.find((item) => item.variantId === "attack-shift");
  const seedVital = PyramidFourContract.deriveCenter(seed.eyeSpace, PracticeContract);
  const shiftedVital = PyramidFourContract.deriveCenter(shifted.eyeSpace, PracticeContract);
  assert.notDeepEqual(shiftedVital, seedVital);
  const stale = PyramidFourContract.score(shifted, seedVital, { Go, PracticeContract });
  assert.equal(stale.ok, true);
  assert.equal(stale.correct, false);
});

test("丁四 catalog/UI 維持 geometry identity 與 bounded first-move claim", () => {
  const entry = Catalog.entries.find((item) => item.id === "pyramid-four-v1");
  assert.equal(entry.preferredZhTW, "丁四");
  assert.equal(entry.practiceStatus, "playable_bounded_geometry_derived_vital_point_contract");
  assert.ok(entry.aliases.some((alias) => alias.name === "Pyramid Four" && alias.reviewStatus === Catalog.REVIEW.VERIFIED));
  assert.ok(entry.sources.some((source) => source.label.includes("YeeFan")));
  assert.equal(entry.geometryIdentity.contractVersion, "classic-pyramid-four-vital-point-v1");
  assert.equal(entry.geometryIdentity.fingerprint, "T-tetromino");
  assert.match(html, /丁四／Pyramid Four：T 形中心就是共同急所/);
  assert.match(html, /不在題目資料保存答案/);
  assert.match(html, /唯一 degree-3 點/);
  assert.match(js, /GoPyramidFourContract/);
  assert.match(js, /不代表完整吃淨答案樹、mastery 或 transfer/);
});
