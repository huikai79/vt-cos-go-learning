const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const GoCore = require("../go.js");
const GoContent = require("../content.js");
const GoPhase2Content = require("../phase2-content.js");
const GoPhase4Content = require("../phase4-content.js");
const GoScheduler = require("../scheduler.js");
const GoSgf = require("../sgf.js");
const GoTrial = require("../trial.js");
const GoLearningMetrics = require("../learning-metrics.js");
const STORAGE_KEY = "go-learning-prototype-v7";

class Element {
  constructor() {
    this.dataset = {};
    this.listeners = {};
    this.className = "";
    this.textContent = "";
    this.innerHTML = "";
    this.disabled = false;
    this.style = {};
    this.classList = { toggle() {}, contains() { return false; } };
  }

  addEventListener(type, callback) { this.listeners[type] = callback; }
  querySelectorAll() { return []; }
  setAttribute() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  click() { if (this.onClick) this.onClick(); }
}

function pointTarget(dataset, selector) {
  return { closest(requested) { return requested === selector ? { dataset } : null; } };
}

function createApp(saved = {}, options = {}) {
  const ids = ["lesson-nav", "unit-select", "previous-unit-button", "next-unit-button", "resume-button", "due-review-button", "due-review-count", "lesson-intro-dialog", "lesson-intro-title", "lesson-intro-kicker", "lesson-intro-first-use", "lesson-intro-button", "lesson-intro-dismiss-button", "lesson-intro-start-button", "learning-flow-button", "learning-flow-dialog", "learning-flow-close-button", "tools-menu", "evaluation-dialog", "evaluation-cancel-button", "evaluation-confirm-button", "sgf-picker-dialog", "sgf-picker-move", "sgf-picker-cancel-button", "sgf-picker-confirm-button", "board-card", "board", "answer-area", "answer-policy", "board-instruction", "player-color", "lesson-kicker", "question-number", "unit-meta", "lesson-title", "lesson-subtitle", "lesson-badge", "teaching-text", "teaching-demo", "teaching-demo-board", "teaching-demo-stepper", "teaching-demo-caption", "teaching-demo-count", "teaching-demo-previous", "teaching-demo-next", "teaching-check", "question-tag", "question-title", "question-prompt", "takeaway-text", "sgf-reflection", "sgf-candidate-input", "sgf-reason-input", "sgf-opponent-response-input", "sgf-reflection-save-button", "sgf-reflection-status", "sgf-review", "sgf-review-status-input", "sgf-acceptable-answer-input", "sgf-next-cue-input", "sgf-review-save-button", "sgf-export-button", "sgf-export-help", "sgf-review-status", "feedback", "hint-button", "next-button", "progress-count", "progress-bar", "progress-caption", "diagnostic-summary", "review-count", "review-button", "scheduled-practice-button", "application-button", "evaluation-button", "sample-sgf-button", "sgf-file-input", "policy-fixed", "policy-adaptive", "export-button", "export-events-button", "learning-now", "learning-now-summary", "learning-why", "learning-next", "learning-stage-badge", "learning-step-0", "learning-step-1", "learning-step-2", "learning-step-3", "learning-step-4", "level-beginner", "level-intermediate", "level-advanced"];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  const storage = new Map(Object.entries(saved).map(([key, value]) => [key, JSON.stringify(value)]));
  for (const [key, value] of Object.entries(options.rawStorage || {})) storage.set(key, value);
  const downloads = [];
  const blobs = new Map();
  let blobId = 0;
  const document = {
    getElementById(id) { return elements[id]; },
    querySelector(selector) { return selector === ".practice-grid" ? new Element() : null; },
    createElement() {
      const element = new Element();
      element.onClick = () => downloads.push({ filename: element.download, blob: blobs.get(element.href) });
      return element;
    }
  };
  const window = { GoCore, GoContent, GoPhase2Content, GoPhase4Content, GoSgf, GoScheduler, GoTrial, GoLearningMetrics };
  const url = {
    createObjectURL(blob) { const href = `blob:test-${++blobId}`; blobs.set(href, blob); return href; },
    revokeObjectURL() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../app.js"), "utf8"), {
    window,
    document,
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) {
        if (options.failStorageWrites) throw new Error("storage unavailable");
        storage.set(key, value);
      }
    },
    Date,
    Map,
    Set,
    JSON,
    Math,
    Blob,
    URL: url,
    setTimeout
  });
  return { elements, storage, downloads };
}

