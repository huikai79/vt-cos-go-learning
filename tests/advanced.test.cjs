const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const content = require("../advanced-content.js");
const Events = require("../advanced-events.js");
const SequenceEvents = require("../advanced-sequence-events.js");
const SequenceContract = require("../advanced-sequence-contract.js");
const SequencePolicy = require("../advanced-sequence-policy.js");
const Go = require("../go.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "advanced.html"), "utf8");
const js = fs.readFileSync(path.join(root, "advanced.js"), "utf8");
const sequenceJs = fs.readFileSync(path.join(root, "advanced-sequence.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

function memoryStorage(initial = null) {
  const data = new Map();
  if (initial !== null) data.set(Events.STORAGE_KEY, initial);
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, value); },
    removeItem(key) { data.delete(key); }
  };
}

test("進階頁不是第 16 單元，且明示 practice-only 證據邊界", () => {
  assert.match(html, /這不是第 16 單元/);
  assert.match(html, /href="index\.html">← 悟之一手首頁<\/a>/);
  assert.match(html, /href="index\.html#core">核心課程<\/a>/);
  assert.doesNotMatch(indexHtml, /class="[^"]*intro-path-action[^"]*" href="advanced\.html"/);
  assert.match(indexHtml, /data-site-intro-unit="5">從這裡開始/);
  assert.match(indexHtml, /data-site-intro-unit="10">從這裡開始/);
  assert.match(html, /不影響核心課程的學習紀錄、複習安排或正式評量/);
  assert.match(html, /先作答再看完整理由；答錯可重試，但首答會和重試分開保存/);
  assert.match(js, /answer_first/);
  assert.match(js, /answer_retry/);
});

test("進階 choice scaffold 保留三條局部訓練線並提供 19 路全盤 practice", () => {
  assert.equal(content.version, 9);
  assert.equal(content.scoringContractVersion, "advanced-choice-v1");
  assert.equal(content.tracks.filter((track) => track.status === "active").length, 4);
  const full = content.tracks.find((track) => track.id === "full-board-review");
  assert.equal(full.status, "active");
  assert.equal(full.href, "live-game.html?size=19");
  assert.match(full.summary, /全盤實戰練習/);
  assert.match(html, /不納入正式能力評量/);
  assert.equal(content.experiences.length, 12);
  for (const item of content.experiences) {
    assert.ok(content.tracks.some((track) => track.id === item.trackId));
    assert.ok(item.choices.length >= 3, item.id);
    assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length, item.id);
    assert.ok(Array.isArray(item.demoSteps) && item.demoSteps.length >= 3, item.id);
    assert.ok(Array.isArray(item.terms) && item.terms.length >= 2, item.id);
  }
});

test("打吃方向以 teaching candidate/task features 進入 choice practice，不直接升格 KC", () => {
  const items = content.experiences.filter((item) => item.candidateId === "capture-semeai-track-v1");
  assert.deepEqual(items.map((item) => item.id), ["adv-r09", "adv-r10"]);
  assert.deepEqual(items.map((item) => item.taskFeatures.atariDirectionGoal), ["edge_constraint", "prevent_connection"]);
  for (const item of items) {
    assert.equal(item.candidateStatus, "teaching_candidate");
    assert.equal(item.kcStatus, "not_promoted");
    assert.equal(item.taskFeatures.capturePattern, "atari_direction");
    assert.equal(item.taskFeatures.eyeCondition, "none");
    assert.equal(item.taskFeatures.approachMoveRequired, false);
    assert.equal(item.taskFeatures.terminalCaptureResult, "not_asserted");
    assert.ok(Array.isArray(item.demoSteps) && item.demoSteps.length >= 3);
  }
  assert.equal(content.sequenceExperiences.some((item) => item.familyId === "atari-direction"), false);
  assert.equal(content.sequenceExperiences.some((item) => item.candidateId === "capture-semeai-track-v1"), false);
});

