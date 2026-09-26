const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const content = require("../advanced-content.js");
const Events = require("../advanced-events.js");
const SequenceEvents = require("../advanced-sequence-events.js");
const SequenceContract = require("../advanced-sequence-contract.js");
const Go = require("../go.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "advanced.html"), "utf8");
const js = fs.readFileSync(path.join(root, "advanced.js"), "utf8");
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
  assert.match(indexHtml, /class="course-entry-link" href="advanced\.html">進入進階訓練/);
  assert.match(html, /不更新 KC、scheduler、T2／T3、mastery 或正式評量/);
  assert.match(html, /先作答再看完整理由；答錯可重試，但首答會和重試分開保存/);
  assert.match(js, /answer_first/);
  assert.match(js, /answer_retry/);
});

test("進階 choice scaffold 保留三條可用訓練線與一條後續路線", () => {
  assert.equal(content.version, 3);
  assert.equal(content.scoringContractVersion, "advanced-choice-v1");
  assert.equal(content.tracks.filter((track) => track.status === "active").length, 3);
  assert.ok(content.tracks.some((track) => track.id === "full-board-review" && track.status === "planned"));
  assert.equal(content.experiences.length, 8);
  for (const item of content.experiences) {
    assert.ok(content.tracks.some((track) => track.id === item.trackId));
    assert.ok(item.choices.length >= 3, item.id);
    assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length, item.id);
    assert.ok(Array.isArray(item.demoSteps) && item.demoSteps.length >= 3, item.id);
    assert.ok(Array.isArray(item.terms) && item.terms.length >= 2, item.id);
  }
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


test("進階 v3 的三個棋盤 sequence 全部通過 rules-backed contract", () => {
  assert.equal(content.sequenceScoringContractVersion, "advanced-sequence-v1");
  assert.equal(content.sequenceExperiences.length, 3);
  assert.deepEqual(content.sequenceExperiences.map((item) => item.id), [
    "adv-seq-snapback-01",
    "adv-seq-net-01",
    "adv-seq-semeai-01"
  ]);
  const validation = SequenceContract.validateAll(content.sequenceExperiences, Go);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  for (const item of content.sequenceExperiences) {
    assert.equal(item.decisions.length, 2, item.id);
    assert.ok(item.terms.length >= 2, item.id);
  }
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


test("多手 sequence event store 逐 decision 保留首答與 retry", () => {
  const storage = memoryStorage();
  const common = {
    sessionId: "seq-s1",
    presentationId: "seq-p1",
    experienceId: "adv-seq-snapback-01",
    experienceVersion: 1,
    trackId: "reading-tesuji",
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
});

test("多手 sequence store 損壞時 fail closed，且頁面明示棋盤 Response", () => {
  const storage = memoryStorage();
  storage.setItem(SequenceEvents.STORAGE_KEY, "{broken");
  const result = SequenceEvents.read(storage);
  assert.equal(result.ok, false);
  assert.equal(result.error, "advanced_sequence_store_malformed");
  assert.match(html, /棋盤 Response/);
  assert.match(html, /多手讀棋實走/);
  assert.match(html, /advanced-sequence\.js\?v=advanced-sequence-v2/);
  assert.match(html, /advanced-sequence-contract\.js\?v=advanced-sequence-v1/);
  assert.match(html, /go\.js/);
});