test("每課短講只自動顯示一次，並可隨時重開", () => {
  const { elements, storage } = createApp();
  assert.equal(elements["lesson-intro-dialog"].open, true);
  assert.equal(elements["lesson-intro-title"].textContent, "現在先學：認識氣");
  assert.match(elements["teaching-text"].textContent, /上下左右相鄰的空點/);
  assert.match(elements["teaching-demo"].textContent, /角上的一顆黑棋/);
  assert.match(elements["teaching-check"].textContent, /先找空點/);
  assert.match(elements["teaching-demo-board"].innerHTML, /demo-liberty/);
  elements["lesson-intro-start-button"].listeners.click();
  assert.equal(elements["lesson-intro-dialog"].open, false);
  assert.deepEqual(JSON.parse(storage.get(STORAGE_KEY)).seenLessonIntros, [0]);
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "4" }, "[data-lesson]") });
  assert.equal(elements["lesson-intro-dialog"].open, true);
  assert.match(elements["teaching-demo-board"].innerHTML, /兩顆黑棋的直接連接點/);
  elements["lesson-intro-dismiss-button"].listeners.click();
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "0" }, "[data-lesson]") });
  assert.equal(elements["lesson-intro-dialog"].open, false, "已看過的課不應再次自動彈出短講");
  elements["lesson-intro-button"].listeners.click();
  assert.equal(elements["lesson-intro-dialog"].open, true, "仍可手動重開短講");
  elements["lesson-intro-dismiss-button"].listeners.click();
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "7" }, "[data-lesson]") });
  assert.match(elements["teaching-demo-board"].innerHTML, /直三|三個連成一直線/);
});

test("試行技能將首答、重試與提示後作答存成可重算事件", () => {
  const { elements, storage } = createApp();
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "1" }, "[data-lesson]") });
  elements.board.listeners.click({ target: pointTarget({ x: "8", y: "8" }, "[data-x]") });
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "5" }, "[data-x]") });
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "4" }, "[data-lesson]") });
  elements["hint-button"].listeners.click();
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "4" }, "[data-x]") });

  const saved = JSON.parse(storage.get(STORAGE_KEY));
  const capture = saved.events.filter((event) => event.problemId === "u1-06");
  const join = saved.events.filter((event) => event.problemId === "u2-05");
  assert.deepEqual(capture.map((event) => [event.type, event.outcome, event.firstAnswer, event.unhinted, event.qualifiedOpportunity]), [
    ["presented", undefined, undefined, undefined, false],
    ["answer", "incorrect", true, true, true],
    ["answer", "correct", false, true, false],
    ["presentation_end", "solved", undefined, undefined, undefined]
  ]);
  assert.deepEqual(join.map((event) => [event.type, event.outcome, event.firstAnswer, event.unhinted, event.qualifiedOpportunity]), [
    ["presented", undefined, undefined, undefined, false],
    ["hint", undefined, undefined, false, false],
    ["answer", "correct", true, false, false]
  ]);
  assert.ok(saved.events.every((event) => event.skillId && event.skillVersion === 1 && event.presentedAt && event.occurredAt && event.presentationId));
  assert.equal(capture[0].firstExposure, true);
  assert.ok(capture.every((event) => event.schemaVersion === 3));
  assert.equal(capture[1].errorTypeId, "capture-last-liberty-outcome-miss-v1");
  assert.equal(capture.at(-1).endedReason, "navigation");
  assert.equal(saved.exposures["u1-06"].contentVersion, 1);
  assert.match(elements["diagnostic-summary"].textContent, /最後一口氣未找對：1 次首答錯誤/);
});