test("雙打吃 Teaching Candidate 由 rules engine 驗證同一手同時讓兩串分離白棋各剩一氣", () => {
  const item = content.experiences.find((experience) => experience.id === "adv-r11");
  assert.ok(item);
  assert.equal(item.candidateId, "capture-patterns-v1");
  assert.equal(item.candidateStatus, "teaching_candidate");
  assert.equal(item.kcStatus, "not_promoted");
  assert.equal(item.sourceReviewId, "capture-pattern-concept-anchors-v1");
  assert.equal(item.taskFeatures.capturePattern, "double_atari");
  assert.equal(item.taskFeatures.simultaneousAtariTargets, 2);
  assert.equal(item.taskFeatures.immediateCaptureCount, 0);

  const board = Go.boardFromStones(item.demoSteps[0].stones, item.demoSteps[0].boardSize);
  const beforeUpper = Go.groupAt(board, 2, 1);
  const beforeLower = Go.groupAt(board, 2, 3);
  assert.equal(beforeUpper.liberties.length, 2);
  assert.equal(beforeLower.liberties.length, 2);
  assert.notDeepEqual(beforeUpper.stones, beforeLower.stones);

  const move = Go.playMove(board, 2, 2, Go.BLACK);
  assert.equal(move.legal, true);
  assert.equal(move.captured.length, 0);
  assert.equal(Go.groupAt(move.board, 2, 1).liberties.length, 1);
  assert.equal(Go.groupAt(move.board, 2, 3).liberties.length, 1);

  const simultaneous = [];
  for (let y = 0; y < item.demoSteps[0].boardSize; y += 1) {
    for (let x = 0; x < item.demoSteps[0].boardSize; x += 1) {
      const trial = Go.playMove(board, x, y, Go.BLACK);
      if (!trial.legal || trial.captured.length !== 0) continue;
      const upper = Go.groupAt(trial.board, 2, 1);
      const lower = Go.groupAt(trial.board, 2, 3);
      if (upper && lower && upper.liberties.length === 1 && lower.liberties.length === 1) simultaneous.push([x, y]);
    }
  }
  assert.deepEqual(simultaneous, [[2, 2]]);

  const whiteSave = Go.playMove(move.board, 3, 1, Go.WHITE);
  assert.equal(whiteSave.legal, true);
  const blackCapture = Go.playMove(whiteSave.board, 1, 3, Go.BLACK);
  assert.equal(blackCapture.legal, true);
  assert.deepEqual(blackCapture.captured, [[2, 3]]);
});

test("門吃與抱吃仍停在研究術語候選，不偷塞進 learner-facing Experience 或 KC", () => {
  assert.equal(content.experiences.some((item) => item.taskFeatures?.capturePattern === "door_capture"), false);
  assert.equal(content.experiences.some((item) => item.taskFeatures?.capturePattern === "hug_capture"), false);
  assert.equal(content.sequenceExperiences.some((item) => ["door-capture", "hug-capture", "double-atari"].includes(item.familyId)), false);
});

test("包圍吃子 Teaching Candidate 只升共同機制，不替門吃／抱吃建立 KC 或來源標籤", () => {
  const item = content.experiences.find((experience) => experience.id === "adv-r12");
  assert.ok(item);
  assert.equal(item.candidateId, "capture-patterns-v1");
  assert.equal(item.candidateStatus, "teaching_candidate");
  assert.equal(item.kcStatus, "not_promoted");
  assert.equal(item.sourceReviewId, "capture-pattern-concept-anchors-v1");
  assert.equal(item.taskFeatures.capturePattern, "enclosure_capture");
  assert.deepEqual(item.taskFeatures.sourceTermCandidates, ["門吃", "抱吃"]);
  assert.equal(item.taskFeatures.sourceLabelSplit, "unknown");
  assert.equal(item.taskFeatures.connectionCut, true);
  assert.equal(item.taskFeatures.targetLibertiesBefore, 2);
  assert.equal(item.taskFeatures.targetLibertiesAfterCut, 1);
  assert.equal(item.taskFeatures.forcedExtensionRemainsAtari, true);
  assert.equal(item.taskFeatures.nextMoveCapturesTarget, true);
  assert.equal(content.sequenceExperiences.some((entry) => entry.familyId === "enclosure-capture"), false);
});

test("包圍吃子 learner-facing 文案明示重新數氣，不把教材名稱當答案", () => {
  const item = content.experiences.find((experience) => experience.id === "adv-r12");
  assert.match(item.explanation, /先不要求背名稱/);
  assert.match(item.explanation, /延長後若仍只有一口氣/);
  assert.match(item.explanation, /不能硬套/);
  assert.equal(item.title.includes("門吃"), false);
  assert.equal(item.title.includes("抱吃"), false);
});

