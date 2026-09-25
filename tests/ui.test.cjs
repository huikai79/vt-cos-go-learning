const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const browser = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find((candidate) => fs.existsSync(candidate));
const requestedBaseUrl = process.env.GO_UI_BASE_URL;
const baseUrl = requestedBaseUrl ? new URL(requestedBaseUrl.endsWith("/") ? requestedBaseUrl : `${requestedBaseUrl}/`) : null;
const page = baseUrl ? new URL("index.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../index.html")).href;
const reviewPage = baseUrl ? new URL("r1-review.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../r1-review.html")).href;

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

class CdpPipe {
  constructor(write, read) {
    this.write = write;
    this.read = read;
    this.nextId = 0;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    read.on("data", (chunk) => this.onData(chunk));
    read.on("error", (error) => this.failPending(error));
    write.on("error", (error) => this.failPending(error));
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let separator;
    while ((separator = this.buffer.indexOf(0)) !== -1) {
      const message = JSON.parse(this.buffer.subarray(0, separator).toString("utf8"));
      this.buffer = this.buffer.subarray(separator + 1);
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      clearTimeout(pending.timeout);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else if (message.result && message.result.exceptionDetails) {
        const details = message.result.exceptionDetails;
        pending.reject(new Error(details.exception && details.exception.description || details.text));
      }
      else pending.resolve(message.result);
    }
  }

  failPending(error) {
    for (const { timeout, reject } of this.pending.values()) {
      clearTimeout(timeout);
      reject(error);
    }
    this.pending.clear();
  }

  command(method, params = {}, sessionId = this.sessionId, timeoutMs = 10000) {
    const id = ++this.nextId;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.write.write(`${JSON.stringify(payload)}\0`);
    });
  }

  close() {
    this.failPending(new Error("CDP pipe closed"));
    this.read.destroy();
    this.write.destroy();
  }
}

async function command(socket, method, params = {}) {
  if (socket instanceof CdpPipe) return socket.command(method, params);
  const id = Math.floor(Math.random() * 1e9);
  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.removeEventListener("message", onMessage); reject(new Error("CDP timed out")); }, 10000);
    function onMessage(event) {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      if (message.error) reject(new Error(message.error.message));
      else if (message.result.exceptionDetails) reject(new Error(message.result.exceptionDetails.text));
      else resolve(message.result);
    }
    socket.addEventListener("message", onMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
  return result;
}