test("舊版進度可載入並在首次新事件時寫入新版資料", () => {
  const legacy = { completed: ["u1-01"], missed: [], attempts: { "u1-01": 1 } };
  const { elements, storage } = createApp({ "go-learning-prototype-v1": legacy });
  assert.equal(elements["progress-count"].textContent, "1 / 106");
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "1" }, "[data-lesson]") });
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "5" }, "[data-x]") });
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.schemaVersion, 7);
  assert.ok(saved.completed.includes("u1-01"));
  assert.equal(saved.events[0].type, "presented");
  assert.equal(saved.events[0].skillId, "capture-last-liberty-v1");
});

test("損壞 JSON 與欄位型別異常不會阻止課程啟動", () => {
  const malformed = createApp({}, { rawStorage: { [STORAGE_KEY]: "{broken" } });
  assert.equal(malformed.elements["question-title"].textContent, "中央的一顆棋");
  assert.equal(JSON.parse(malformed.storage.get("go-learning-prototype-recovery-v1")).rawValue, "{broken");
  assert.match(malformed.elements.feedback.textContent, /復原副本/);

  const wrongShape = createApp({
    [STORAGE_KEY]: {
      schemaVersion: 999,
      contentCatalogVersion: 3,
      index: 999,
      completed: {},
      missed: "not-an-array",
      attempts: "not-an-object",
      events: {}
    }
  });
  assert.equal(wrongShape.elements["question-title"].textContent, "中央的一顆棋");
  const repaired = JSON.parse(wrongShape.storage.get(STORAGE_KEY));
  assert.equal(JSON.parse(wrongShape.storage.get("go-learning-prototype-recovery-v1")).reason, "invalid_field_types");
  assert.deepEqual(repaired.completed, []);
  assert.deepEqual(repaired.missed, []);
  assert.deepEqual(repaired.attempts, {});
  assert.deepEqual(repaired.events, []);
});

test("v3 儲存資料會遷移到 v7，且舊 trial v1 不混入現行 pilot", () => {
  const legacy = {
    schemaVersion: 3,
    completed: ["u1-01"],
    trial: { schemaVersion: 1, protocolId: "personal-longitudinal-v1", batches: [{ id: "old" }], answers: [{ correct: true }] }
  };
  const { elements, storage } = createApp({ "go-learning-prototype-v3": legacy });
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "1" }, "[data-lesson]") });
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.schemaVersion, 7);
  assert.equal(saved.trial.protocolId, "personal-pilot-v3");
  assert.deepEqual(saved.trial.batches, []);
  assert.equal(saved.trial.legacyTrials[0].invalidForEvidence, true);
});

test("v4 缺少資格欄位的舊排程作答會保留但不混入診斷", () => {
  const legacy = {
    schemaVersion: 4,
    scheduler: {
      schemaVersion: 1,
      selections: [],
      reviews: {},
      responses: [{
        occurredAt: "2026-09-01T00:00:00.000Z",
        problemId: "p2-c-1-1",
        skillId: "capture-last-liberty-v1",
        firstAnswerCorrect: false
      }]
    }
  };
  const { elements, storage } = createApp({ "go-learning-prototype-v4": legacy });
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "1" }, "[data-lesson]") });
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.schemaVersion, 7);
  assert.equal(saved.scheduler.responses.length, 1);
  assert.match(elements["diagnostic-summary"].textContent, /1 筆提示後或資格不明的作答未納入/);
});

test("v5 第 4 單元之後的舊數字索引會遷移到原本題目", () => {
  const { elements, storage } = createApp({ "go-learning-prototype-v5": { schemaVersion: 5, index: 26, hasStarted: true } });
  assert.equal(elements["question-title"].textContent, "兩眼的意義");
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.index, 34);
  assert.equal(saved.currentProblemId, "u4-01");
  assert.equal(saved.contentCatalogVersion, 3);
});

