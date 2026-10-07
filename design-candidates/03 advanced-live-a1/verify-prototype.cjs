const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { terminateBrowserTree } = require('../browser-verifier-cleanup.cjs');

const browser = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find((candidate) => fs.existsSync(candidate));

class CdpSocket {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    socket.addEventListener('message', (event) => this.onMessage(event.data));
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
  const marker = path.join(profile, 'DevToolsActivePort');
  let port;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (fs.existsSync(marker)) {
      try {
        port = Number(fs.readFileSync(marker, 'utf8').split(/\r?\n/)[0]);
        if (Number.isInteger(port)) break;
      } catch (error) {
        if (!['EBUSY', 'EACCES', 'ENOENT'].includes(error.code)) throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(port, 'Edge did not open the debugging port');
  let target;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = targets.find((candidate) => candidate.type === 'page' && candidate.url === page);
    if (target) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(target, 'Local prototype page did not load');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('CDP WebSocket connection timed out')), 10000);
    socket.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('CDP WebSocket connection failed')); }, { once: true });
  });
  return new CdpSocket(socket);
}

async function evaluate(cdp, expression) {
  const result = await cdp.command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
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
  const result = await cdp.command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, filename), Buffer.from(result.data, 'base64'));
}

async function main() {
  assert.ok(browser, 'Edge or Chrome is required');
  const html = fs.readFileSync(path.join(__dirname, 'prototype.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, 'prototype.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'prototype.css'), 'utf8');
  const productionRoot = path.resolve(__dirname, '..', '..');
  const advanced = fs.readFileSync(path.join(productionRoot, 'advanced.html'), 'utf8');
  const live = fs.readFileSync(path.join(productionRoot, 'live-game.html'), 'utf8');

  assert.equal(/localStorage|sessionStorage|document\.cookie|fetch\s*\(|sendBeacon|XMLHttpRequest/.test(`${html}\n${js}`), false, 'Candidate must not write learner or network data');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(advanced, /答錯可重試，但首答會和重試分開保存/);
  assert.match(advanced, /原棋譜著手在你提出第一候選前保持隱藏/);
  assert.match(advanced, /同一個已看過的局面.*不算未見題或遷移/);
  assert.match(advanced, /至少 24 小時後才開放/);
  assert.match(live, /data-board-size-choice="5"/);
  assert.match(live, /data-board-size-choice="7"/);
  assert.match(live, /data-board-size-choice="9"/);
  assert.match(live, /data-board-size-choice="19"/);
  assert.match(live, /系統不自動判死活/);
  assert.match(live, /不會偷偷改用另一個引擎/);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'go-practice-lab-a1-'));
  const page = pathToFileURL(path.resolve(__dirname, 'prototype.html')).href;
  const child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--disable-background-mode', '--remote-debugging-port=0', `--user-data-dir=${profile}`, page], { stdio: 'ignore' });
  let cdp;
  try {
    cdp = await connectToPage(profile, page);
    await cdp.command('Runtime.enable');
    await cdp.command('Page.enable');
    await waitFor(cdp, "document.readyState === 'complete' && Boolean(document.querySelector('#review-stage'))", 'page readiness');
    const semantics = await evaluate(cdp, `({
      title: document.title,
      views: document.querySelectorAll('.review-view').length,
      intents: document.querySelectorAll('.award-intent').length,
      intentFields: document.querySelectorAll('.award-intent dt').length,
      panels: document.querySelectorAll('[role="tabpanel"]').length,
      selected: document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.view,
      forms: document.querySelectorAll('form').length,
      externalAssets: [...document.querySelectorAll('script[src],link[rel="stylesheet"]')].filter((node) => /^https?:/.test(node.src || node.href)).length
    })`);
    assert.deepEqual(semantics, { title: 'VT-COS｜Practice Lab A1', views: 6, intents: 6, intentFields: 42, panels: 6, selected: 'w1', forms: 0, externalAssets: 0 });

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const w1 = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      tracks: document.querySelectorAll('#w1 .orbit-track').length,
      selected: document.querySelector('#w1 [data-track][aria-pressed="true"]')?.dataset.track,
      noUnit16: document.querySelector('#w1').innerText.includes('NOT UNIT 16'),
      boundary: document.querySelector('#w1 .authority-note').innerText.includes('不改 Core 排程或正式評量')
    })`);
    assert.deepEqual(w1, { overflow: false, tracks: 4, selected: 'reading', noUnit16: true, boundary: true });
    await evaluate(cdp, `document.querySelector('#w1 [data-track="middle"]').click()`);
    assert.deepEqual(await evaluate(cdp, `({selected: document.querySelector('#w1 [data-track][aria-pressed="true"]').dataset.track, title: document.querySelector('#track-map-title').textContent})`), { selected: 'middle', title: '中盤攻防' });
    await screenshot(cdp, 'desktop-w1.png');

    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click()`);
    const w2Before = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      first: document.querySelector('#first-response-ledger strong').textContent,
      takeawayHidden: document.querySelector('#sequence-takeaway').hidden,
      nextDisabled: document.querySelector('#sequence-next').disabled,
      family: document.querySelector('#board-family').textContent,
      candidates: document.querySelectorAll('#w2 [data-sequence-move]').length
    })`);
    assert.deepEqual(w2Before, { overflow: false, first: '尚未記錄', takeawayHidden: true, nextDisabled: true, family: 'FAMILY HIDDEN', candidates: 3 });
    await evaluate(cdp, `document.querySelector('#w2 [data-sequence-move="C4"]').click()`);
    let sequence = await evaluate(cdp, `({first: document.querySelector('#first-response-ledger strong').textContent, feedback: document.querySelector('#sequence-feedback').innerText, nextDisabled: document.querySelector('#sequence-next').disabled})`);
    assert.match(sequence.first, /C4/);
    assert.match(sequence.feedback, /不推進/);
    assert.equal(sequence.nextDisabled, true);
    await evaluate(cdp, `document.querySelector('#w2 [data-sequence-move="D5"]').click()`);
    sequence = await evaluate(cdp, `({first: document.querySelector('#first-response-ledger strong').textContent, feedback: document.querySelector('#sequence-feedback').innerText, nextDisabled: document.querySelector('#sequence-next').disabled, takeawayHidden: document.querySelector('#sequence-takeaway').hidden, family: document.querySelector('#board-family').textContent})`);
    assert.match(sequence.first, /C4/);
    assert.match(sequence.feedback, /完成修正/);
    assert.equal(sequence.nextDisabled, false);
    assert.equal(sequence.takeawayHidden, false);
    assert.match(sequence.family, /枷/);
    await screenshot(cdp, 'desktop-w2.png');

    await evaluate(cdp, `document.querySelector('[data-view="w3"]').click()`);
    const w3Before = await evaluate(cdp, `({
      state: document.querySelector('#review-studio').dataset.reviewState,
      revealDisabled: document.querySelector('#reveal-original').disabled,
      veil: getComputedStyle(document.querySelector('#w3 .original-veil')).opacity,
      queues: document.querySelectorAll('#w3 .return-queue article').length,
      exposedBoundary: document.querySelector('#w3 .queue-boundary').innerText.includes('formal unseen')
    })`);
    assert.deepEqual(w3Before, { state: 'masked', revealDisabled: true, veil: '1', queues: 4, exposedBoundary: true });
    await evaluate(cdp, `document.querySelector('#place-review-candidate').click(); document.querySelector('#reveal-original').click()`);
    const w3After = await evaluate(cdp, `({
      state: document.querySelector('#review-studio').dataset.reviewState,
      verdict: document.querySelector('#review-verdict').innerText,
      engineDisabled: document.querySelector('#engine-demo').disabled
    })`);
    assert.equal(w3After.state, 'revealed');
    assert.match(w3After.verdict, /不同不等於.*錯/s);
    assert.equal(w3After.engineDisabled, false);
    await screenshot(cdp, 'desktop-w3.png');

    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const w4Before = await evaluate(cdp, `({
      sizes: document.querySelectorAll('#w4 [data-board-size]').length,
      active: document.querySelector('#w4 [data-board-size][aria-pressed="true"]').dataset.boardSize,
      computer: document.querySelector('#w4 [data-opponent][aria-pressed="true"]').dataset.opponent,
      providerOpen: document.querySelector('#w4 .provider-disclosure').open,
      noApiKey: !/api key input|type=["']password/i.test(document.querySelector('#w4').innerHTML),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(w4Before, { sizes: 4, active: '9', computer: 'computer', providerOpen: false, noApiKey: true, overflow: false });
    await evaluate(cdp, `document.querySelector('#w4 [data-board-size="19"]').click()`);
    const w4After = await evaluate(cdp, `({active: document.querySelector('#live-setup-demo').dataset.size, boundary: document.querySelector('#setup-boundary').innerText, cta: document.querySelector('#w4 .setup-panel > .primary-action').innerText})`);
    assert.equal(w4After.active, '19');
    assert.match(w4After.boundary, /不取得 T3/);
    assert.match(w4After.cta, /19×19/);
    await screenshot(cdp, 'desktop-w4.png');

    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const w5Before = await evaluate(cdp, `({
      played: document.querySelector('#live-game-demo').dataset.movePlayed,
      moves: document.querySelector('#demo-moves').textContent,
      log: document.querySelectorAll('#demo-move-log li').length,
      rules: document.querySelector('#w5 .game-status-ribbon').innerText.includes('中國式面積 · 簡單劫'),
      local: document.querySelector('#w5 .save-pulse').innerText.includes('只存這台電腦'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(w5Before, { played: 'false', moves: '18', log: 4, rules: true, local: true, overflow: false });
    await evaluate(cdp, `document.querySelector('#play-demo-move').click()`);
    const w5After = await evaluate(cdp, `({played: document.querySelector('#live-game-demo').dataset.movePlayed, moves: document.querySelector('#demo-moves').textContent, log: document.querySelectorAll('#demo-move-log li').length, feedback: document.querySelector('#live-demo-feedback').innerText})`);
    assert.deepEqual({ played: w5After.played, moves: w5After.moves, log: w5After.log }, { played: 'true', moves: '19', log: 5 });
    assert.match(w5After.feedback, /規則驗證通過/);
    await screenshot(cdp, 'desktop-w5.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await evaluate(cdp, `document.querySelector('[data-view="w6"]').click()`);
    const w6Before = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      phoneWidth: Math.round(document.querySelector('#w6 .phone-shell').getBoundingClientRect().width),
      marked: document.querySelector('#endgame-demo').dataset.deadMarked,
      resultHidden: document.querySelector('#mobile-result').hidden,
      boundary: document.querySelector('#w6 .endgame-boundary').innerText.includes('不產生棋力')
    })`);
    assert.equal(w6Before.overflow, false, JSON.stringify(w6Before));
    assert.ok(w6Before.phoneWidth <= 359, JSON.stringify(w6Before));
    assert.deepEqual({ marked: w6Before.marked, resultHidden: w6Before.resultHidden, boundary: w6Before.boundary }, { marked: 'false', resultHidden: true, boundary: true });
    await evaluate(cdp, `document.querySelector('#dead-group-toggle').click(); document.querySelector('#confirm-demo-score').click()`);
    const w6After = await evaluate(cdp, `({marked: document.querySelector('#endgame-demo').dataset.deadMarked, pressed: document.querySelector('#dead-group-toggle').getAttribute('aria-pressed'), black: document.querySelector('#black-score').textContent, result: document.querySelector('#mobile-result').innerText, resultHidden: document.querySelector('#mobile-result').hidden})`);
    assert.deepEqual({ marked: w6After.marked, pressed: w6After.pressed, black: w6After.black, resultHidden: w6After.resultHidden }, { marked: 'true', pressed: 'true', black: '39', resultHidden: false });
    assert.match(w6After.result, /不是學習分數/);
    await screenshot(cdp, 'mobile-w6.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      minTarget: Math.min(...[...document.querySelectorAll('#w6 button')].map((node) => Math.round(node.getBoundingClientRect().height)))
    })`);
    assert.equal(narrow.overflow, false, JSON.stringify(narrow));
    assert.ok(narrow.minTarget >= 44, JSON.stringify(narrow));

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 640, height: 900, deviceScaleFactor: 2, mobile: false });
    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click()`);
    const zoom = await evaluate(cdp, `({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, firstVisible: Boolean(document.querySelector('#first-response-ledger').offsetParent)})`);
    assert.deepEqual(zoom, { overflow: false, firstVisible: true });

    await cdp.command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
    await evaluate(cdp, `document.querySelector('#motion-demo').click()`);

    process.stdout.write('PASS: Practice Lab A1 verified — 2 production-grounded pages, 6 views/6 Award Intents, first-response retention, masked SGF reveal, delayed/exposed separation, size/provider boundaries, live move feedback, human-confirmed scoring, no-write semantics, 1440/375/320/200% reflow, and reduced motion.\n');
  } finally {
    cdp?.close();
    terminateBrowserTree(child, profile);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