test("打吃方向新增不改寫既有 fixed-interleave sequence policy 或四個 family", () => {
  assert.equal(SequencePolicy.VERSION, "advanced-fixed-interleave-v1");
  const validation = SequencePolicy.validateCatalog(content.sequenceExperiences);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.deepEqual(SequenceContract.summarizeFamilies(content.sequenceExperiences).map((family) => family.familyId), [
    "snapback", "net", "semeai", "ladder"
  ]);
});

test("進階示意圖沿用固定 marker 語義，不把 reference 當禁著", () => {
  for (const item of content.experiences) {
    for (const step of item.demoSteps) {
      const blocked = new Set((step.blocked || []).map((point) => point.join(",")));
      for (const point of step.reference || []) {
        assert.equal(blocked.has(point.join(",")), false, item.id + " reference/blocked 語義衝突");
      }
    }
  }
  assert.match(html, /紅叉：這一步不能下/);
  assert.match(html, /藍框：比較／前一步位置/);
});

test("進階 event store 保留首答與 retry，不以最後答對覆寫首答", () => {
  const storage = memoryStorage();
  const common = {
    sessionId: "s1",
    presentationId: "p1",
    experienceId: "adv-r01",
    trackId: "reading-tesuji",
    occurredAt: "2026-09-26T10:00:00.000Z"
  };
  const presented = Events.append(storage, { ...common, eventId: "e1", type: "presented" });
  assert.equal(presented.ok, true);
  const first = Events.append(storage, { ...common, eventId: "e2", type: "answer_first", selectedIndex: 2, correct: false });
  assert.equal(first.ok, true);
  const retry = Events.append(storage, { ...common, eventId: "e3", type: "answer_retry", selectedIndex: 0, correct: true });
  assert.equal(retry.ok, true);
  const complete = Events.append(storage, { ...common, eventId: "e4", type: "completed", selectedIndex: 0, correct: true });
  assert.equal(complete.ok, true);
  const store = Events.read(storage).store;
  assert.deepEqual(store.events.filter((event) => event.type.startsWith("answer_")).map((event) => [event.type, event.correct]), [
    ["answer_first", false],
    ["answer_retry", true]
  ]);
  const summary = Events.summarize(store);
  assert.equal(summary.firstAnswers, 1);
  assert.equal(summary.firstCorrect, 0);
  assert.equal(summary.retries, 1);
  assert.equal(summary.completedExperiences, 1);
  assert.equal(summary.formalEligible, false);
});

test("進階 event store 遇到損壞資料 fail closed，不猜測修復", () => {
  const storage = memoryStorage("{broken");
  const result = Events.read(storage);
  assert.equal(result.ok, false);
  assert.equal(result.error, "advanced_event_store_malformed");
  const append = Events.append(storage, {
    eventId: "e1",
    sessionId: "s1",
    presentationId: "p1",
    experienceId: "adv-r01",
    trackId: "reading-tesuji",
    type: "presented",
    occurredAt: "2026-09-26T10:00:00.000Z"
  });
  assert.equal(append.ok, false);
});


test("核心課程提供獨立進階訓練入口，不偽裝成第 16 單元", () => {
  assert.match(indexHtml, /href="advanced\.html">進階訓練</);
  assert.match(indexHtml, /15 單元核心課程/);
  assert.match(html, /這不是第 16 單元/);
});