test("短暫 v6 內容目錄的索引也會再遷移到原本題目", () => {
  const { elements, storage } = createApp({ "go-learning-prototype-v6": { schemaVersion: 6, contentCatalogVersion: 2, index: 30, hasStarted: true } });
  assert.equal(elements["question-title"].textContent, "兩眼的意義");
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.index, 34);
  assert.equal(saved.currentProblemId, "u4-01");
});

test("離開未作答的試行題會保留呈現與結束，原始匯出包含可重算資料", async () => {
  const { elements, storage, downloads } = createApp();
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "1" }, "[data-lesson]") });
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "4" }, "[data-lesson]") });
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  const capture = saved.events.filter((event) => event.problemId === "u1-06");
  assert.deepEqual(capture.map((event) => event.type), ["presented", "presentation_end"]);
  assert.equal(capture[1].outcome, "unanswered");
  assert.equal(capture[1].endedReason, "navigation");

  elements["export-events-button"].listeners.click();
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].filename, "個人圍棋原始事件.json");
  const exported = JSON.parse(await downloads[0].blob.text());
  assert.equal(exported.eventPolicyVersion, "trial-events-v4");
  assert.equal(exported.schemaVersion, 2);
  assert.equal(exported.schedulerPolicy, "fixed-spacing-v1");
  assert.equal(exported.phase2Catalog.length, 148);
  assert.equal(exported.holdoutAnswersRedacted, true);
  assert.equal(exported.learningDiagnostics.metricPolicyVersion, "skill-correction-diagnostics-v1");
  assert.match(exported.learningDiagnostics.interpretationBoundary, /不代表已確認心理或認知根因/);
  assert.ok(exported.phase2Catalog.filter((problem) => problem.pool === "holdout").every((problem) => problem.redacted && !("answer" in problem) && !("stones" in problem) && !("goal" in problem)));
  assert.ok(exported.phase2Catalog.filter((problem) => problem.pool !== "holdout").every((problem) => "answer" in problem));
  assert.ok(exported.trialProblems.every((problem) => problem.taskFeatures));
  assert.equal(exported.exposures["u1-06"].contentVersion, 1);
  assert.deepEqual(exported.events.filter((event) => event.problemId === "u1-06").map((event) => event.type), ["presented", "presentation_end"]);

  elements["export-button"].listeners.click();
  assert.equal(downloads[1].filename, "個人圍棋練習紀錄.md");
  const notes = await downloads[1].blob.text();
  assert.match(notes, /顯示題目/);
  assert.match(notes, /結束題目/);
  assert.match(notes, /未作答/);
  assert.match(notes, /未納入診斷的提示後或資格不明作答/);
});

test("完成兩批 pilot 後原始匯出仍永久遮蔽全部 holdout 候選答案", async () => {
  let decision = GoTrial.startOrResume(null, GoPhase2Content.phase2Problems, 0);
  let trial = decision.state;
  for (const problemId of decision.batch.problemIds) {
    const problem = GoPhase2Content.phase2Problems.find((item) => item.id === problemId);
    trial = GoTrial.recordAnswer(trial, decision.batch, problem, true, "test", 1, 1);
  }
  decision = GoTrial.startOrResume(trial, GoPhase2Content.phase2Problems, GoTrial.DAY * 8);
  trial = decision.state;
  for (const problemId of decision.batch.problemIds) {
    const problem = GoPhase2Content.phase2Problems.find((item) => item.id === problemId);
    trial = GoTrial.recordAnswer(trial, decision.batch, problem, true, "test", 1, GoTrial.DAY * 8 + 1);
  }
  const { elements, downloads } = createApp({ [STORAGE_KEY]: { schemaVersion: 7, trial } });
  elements["export-events-button"].listeners.click();
  const exported = JSON.parse(await downloads[0].blob.text());
  assert.equal(exported.holdoutAnswersRedacted, true);
  assert.ok(exported.phase2Catalog.filter((problem) => problem.pool === "holdout").every((problem) => problem.redacted && !("answer" in problem) && !("stones" in problem) && !("goal" in problem)));
});

