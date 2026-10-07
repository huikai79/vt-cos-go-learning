const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

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
    const payload = { id, method, params };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`CDP ${method} timed out`)), 15000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify(payload));
    });
  }

  close() {
    this.socket.close();
  }
}

async function connectToPage(profile, page) {
  const marker = path.join(profile, "DevToolsActivePort");
  let port;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (fs.existsSync(marker)) {
      port = Number(fs.readFileSync(marker, "utf8").split(/\r?\n/)[0]);
      if (Number.isInteger(port)) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(port, "Edge did not open the debugging port");

  let target;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await response.json();
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
  const result = await cdp.command("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
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

async function screenshot(cdp, filename) {
  const result = await cdp.command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(__dirname, filename), Buffer.from(result.data, "base64"));
}

async function main() {
  assert.ok(browser, "Edge or Chrome is required");

  const html = fs.readFileSync(path.join(__dirname, "prototype.html"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "prototype.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "prototype.css"), "utf8");
  const forbiddenWrites = /localStorage|sessionStorage|document\.cookie|fetch\s*\(|sendBeacon|XMLHttpRequest/;
  assert.equal(forbiddenWrites.test(`${html}\n${js}`), false, "Prototype must not write learner or network data");
  assert.match(css, /prefers-reduced-motion:\s*reduce/, "Reduced-motion override is required");

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "go-award-a1-"));
  const page = pathToFileURL(path.resolve(__dirname, "prototype.html")).href;
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    "--disable-background-mode",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    page
  ], { stdio: "ignore" });
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
      selected: document.querySelector('[data-view][aria-selected="true"]')?.dataset.view,
      panels: document.querySelectorAll('[role="tabpanel"]').length,
      forms: document.querySelectorAll('form').length,
      externalScripts: [...document.scripts].filter((script) => script.src && !script.src.startsWith('file:')).length
    })`);
    assert.deepEqual(semantics, {
      title: "悟之一手｜Award Experience A1",
      views: 6,
      intents: 6,
      intentFields: 42,
      selected: "w1",
      panels: 6,
      forms: 0,
      externalScripts: 0
    });

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const desktop = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      frameWidth: Math.round(document.querySelector('#w1 .experience-frame').getBoundingClientRect().width),
      boardWidth: Math.round(document.querySelector('#w1 .hero-board').getBoundingClientRect().width),
      awardVisible: document.querySelector('#w1 .award-intent').getBoundingClientRect().top < innerHeight,
      actionHeight: Math.round(document.querySelector('#home-preview-action').getBoundingClientRect().height),
      titleVisible: document.querySelector('#w1 h2').getBoundingClientRect().top < innerHeight
    })`);
    assert.equal(desktop.overflow, false, JSON.stringify(desktop));
    assert.ok(desktop.frameWidth >= 900, JSON.stringify(desktop));
    assert.ok(desktop.boardWidth >= 390, JSON.stringify(desktop));
    assert.equal(desktop.awardVisible, true);
    assert.ok(desktop.actionHeight >= 44, JSON.stringify(desktop));
    assert.equal(desktop.titleVisible, true);
    await screenshot(cdp, "desktop-w1.png");

    await evaluate(cdp, `document.querySelector('#motion-demo').click()`);
    await waitFor(cdp, "!document.querySelector('#w2').hidden", "W1 to W2 motion transition");
    const motion = await evaluate(cdp, `({
      selected: document.querySelector('[data-view][aria-selected="true"]')?.dataset.view,
      retained: Boolean(document.querySelector('#w2 .first-response-ring')),
      consequence: Boolean(document.querySelector('#w2 .effect-stone')),
      reason: Boolean(document.querySelector('#w2 .reason-panel'))
    })`);
    assert.deepEqual(motion, { selected: "w2", retained: true, consequence: true, reason: true });
    await screenshot(cdp, "desktop-w2.png");

    await evaluate(cdp, `document.querySelector('[data-view="w3"]').click()`);
    const independent = await evaluate(cdp, `({
      taskKind: document.querySelector('#w3 .task-kind-chip')?.textContent.trim(),
      questionState: document.querySelector('#w3 .question-state-chip')?.textContent.trim(),
      answerLeak: Boolean(document.querySelector('#w3 .answer-feedback, #w3 .reason-panel')),
      primaryActions: document.querySelectorAll('#w3 .primary-action').length
    })`);
    assert.deepEqual(independent, {
      taskKind: "目前任務 · 練習",
      questionState: "本題 · 自己判斷",
      answerLeak: false,
      primaryActions: 1
    });
    await screenshot(cdp, "desktop-w3.png");

    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const workspace = await evaluate(cdp, `({
      visible: !document.querySelector('#w4').hidden,
      taskKind: document.querySelector('#w4 .task-kind-chip')?.textContent.trim(),
      questionState: document.querySelector('#w4 .question-state-chip')?.textContent.trim(),
      retained: Boolean(document.querySelector('#w4 .first-response-ring')),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(workspace, {
      visible: true,
      taskKind: "目前任務 · 練習",
      questionState: "本題 · 修正重算",
      retained: true,
      overflow: false
    });
    await screenshot(cdp, "desktop-w4.png");

    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const masked = await evaluate(cdp, `({
      receipt: Boolean(document.querySelector('#w5 [role="status"]')),
      alert: Boolean(document.querySelector('#w5 [role="alert"]')),
      claimsUnseen: /unseen|未見評量/.test(document.querySelector('#w5 .source-band').textContent) && !document.querySelector('#w5 .source-band').textContent.includes('不作正式未見評量')
    })`);
    assert.deepEqual(masked, { receipt: true, alert: true, claimsUnseen: false });
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
    const narrow = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      targetHeight: Math.round(document.querySelector('[data-mobile-toggle]').getBoundingClientRect().height)
    })`);
    assert.equal(narrow.overflow, false, JSON.stringify(narrow));
    assert.ok(narrow.targetHeight >= 44, JSON.stringify(narrow));

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 640, height: 900, deviceScaleFactor: 2, mobile: false });
    await evaluate(cdp, `document.querySelector('[data-view="w3"]').click()`);
    const zoom = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      primaryVisible: document.querySelector('#lesson-answer-action').getBoundingClientRect().width > 0,
      boardWidth: Math.round(document.querySelector('#w3 .lesson-board').getBoundingClientRect().width)
    })`);
    assert.equal(zoom.overflow, false, JSON.stringify(zoom));
    assert.equal(zoom.primaryVisible, true);
    assert.ok(zoom.boardWidth >= 260, JSON.stringify(zoom));

    await cdp.command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await evaluate(cdp, `document.querySelector('[data-view="w1"]').click(); document.querySelector('#motion-demo').click()`);
    await waitFor(cdp, "!document.querySelector('#w2').hidden", "reduced-motion direct transition");
    const reduced = await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`);
    assert.equal(reduced, true);

    process.stdout.write("PASS: 6 views/6 Award Intents; data-write boundary, signature motion, masked semantics, 1440px, 375px, 320px, 200% equivalent reflow, and reduced motion verified.\n");
  } finally {
    cdp?.close();
    if (!child.killed) child.kill();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