test("進階 v5 的八個棋盤 sequence 全部通過 rules-backed contract", () => {
  assert.equal(content.sequenceScoringContractVersion, "advanced-sequence-v1");
  assert.equal(content.sequenceExperiences.length, 8);
  assert.deepEqual(content.sequenceExperiences.map((item) => item.id), [
    "adv-seq-snapback-01",
    "adv-seq-snapback-02",
    "adv-seq-net-01",
    "adv-seq-net-02",
    "adv-seq-semeai-01",
    "adv-seq-semeai-02",
    "adv-seq-ladder-01",
    "adv-seq-ladder-02"
  ]);
  const validation = SequenceContract.validateAll(content.sequenceExperiences, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const families = SequenceContract.summarizeFamilies(content.sequenceExperiences);
  assert.deepEqual(families.map((family) => [family.familyId, family.variants]), [
    ["snapback", 2],
    ["net", 2],
    ["semeai", 2],
    ["ladder", 2]
  ]);
  for (const item of content.sequenceExperiences) {
    assert.ok(item.decisions.length >= 2, item.id);
    assert.ok(item.terms.length >= 2, item.id);
    assert.ok(item.familyId);
    assert.ok(item.variantId);
    assert.ok(item.variationAxes.length >= 1);
  }
});

test("四個第二變形都改變至少一個非單純旋轉的內容軸", () => {
  const variants = Object.fromEntries(content.sequenceExperiences.map((item) => [item.id, item]));
  assert.equal(variants["adv-seq-snapback-01"].decisions.at(-1).expectedLearnerCapturedCount, 2);
  assert.equal(variants["adv-seq-snapback-02"].decisions.at(-1).expectedLearnerCapturedCount, 3);
  assert.deepEqual(variants["adv-seq-net-02"].variationAxes, ["escape-geometry", "local-shape"]);
  assert.equal(variants["adv-seq-semeai-01"].playerColor, Go.BLACK);
  assert.equal(variants["adv-seq-semeai-02"].playerColor, Go.WHITE);
  assert.equal(variants["adv-seq-ladder-01"].boardSize, 7);
  assert.equal(variants["adv-seq-ladder-02"].boardSize, 8);
  assert.equal(variants["adv-seq-ladder-01"].decisions.length, 7);
  assert.equal(variants["adv-seq-ladder-02"].decisions.length, 10);
});


test("枷 sequence 不只驗示範逃路，也驗另一個主要分支", () => {
  const item = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-net-01");
  assert.equal(item.verificationBranches.length, 1);
  assert.deepEqual(item.verificationBranches[0].opponentMove, [2,3]);
  assert.deepEqual(item.verificationBranches[0].learnerReply, [1,2]);
  const validation = SequenceContract.validateExperience(item, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
});

test("對殺 sequence 明確依賴行棋次序與三子提取，不用起始總氣數替代讀棋", () => {
  const item = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-semeai-01");
  const validation = SequenceContract.validateExperience(item, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const start = Go.boardFromStones(item.setupStones, item.boardSize);
  assert.equal(Go.groupAt(start, 2, 2).liberties.length, 2);
  assert.equal(Go.groupAt(start, 3, 2).liberties.length, 2);
  const first = Go.playMove(start, 3, 0, Go.BLACK);
  assert.equal(first.legal, true);
  const response = Go.playMove(first.board, 2, 1, Go.WHITE, { previousBoard: start });
  assert.equal(response.legal, true);
  assert.equal(Go.groupAt(response.board, 2, 2).liberties.length, 1);
  assert.equal(Go.groupAt(response.board, 3, 2).liberties.length, 1);
  const finish = Go.playMove(response.board, 2, 0, Go.BLACK, { previousBoard: first.board });
  assert.equal(finish.legal, true);
  assert.equal(finish.captured.length, 3);
});

test("征子 sequence 每個固定應手都等於 tracked group 的唯一一口氣", () => {
  const item = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-ladder-01");
  assert.equal(item.decisions.length, 7);
  const validation = SequenceContract.validateExperience(item, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.equal(item.decisions.slice(0, -1).every((decision) => decision.opponentMoveMustBeUniqueLiberty === true), true);
  assert.equal(item.decisions.at(-1).expectedLearnerCapturedCount, 8);
});

test("征子路線加入引征干擾子後，原 forced line 必須失效", () => {
  const source = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-ladder-01");
  const withBreaker = structuredClone(source);
  withBreaker.id = "adv-seq-ladder-breaker-negative";
  withBreaker.setupStones.push([5,4,Go.WHITE]);
  const result = SequenceContract.validateExperience(withBreaker, Go);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /canonical learner move is illegal|tracked liberties|unique liberty/);
});

test("第二倒撲變形實際提回三子，第二枷變形兩個出口都可被收住", () => {
  const snapback = content.sequenceExperiences.find((item) => item.id === "adv-seq-snapback-02");
  const net = content.sequenceExperiences.find((item) => item.id === "adv-seq-net-02");
  assert.equal(SequenceContract.validateExperience(snapback, Go).ok, true);
  assert.equal(SequenceContract.validateExperience(net, Go).ok, true);
  assert.equal(net.verificationBranches.length, 1);
  assert.deepEqual(net.verificationBranches[0].opponentMove, [3,2]);
  assert.deepEqual(net.verificationBranches[0].learnerReply, [2,3]);
});

test("第二對殺變形交換 learner 棋色仍提三子", () => {
  const item = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-semeai-02");
  assert.equal(item.playerColor, Go.WHITE);
  const validation = SequenceContract.validateExperience(item, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const start = Go.boardFromStones(item.setupStones, item.boardSize);
  const first = Go.playMove(start, 3, 0, Go.WHITE);
  const response = Go.playMove(first.board, 2, 1, Go.BLACK, { previousBoard: start });
  const finish = Go.playMove(response.board, 2, 0, Go.WHITE, { previousBoard: first.board });
  assert.equal(finish.legal, true);
  assert.equal(finish.captured.length, 3);
});

test("8x8 征子變形比 7x7 更長，仍逐手驗唯一 liberty 並提十一子", () => {
  const item = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-ladder-02");
  const validation = SequenceContract.validateExperience(item, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.equal(item.decisions.slice(0, -1).every((decision) => decision.opponentMoveMustBeUniqueLiberty === true), true);
  assert.equal(item.decisions.at(-1).expectedLearnerCapturedCount, 11);
});

test("family metadata 缺漏或 family/variant 重複時 fail closed", () => {
  const source = structuredClone(content.sequenceExperiences[0]);
  delete source.familyId;
  const missing = SequenceContract.validateExperience(source, Go);
  assert.equal(missing.ok, false);
  assert.match(missing.errors.join(" "), /familyId missing/);

  const duplicate = structuredClone(content.sequenceExperiences);
  duplicate.push(structuredClone(duplicate[0]));
  duplicate.at(-1).id = "adv-seq-duplicate-id-only";
  const duplicateResult = SequenceContract.validateAll(duplicate, Go);
  assert.equal(duplicateResult.ok, false);
  assert.match(duplicateResult.errors.join(" "), /duplicate family variant/);
});

test("sequence contract 對捕獲數或內建手順漂移 fail closed", () => {
  const source = content.sequenceExperiences.find((entry) => entry.id === "adv-seq-snapback-01");
  const brokenCapture = structuredClone(source);
  brokenCapture.decisions[1].expectedLearnerCapturedCount = 99;
  const captureResult = SequenceContract.validateExperience(brokenCapture, Go);
  assert.equal(captureResult.ok, false);
  assert.match(captureResult.errors.join(" "), /captured 2 but expected 99/);

  const brokenMove = structuredClone(source);
  brokenMove.decisions[0].acceptedMoves = [[1,3]];
  const moveResult = SequenceContract.validateExperience(brokenMove, Go);
  assert.equal(moveResult.ok, false);
  assert.match(moveResult.errors.join(" "), /canonical learner move is illegal|captured|expected/);
});


test("fixed interleave v1 先走四個 seed，再走四個 variant", () => {
  assert.equal(SequencePolicy.VERSION, "advanced-fixed-interleave-v1");
  const validation = SequencePolicy.validateCatalog(content.sequenceExperiences);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.deepEqual(validation.ordered.map((item) => item.id), [
    "adv-seq-snapback-01",
    "adv-seq-net-01",
    "adv-seq-semeai-01",
    "adv-seq-ladder-01",
    "adv-seq-snapback-02",
    "adv-seq-net-02",
    "adv-seq-semeai-02",
    "adv-seq-ladder-02"
  ]);
});

test("fixed interleave stage 只開放下一個固定位置，不讓 variant 緊跟 seed", () => {
  const storage = memoryStorage();
  const base = {
    sessionId: "policy-s",
    experienceVersion: 1,
    trackId: "reading-tesuji",
    occurredAt: "2026-09-28T00:00:00.000Z"
  };
  const ordered = SequencePolicy.orderedExperiences(content.sequenceExperiences);
  const appendCompleted = (item, position) => {
    const common = { ...base, presentationId: "p-" + position, experienceId: item.id, familyId: item.familyId, variantId: item.variantId, variationAxes: item.variationAxes, policyPosition: position };
    assert.equal(SequenceEvents.append(storage, { ...common, eventId: "presented-" + position, type: "presented" }).ok, true);
    assert.equal(SequenceEvents.append(storage, { ...common, eventId: "completed-" + position, type: "completed" }).ok, true);
  };
  let stage = SequencePolicy.stageState(ordered, SequenceEvents.read(storage).store);
  assert.equal(stage.nextIndex, 0);
  appendCompleted(ordered[0], 0);
  stage = SequencePolicy.stageState(ordered, SequenceEvents.read(storage).store);
  assert.equal(stage.nextIndex, 1);
  assert.equal(stage.ordered[1].familyId, "net");
  assert.notEqual(stage.ordered[1].familyId, stage.ordered[0].familyId);
});

test("family 描述資格要求其他三個 family 已介入，缺一個就 fail closed", () => {
  const storage = memoryStorage();
  const ordered = SequencePolicy.orderedExperiences(content.sequenceExperiences);
  const addPresentationAndFirst = (item, position, suffix) => {
    const common = {
      sessionId: "gap-s", presentationId: "gap-" + suffix, experienceId: item.id, experienceVersion: 1,
      trackId: item.trackId, familyId: item.familyId, variantId: item.variantId, variationAxes: item.variationAxes,
      policyPosition: position, occurredAt: "2026-09-28T00:00:00.000Z"
    };
    assert.equal(SequenceEvents.append(storage, { ...common, eventId: "gp-" + suffix, type: "presented" }).ok, true);
    assert.equal(SequenceEvents.append(storage, { ...common, eventId: "gm-" + suffix, type: "move_first", decisionId: item.decisions[0].id, stepIndex: 0, point: item.decisions[0].acceptedMoves[0], correct: true, legal: true, capturedCount: 0 }).ok, true);
  };
  addPresentationAndFirst(ordered[0], 0, "seed");
  addPresentationAndFirst(ordered[1], 1, "net");
  addPresentationAndFirst(ordered[2], 2, "semeai");
  addPresentationAndFirst(ordered[4], 4, "variant");
  const eligibility = SequencePolicy.transitionEligibility(ordered, SequenceEvents.read(storage).store, "snapback");
  assert.equal(eligibility.status, "INSUFFICIENT_DATA");
  assert.equal(eligibility.reason, "fixed_interleave_incomplete");
  assert.deepEqual(eligibility.missingFamilies, ["ladder"]);
});

test("v2 sequence events 保留為 legacy，不被 v3 固定交錯分析偷換語義", () => {
  const storage = memoryStorage();
  const legacy = {
    schemaVersion: 2,
    eventStreamVersion: "advanced-sequence-events-v2",
    events: [{
      schemaVersion: 2, eventStreamVersion: "advanced-sequence-events-v2", eventId: "legacy-v2", sessionId: "s", presentationId: "p",
      experienceId: "adv-seq-snapback-01", experienceVersion: 1, trackId: "reading-tesuji", type: "presented",
      occurredAt: "2026-09-27T00:00:00.000Z", decisionId: null, stepIndex: null, point: null, correct: null, legal: null,
      capturedCount: null, hintShown: false, firstResponse: false, formalEligible: false, qualifiedOpportunity: false,
      evidenceUse: "advanced_practice_only", evaluationContext: "advanced_sequence_practice", scoringContractVersion: "advanced-sequence-v1",
      transferLevel: null, skillId: null, familyId: "snapback", variantId: "seed", variationAxes: ["baseline"]
    }]
  };
  storage.setItem(SequenceEvents.LEGACY_STORAGE_KEY, JSON.stringify(legacy));
  assert.equal(SequenceEvents.readLegacy(storage).ok, true);
  assert.equal(SequencePolicy.currentEvents(SequenceEvents.readLegacy(storage).store).length, 0);
});

test("多手 sequence event store v3 逐 decision 保留首答、retry、family 與 policy metadata", () => {
  const storage = memoryStorage();
  const common = {
    sessionId: "seq-s1",
    presentationId: "seq-p1",
    experienceId: "adv-seq-snapback-01",
    experienceVersion: 1,
    trackId: "reading-tesuji",
    familyId: "snapback",
    variantId: "seed",
    variationAxes: ["baseline"],
    policyPosition: 0,
    occurredAt: "2026-09-26T12:00:00.000Z"
  };
  assert.equal(SequenceEvents.append(storage, { ...common, eventId: "s1", type: "presented" }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...common, eventId: "s2", type: "decision_presented", decisionId: "sacrifice", stepIndex: 0 }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...common, eventId: "s3", type: "move_first", decisionId: "sacrifice", stepIndex: 0, point: [2,2], correct: false, legal: true, capturedCount: 0 }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...common, eventId: "s4", type: "move_retry", decisionId: "sacrifice", stepIndex: 0, point: [0,2], correct: true, legal: true, capturedCount: 0 }).ok, true);
  const stored = SequenceEvents.read(storage).store.events.filter((event) => event.type.startsWith("move_"));
  assert.deepEqual(stored.map((event) => [event.type, event.decisionId, event.correct, event.firstResponse]), [
    ["move_first", "sacrifice", false, true],
    ["move_retry", "sacrifice", true, false]
  ]);
  const summary = SequenceEvents.summarize(SequenceEvents.read(storage).store);
  assert.equal(summary.firstMoves, 1);
  assert.equal(summary.firstCorrect, 0);
  assert.equal(summary.retries, 1);
  assert.equal(summary.formalEligible, false);
  assert.equal(summary.families[0].familyId, "snapback");
  assert.equal(summary.families[0].variants[0].firstMoveCount, 1);
  assert.equal(summary.families[0].variants[0].firstCorrectCount, 0);
});

test("family transition 只輸出描述狀態，不產生 mastery 或 transfer claim", () => {
  const storage = memoryStorage();
  const base = {
    sessionId: "family-s1",
    experienceVersion: 1,
    trackId: "reading-tesuji",
    familyId: "snapback",
    variationAxes: ["baseline"],
    policyPosition: 0,
    occurredAt: "2026-09-27T00:00:00.000Z"
  };
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "f0", presentationId: "seed-p", experienceId: "adv-seq-snapback-01", variantId: "seed", type: "presented" }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "f1", presentationId: "seed-p", experienceId: "adv-seq-snapback-01", variantId: "seed", type: "move_first", decisionId: "sacrifice", stepIndex: 0, point: [0,2], correct: true, legal: true, capturedCount: 0 }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "f1b", presentationId: "variant-p", experienceId: "adv-seq-snapback-02", variantId: "capture-three", variationAxes: ["capture-count", "local-shape"], type: "presented" }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "f2", presentationId: "variant-p", experienceId: "adv-seq-snapback-02", variantId: "capture-three", variationAxes: ["capture-count", "local-shape"], type: "move_first", decisionId: "sacrifice", stepIndex: 0, point: [1,1], correct: false, legal: true, capturedCount: 0 }).ok, true);
  const transition = SequenceEvents.classifyFamilyTransition(SequenceEvents.read(storage).store, "snapback");
  assert.deepEqual(transition, {
    status: "DESCRIPTIVE_ONLY",
    familyId: "snapback",
    seed: "seed_first_all_correct",
    variant: "variant_first_all_wrong",
    mastery: null,
    transferClaim: false
  });
});