test("間隔練習保存選題政策與作答後的下一次到期時間", async () => {
  const { elements, storage, downloads } = createApp();
  elements["scheduled-practice-button"].listeners.click();
  assert.match(elements["question-number"].textContent, /固定方案/);
  assert.match(elements["learning-why"].textContent, /安排一題新練習|已到複習時間/);
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "5" }, "[data-x]") });
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.scheduler.selections[0].policyVersion, "fixed-spacing-v1");
  assert.equal(saved.scheduler.responses[0].correct, true);
  assert.equal(saved.scheduler.responses[0].skillId, "capture-last-liberty-v1");
  assert.equal(saved.scheduler.responses[0].unhinted, true);
  assert.equal(saved.scheduler.responses[0].qualifiedOpportunity, true);
  assert.ok(saved.scheduler.reviews[saved.scheduler.responses[0].problemId].dueAt > Date.now());
  elements["policy-adaptive"].listeners.change();
  assert.equal(elements["policy-adaptive"].checked, true);
  assert.equal(elements["policy-fixed"].checked, false);
  elements["export-events-button"].listeners.click();
  assert.equal(downloads[0].filename, "個人圍棋原始事件.json");
  const exported = JSON.parse(await downloads[0].blob.text());
  assert.equal(exported.scheduler.selections.length, 1);
  assert.equal(exported.uiVersion, "learner-flow-v28");
});

test("首頁只在確實有題目到期時顯示直接複習入口", () => {
  const fresh = createApp();
  assert.equal(fresh.elements["due-review-button"].hidden, true);

  const due = createApp({ [STORAGE_KEY]: {
    schemaVersion: 7,
    scheduler: { schemaVersion: 1, selections: [], responses: [], reviews: { "p2-c-1-1": { stage: 0, dueAt: 0, scheduledBy: "fixed-spacing-v1" } } }
  } });
  assert.equal(due.elements["due-review-button"].hidden, false);
  assert.equal(due.elements["due-review-count"].textContent, 1);
  due.elements["due-review-button"].listeners.click();
  assert.match(due.elements["question-number"].textContent, /間隔練習/);
});

test("錯題複習與沒有到期題的新練習不冒充延後新棋形驗證", () => {
  const { elements } = createApp();
  elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "1" }, "[data-lesson]") });
  elements.board.listeners.click({ target: pointTarget({ x: "8", y: "8" }, "[data-x]") });
  elements["review-button"].listeners.click();
  assert.match(elements["learning-now"].textContent, /回看這道錯題/);
  assert.match(elements["learning-why"].textContent, /同一原題/);

  const fresh = createApp();
  fresh.elements["scheduled-practice-button"].listeners.click();
  assert.match(fresh.elements["learning-now"].textContent, /新練習/);
  assert.match(fresh.elements["learning-why"].textContent, /目前沒有到期題/);
});

test("單元選擇只篩選課程，並在重開後保留目前題目與選定單元", () => {
  const { elements, storage } = createApp();
  elements["unit-select"].listeners.change({ target: { value: "14" } });
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.index, 0);
  assert.equal(saved.navUnitIndex, 14);
  assert.equal(elements["next-unit-button"].disabled, true);
  assert.equal(elements["previous-unit-button"].disabled, false);

  const resumed = createApp({ [STORAGE_KEY]: saved });
  assert.equal(resumed.elements["lesson-title"].textContent, "認識氣");
  assert.equal(resumed.elements["unit-select"].value, "14");
});

