const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { terminateBrowserTree } = require("../browser-verifier-cleanup.cjs");

const browser = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
].find((candidate) => fs.existsSync(candidate));

class CdpSocket {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    socket.addEventListener("message", (event) => this.onMessage(event.data));
  }

  onMessage(data) {
    const message = JSON.parse(String(data));
    const pending = this.pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result);
  }

  command(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`CDP ${method} timed out`)), 15000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() { this.socket.close(); }
}

async function connectToPage(profile, page) {
  const marker = path.join(profile, "DevToolsActivePort");
  let port;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (fs.existsSync(marker)) {
      try {
        port = Number(fs.readFileSync(marker, "utf8").split(/\r?\n/)[0]);
        if (Number.isInteger(port)) break;
      } catch (error) {
        if (!["EBUSY", "EACCES", "ENOENT"].includes(error.code)) throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(port, "Edge did not open the debugging port");

  let target;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = targets.find((candidate) => candidate.type === "page" && candidate.url === page);
    if (target) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(target, "Local prototype page did not load");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("CDP WebSocket connection timed out")), 10000);
    socket.addEventListener("open", () => { clearTimeout(timeout); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("CDP WebSocket connection failed")); }, { once: true });
  });
  return new CdpSocket(socket);
}

async function evaluate(cdp, expression) {
  const result = await cdp.command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(cdp, expression, label) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate(cdp, expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function screenshot(cdp, filename) {
  const layout = await evaluate(cdp, `(() => {
    const active = document.querySelector('.review-view:not([hidden])');
    const title = active?.querySelector('[data-view-title]');
    if (!title) return { found: false };
    const lines = [...title.querySelectorAll('.title-line')];
    const overflow = title.scrollWidth > title.clientWidth + 1
      || lines.some((line) => line.scrollWidth > line.clientWidth + 1);
    return { found: true, id: title.id, text: title.innerText.trim(), lines: lines.length, overflow };
  })()`);
  assert.equal(layout.found, true, `Visible view is missing its primary title: ${JSON.stringify(layout)}`);
  assert.equal(layout.overflow, false, `Primary title overflows or breaks its semantic line: ${JSON.stringify(layout)}`);
  assert.ok(layout.lines > 0 || layout.text.length <= 8, `Primary title lacks semantic lines: ${JSON.stringify(layout)}`);
  const result = await cdp.command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, filename), Buffer.from(result.data, "base64"));
}