test("family transition 若 variant 先於 seed 呈現，保持 INSUFFICIENT_DATA", () => {
  const storage = memoryStorage();
  const base = {
    sessionId: "family-order",
    experienceVersion: 1,
    trackId: "reading-tesuji",
    familyId: "snapback",
    policyPosition: 0,
    occurredAt: "2026-09-27T00:00:00.000Z"
  };
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "o1", presentationId: "variant-p", experienceId: "adv-seq-snapback-02", variantId: "capture-three", variationAxes: ["capture-count", "local-shape"], type: "presented" }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "o2", presentationId: "variant-p", experienceId: "adv-seq-snapback-02", variantId: "capture-three", variationAxes: ["capture-count", "local-shape"], type: "move_first", decisionId: "sacrifice", stepIndex: 0, point: [0,2], correct: true, legal: true, capturedCount: 0 }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "o3", presentationId: "seed-p", experienceId: "adv-seq-snapback-01", variantId: "seed", variationAxes: ["baseline"], type: "presented" }).ok, true);
  assert.equal(SequenceEvents.append(storage, { ...base, eventId: "o4", presentationId: "seed-p", experienceId: "adv-seq-snapback-01", variantId: "seed", variationAxes: ["baseline"], type: "move_first", decisionId: "sacrifice", stepIndex: 0, point: [0,2], correct: true, legal: true, capturedCount: 0 }).ok, true);
  const transition = SequenceEvents.classifyFamilyTransition(SequenceEvents.read(storage).store, "snapback");
  assert.equal(transition.status, "INSUFFICIENT_DATA");
  assert.equal(transition.reason, "seed_not_presented_before_variant");
});