test("候選自適應將先錯後對保存為一次機會，下一題優先同母題變形", () => {
  const { elements, storage } = createApp();
  elements["policy-adaptive"].listeners.change();
  elements["scheduled-practice-button"].listeners.click();
  elements.board.listeners.click({ target: pointTarget({ x: "8", y: "8" }, "[data-x]") });
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "5" }, "[data-x]") });
  elements["next-button"].listeners.click();
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.scheduler.responses.length, 1);
  assert.equal(saved.scheduler.responses[0].firstAnswerCorrect, false);
  assert.equal(saved.scheduler.responses[0].eventualCorrect, true);
  assert.equal(saved.scheduler.responses[0].attemptCount, 2);
  assert.equal(saved.scheduler.selections[1].selectionReason, "immediate_unseen_variant_after_error");
  assert.equal(saved.scheduler.selections[1].familyId, saved.scheduler.selections[0].familyId);
  assert.match(elements["learning-why"].textContent, /未見變形/);
});

test("固定應用探測與本機 SGF 局部題不會進入間隔排程，且可匯出反思提示", async () => {
  const { elements, storage, downloads } = createApp();
  elements["application-button"].listeners.click();
  assert.match(elements["question-number"].textContent, /固定應用探測/);
  assert.equal(elements["question-tag"].textContent, "固定應用探測");
  assert.match(elements["learning-why"].textContent, /固定局面小測驗/);
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "5" }, "[data-x]") });
  let saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.scheduler.responses.length, 0);

  elements["sample-sgf-button"].listeners.click();
  assert.equal(elements["sgf-picker-dialog"].open, true);
  assert.equal(elements["sgf-picker-move"].value, "1");
  elements["sgf-picker-confirm-button"].listeners.click();
  assert.match(elements["question-number"].textContent, /棋譜局部/);
  assert.equal(elements["sgf-reflection"].hidden, false);
  elements["sgf-candidate-input"].value = "第 5 行第 5 列";
  elements["sgf-reason-input"].value = "先看中央的氣，還不確定是否能直接提子。";
  elements["sgf-opponent-response-input"].value = "預期白棋會先補氣。";
  elements["sgf-reflection-save-button"].listeners.click();
  assert.match(elements["sgf-reflection-status"].textContent, /作答前保存/);
  elements.board.listeners.click({ target: pointTarget({ x: "4", y: "5" }, "[data-x]") });
  assert.equal(elements["sgf-review"].hidden, false);
  elements["sgf-review-status-input"].value = "original_confirmed";
  elements["sgf-acceptable-answer-input"].value = "人工複盤後確認原著可接受。";
  elements["sgf-next-cue-input"].value = "先數中央的氣。";
  elements["sgf-review-save-button"].listeners.click();
  assert.match(elements["sgf-review-status"].textContent, /已確認原著可接受/);
  saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.localExercises.length, 1);
  assert.equal(saved.localExercises[0].linkedSkill, "一手提子");
  assert.equal(saved.localExercises[0].reflection.candidate, "第 5 行第 5 列");
  assert.equal(saved.localExercises[0].reflection.expectedOpponentResponse, "預期白棋會先補氣。");
  assert.equal(saved.localExercises[0].reflection.savedBeforeAnswer, true);
  assert.equal(saved.localExercises[0].review.status, "original_confirmed");
  elements["sgf-export-button"].listeners.click();
  assert.equal(downloads[0].filename, `局部復盤_${saved.localExercises[0].source.sourceId}_第1手.sgf`);
  const localSgf = await downloads[0].blob.text();
  assert.match(localSgf, /^\(;GM\[1\]FF\[4\]CA\[UTF-8\]SZ\[9\]AB/);
  assert.match(localSgf, /;B\[ef\]\)/);
  assert.match(localSgf, /預期對方應手：預期白棋會先補氣/);
  elements["export-button"].listeners.click();
  const notes = await downloads[1].blob.text();
  assert.match(notes, /棋譜局部複習/);
  assert.match(notes, /內建示範棋譜/);
  assert.match(notes, /我先考慮的候選手/);
  assert.match(notes, /先看中央的氣/);
  assert.match(notes, /預期白棋會先補氣/);
  assert.match(notes, /原局面（9 路）：黑/);
  assert.match(notes, /人工複盤後確認原著可接受/);
});

