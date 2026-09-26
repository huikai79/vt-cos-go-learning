const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const content = require("../advanced-content.js");
const Events = require("../advanced-events.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "advanced.html"), "utf8");
const js = fs.readFileSync(path.join(root, "advanced.js"), "utf8");

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
  assert.match(html, /不更新 KC、scheduler、T2／T3、mastery 或正式評量/);
  assert.match(html, /先作答再看完整理由；答錯可重試，但首答會和重試分開保存/);
  assert.match(js, /answer_first/);
  assert.match(js, /answer_retry/);
});

test("進階 v1 先建立三條可用訓練線與一條後續路線", () => {
  assert.equal(content.version, 1);
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