test("棋盤 family cue 在完成前隱藏，variant 未完成 seed 時不可跳入", () => {
  assert.match(sequenceJs, /棋盤練習/);
  assert.match(sequenceJs, /完整名稱、術語與重點會在走完後揭露/);
  assert.match(sequenceJs, /itemReady/);
  assert.match(sequenceJs, /disabled aria-disabled/);
  assert.match(sequenceJs, /advanced-sequence-terms"\)\.hidden = true/);
  assert.doesNotMatch(sequenceJs, /<strong>' \+ escapeHtml\(item\.title\)/);
  assert.doesNotMatch(sequenceJs, /escapeHtml\(item\.familyId\) \+ ' · '/);
});

test("family transition 缺 seed 或 variant 首答時保持 INSUFFICIENT_DATA", () => {
  const storage = memoryStorage();
  const common = {
    sessionId: "family-s2",
    presentationId: "seed-only",
    experienceId: "adv-seq-net-01",
    experienceVersion: 1,
    trackId: "reading-tesuji",
    familyId: "net",
    variantId: "seed",
    variationAxes: ["baseline"],
    occurredAt: "2026-09-27T00:00:00.000Z",
    eventId: "only",
    type: "move_first",
    decisionId: "net",
    stepIndex: 0,
    point: [1,3],
    correct: true,
    legal: true,
    capturedCount: 0,
    policyPosition: 1
  };
  assert.equal(SequenceEvents.append(storage, common).ok, true);
  assert.equal(SequenceEvents.classifyFamilyTransition(SequenceEvents.read(storage).store, "net").status, "INSUFFICIENT_DATA");
});

test("v1 與 v2 多手事件各自保留歷史 reader，不被 v3 policy migration 改寫", () => {
  const storage = memoryStorage();
  const v1Event = {
    schemaVersion: 1, eventStreamVersion: "advanced-sequence-events-v1", eventId: "old-1", sessionId: "old-s", presentationId: "old-p",
    experienceId: "adv-seq-snapback-01", experienceVersion: 1, trackId: "reading-tesuji", type: "move_first",
    occurredAt: "2026-09-26T00:00:00.000Z", decisionId: "sacrifice", stepIndex: 0, point: [0,2], correct: true, legal: true,
    capturedCount: 0, hintShown: false, firstResponse: true, formalEligible: false, qualifiedOpportunity: false,
    evidenceUse: "advanced_practice_only", evaluationContext: "advanced_sequence_practice", scoringContractVersion: "advanced-sequence-v1",
    transferLevel: null, skillId: null
  };
  storage.setItem(SequenceEvents.V1_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, eventStreamVersion: "advanced-sequence-events-v1", events: [v1Event] }));
  const old = SequenceEvents.readV1(storage);
  assert.equal(old.ok, true);
  assert.equal(old.store.events[0].familyId, undefined);
  assert.equal(SequencePolicy.currentEvents(old.store).length, 0);
});

test("多手 sequence store 損壞時 fail closed，且頁面明示棋盤 Response", () => {
  const storage = memoryStorage();
  storage.setItem(SequenceEvents.STORAGE_KEY, "{broken");
  const result = SequenceEvents.read(storage);
  assert.equal(result.ok, false);
  assert.equal(result.error, "advanced_sequence_store_malformed");
  assert.match(html, /棋盤作答/);
  assert.match(html, /多手讀棋實走/);
  assert.match(html, /advanced-sequence-events\.js\?v=advanced-sequence-v3/);
  assert.match(html, /advanced-sequence\.js\?v=advanced-sequence-v6/);
  assert.match(html, /advanced-sequence-contract\.js\?v=advanced-sequence-v1/);
  assert.match(html, /go\.js/);
});
