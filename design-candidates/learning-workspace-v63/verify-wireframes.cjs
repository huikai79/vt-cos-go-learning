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

class CdpPipe {
  constructor(write, read) {
    this.write = write;
    this.read = read;
    this.nextId = 0;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    read.on("data", (chunk) => this.onData(chunk));
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
      else pending.resolve(message.result);
    }
  }
  command(method, params = {}, sessionId = this.sessionId) {
    const id = ++this.nextId;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`CDP ${method} timed out`)), 10000);
      this.pending.set(id, { resolve, reject, timeout });
      this.write.write(`${JSON.stringify(payload)}\0`);
    });
  }
  close() { this.read.destroy(); this.write.destroy(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function main() {
  assert.ok(browser, "Edge or Chrome is required");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "go-wireframe-v63-"));
  const page = pathToFileURL(path.resolve(__dirname, "wireframes.html")).href;
  const child = spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions", "--disable-background-mode", "--remote-debugging-pipe", `--user-data-dir=${profile}`, page], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
  const cdp = new CdpPipe(child.stdio[3], child.stdio[4]);
  try {
    const created = await cdp.command("Target.createTarget", { url: page }, null);
    const attached = await cdp.command("Target.attachToTarget", { targetId: created.targetId, flatten: true }, null);
    cdp.sessionId = attached.sessionId;
    await cdp.command("Runtime.enable");
    await cdp.command("Page.enable");
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const ready = await evaluate(cdp, "document.readyState === 'complete' && Boolean(document.querySelector('#review-stage'))");
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const semantics = await evaluate(cdp, `({
      title: document.title,
      views: document.querySelectorAll('.review-view').length,
      intents: document.querySelectorAll('.award-card').length,
      selected: document.querySelector('[data-view][aria-selected="true"]')?.dataset.view,
      productionForms: document.querySelectorAll('form').length
    })`);
    assert.deepEqual(semantics, { title: "悟之一手｜Learning Workspace v63 Design Candidate", views: 6, intents: 6, selected: "w1", productionForms: 0 });

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const desktop = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      boardWidth: Math.round(document.querySelector('#w1 .go-board').getBoundingClientRect().width),
      questionVisible: document.querySelector('#w1 h2').getBoundingClientRect().top < innerHeight,
      responseVisible: document.querySelector('#w1 .task-actions').getBoundingClientRect().bottom - document.querySelector('#w1 .prototype').getBoundingClientRect().top <= 900,
      prototypeHeight: Math.round(document.querySelector('#w1 .prototype').getBoundingClientRect().height),
      orphanToolCard: Boolean(document.querySelector('.workspace-aside-tools'))
    })`);
    assert.equal(desktop.overflow, false);
    assert.ok(desktop.boardWidth >= 380 && desktop.boardWidth <= 440, JSON.stringify(desktop));
    assert.equal(desktop.questionVisible, true);
    assert.equal(desktop.responseVisible, true, JSON.stringify(desktop));
    assert.equal(desktop.orphanToolCard, false);
    const desktopImage = await cdp.command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    fs.writeFileSync(path.join(__dirname, "desktop-w1.png"), Buffer.from(desktopImage.data, "base64"));

    await evaluate(cdp, `document.querySelector('[data-view="w3"]').click()`);
    const textTask = await evaluate(cdp, `({
      visible: !document.querySelector('#w3').hidden,
      choices: document.querySelectorAll('#w3 .choice-grid label').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      toolRectangle: Boolean(document.querySelector('#w3 .workspace-aside-tools'))
    })`);
    assert.deepEqual(textTask, { visible: true, choices: 3, overflow: false, toolRectangle: false });

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const mobile = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      frameWidth: Math.round(document.querySelector('#w5 .phone-frame').getBoundingClientRect().width),
      boardWidth: Math.round(document.querySelector('#w5 .mobile-board').getBoundingClientRect().width),
      toolsBeforeTask: document.querySelector('#w5 .mobile-task').textContent.includes('進階工具與資料')
    })`);
    assert.equal(mobile.overflow, false);
    assert.ok(mobile.frameWidth <= 355, JSON.stringify(mobile));
    assert.ok(mobile.boardWidth >= 280, JSON.stringify(mobile));
    assert.equal(mobile.toolsBeforeTask, false);
    const mobileImage = await cdp.command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    fs.writeFileSync(path.join(__dirname, "mobile-w5.png"), Buffer.from(mobileImage.data, "base64"));

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1})`);
    assert.equal(narrow.overflow, false);

    await cdp.command("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    const zoom = await evaluate(cdp, `(async () => {
      document.documentElement.style.fontSize = '32px';
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1};
    })()`);
    assert.equal(zoom.overflow, false);

    process.stdout.write(`PASS: 6 views/6 Award Intents; desktop, text-task, 375px, 320px, and 200% reflow verified.\n`);
  } finally {
    cdp.close();
    if (!child.killed) child.kill();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