async function main() {
  assert.ok(browser, "Edge or Chrome is required");
  const html = fs.readFileSync(path.join(__dirname, "prototype.html"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "prototype.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "prototype.css"), "utf8");
  assert.equal(/localStorage|sessionStorage|document\.cookie|fetch\s*\(|sendBeacon|XMLHttpRequest/.test(`${html}\n${js}`), false, "Prototype must not write learner or network data");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /award-experience-a1\/prototype\.css/, "A2 should traceably inherit the accepted A1 visual foundation");

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "go-award-a2-"));
  const page = pathToFileURL(path.resolve(__dirname, "prototype.html")).href;
  const child = spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions", "--disable-background-mode", "--remote-debugging-port=0", `--user-data-dir=${profile}`, page], { stdio: "ignore" });
  let cdp;

  try {
    cdp = await connectToPage(profile, page);
    await cdp.command("Runtime.enable");
    await cdp.command("Page.enable");
    await waitFor(cdp, "document.readyState === 'complete' && Boolean(document.querySelector('#review-stage'))", "page readiness");

    const semantics = await evaluate(cdp, `({
      title: document.title,
      views: document.querySelectorAll('.review-view').length,
      intents: document.querySelectorAll('.award-intent').length,
      intentFields: document.querySelectorAll('.award-intent dt').length,
      panels: document.querySelectorAll('[role="tabpanel"]').length,
      selected: document.querySelector('[data-view][aria-selected="true"]')?.dataset.view,
      forms: document.querySelectorAll('form').length,
      externalAssets: [...document.querySelectorAll('script[src], link[rel="stylesheet"]')].filter((node) => /^https?:/.test(node.src || node.href)).length
    })`);
    assert.deepEqual(semantics, { title: "悟之一手｜Award Experience A2 Integrated", views: 6, intents: 6, intentFields: 42, panels: 6, selected: "w1", forms: 0, externalAssets: 0 });

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const landingBefore = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      beforeVisible: getComputedStyle(document.querySelector('#w1 .signature-before')).display !== 'none',
      afterVisible: getComputedStyle(document.querySelector('#w1 .signature-after')).display !== 'none',
      pressed: document.querySelector('#signature-toggle').getAttribute('aria-pressed')
    })`);
    assert.deepEqual(landingBefore, { overflow: false, beforeVisible: true, afterVisible: false, pressed: "false" });
    await evaluate(cdp, `document.querySelector('#signature-toggle').click()`);
    await pause(500);
    const landingAfter = await evaluate(cdp, `({
      beforeVisible: getComputedStyle(document.querySelector('#w1 .signature-before')).display !== 'none',
      afterVisible: getComputedStyle(document.querySelector('#w1 .signature-after')).display !== 'none',
      pressed: document.querySelector('#signature-toggle').getAttribute('aria-pressed'),
      retained: Boolean(document.querySelector('#w1 .first-response-ring')),
      consequence: Boolean(document.querySelector('#w1 .effect-stone')),
      reason: Boolean(document.querySelector('#w1 .reason-panel')),
      reasonOpacity: getComputedStyle(document.querySelector('#w1 .reason-panel')).opacity
    })`);
    assert.deepEqual(landingAfter, { beforeVisible: false, afterVisible: true, pressed: "true", retained: true, consequence: true, reason: true, reasonOpacity: "1" });
    await screenshot(cdp, "desktop-w1.png");

    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click()`);
    const boardBefore = await evaluate(cdp, `({
      task: document.querySelector('#w2 .task-kind-chip').textContent.trim(),
      state: document.querySelector('#w2 .question-state-chip').textContent.trim(),
      methodProgressSignals: document.querySelectorAll('#w2 .learning-method [aria-current], #w2 .learning-method .active, #w2 .learning-method .passed, #w2 .learning-method .done').length,
      courseCurrent: document.querySelectorAll('#w2 .course-rail [aria-current="page"]').length,
      answerLeak: Boolean(document.querySelector('#w2 .answer-feedback, #w2 .reason-panel')),
      legacyLabels: /S[1-5]/.test(document.querySelector('#w2 .experience-frame').innerText),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(boardBefore, { task: "目前任務 · 練習", state: "本題 · 自己判斷", methodProgressSignals: 0, courseCurrent: 1, answerLeak: false, legacyLabels: false, overflow: false });
    await screenshot(cdp, "desktop-w2.png");

    await evaluate(cdp, `document.querySelector('#board-answer-action').click()`);
    await waitFor(cdp, "!document.querySelector('#w3').hidden", "board consequence transition");
    await pause(500);
    const boardAfter = await evaluate(cdp, `({
      state: document.querySelector('#w3 .question-state-chip').textContent.trim(),
      retained: Boolean(document.querySelector('#w3 .first-response-ring')),
      consequence: Boolean(document.querySelector('#w3 .effect-stone')),
      reason: Boolean(document.querySelector('#w3 .reason-steps')),
      methodProgressSignals: document.querySelectorAll('#w3 .learning-method [aria-current], #w3 .learning-method .active, #w3 .learning-method .passed, #w3 .learning-method .done').length,
      feedbackOpacity: getComputedStyle(document.querySelector('#w3 .feedback-surface')).opacity
    })`);
    assert.deepEqual(boardAfter, { state: "本題 · 修正重算", retained: true, consequence: true, reason: true, methodProgressSignals: 0, feedbackOpacity: "1" });
    await screenshot(cdp, "desktop-w3.png");

    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const textTask = await evaluate(cdp, `({
      choices: document.querySelectorAll('#w4 [role="radio"]').length,
      checked: document.querySelectorAll('#w4 [role="radio"][aria-checked="true"]').length,
      resultLeak: Boolean(document.querySelector('#w4 .answer-feedback, #w4 .reason-panel, #w4 .feedback-surface')),
      disabledPrimary: document.querySelector('#w4 .primary-action').disabled,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(textTask, { choices: 3, checked: 0, resultLeak: false, disabledPrimary: true, overflow: false });
    const textInteraction = await evaluate(cdp, `(() => {
      document.querySelector('#w4 [role="radio"]')?.click();
      return {
        checked: document.querySelectorAll('#w4 [role="radio"][aria-checked="true"]').length,
        enabledPrimary: !document.querySelector('#w4 .choice-footer .primary-action').disabled,
        tabStops: [...document.querySelectorAll('#w4 [role="radio"]')].filter((radio) => radio.tabIndex === 0).length
      };
    })()`);
    assert.deepEqual(textInteraction, { checked: 1, enabledPrimary: true, tabStops: 1 });
    await screenshot(cdp, "desktop-w4.png");

    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const masked = await evaluate(cdp, `({
      receipt: document.querySelectorAll('#w5 [role="status"]').length >= 1,
      alert: document.querySelectorAll('#w5 [role="alert"]').length === 1,
      deniesFormalUnseen: document.querySelector('#w5 .source-band').textContent.includes('不作正式未見評量'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(masked, { receipt: true, alert: true, deniesFormalUnseen: true, overflow: false });
    await screenshot(cdp, "desktop-w5.png");

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await evaluate(cdp, `document.querySelector('[data-view="w6"]').click()`);
    const mobileBefore = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      phoneWidth: Math.round(document.querySelector('#w6 .phone').getBoundingClientRect().width),
      boardWidth: Math.round(document.querySelector('#w6 .mobile-board').getBoundingClientRect().width),
      beforeVisible: getComputedStyle(document.querySelector('#w6 .mobile-state-before')).display !== 'none'
    })`);
    assert.equal(mobileBefore.overflow, false, JSON.stringify(mobileBefore));
    assert.ok(mobileBefore.phoneWidth <= 355, JSON.stringify(mobileBefore));
    assert.ok(mobileBefore.boardWidth >= 280, JSON.stringify(mobileBefore));
    assert.equal(mobileBefore.beforeVisible, true);
    await evaluate(cdp, `document.querySelector('[data-mobile-toggle]').click()`);
    const mobileAfter = await evaluate(cdp, `({
      pressed: document.querySelector('[data-mobile-toggle]').getAttribute('aria-pressed'),
      resultVisible: getComputedStyle(document.querySelector('#w6 .mobile-feedback')).display !== 'none',
      retained: getComputedStyle(document.querySelector('#w6 .first-response-ring')).display !== 'none',
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(mobileAfter, { pressed: "true", resultVisible: true, retained: true, overflow: false });
    await screenshot(cdp, "mobile-w6.png");

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, target: Math.round(document.querySelector('[data-mobile-toggle]').getBoundingClientRect().height)})`);
    assert.equal(narrow.overflow, false, JSON.stringify(narrow));
    assert.ok(narrow.target >= 44, JSON.stringify(narrow));

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 640, height: 900, deviceScaleFactor: 2, mobile: false });
    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const zoom = await evaluate(cdp, `({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, choices: document.querySelectorAll('#w4 [role="radio"]').length})`);
    assert.deepEqual(zoom, { overflow: false, choices: 3 });

    await cdp.command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click(); document.querySelector('#motion-demo').click()`);
    await waitFor(cdp, "!document.querySelector('#w3').hidden", "reduced-motion direct transition");
    assert.equal(await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`), true);

    process.stdout.write("PASS: A2 integrated candidate verified — 6 views/6 Award Intents, Johari-driven semantic correction, board/text/masked/mobile coverage, no-write boundary, 1440/375/320/200% reflow, and reduced motion.\n");
  } finally {
    cdp?.close();
    terminateBrowserTree(child, profile);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
