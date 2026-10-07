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

function countCurrentRounds(root) {
  const modules = [
    'classic-shape-practice.js',
    'classic-cross-five-practice.js',
    'classic-bent-three-practice.js',
    'classic-four-space-status-practice.js',
    'classic-curved-four-status-practice.js',
    'classic-pyramid-four-practice.js',
    'classic-flower-six-practice.js',
    'classic-golden-chicken-practice.js',
    'classic-big-pigs-mouth-practice.js',
    'classic-shape-read.js',
    'classic-shape-reduction.js',
    'classic-contrast-practice.js'
  ];
  const moduleRounds = modules.reduce((total, filename) => {
    const item = require(path.join(root, filename));
    return total + (item.items || item.rounds).length;
  }, 0);
  return moduleRounds + 4;
}

async function main() {
  assert.ok(browser, 'Edge or Chrome is required');
  const html = fs.readFileSync(path.join(__dirname, 'prototype.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, 'prototype.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'prototype.css'), 'utf8');
  const productionRoot = path.resolve(__dirname, '..', '..');
  const productionHtml = fs.readFileSync(path.join(productionRoot, 'classic-shapes.html'), 'utf8');
  const productionJs = fs.readFileSync(path.join(productionRoot, 'classic-shapes.js'), 'utf8');
  const catalogSource = fs.readFileSync(path.join(productionRoot, 'classic-shapes-catalog.js'), 'utf8');
  const Ontology = require(path.join(productionRoot, 'classic-shapes-ontology.js'));
  const Catalog = require(path.join(productionRoot, 'classic-shapes-catalog.js'));

  assert.equal(/localStorage|sessionStorage|document\.cookie|sendBeacon|XMLHttpRequest|fetch\s*\(/.test(`${html}\n${js}`), false, 'Candidate must not write learner or network data');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(productionHtml, /data-classic-mode-panel="practice"/);
  assert.match(productionHtml, /data-classic-mode-panel="atlas"/);
  assert.match(productionHtml, /不會直接用來判定你的棋力/);
  assert.match(productionHtml, /名稱仍依各題原本規則在適當時機揭示/);
  assert.doesNotMatch(productionJs, /localStorage|sessionStorage/);
  assert.ok((productionJs.match(/function render[A-Z]/g) || []).length >= 20, 'Current runtime should evidence parallel renderer growth');
  assert.equal(Ontology.concepts.length, 23);
  assert.deepEqual(Catalog.entries.map((item) => item.id), Ontology.concepts.map((item) => item.id));
  assert.match(catalogSource, /Ontology\.concepts\.map\(toLegacyEntry\)/);
  assert.equal(countCurrentRounds(productionRoot), 49);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'go-classic-shapes-a1-'));
  const page = pathToFileURL(path.resolve(__dirname, 'prototype.html')).href;
  const child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--disable-background-mode', '--remote-debugging-port=0', `--user-data-dir=${profile}`, page], { stdio: 'ignore' });
  let cdp;
  try {
    cdp = await connectToPage(profile, page);
    await cdp.command('Runtime.enable');
    await cdp.command('Page.enable');
    await waitFor(cdp, "document.readyState === 'complete' && Boolean(window.ClassicCandidate)", 'prototype readiness');
    const semantics = await evaluate(cdp, `({
      title: document.title,
      views: document.querySelectorAll('.review-view').length,
      intents: document.querySelectorAll('.award-intent').length,
      intentFields: document.querySelectorAll('.award-intent dt').length,
      tabs: document.querySelectorAll('[role="tab"]').length,
      selected: document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.view,
      externalAssets: [...document.querySelectorAll('script[src],link[rel="stylesheet"]')].filter((node) => /^https?:/.test(node.src || node.href)).length
    })`);
    assert.deepEqual(semantics, { title: 'VT-COS｜形之間 Classic Shapes A1', views: 6, intents: 6, intentFields: 42, tabs: 6, selected: 'w1', externalAssets: 0 });

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const w1Before = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      paths: document.querySelectorAll('#w1 [data-path]').length,
      selected: document.querySelector('#w1 [data-path][aria-pressed="true"]').dataset.path,
      boundary: document.querySelector('#w1 .boundary-strip').innerText.includes('不是棋力判定')
    })`);
    assert.deepEqual(w1Before, { overflow: false, paths: 4, selected: 'vital', boundary: true });
    await evaluate(cdp, `document.querySelector('#w1 [data-path="read"]').click()`);
    assert.deepEqual(await evaluate(cdp, `({selected: document.querySelector('#w1 [data-path][aria-pressed="true"]').dataset.path, title: document.querySelector('#path-outcome-title').textContent})`), { selected: 'read', title: '讀一小段變化' });
    await screenshot(cdp, 'desktop-w1.png');

    await evaluate(cdp, `window.ClassicCandidate.openView('w2', false)`);
    let w2 = await evaluate(cdp, `({
      cards: document.querySelectorAll('#practice-catalog .practice-card').length,
      count: document.querySelector('#catalog-result-count').textContent,
      page: document.querySelector('#catalog-page').textContent,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(w2, { cards: 12, count: '12', page: '01 / 01', overflow: false });
    const scale = await evaluate(cdp, `window.ClassicCandidate.simulateCatalog(240)`);
    assert.deepEqual(scale, { total: 240, rendered: 12, pages: 20 });
    assert.equal(await evaluate(cdp, `document.querySelectorAll('#practice-catalog .practice-card').length`), 12);
    await evaluate(cdp, `window.ClassicCandidate.resetCatalog(); document.querySelector('#w2 [data-filter="read"]').click()`);
    w2 = await evaluate(cdp, `({cards: document.querySelectorAll('#practice-catalog .practice-card').length, count: document.querySelector('#catalog-result-count').textContent})`);
    assert.deepEqual(w2, { cards: 2, count: '2' });
    await evaluate(cdp, `document.querySelector('#w2 [data-filter="all"]').click()`);
    await screenshot(cdp, 'desktop-w2.png');

    await evaluate(cdp, `window.ClassicCandidate.openView('w3', false)`);
    const w3Before = await evaluate(cdp, `({first: document.querySelector('#first-response').textContent, nextDisabled: document.querySelector('#practice-next').disabled, choices: document.querySelectorAll('#w3 [data-move]').length, family: document.querySelector('#player-family-label').textContent})`);
    assert.deepEqual(w3Before, { first: '尚未記錄', nextDisabled: true, choices: 3, family: '名稱尚未揭示' });
    await evaluate(cdp, `document.querySelector('#w3 [data-move="C3"]').click(); document.querySelector('#w3 [data-move="D4"]').click()`);
    const w3After = await evaluate(cdp, `({first: document.querySelector('#first-response').textContent, state: document.querySelector('#practice-player').dataset.state, nextDisabled: document.querySelector('#practice-next').disabled, feedback: document.querySelector('#practice-feedback').innerText})`);
    assert.equal(w3After.first, 'C3 · 已保留');
    assert.equal(w3After.state, 'corrected');
    assert.equal(w3After.nextDisabled, false);
    assert.match(w3After.feedback, /完成修正/);
    await screenshot(cdp, 'desktop-w3.png');

    await evaluate(cdp, `window.ClassicCandidate.openView('w4', false)`);
    assert.deepEqual(await evaluate(cdp, `({revealed: document.querySelector('#reveal-demo').dataset.revealed, name: document.querySelector('#revealed-name').textContent, scopeCards: document.querySelectorAll('#w4 .scope-list article').length})`), { revealed: 'false', name: '名稱仍被遮住', scopeCards: 3 });
    await evaluate(cdp, `document.querySelector('#reveal-shape').click()`);
    const w4After = await evaluate(cdp, `({revealed: document.querySelector('#reveal-demo').dataset.revealed, name: document.querySelector('#revealed-name').textContent, disabled: document.querySelector('#reveal-shape').disabled})`);
    assert.deepEqual(w4After, { revealed: 'true', name: '梅花五', disabled: true });
    await screenshot(cdp, 'desktop-w4.png');

    await evaluate(cdp, `window.ClassicCandidate.openView('w5', false); document.querySelector('#w5 [data-contrast-answer="correct"]').click()`);
    const w5After = await evaluate(cdp, `({answered: document.querySelector('#contrast-demo').dataset.answered, family: document.querySelector('#contrast-family').textContent, nextDisabled: document.querySelector('#w5 .locked-action').disabled, boundary: document.querySelector('#contrast-feedback').innerText.includes('不會生成')})`);
    assert.equal(w5After.answered, 'true');
    assert.match(w5After.family, /degree-3/);
    assert.equal(w5After.nextDisabled, false);
    assert.equal(w5After.boundary, false);
    assert.match(await evaluate(cdp, `document.querySelector('#contrast-feedback').innerText`), /這一題第一手正確/);
    await screenshot(cdp, 'desktop-w5.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await evaluate(cdp, `window.ClassicCandidate.openView('w6', false); document.querySelector('#w6 [data-atlas-filter="unknown"]').click()`);
    await evaluate(cdp, `document.querySelector('#w6 [data-atlas-id]').click()`);
    const w6 = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      title: document.querySelector('#atlas-detail-title').textContent,
      ctaDisabled: document.querySelector('#atlas-practice-link').disabled,
      layers: document.querySelectorAll('#atlas-detail dl > div').length,
      unknown: document.querySelector('#atlas-geometry-state').innerText.includes('INSUFFICIENT_GEOMETRY_EVIDENCE'),
      detailOpen: document.querySelector('#atlas-shell').dataset.detailOpen
    })`);
    assert.deepEqual(w6, { overflow: false, title: '小曲尺', ctaDisabled: true, layers: 3, unknown: true, detailOpen: 'true' });
    await screenshot(cdp, 'mobile-w6.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      minTarget: Math.min(...[...document.querySelectorAll('button')].filter((node) => node.offsetParent).map((node) => Math.round(node.getBoundingClientRect().height)))
    })`);
    assert.equal(narrow.overflow, false, JSON.stringify(narrow));
    assert.ok(narrow.minTarget >= 44, JSON.stringify(narrow));

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 640, height: 900, deviceScaleFactor: 2, mobile: false });
    await evaluate(cdp, `window.ClassicCandidate.openView('w3', false)`);
    assert.equal(await evaluate(cdp, `document.documentElement.scrollWidth > document.documentElement.clientWidth + 1`), false);

    await cdp.command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
    await evaluate(cdp, `document.querySelector('#motion-demo').click()`);

    process.stdout.write('PASS: Classic Shapes A1 verified — production-grounded 23 concepts / 49 rounds, 6 views / 42 Award Intent fields, 240-item catalog with 12-node DOM budget, first-response retention, scoped reveal, contrast delegation copy, unknown-disabled Atlas, no-write/no-network semantics, 1440/375/320/200%-equivalent reflow, and reduced motion.\n');
  } finally {
    cdp?.close();
    terminateBrowserTree(child, profile);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
