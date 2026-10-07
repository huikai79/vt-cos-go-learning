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
  const result = await cdp.command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, filename), Buffer.from(result.data, 'base64'));
}

async function main() {
  assert.ok(browser, 'Edge or Chrome is required');
  const html = fs.readFileSync(path.join(__dirname, 'prototype.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, 'prototype.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'prototype.css'), 'utf8');
  assert.equal(/localStorage|sessionStorage|document\.cookie|fetch\s*\(|sendBeacon|XMLHttpRequest/.test(`${html}\n${js}`), false, 'Prototype must not write learner or network data');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /award-experience-a1\/prototype\.css/, 'Homepage candidate should traceably reuse the review shell');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'go-homepage-a1-'));
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
      selected: document.querySelector('[data-view][aria-selected="true"]')?.dataset.view,
      forms: document.querySelectorAll('form').length,
      externalAssets: [...document.querySelectorAll('script[src], link[rel="stylesheet"]')].filter((node) => /^https?:/.test(node.src || node.href)).length
    })`);
    assert.deepEqual(semantics, { title: 'VT-COS｜悟之一手 index.html Homepage A1', views: 6, intents: 6, intentFields: 42, panels: 6, selected: 'w1', forms: 0, externalAssets: 0 });

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const freshBefore = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      beforeVisible: getComputedStyle(document.querySelector('#w1 .preview-before')).display !== 'none',
      afterVisible: getComputedStyle(document.querySelector('#w1 .preview-after')).display !== 'none',
      pressed: document.querySelector('#fresh-preview-toggle').getAttribute('aria-pressed'),
      productionAsset: document.querySelector('#w1 .home-atmosphere').getAttribute('src')
    })`);
    assert.deepEqual(freshBefore, { overflow: false, beforeVisible: true, afterVisible: false, pressed: 'false', productionAsset: '../../assets/homepage/hero-atmosphere.svg' });
    await evaluate(cdp, `document.querySelector('#fresh-preview-toggle').click()`);
    await waitFor(cdp, `getComputedStyle(document.querySelector('#w1 .preview-reason')).opacity === '1'`, 'hero reason animation');
    const freshAfter = await evaluate(cdp, `({
      beforeVisible: getComputedStyle(document.querySelector('#w1 .preview-before')).display !== 'none',
      afterVisible: getComputedStyle(document.querySelector('#w1 .preview-after')).display !== 'none',
      pressed: document.querySelector('#fresh-preview-toggle').getAttribute('aria-pressed'),
      retained: Boolean(document.querySelector('#w1 .first-response-ring')),
      consequence: Boolean(document.querySelector('#w1 .effect-stone')),
      reasonDisplay: getComputedStyle(document.querySelector('#w1 .preview-reason')).display,
      reasonOpacity: getComputedStyle(document.querySelector('#w1 .preview-reason')).opacity
    })`);
    assert.deepEqual(freshAfter, { beforeVisible: false, afterVisible: true, pressed: 'true', retained: true, consequence: true, reasonDisplay: 'grid', reasonOpacity: '1' });
    await screenshot(cdp, 'desktop-w1.png');

    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click()`);
    const returning = await evaluate(cdp, `({
      location: document.querySelector('#w2 .return-current').innerText.includes('第 4 單元') && document.querySelector('#w2 .return-current').innerText.includes('題目 3 / 14'),
      dueIsConditional: document.querySelector('#w2 .return-today').dataset.condition,
      deniesMastery: document.querySelector('#w2 .return-no-score').innerText.includes('不顯示 mastery 分數'),
      demoMarked: document.querySelector('#w2 .return-today').innerText.includes('DEMO ONLY'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(returning, { location: true, dueIsConditional: 'due-count-greater-than-zero', deniesMastery: true, demoMarked: true, overflow: false });
    await screenshot(cdp, 'desktop-w2.png');

    await evaluate(cdp, `document.querySelector('[data-view="w3"]').click()`);
    const pathsBefore = await evaluate(cdp, `({
      cards: document.querySelectorAll('#w3 .path-card').length,
      indices: [...document.querySelectorAll('#w3 .path-card')].map((card) => Number(card.dataset.unitIndex)),
      selected: document.querySelector('#w3 .path-card.selected')?.dataset.unitIndex,
      notPlacement: document.querySelector('#w3 .section-shell').innerText.includes('不是個人化診斷'),
      switchable: document.querySelector('#w3 .section-shell').innerText.includes('隨時更換'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(pathsBefore, { cards: 3, indices: [0, 5, 10], selected: '0', notPlacement: true, switchable: true, overflow: false });
    const pathInteraction = await evaluate(cdp, `(() => {
      document.querySelector('#w3 .path-card[data-unit-index="5"] button').click();
      return {
        selected: document.querySelector('#w3 .path-card.selected')?.dataset.unitIndex,
        pressed: document.querySelectorAll('#w3 .path-card button[aria-pressed="true"]').length,
        urlUnchanged: location.hash === ''
      };
    })()`);
    assert.deepEqual(pathInteraction, { selected: '5', pressed: 1, urlUnchanged: true });
    await screenshot(cdp, 'desktop-w3.png');

    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const catalog = await evaluate(cdp, `({
      units: document.querySelectorAll('#w4 .unit-grid button[data-unit-index]').length,
      indices: [...document.querySelectorAll('#w4 .unit-grid button[data-unit-index]')].map((button) => Number(button.dataset.unitIndex)),
      unique: new Set([...document.querySelectorAll('#w4 .unit-grid button[data-unit-index]')].map((button) => button.dataset.unitIndex)).size,
      destinations: [...document.querySelectorAll('#w4 [data-destination]')].map((button) => button.dataset.destination),
      counts: document.querySelector('#w4 .catalog-count').innerText.split(/\\s+/).join(' '),
      noOutcomeClaim: document.querySelector('#w4 .catalog-count').innerText.includes('數量不代表成效或棋力'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(catalog.indices, Array.from({ length: 15 }, (_, index) => index));
    assert.equal(catalog.units, 15);
    assert.equal(catalog.unique, 15);
    assert.deepEqual(catalog.destinations, ['advanced.html', 'live-game.html']);
    assert.match(catalog.counts, /15 單元 19 課 106 題/);
    assert.equal(catalog.noOutcomeClaim, true);
    assert.equal(catalog.overflow, false);
    await screenshot(cdp, 'desktop-w4.png');

    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const method = await evaluate(cdp, `({
      cards: document.querySelectorAll('#w5 .method-grid article').length,
      progressSignals: document.querySelectorAll('#w5 .method-grid .active, #w5 .method-grid .passed, #w5 .method-grid .done, #w5 .method-grid [aria-current]').length,
      removedOverclaim: !document.querySelector('#w5 .experience-frame').innerText.includes('真正學會'),
      boundedClaim: document.querySelector('#w5 .experience-frame').innerText.includes('不直接宣稱已學會'),
      sourceDisclosure: document.querySelector('#w5 details').innerText.includes('9 個既有來源'),
      limitsVisible: document.querySelector('#w5 .boundary-grid').innerText.includes('目前不能直接宣稱'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(method, { cards: 4, progressSignals: 0, removedOverclaim: true, boundedClaim: true, sourceDisclosure: true, limitsVisible: true, overflow: false });
    await screenshot(cdp, 'desktop-w5.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await evaluate(cdp, `document.querySelector('[data-view="w6"]').click()`);
    const mobileBefore = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      phoneWidth: Math.round(document.querySelector('#w6 .home-phone').getBoundingClientRect().width),
      boardWidth: Math.round(document.querySelector('#w6 .mobile-home-board').getBoundingClientRect().width),
      beforeVisible: getComputedStyle(document.querySelector('#w6 .mobile-preview-before')).display !== 'none',
      pressed: document.querySelector('#mobile-preview-toggle').getAttribute('aria-pressed')
    })`);
    assert.equal(mobileBefore.overflow, false, JSON.stringify(mobileBefore));
    assert.ok(mobileBefore.phoneWidth <= 355, JSON.stringify(mobileBefore));
    assert.ok(mobileBefore.boardWidth >= 280, JSON.stringify(mobileBefore));
    assert.equal(mobileBefore.beforeVisible, true);
    assert.equal(mobileBefore.pressed, 'false');
    await evaluate(cdp, `document.querySelector('#mobile-preview-toggle').click()`);
    await waitFor(cdp, `getComputedStyle(document.querySelector('#w6 .mobile-preview-reason')).display === 'grid'`, 'mobile preview result');
    const mobileAfter = await evaluate(cdp, `({
      pressed: document.querySelector('#mobile-preview-toggle').getAttribute('aria-pressed'),
      resultVisible: getComputedStyle(document.querySelector('#w6 .mobile-preview-reason')).display === 'grid',
      retained: getComputedStyle(document.querySelector('#w6 .first-response-ring')).display !== 'none',
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(mobileAfter, { pressed: 'true', resultVisible: true, retained: true, overflow: false });
    await screenshot(cdp, 'mobile-w6.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      target: Math.round(document.querySelector('#mobile-preview-toggle').getBoundingClientRect().height),
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll('body *')].map((node) => ({
        name: node.id || node.className || node.tagName,
        left: Math.round(node.getBoundingClientRect().left),
        right: Math.round(node.getBoundingClientRect().right)
      })).filter((item) => item.right > document.documentElement.clientWidth + 1 || item.left < -1).slice(0, 8)
    })`);
    assert.equal(narrow.overflow, false, JSON.stringify(narrow));
    assert.ok(narrow.target >= 44, JSON.stringify(narrow));

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 640, height: 900, deviceScaleFactor: 2, mobile: false });
    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const zoom = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      units: document.querySelectorAll('#w4 .unit-grid button[data-unit-index]').length
    })`);
    assert.deepEqual(zoom, { overflow: false, units: 15 });

    await cdp.command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click(); document.querySelector('#motion-demo').click()`);
    await waitFor(cdp, `!document.querySelector('#w1').hidden && document.querySelector('#fresh-preview').classList.contains('show-result')`, 'reduced-motion hero result');
    assert.equal(await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`), true);

    process.stdout.write('PASS: index.html Homepage A1 candidate verified — 6 views/6 Award Intents, actual route and asset mapping, no-write Hero preview, honest return/start/catalog/evidence semantics, 1440/375/320/200% reflow, and reduced motion.\n');
  } finally {
    cdp?.close();
    terminateBrowserTree(child, profile);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