async function evaluate(socket, expression) {
  const result = await command(socket, "Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return result.result.value;
}

async function main() {
  assert.ok(browser, "Chrome or Edge is required for this local UI test");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "go-learning-ui-"));
  const child = spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions", "--disable-background-mode", "--remote-debugging-pipe", `--user-data-dir=${profile}`, page], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
  let socket;
  try {
    socket = new CdpPipe(child.stdio[3], child.stdio[4]);
    let target;
    for (let retry = 0; retry < 50; retry += 1) {
      const targets = await socket.command("Target.getTargets", {}, null, 30000);
      target = targets.targetInfos.find((item) => item.type === "page" && item.url === page);
      if (target) break;
      await delay(100);
    }
    assert.ok(target, "local file page did not load");
    const attached = await socket.command("Target.attachToTarget", { targetId: target.targetId, flatten: true }, null);
    socket.sessionId = attached.sessionId;
    let title;
    for (let retry = 0; retry < 30; retry += 1) {
      title = await evaluate(socket, "document.querySelector('#question-title')?.textContent");
      if (title === "中央的一顆棋") break;
      await delay(100);
    }
    assert.equal(title, "中央的一顆棋");
    const firstUse = await evaluate(socket, `(() => {
      const title = document.querySelector('#question-title');
      const board = document.querySelector('#board');
      return {
        introOpen: document.querySelector('#lesson-intro-dialog').open,
        introTitle: document.querySelector('#lesson-intro-title').textContent,
        startLabel: document.querySelector('#resume-button').textContent,
        reviewHidden: document.querySelector('#review-button').hidden,
        promptBeforeBoard: Boolean(title.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING),
        policy: document.querySelector('#answer-policy').textContent,
        flowSteps: document.querySelectorAll('.learning-steps li').length,
        activeFlow: document.querySelector('.learning-steps li.active')?.id,
        flowNow: document.querySelector('#learning-now').textContent,
        flowWhy: document.querySelector('#learning-why').textContent,
        concept: document.querySelector('#teaching-text').textContent,
        demo: document.querySelector('#teaching-demo').textContent,
        check: document.querySelector('#teaching-check').textContent,
        visualDemo: document.querySelectorAll('#teaching-demo-board .demo-liberty').length,
        compactGuidance: document.querySelector('#learning-now-summary').textContent,
        currentLevel: document.querySelector('.level-path > .active')?.id,
        stageBadge: document.querySelector('#learning-stage-badge').textContent
      };
    })()`);
    assert.deepEqual(firstUse, { introOpen: true, introTitle: "現在先學：認識氣", startLabel: "開始第 1 題", reviewHidden: true, promptBeforeBoard: true, policy: "選擇答案後會立即作答；答錯可以再試。", flowSteps: 5, activeFlow: "learning-step-0", flowNow: "先看本課短講，再用棋盤示範確認要觀察的變化。", flowWhy: "每一課先建立一個明確概念，才進入無提示練習。", concept: "棋子放在交叉點上。沿線上下左右相鄰的空點叫做「氣」；斜對角不算。連成一串的棋子共用氣。", demo: "角上的一顆黑棋，只有右邊和下邊兩個盤內空點，所以有 2 口氣；斜角的空點不算。", check: "先找空點，再數氣；同一個空點只算一次。", visualDemo: 2, compactGuidance: "先看本課短講，再用棋盤示範確認要觀察的變化。", currentLevel: "level-beginner", stageBadge: "目前 1/5 · 先看懂" });
    const screenshotDirectory = process.env.GO_UI_SCREENSHOT_DIR;
    if (screenshotDirectory) {
      assert.ok(fs.existsSync(screenshotDirectory), "screenshot directory must already exist");
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
      const firstDesktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "first-entry-desktop.png"), Buffer.from(firstDesktop.data, "base64"));
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
      const firstMobile = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "first-entry-mobile.png"), Buffer.from(firstMobile.data, "base64"));
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    }
    const steppedDemo = await evaluate(socket, `(() => { const before = {step: document.querySelector('#teaching-demo-count').textContent, caption: document.querySelector('#teaching-demo-caption').textContent, previousDisabled: document.querySelector('#teaching-demo-previous').disabled}; document.querySelector('#teaching-demo-next').click(); return {before, after: {step: document.querySelector('#teaching-demo-count').textContent, caption: document.querySelector('#teaching-demo-caption').textContent, nextDisabled: document.querySelector('#teaching-demo-next').disabled}}; })()`);
    assert.deepEqual(steppedDemo, { before: {step: "第 1 / 2 步", caption: "先看角上的黑棋：棋盤外不是交叉點，所以不算氣。", previousDisabled: true}, after: {step: "第 2 / 2 步", caption: "只剩右邊和下邊兩個盤內空點，因此這顆棋有 2 口氣；斜角不算。", nextDisabled: true} });
    const started = await evaluate(socket, `(() => { document.querySelector('#lesson-intro-start-button').click(); return {introOpen: document.querySelector('#lesson-intro-dialog').open, label: document.querySelector('#resume-button').textContent, focused: document.activeElement.id, activeFlow: document.querySelector('.learning-steps li.active')?.id, seen: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).seenLessonIntros}; })()`);
    assert.deepEqual(started, { introOpen: false, label: "前往目前題目", focused: "question-title", activeFlow: "learning-step-1", seen: [0] });
    const flowDialog = await evaluate(socket, `(() => { const inlineFlow = document.querySelector('.content-wrap .learning-flow'); document.querySelector('#learning-flow-button').click(); const open = document.querySelector('#learning-flow-dialog').open; document.querySelector('#learning-flow-close-button').click(); return {inlineFlow: Boolean(inlineFlow), open, closed: !document.querySelector('#learning-flow-dialog').open}; })()`);
    assert.deepEqual(flowDialog, { inlineFlow: false, open: true, closed: true });
    let courseShape = await evaluate(socket, "({units: document.querySelector('#unit-select').options.length, shownUnits: document.querySelectorAll('.nav-unit').length, lessons: document.querySelectorAll('[data-lesson]').length, toolDescriptions: document.querySelectorAll('.tool-item p').length, r1LinkAbsent: document.querySelector('a[href=\"r1-review.html\"]') === null, contextBars: document.querySelectorAll('.lesson-context-bar').length, advancedClosed: !document.querySelector('#advanced-tools').open, advancedLabel: document.querySelector('#advanced-tools summary').textContent.trim(), rawBackupHint: document.querySelector('#export-events-button').nextElementSibling.textContent})");
    assert.deepEqual(courseShape, { units: 15, shownUnits: 1, lessons: 3, toolDescriptions: 8, r1LinkAbsent: true, contextBars: 1, advancedClosed: true, advancedLabel: "進階設定與資料 通常不需要現在處理", rawBackupHint: "下載可重算的 JSON 原始事件與局部復盤資料；請自行妥善保存，不需要每天匯出。" });
    const advancedTools = await evaluate(socket, `(() => { const section = document.querySelector('#advanced-tools'); section.open = true; const visible = section.offsetHeight > 0 && getComputedStyle(section).display !== 'none'; const labels = [...section.querySelectorAll('.tool-item button')].map((button) => button.textContent.trim()); section.open = false; return {visible, labels, closed: !section.open}; })()`);
    assert.deepEqual(advancedTools, { visible: true, labels: ["七天流程試行", "匯出學習摘要", "備份完整資料"], closed: true });
    const lastUnit = await evaluate(socket, "(() => { const select = document.querySelector('#unit-select'); const before = document.querySelector('#lesson-kicker').textContent; select.value = '14'; select.dispatchEvent(new Event('change', {bubbles: true})); return {unit: select.value, before, lessonKicker: document.querySelector('#lesson-kicker').textContent, shownLessons: document.querySelectorAll('[data-lesson]').length}; })()");
    assert.equal(lastUnit.unit, "14");
    assert.equal(lastUnit.lessonKicker, lastUnit.before, "changing the unit filter must not open a different lesson");
    assert.ok(lastUnit.shownLessons >= 1);
    const finalLessonDemo = await evaluate(socket, `(() => {
      document.querySelector('[data-lesson="18"]').click();
      const before = {lesson: document.querySelector('#lesson-title').textContent, step: document.querySelector('#teaching-demo-count').textContent, hidden: document.querySelector('#teaching-demo-stepper').hidden, label: document.querySelector('#teaching-demo-board svg').getAttribute('aria-label')};
      document.querySelector('#teaching-demo-next').click();
      const after = {step: document.querySelector('#teaching-demo-count').textContent, caption: document.querySelector('#teaching-demo-caption').textContent};
      document.querySelector('#lesson-intro-dismiss-button').click();
      return {before, after};
    })()`);
    assert.deepEqual(finalLessonDemo.before, {lesson: "從一局找到下一個課題", step: "第 1 / 2 步", hidden: false, label: "複盤時先標記原本的轉折手"});
    assert.equal(finalLessonDemo.after.step, "第 2 / 2 步");
    assert.match(finalLessonDemo.after.caption, /比較原著手|候選方向/);
    await evaluate(socket, "(() => { const select = document.querySelector('#unit-select'); select.value = '0'; select.dispatchEvent(new Event('change', {bubbles: true})); document.querySelector('[data-lesson=\"0\"]').click(); })()");
    let response = await evaluate(socket, `document.querySelector('[data-answer="4"]').click(); ({feedback: document.querySelector('#feedback').textContent, nextDisabled: document.querySelector('#next-button').disabled, progress: document.querySelector('#progress-count').textContent})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.nextDisabled, false);
    assert.equal(response.progress, "1 / 106");
    assert.equal(await evaluate(socket, "document.querySelector('.learning-steps li.active')?.id"), "learning-step-2");
    const nextQuestion = await evaluate(socket, `(() => { document.querySelector('#next-button').click(); return {title: document.querySelector('#question-title').textContent, focused: document.activeElement.id}; })()`);
    assert.deepEqual(nextQuestion, { title: "邊上的一顆棋", focused: "question-title" });
    response = await evaluate(socket, `(() => {
      document.querySelector('[data-lesson="1"]').click();
      document.querySelector('#lesson-intro-start-button').click();
      const initial = document.querySelector('[data-board-point][tabindex="0"]');
      const before = {
        points: document.querySelectorAll('[data-board-point]').length,
        tabbable: document.querySelectorAll('[data-board-point][tabindex="0"]').length,
        x: initial.dataset.x,
        y: initial.dataset.y,
        label: initial.getAttribute('aria-label')
      };
      initial.focus();
      initial.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));
      const moved = document.activeElement;
      const afterMove = {x: moved.dataset.x, y: moved.dataset.y, label: moved.getAttribute('aria-label'), tabbable: document.querySelectorAll('[data-board-point][tabindex="0"]').length};
      moved.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
      return {before, afterMove, feedback: document.querySelector('#feedback').textContent, missed: document.querySelector('#review-count').textContent};
    })()`);
    assert.deepEqual(response.before, { points: 81, tabbable: 1, x: "4", y: "4", label: "第 5 行第 5 列，白棋，已有棋子" });
    assert.deepEqual(response.afterMove, { x: "5", y: "5", label: "第 6 行第 6 列，空點，可落子", tabbable: 1 });
    assert.match(response.feedback, /再試一次/);
    assert.equal(response.missed, "1");
    response = await evaluate(socket, `document.querySelector('[data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); ({feedback: document.querySelector('#feedback').textContent, white: document.querySelectorAll('#board .stone-white').length})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.white, 0);
    const captureEvents = await evaluate(socket, `JSON.parse(localStorage.getItem('go-learning-prototype-v7')).events.filter((event) => event.problemId === 'u1-06')`);
    assert.equal(captureEvents.length, 3);
    assert.deepEqual(captureEvents.map((event) => ({ type: event.type, outcome: event.outcome, firstAnswer: event.firstAnswer, unhinted: event.unhinted, qualifiedOpportunity: event.qualifiedOpportunity, skillId: event.skillId, skillVersion: event.skillVersion })), [
      { type: "presented", outcome: undefined, firstAnswer: undefined, unhinted: undefined, qualifiedOpportunity: false, skillId: "capture-last-liberty-v1", skillVersion: 1 },
      { type: "answer", outcome: "incorrect", firstAnswer: true, unhinted: true, qualifiedOpportunity: true, skillId: "capture-last-liberty-v1", skillVersion: 1 },
      { type: "answer", outcome: "correct", firstAnswer: false, unhinted: true, qualifiedOpportunity: false, skillId: "capture-last-liberty-v1", skillVersion: 1 }
    ]);
    assert.ok(captureEvents.every((event) => event.uiVersion === "learner-flow-v35"));
    assert.equal(captureEvents[1].errorTypeId, "capture-last-liberty-outcome-miss-v1");
    assert.match(await evaluate(socket, "document.querySelector('#diagnostic-summary').textContent"), /最後一口氣未找對：1 次首答錯誤/);
    const expectedReloadedTitle = await evaluate(socket, "document.querySelector('#question-title').textContent");
    await command(socket, "Page.reload");
    let reloadedTitle;
    for (let retry = 0; retry < 30; retry += 1) {
      reloadedTitle = await evaluate(socket, "document.querySelector('#question-title')?.textContent");
      if (reloadedTitle === expectedReloadedTitle) break;
      await delay(100);
    }
    assert.equal(reloadedTitle, expectedReloadedTitle);
    const reloadedEvents = await evaluate(socket, `JSON.parse(localStorage.getItem('go-learning-prototype-v7')).events.filter((event) => event.problemId === 'u1-06')`);
    assert.ok(reloadedEvents.some((event) => event.type === "presentation_end" && event.outcome === "interrupted" && event.recovered), "reload must retain and close the active presentation");
    response = await evaluate(socket, `document.querySelector('#review-button').click(); document.querySelector('[data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); ({missed: document.querySelector('#review-count').textContent, progress: document.querySelector('#progress-count').textContent})`);
    assert.equal(response.missed, "0");
    assert.equal(response.progress, "2 / 106");
    response = await evaluate(socket, `document.querySelector('#unit-select').value = '1'; document.querySelector('#unit-select').dispatchEvent(new Event('change', {bubbles:true})); document.querySelector('[data-lesson="3"]').click(); document.querySelector('#lesson-intro-start-button').click(); document.querySelector('[data-answer="true"]').click(); ({feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.progress, "3 / 106");
    response = await evaluate(socket, `document.querySelector('[data-lesson="4"]').click(); document.querySelector('#lesson-intro-start-button').click(); document.querySelector('[data-x="4"][data-y="4"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); ({feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.progress, "4 / 106");
    response = await evaluate(socket, `document.querySelector('[data-lesson="5"]').click(); document.querySelector('#lesson-intro-start-button').click(); document.querySelector('[data-x="4"][data-y="4"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); ({feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.progress, "5 / 106");
    response = await evaluate(socket, `document.querySelector('#unit-select').value = '2'; document.querySelector('#unit-select').dispatchEvent(new Event('change', {bubbles:true})); document.querySelector('[data-lesson="6"]').click(); document.querySelector('#lesson-intro-start-button').click(); document.querySelector('[data-answer="1"]').click(); ({feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent, title: document.querySelector('#lesson-title').textContent})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.progress, "6 / 106");
    assert.equal(response.title, "不能下與不能立刻提回");
    const lifeAndDeath = await evaluate(socket, `(() => {
      document.querySelector('#unit-select').value = '3';
      document.querySelector('#unit-select').dispatchEvent(new Event('change', {bubbles:true}));
      document.querySelector('[data-lesson="7"]').click();
      const before = {
        lesson: document.querySelector('#lesson-title').textContent,
        title: document.querySelector('#question-title').textContent,
        step: document.querySelector('#teaching-demo-count').textContent,
        caption: document.querySelector('#teaching-demo-caption').textContent,
        boardPoints: document.querySelectorAll('[data-board-point]').length
      };
      document.querySelector('#teaching-demo-next').click();
      document.querySelector('#teaching-demo-next').click();
      const after = {step: document.querySelector('#teaching-demo-count').textContent, caption: document.querySelector('#teaching-demo-caption').textContent};
      document.querySelector('#lesson-intro-dismiss-button').click();
      return {before, after};
    })()`);
    assert.equal(lifeAndDeath.before.lesson, "兩眼與急所");
    assert.equal(lifeAndDeath.before.title, "先找第一個急所");
    assert.equal(lifeAndDeath.before.step, "第 1 / 3 步");
    assert.match(lifeAndDeath.before.caption, /三個連成一直線/);
    assert.equal(lifeAndDeath.before.boardPoints, 81);
    assert.equal(lifeAndDeath.after.step, "第 3 / 3 步");
    assert.match(lifeAndDeath.after.caption, /白若填一端，黑可再佔另一端提掉白棋/);
    response = await evaluate(socket, `document.querySelector('#unit-select').value = '14'; document.querySelector('#unit-select').dispatchEvent(new Event('change', {bubbles:true})); document.querySelector('[data-lesson="18"]').click(); const before = {boardHidden: getComputedStyle(document.querySelector('.board-card')).display === 'none', singleColumn: document.querySelector('.practice-grid').classList.contains('text-practice')}; document.querySelector('[data-answer="0"]').click(); ({...before, feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent, title: document.querySelector('#lesson-title').textContent})`);
    assert.match(response.feedback, /答對了/);
    assert.equal(response.progress, "7 / 106");
    assert.equal(response.title, "從一局找到下一個課題");
    assert.equal(response.boardHidden, true);
    assert.equal(response.singleColumn, true);
    const notes = await evaluate(socket, `(async () => { URL.createObjectURL = (blob) => { window.__exportBlob = blob; return 'blob:captured'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function () { window.__downloadName = this.download; }; document.querySelector('#export-button').click(); return {name: window.__downloadName, text: await window.__exportBlob.text()}; })()`);
    assert.equal(notes.name, "個人圍棋練習紀錄.md");
    assert.match(notes.text, /已完成：7 \/ 106/);
    assert.match(notes.text, /待複習：0 題/);
    assert.match(notes.text, /指定棋形的練習紀錄，不是獨立保留題或實戰成效/);
    assert.match(notes.text, /capture-last-liberty-v1 v1/);
    assert.match(notes.text, /\| .* \| capture-last-liberty-v1 \| u1-06 \| 首次作答 \| 未提示 \| 錯誤 \|/);
    assert.match(notes.text, /## 錯誤修正診斷/);
    assert.match(notes.text, /不代表已確認心理或認知根因/);
    const scheduled = await evaluate(socket, `document.querySelector('#scheduled-practice-button').click(); ({number: document.querySelector('#question-number').textContent, prompt: document.querySelector('#question-prompt').textContent, why: document.querySelector('#learning-why').textContent})`);
    assert.match(scheduled.number, /固定方案/);
    assert.match(scheduled.prompt, /輪到黑棋/);
    assert.match(scheduled.why, /安排一題新練習|已到複習時間/);
    assert.equal(await evaluate(socket, "document.querySelector('.learning-steps li.active')?.id"), "learning-step-1");
    await evaluate(socket, `(() => { const key = 'go-learning-prototype-v7'; const saved = JSON.parse(localStorage.getItem(key)); const id = saved.scheduler.selections.at(-1).problemId; saved.scheduler.reviews[id] = {stage: 0, dueAt: 0, scheduledBy: 'fixed-spacing-v1'}; localStorage.setItem(key, JSON.stringify(saved)); return id; })()`);
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "Boolean(document.querySelector('#due-review-button')?.getAttribute('aria-label'))")) break;
      await delay(100);
    }
    const dueReview = await evaluate(socket, `(() => { const button = document.querySelector('#due-review-button'); const before = {hidden: button.hidden, count: document.querySelector('#due-review-count').textContent, label: button.getAttribute('aria-label')}; button.click(); return {...before, number: document.querySelector('#question-number').textContent}; })()`);
    assert.equal(dueReview.hidden, false);
    assert.equal(dueReview.count, "1");
    assert.match(dueReview.label, /1 題到期複習/);
    assert.match(dueReview.number, /間隔練習/);
    await delay(30);
    assert.equal(await evaluate(socket, "document.activeElement.id"), "question-title");
    const phase4 = await evaluate(socket, `document.querySelector('#tools-menu').open = true; document.querySelector('#application-button').click(); const application = {number: document.querySelector('#question-number').textContent, tag: document.querySelector('#question-tag').textContent, why: document.querySelector('#learning-why').textContent, toolsClosed: !document.querySelector('#tools-menu').open, focused: document.activeElement.id}; document.querySelector('[data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); document.querySelector('#sample-sgf-button').click(); const picker = {open: document.querySelector('#sgf-picker-dialog').open, choices: document.querySelector('#sgf-picker-move').options.length}; document.querySelector('#sgf-picker-confirm-button').click(); const candidate = document.querySelector('#sgf-candidate-input'); const reason = document.querySelector('#sgf-reason-input'); const expectedResponse = document.querySelector('#sgf-opponent-response-input'); candidate.value = '第 5 行第 5 列'; reason.value = '先確認中央氣數'; expectedResponse.value = '預期白棋會先補氣'; document.querySelector('#sgf-reflection-save-button').click(); const local = {number: document.querySelector('#question-number').textContent, player: document.querySelector('#player-color').textContent, status: document.querySelector('#sgf-reflection-status').textContent}; document.querySelector('[data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); document.querySelector('#sgf-review-status-input').value = 'original_confirmed'; document.querySelector('#sgf-acceptable-answer-input').value = '人工複盤確認原著可接受'; document.querySelector('#sgf-review-save-button').click(); const review = document.querySelector('#sgf-review-status').textContent; ({application, picker, local, review, feedback: document.querySelector('#feedback').textContent})`);
    assert.match(phase4.application.number, /固定應用探測/);
    assert.equal(phase4.application.tag, "固定應用探測");
    assert.match(phase4.application.why, /固定局面小測驗/);
    assert.equal(phase4.application.toolsClosed, true);
    assert.equal(phase4.application.focused, "question-title");
    assert.deepEqual(phase4.picker, {open: true, choices: 1});
    assert.equal(await evaluate(socket, "document.querySelector('.learning-steps li.active')?.id"), "learning-step-4");
    assert.match(phase4.local.number, /棋譜單點復盤/);
    assert.equal(phase4.local.player, "● 黑棋");
    assert.match(phase4.local.status, /作答前保存/);
    assert.match(phase4.review, /已確認原著可接受/);
    assert.match(phase4.feedback, /與原著一致/);
    const localSgfExport = await evaluate(socket, `(async () => { URL.createObjectURL = (blob) => { window.__localSgfBlob = blob; return 'blob:local-sgf'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function () { window.__localSgfName = this.download; }; document.querySelector('#sgf-export-button').click(); return {name: window.__localSgfName, text: await window.__localSgfBlob.text()}; })()`);
    assert.match(localSgfExport.name, /^局部復盤_sgf-[0-9a-f]{8}_第1手\.sgf$/);
    assert.match(localSgfExport.text, /^\(;GM\[1\]FF\[4\]CA\[UTF-8\]SZ\[9\]AB/);
    assert.match(localSgfExport.text, /預期對方應手：預期白棋會先補氣/);
    assert.match(await evaluate(socket, "document.querySelector('#sgf-export-help').textContent"), /可用 KaTrain 開啟/);
    const evaluation = await evaluate(socket, `document.querySelector('#evaluation-button').click(); const preflight = {open: document.querySelector('#evaluation-dialog').open, text: document.querySelector('#evaluation-dialog').textContent}; document.querySelector('#evaluation-confirm-button').click(); const evaluationMeta = {number: document.querySelector('#question-number').textContent, tag: document.querySelector('#question-tag').textContent, hintDisabled: document.querySelector('#hint-button').disabled}; document.querySelector('[data-x="8"][data-y="8"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); ({preflight, ...evaluationMeta, feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent, missed: document.querySelector('#review-count').textContent})`);
    assert.equal(evaluation.preflight.open, true);
    assert.match(evaluation.preflight.text, /每題只記第一次作答/);
    assert.match(evaluation.preflight.text, /已在舊 R1 自我審查中看過/);
    assert.match(evaluation.number, /個人 pilot.*基線/);
    assert.equal(evaluation.tag, "無提示個人試行");
    assert.equal(evaluation.hintDisabled, true);
    assert.match(evaluation.feedback, /完成整批前不顯示正誤/);
    assert.equal(evaluation.progress, "7 / 106");
    assert.equal(evaluation.missed, "0");
    const rawEvents = await evaluate(socket, `(async () => { URL.createObjectURL = (blob) => { window.__rawEventBlob = blob; return 'blob:captured'; }; document.querySelector('#export-events-button').click(); return JSON.parse(await window.__rawEventBlob.text()); })()`);
    assert.equal(rawEvents.eventPolicyVersion, "trial-events-v4");
    assert.equal(rawEvents.uiVersion, "learner-flow-v35");
    assert.equal(rawEvents.claimMode, "personal_descriptive");
    assert.equal(rawEvents.formalEvaluationAvailable, false);
    assert.equal(rawEvents.schedulerPolicy, "fixed-spacing-v1");
    assert.equal(rawEvents.phase2Catalog.length, 148);
    assert.equal(rawEvents.holdoutAnswersRedacted, true);
    assert.ok(rawEvents.phase2Catalog.filter((problem) => problem.pool === "holdout").every((problem) => problem.redacted && !("answer" in problem) && !("stones" in problem)));
    assert.equal(rawEvents.scheduler.selections.length, 2);
    assert.equal(rawEvents.scheduler.selections[1].selectionReason, "scheduled_review_due");
    assert.equal(rawEvents.localExercises.length, 1);
    assert.equal(rawEvents.localExercises[0].source.sourceName, "內建示範棋譜");
    assert.equal(rawEvents.localExercises[0].reflection.candidate, "第 5 行第 5 列");
    assert.equal(rawEvents.localExercises[0].reflection.expectedOpponentResponse, "預期白棋會先補氣");
    assert.equal(rawEvents.localExercises[0].source.originalStones.length, 4);
    assert.equal(rawEvents.localExercises[0].reflection.savedBeforeAnswer, true);
    assert.equal(rawEvents.localExercises[0].review.status, "original_confirmed");
    assert.equal(rawEvents.applicationResults.length, 1);
    assert.equal(rawEvents.applicationResults[0].uiVersion, "learner-flow-v35");
    assert.equal(rawEvents.trial.answers.length, 1);
    assert.equal(rawEvents.trial.answers[0].uiVersion, "learner-flow-v35");
    assert.equal(rawEvents.trial.answers[0].formalEligible, false);
    assert.equal(rawEvents.trialSummary.status, "data_insufficient");
    assert.equal(rawEvents.learningDiagnostics.metricPolicyVersion, "skill-correction-diagnostics-v1");
    assert.equal(rawEvents.learningDiagnostics.skills[0].errorTypeId, "capture-last-liberty-outcome-miss-v1");
    assert.ok(rawEvents.events.some((event) => event.type === "presentation_end" && event.recovered));
    assert.ok(rawEvents.trialProblems.every((problem) => problem.motherFamilyId && problem.taskFeatures));
    await evaluate(socket, "localStorage.clear()");
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#question-title')?.textContent === '中央的一顆棋'")) break;
      await delay(100);
    }
    await evaluate(socket, "document.querySelector('#lesson-intro-start-button').click()");
    const correctEvaluationView = await evaluate(socket, `(() => { document.querySelector('#evaluation-button').click(); document.querySelector('#evaluation-confirm-button').click(); const before = document.querySelector('#board').innerHTML; document.querySelector('[data-x="2"][data-y="4"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); return {before, after: document.querySelector('#board').innerHTML, feedback: document.querySelector('#feedback').textContent, feedbackClass: document.querySelector('#feedback').className, nextDisabled: document.querySelector('#next-button').disabled, lastMoves: document.querySelectorAll('.last-move').length}; })()`);
    await evaluate(socket, "localStorage.clear()");
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#question-title')?.textContent === '中央的一顆棋'")) break;
      await delay(100);
    }
    await evaluate(socket, "document.querySelector('#lesson-intro-start-button').click()");
    const wrongEvaluationView = await evaluate(socket, `(() => { document.querySelector('#evaluation-button').click(); document.querySelector('#evaluation-confirm-button').click(); const before = document.querySelector('#board').innerHTML; document.querySelector('[data-x="8"][data-y="8"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); return {before, after: document.querySelector('#board').innerHTML, feedback: document.querySelector('#feedback').textContent, feedbackClass: document.querySelector('#feedback').className, nextDisabled: document.querySelector('#next-button').disabled, lastMoves: document.querySelectorAll('.last-move').length}; })()`);
    assert.equal(correctEvaluationView.after, correctEvaluationView.before);
    assert.equal(wrongEvaluationView.after, wrongEvaluationView.before);
    assert.deepEqual({ ...correctEvaluationView, before: undefined, after: undefined }, { ...wrongEvaluationView, before: undefined, after: undefined });
    await evaluate(socket, "localStorage.clear()");
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#question-title')?.textContent === '中央的一顆棋'")) break;
      await delay(100);
    }
    await evaluate(socket, "document.querySelector('#lesson-intro-start-button').click()");
    const localSpot = await evaluate(socket, `(() => {
      const unit = document.querySelector('#unit-select');
      unit.value = '4';
      unit.dispatchEvent(new Event('change', {bubbles:true}));
      document.querySelector('[data-lesson="8"]').click();
      document.querySelector('#lesson-intro-start-button').click();
      document.querySelector('[data-answer="0"]').click();
      document.querySelector('#next-button').click();
      document.querySelector('[data-answer="0"]').click();
      document.querySelector('#next-button').click();
      const before = {
        title: document.querySelector('#question-title').textContent,
        player: document.querySelector('#player-color').textContent,
        instruction: document.querySelector('#answer-area').textContent,
        points: document.querySelectorAll('#board [data-board-point]').length
      };
      document.querySelector('#board [data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {...before, feedback: document.querySelector('#feedback').textContent, nextDisabled: document.querySelector('#next-button').disabled, lastMoves: document.querySelectorAll('#board .last-move').length};
    })()`);
    assert.equal(localSpot.title, "先補弱棋的出路");
    assert.equal(localSpot.player, "◎ 選擇要點");
    assert.match(localSpot.instruction, /局部觀察點/);
    assert.equal(localSpot.points, 81);
    assert.match(localSpot.feedback, /答對了/);
    assert.equal(localSpot.nextDisabled, false);
    assert.equal(localSpot.lastMoves, 1);
    await evaluate(socket, "localStorage.clear()");
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#question-title')?.textContent === '中央的一顆棋'")) break;
      await delay(100);
    }
    await evaluate(socket, "document.querySelector('#lesson-intro-start-button').click()");
    const lessonTransition = await evaluate(socket, `(() => {
      const unit = document.querySelector('#unit-select');
      unit.value = '0';
      unit.dispatchEvent(new Event('change', {bubbles:true}));
      document.querySelector('[data-lesson="2"]').click();
      const opening = {
        lesson: document.querySelector('#lesson-title').textContent,
        stage: document.querySelector('#learning-stage-badge').textContent,
        focused: document.activeElement.id,
        introOpen: document.querySelector('#lesson-intro-dialog').open
      };
      document.querySelector('#lesson-intro-start-button').click();
      document.querySelector('#board [data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true}));
      const boundaryButton = document.querySelector('#next-button').textContent.trim();
      document.querySelector('#next-button').click();
      return {
        opening,
        boundaryButton,
        nextLesson: document.querySelector('#lesson-title').textContent,
        nextQuestion: document.querySelector('#question-title').textContent,
        nextStage: document.querySelector('#learning-stage-badge').textContent,
        guidance: document.querySelector('#learning-now').textContent,
        focused: document.activeElement.id,
        demoVisible: !document.querySelector('#teaching-demo-stepper').hidden,
        introOpen: document.querySelector('#lesson-intro-dialog').open
      };
    })()`);
    assert.deepEqual(lessonTransition.opening, {lesson: "逃出打吃", stage: "目前 1/5 · 先看懂", focused: "lesson-intro-title", introOpen: true});
    assert.match(lessonTransition.boundaryButton, /進入第 2 單元短講/);
    assert.equal(lessonTransition.nextLesson, "辨認棋串");
    assert.equal(lessonTransition.nextQuestion, "左右相鄰");
    assert.equal(lessonTransition.nextStage, "目前 1/5 · 先看懂");
    assert.match(lessonTransition.guidance, /短講.*棋盤示範/);
    assert.equal(lessonTransition.focused, "lesson-intro-title");
    assert.equal(lessonTransition.demoVisible, true);
    assert.equal(lessonTransition.introOpen, true);
    assert.equal(await evaluate(socket, "JSON.parse(localStorage.getItem('go-learning-prototype-v7')).lessonIntroPending"), true);
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#lesson-title')?.textContent === '辨認棋串'")) break;
      await delay(100);
    }
    const restoredLessonIntro = await evaluate(socket, `({lesson: document.querySelector('#lesson-title').textContent, stage: document.querySelector('#learning-stage-badge').textContent, guidance: document.querySelector('#learning-now').textContent, pending: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).lessonIntroPending, introOpen: document.querySelector('#lesson-intro-dialog').open})`);
    assert.deepEqual(restoredLessonIntro, {lesson: "辨認棋串", stage: "目前 1/5 · 先看懂", guidance: "先看本課短講，再用棋盤示範確認要觀察的變化。", pending: true, introOpen: true});
    const seenAfterDismiss = await evaluate(socket, `(() => { document.querySelector('#lesson-intro-start-button').click(); document.querySelector('[data-lesson="4"]').click(); const reopened = document.querySelector('#lesson-intro-dialog').open; document.querySelector('#lesson-intro-dismiss-button').click(); document.querySelector('[data-lesson="4"]').click(); return {seen: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).seenLessonIntros, reopened, repeatedOpen: document.querySelector('#lesson-intro-dialog').open}; })()`);
    assert.equal(seenAfterDismiss.reopened, true);
    assert.equal(seenAfterDismiss.repeatedOpen, false);
    assert.ok(seenAfterDismiss.seen.includes(4));

    // Regression: previewing a future unit must not suppress the formal unit-transition intro.
    await evaluate(socket, `(() => {
      localStorage.setItem('go-learning-prototype-v7', JSON.stringify({
        schemaVersion: 7,
        contentCatalogVersion: 3,
        index: 57,
        navUnitIndex: 6,
        hasStarted: true,
        lessonIntroPending: false,
        seenLessonIntros: [10, 11]
      }));
    })()`);
    await command(socket, "Page.reload");
    let revisitedUnitBoundaryReady = false;
    for (let retry = 0; retry < 30; retry += 1) {
      revisitedUnitBoundaryReady = await evaluate(socket, "document.querySelector('#question-title')?.textContent === '全局比較'");
      if (revisitedUnitBoundaryReady) break;
      await delay(100);
    }
    assert.equal(revisitedUnitBoundaryReady, true, "第 7 單元末題未載入");
    const revisitedUnitTransition = await evaluate(socket, `(() => {
      const problem = window.GoContent.problems[57];
      if (!problem || problem.id !== 'u7-06') throw new Error('u7-06 boundary mismatch');
      if (problem.type === 'choice') {
        const option = document.querySelector('[data-answer="' + problem.answer + '"]');
        if (!option) throw new Error('u7-06 answer missing');
        option.click();
      } else if (problem.type === 'move') {
        const point = document.querySelector('#board [data-x="' + problem.answer[0] + '"][data-y="' + problem.answer[1] + '"]');
        if (!point) throw new Error('u7-06 move answer missing');
        point.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      } else {
        throw new Error('unsupported u7-06 type: ' + problem.type);
      }
      const boundaryButton = document.querySelector('#next-button').textContent.replace(/\\s+/g, ' ').trim();
      document.querySelector('#next-button').click();
      const saved = JSON.parse(localStorage.getItem('go-learning-prototype-v7'));
      return {
        boundaryButton,
        lesson: document.querySelector('#lesson-title').textContent,
        question: document.querySelector('#question-title').textContent,
        introOpen: document.querySelector('#lesson-intro-dialog').open,
        introTitle: document.querySelector('#lesson-intro-title').textContent,
        pending: saved.lessonIntroPending,
        seen: saved.seenLessonIntros,
        focused: document.activeElement.id
      };
    })()`);
    assert.equal(revisitedUnitTransition.boundaryButton, "進入第 8 單元短講 →");
    assert.equal(revisitedUnitTransition.lesson, "先照顧弱棋");
    assert.equal(revisitedUnitTransition.question, "弱棋的線索");
    assert.equal(revisitedUnitTransition.introOpen, true, "已預覽過第 8 單元時，正式從第 7 單元進入仍必須開啟短講");
    assert.equal(revisitedUnitTransition.introTitle, "現在先學：先照顧弱棋");
    assert.equal(revisitedUnitTransition.pending, true);
    assert.ok(revisitedUnitTransition.seen.includes(11), "測試前提：第 8 單元短講必須已看過");
    assert.equal(revisitedUnitTransition.focused, "lesson-intro-title");

    const unitBoundaryCases = [
      { index: 9, fromId: "u1-10", fromTitle: "救出被打吃的黑棋", fromLesson: 2, toUnit: 2, toLesson: "辨認棋串", toQuestion: "左右相鄰" },
      { index: 19, fromId: "u2-10", fromTitle: "近邊的斷點", fromLesson: 5, toUnit: 3, toLesson: "不能下與不能立刻提回", toQuestion: "沒有氣的一手" },
      { index: 25, fromId: "u3-06", fromTitle: "本程式的劫規則", fromLesson: 6, toUnit: 4, toLesson: "兩眼與急所", toQuestion: "先找第一個急所" },
      { index: 39, fromId: "u4-06", fromTitle: "先手的重要性", fromLesson: 7, toUnit: 5, toLesson: "把一局下完", toQuestion: "9 路盤的用途" },
      { index: 45, fromId: "u5-06", fromTitle: "小局複盤", fromLesson: 8, toUnit: 6, toLesson: "從角落展開", toQuestion: "角落的效率" },
      { index: 51, fromId: "u6-06", fromTitle: "佈局後的自問", fromLesson: 9, toUnit: 7, toLesson: "實地與厚勢", toQuestion: "實地" },
      { index: 57, fromId: "u7-06", fromTitle: "全局比較", fromLesson: 10, toUnit: 8, toLesson: "先照顧弱棋", toQuestion: "弱棋的線索" },
      { index: 63, fromId: "u8-06", fromTitle: "攻守檢查", fromLesson: 11, toUnit: 9, toLesson: "讀到活或死", toQuestion: "死活不是猜圖" },
      { index: 69, fromId: "u9-06", fromTitle: "死活練習的選題", fromLesson: 12, toUnit: 10, toLesson: "收官與數目", toQuestion: "官子的焦點" },
      { index: 75, fromId: "u10-06", fromTitle: "數目校正", fromLesson: 13, toUnit: 11, toLesson: "選擇全局更大的方向", toQuestion: "全局先找弱棋" },
      { index: 81, fromId: "u11-06", fromTitle: "方向不是背譜", fromLesson: 14, toUnit: 12, toLesson: "戰鬥中的取捨", toQuestion: "辨認可能的棄子" },
      { index: 87, fromId: "u12-06", fromTitle: "戰鬥複盤", fromLesson: 15, toUnit: 13, toLesson: "劫材與全局價值", toQuestion: "劫材是否真實" },
      { index: 93, fromId: "u13-06", fromTitle: "劫的複盤", fromLesson: 16, toUnit: 14, toLesson: "定石看方向", toQuestion: "定石的意思" },
      { index: 99, fromId: "u14-06", fromTitle: "學定石的方法", fromLesson: 17, toUnit: 15, toLesson: "從一局找到下一個課題", toQuestion: "複盤先找哪裡" }
    ];
    assert.equal(unitBoundaryCases.length, 14, "15 個單元必須有 14 個跨單元銜接");
    for (const boundary of unitBoundaryCases) {
      await evaluate(socket, `(() => {
        localStorage.setItem('go-learning-prototype-v7', JSON.stringify({
          schemaVersion: 7,
          contentCatalogVersion: 3,
          index: ${boundary.index},
          navUnitIndex: ${boundary.toUnit - 2},
          hasStarted: true,
          lessonIntroPending: false,
          seenLessonIntros: [${boundary.fromLesson}]
        }));
      })()`);
      await command(socket, "Page.reload");
      let boundaryReady = false;
      for (let retry = 0; retry < 30; retry += 1) {
        boundaryReady = await evaluate(socket, `document.querySelector('#question-title')?.textContent === ${JSON.stringify(boundary.fromTitle)}`);
        if (boundaryReady) break;
        await delay(100);
      }
      assert.equal(boundaryReady, true, `${boundary.fromId} 未載入到預期的單元末題`);
      const transition = await evaluate(socket, `(() => {
        const boundary = ${JSON.stringify(boundary)};
        const problem = window.GoContent.problems[boundary.index];
        if (!problem || problem.id !== boundary.fromId) throw new Error('unit boundary source mismatch');
        if (problem.type === 'move') {
          const x = problem.answer[0];
          const y = problem.answer[1];
          const point = document.querySelector('#board [data-x="' + x + '"][data-y="' + y + '"]');
          if (!point) throw new Error('unit boundary move answer point missing');
          point.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        } else if (problem.type === 'choice') {
          const option = document.querySelector('[data-answer="' + problem.answer + '"]');
          if (!option) throw new Error('unit boundary choice answer missing');
          option.click();
        } else {
          throw new Error('unsupported unit boundary problem type: ' + problem.type);
        }
        const feedback = document.querySelector('#feedback').textContent;
        const nextDisabled = document.querySelector('#next-button').disabled;
        const boundaryButton = document.querySelector('#next-button').textContent.replace(/\\s+/g, ' ').trim();
        document.querySelector('#next-button').click();
        const saved = JSON.parse(localStorage.getItem('go-learning-prototype-v7'));
        return {
          feedback,
          nextDisabled,
          boundaryButton,
          nextLesson: document.querySelector('#lesson-title').textContent,
          nextQuestion: document.querySelector('#question-title').textContent,
          introTitle: document.querySelector('#lesson-intro-title').textContent,
          introOpen: document.querySelector('#lesson-intro-dialog').open,
          pending: saved.lessonIntroPending,
          focused: document.activeElement.id,
          selectedUnit: document.querySelector('#unit-select').value
        };
      })()`);
      assert.match(transition.feedback, /答對了/, `${boundary.fromId} 單元末題未正確完成`);
      assert.equal(transition.nextDisabled, false, `${boundary.fromId} 完成後下一步仍被停用`);
      assert.equal(transition.boundaryButton, `進入第 ${boundary.toUnit} 單元短講 →`);
      assert.equal(transition.nextLesson, boundary.toLesson);
      assert.equal(transition.nextQuestion, boundary.toQuestion);
      assert.equal(transition.introTitle, `現在先學：${boundary.toLesson}`);
      assert.equal(transition.introOpen, true, `第 ${boundary.toUnit} 單元未自動開啟未看過的短講`);
      assert.equal(transition.pending, true, `第 ${boundary.toUnit} 單元短講 pending 未保存`);
      assert.equal(transition.focused, "lesson-intro-title");
      assert.equal(transition.selectedUnit, String(boundary.toUnit - 1));
    }

    await evaluate(socket, "localStorage.clear()");
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#question-title')?.textContent === '中央的一顆棋'")) break;
      await delay(100);
    }
    await evaluate(socket, "document.querySelector('#lesson-intro-start-button').click()");
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    const typography = await evaluate(socket, `({body: getComputedStyle(document.querySelector('.teaching-card p')).fontSize, prompt: getComputedStyle(document.querySelector('.question-prompt')).fontSize, heading: getComputedStyle(document.querySelector('.title-row h2')).fontSize})`);
    assert.deepEqual(typography, { body: "16px", prompt: "16px", heading: "32px" });
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrowOverflow = await evaluate(socket, "({width: innerWidth, scrollWidth: document.documentElement.scrollWidth})");
    assert.ok(narrowOverflow.scrollWidth <= narrowOverflow.width + 1, `320px horizontal overflow: ${JSON.stringify(narrowOverflow)}`);
    const mobileBrand = await evaluate(socket, `(() => { const label = document.querySelector('.brand small'); return {text: label.textContent, display: getComputedStyle(label).display}; })()`);
    assert.match(mobileBrand.text, /VT-COS/);
    assert.notEqual(mobileBrand.display, "none");
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    const enlargedText = await evaluate(socket, `(() => { document.documentElement.style.fontSize = '32px'; const result = {width: innerWidth, scrollWidth: document.documentElement.scrollWidth}; document.documentElement.style.fontSize = ''; return result; })()`);
    assert.ok(enlargedText.scrollWidth <= enlargedText.width + 1, `200% text horizontal overflow: ${JSON.stringify(enlargedText)}`);
    if (screenshotDirectory) {
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
      const desktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-desktop.png"), Buffer.from(desktop.data, "base64"));
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
      const mobileOverflow = await evaluate(socket, "({width: innerWidth, scrollWidth: document.documentElement.scrollWidth})");
      assert.ok(mobileOverflow.scrollWidth <= mobileOverflow.width + 1, `mobile horizontal overflow: ${JSON.stringify(mobileOverflow)}`);
      const mobile = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-mobile.png"), Buffer.from(mobile.data, "base64"));
    }
    await command(socket, "Page.navigate", { url: reviewPage });
    let reviewReady = false;
    for (let retry = 0; retry < 30; retry += 1) {
      reviewReady = await evaluate(socket, "Boolean(window.GoR1Review && document.querySelectorAll('.card').length === 77)");
      if (reviewReady) break;
      await delay(100);
    }
    assert.equal(reviewReady, true);
    const reviewPageState = await evaluate(socket, `(() => { const card = document.querySelector('.card'); card.querySelector('.hit').dispatchEvent(new MouseEvent('click', {bubbles:true})); card.querySelector('.status').value = 'consistent'; card.querySelector('.status').dispatchEvent(new Event('change', {bubbles:true})); document.querySelector('#export-final').click(); return {items: window.GoR1Review.reviewItems.length, fingerprint: window.GoR1Review.fingerprint, fullBankAbsent: typeof window.GoPhase2Content === 'undefined', declarations: document.querySelectorAll('.declaration input[type="checkbox"]').length, selected: card.querySelectorAll('.selected').length, progress: document.querySelector('#progress').textContent, message: document.querySelector('#message').textContent, notice: document.querySelector('.notice').textContent, width: innerWidth, scrollWidth: document.documentElement.scrollWidth}; })()`);
    assert.equal(reviewPageState.items, 77);
    assert.equal(reviewPageState.fingerprint, "fnv1a32-1afc0a13");
    assert.equal(reviewPageState.fullBankAbsent, true);
    assert.equal(reviewPageState.declarations, 3);
    assert.equal(reviewPageState.selected, 1);
    assert.equal(reviewPageState.progress, "已完成 1 / 77 · 待審 76");
    assert.match(reviewPageState.message, /尚不能匯出完成回條/);
    assert.match(reviewPageState.notice, /不是目前學習者/);
    assert.ok(reviewPageState.scrollWidth <= reviewPageState.width + 1);
    const pendingFilter = await evaluate(socket, `(() => { const filter = document.querySelector('#review-filter'); filter.value = 'pending'; filter.dispatchEvent(new Event('change', {bubbles:true})); return {hidden: [...document.querySelectorAll('.card')].filter((card) => card.hidden).length, visible: [...document.querySelectorAll('.card')].filter((card) => !card.hidden).length, label: filter.selectedOptions[0].textContent}; })()`);
    assert.deepEqual(pendingFilter, {hidden: 1, visible: 76, label: "待審（76）"});
    await evaluate(socket, "document.querySelector('#next-incomplete').click()");
    await delay(30);
    const nextIncomplete = await evaluate(socket, `({cardId: document.activeElement.closest('.card')?.dataset.id, control: document.activeElement.className, filter: document.querySelector('#review-filter').value})`);
    assert.ok(nextIncomplete.cardId && nextIncomplete.cardId !== "p2-c-1-1");
    assert.equal(nextIncomplete.control, "status");
    assert.equal(nextIncomplete.filter, "pending");
    const completedFilter = await evaluate(socket, `(() => { const filter = document.querySelector('#review-filter'); filter.value = 'completed'; filter.dispatchEvent(new Event('change', {bubbles:true})); return {hidden: [...document.querySelectorAll('.card')].filter((card) => card.hidden).length, visible: [...document.querySelectorAll('.card')].filter((card) => !card.hidden).length, label: filter.selectedOptions[0].textContent}; })()`);
    assert.deepEqual(completedFilter, {hidden: 76, visible: 1, label: "已完成（1）"});
    const reviewDraft = await evaluate(socket, `(async () => { URL.createObjectURL = (blob) => { window.__reviewDraftBlob = blob; return 'blob:review-draft'; }; URL.revokeObjectURL = () => {}; document.querySelector('#export-draft').click(); return JSON.parse(await window.__reviewDraftBlob.text()); })()`);
    assert.equal(reviewDraft.draft, true);
    assert.equal(reviewDraft.protocolId, "go-r1-independent-content-review-v4");
    assert.equal(reviewDraft.population.publicReviewGroupCount, 48);
    assert.equal(reviewDraft.reviews.length, 77);
    assert.equal(reviewDraft.reviews.filter((review) => review.status).length, 1);
    assert.equal(reviewDraft.reviewScope.parallelFormComparability, "not_established");
    assert.equal(reviewDraft.reviewScope.learningEffect, "not_measured");
    process.stdout.write("PASS: 離線課程、驗收遮蔽、匯出與 R1 盲審頁面\n");
  } finally {
    if (socket instanceof CdpPipe) {
      try { await socket.command("Browser.close", {}, null); }
      catch (_) { /* The browser may already be shutting down. */ }
      socket.close();
    } else if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ id: 999999999, method: "Browser.close" }));
      await delay(700);
      socket.close();
    }
    child.kill();
    for (let retry = 0; retry < 30 && child.exitCode === null; retry += 1) await delay(100);
    if (process.platform === "win32") {
      spawnSync("powershell.exe", ["-NoProfile", "-Command", "$marker = $env:GO_TEST_PROFILE; Get-CimInstance Win32_Process -Filter \"name = 'msedge.exe'\" | Where-Object { $_.CommandLine -like ('*' + $marker + '*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { env: { ...process.env, GO_TEST_PROFILE: profile }, stdio: "ignore", timeout: 15000 });
      await delay(500);
    }
    const resolvedTemp = path.resolve(os.tmpdir()) + path.sep;
    if (path.resolve(profile).startsWith(resolvedTemp)) {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 }); }
      catch (error) { process.stderr.write(`Browser profile cleanup pending: ${error.message}\n`); }
    }
  }
}

main().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