test("瀏覽器儲存失敗時不會把 SGF 反思誤報為已保存", () => {
  const { elements, storage } = createApp({}, { failStorageWrites: true });
  elements["sample-sgf-button"].listeners.click();
  elements["sgf-picker-confirm-button"].listeners.click();
  elements["sgf-candidate-input"].value = "中央候選手";
  elements["sgf-reflection-save-button"].listeners.click();
  assert.match(elements["sgf-reflection-status"].textContent, /未保存/);
  assert.match(elements.feedback.textContent, /無法寫入瀏覽器儲存空間/);
  assert.equal(storage.has(STORAGE_KEY), false);
});

test("固定應用探測保存呈現、未答、作答後離開與重載中斷分母", () => {
  const unanswered = createApp();
  unanswered.elements["application-button"].listeners.click();
  unanswered.elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "0" }, "[data-lesson]") });
  let saved = JSON.parse(unanswered.storage.get(STORAGE_KEY));
  assert.deepEqual(saved.applicationEvents.map((event) => [event.type, event.outcome]), [["presented", undefined], ["presentation_end", "unanswered"]]);

  const attempted = createApp();
  attempted.elements["application-button"].listeners.click();
  attempted.elements.board.listeners.click({ target: pointTarget({ x: "8", y: "8" }, "[data-x]") });
  attempted.elements["lesson-nav"].listeners.click({ target: pointTarget({ lesson: "0" }, "[data-lesson]") });
  saved = JSON.parse(attempted.storage.get(STORAGE_KEY));
  assert.equal(saved.applicationEvents.at(-1).outcome, "unfinished_after_attempt");

  const interrupted = createApp();
  interrupted.elements["application-button"].listeners.click();
  const openState = JSON.parse(interrupted.storage.get(STORAGE_KEY));
  const recovered = createApp({ [STORAGE_KEY]: openState });
  saved = JSON.parse(recovered.storage.get(STORAGE_KEY));
  assert.equal(saved.applicationEvents.at(-1).outcome, "interrupted");
  assert.equal(saved.applicationEvents.at(-1).recovered, true);
  assert.equal(saved.activeApplicationPresentation, null);
});

test("個人 pilot 禁用提示、只收首答，而且不污染課程進度與錯題", async () => {
  const { elements, storage, downloads } = createApp();
  elements["evaluation-button"].listeners.click();
  assert.equal(elements["evaluation-dialog"].open, true);
  elements["evaluation-confirm-button"].listeners.click();
  assert.match(elements["question-number"].textContent, /個人 pilot.*基線/);
  assert.equal(elements["question-tag"].textContent, "無提示個人試行");
  assert.equal(elements["hint-button"].disabled, true);
  elements.board.listeners.click({ target: pointTarget({ x: "8", y: "8" }, "[data-x]") });
  assert.match(elements.feedback.textContent, /完成整批前不顯示正誤/);
  assert.equal(elements["next-button"].disabled, false);
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.trial.reviewGate, "personal_pilot_only");
  assert.equal(saved.trial.claimMode, "personal_descriptive");
  assert.equal(saved.trial.formalEligible, false);
  assert.equal(saved.trial.answers.length, 1);
  assert.equal(saved.trial.answers[0].correct, false);
  assert.equal(saved.trial.answers[0].uiVersion, "learner-flow-v28");
  assert.equal(saved.trial.answers[0].useMode, "pilot_disposable");
  assert.equal(saved.trial.answers[0].formalEligible, false);
  assert.deepEqual(saved.completed, []);
  assert.deepEqual(saved.missed, []);
  elements["export-events-button"].listeners.click();
  const exported = JSON.parse(await downloads[0].blob.text());
  assert.equal(exported.trialProtocol.id, "personal-pilot-v3");
  assert.equal(exported.trial.reviewGate, "personal_pilot_only");
  assert.equal(exported.claimMode, "personal_descriptive");
  assert.equal(exported.formalEvaluationAvailable, false);
  assert.equal(exported.trialSummary.status, "data_insufficient");
});
