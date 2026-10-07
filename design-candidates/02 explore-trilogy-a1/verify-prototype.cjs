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
  const history = fs.readFileSync(path.join(productionRoot, 'history.html'), 'utf8');
  const math = fs.readFileSync(path.join(productionRoot, 'math.html'), 'utf8');
  const global = fs.readFileSync(path.join(productionRoot, 'global-go-observatory.html'), 'utf8');
  assert.equal(/localStorage|sessionStorage|document\.cookie|fetch\s*\(|sendBeacon|XMLHttpRequest/.test(`${html}\n${js}`), false, 'Candidate must not write learner or network data');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(`${history}\n${math}\n${global}`, /src="(?:app|scheduler|learner-progress)\.js/);
  assert.match(history, /history-explore-v6/);
  assert.match(math, /目前不宣稱本站能提升一般數學能力/);
  assert.match(global, /未知不等於 0/);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'go-explore-a1-'));
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
    assert.deepEqual(semantics, { title: 'VT-COS｜Explore Trilogy A1', views: 6, intents: 6, intentFields: 42, panels: 6, selected: 'w1', forms: 0, externalAssets: 0 });

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    const historyLens = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      labels: document.querySelectorAll('#w1 [data-evidence]').length,
      pressed: document.querySelector('#w1 [data-evidence][aria-pressed="true"]')?.dataset.evidence,
      routes: [...document.querySelectorAll('#w1 [data-route]')].map((node) => node.dataset.route),
      readOnly: document.querySelector('#w1 .read-only-note').innerText.includes('不影響學習進度')
    })`);
    assert.deepEqual(historyLens, { overflow: false, labels: 6, pressed: 'unknown', routes: ['index.html', 'history.html', 'math.html', 'global-go-observatory.html', 'index.html#core'], readOnly: true });
    await evaluate(cdp, `document.querySelector('#w1 [data-evidence="legend"]').click()`);
    const historyLegend = await evaluate(cdp, `({
      pressed: document.querySelectorAll('#w1 [data-evidence][aria-pressed="true"]').length,
      label: document.querySelector('#history-lens-status').textContent,
      claim: document.querySelector('#history-lens-claim').textContent,
      boundary: document.querySelector('#history-lens-boundary').textContent
    })`);
    assert.equal(historyLegend.pressed, 1);
    assert.match(historyLegend.label, /傳說/);
    assert.match(historyLegend.claim, /堯造圍棋/);
    assert.match(historyLegend.boundary, /不能倒推/);
    await screenshot(cdp, 'desktop-w1.png');

    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click()`);
    const causalBefore = await evaluate(cdp, `({
      anchors: [...document.querySelectorAll('#w2 .anchor-card > strong')].map((node) => node.textContent.trim()),
      gap: document.querySelector('#w2 .corpus-gap').innerText.includes('缺口不能被想像補完'),
      equation: document.querySelector('#w2 .seventy-two-test').innerText.includes('19² − 17² = 72'),
      verdict: getComputedStyle(document.querySelector('#w2 .causal-verdict')).display,
      pressed: document.querySelector('#causal-toggle').getAttribute('aria-pressed'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(causalBefore, { anchors: ['132', '595'], gap: true, equation: true, verdict: 'none', pressed: 'false', overflow: false });
    await evaluate(cdp, `document.querySelector('#causal-toggle').click()`);
    await waitFor(cdp, `getComputedStyle(document.querySelector('#w2 .causal-verdict')).display === 'block'`, 'causal verdict');
    assert.deepEqual(await evaluate(cdp, `({pressed: document.querySelector('#causal-toggle').getAttribute('aria-pressed'), barrier: document.querySelector('#w2 .causal-verdict').innerText.includes('不能推出') || document.querySelector('#w2 .causal-verdict').innerText.includes('因果線')})`), { pressed: 'true', barrier: true });
    await screenshot(cdp, 'desktop-w2.png');

    await evaluate(cdp, `document.querySelector('[data-view="w3"]').click()`);
    const mathBefore = await evaluate(cdp, `({
      layers: document.querySelectorAll('#w3 button[data-relation]').length,
      panels: document.querySelectorAll('#w3 [data-relation-panel]').length,
      visible: document.querySelectorAll('#w3 [data-relation-panel]:not([hidden])').length,
      selected: document.querySelector('#w3 button[data-relation][aria-pressed="true"]')?.dataset.relation,
      noEffectClaim: document.querySelector('#w3 .read-only-note').innerText.includes('不宣稱本站提升一般數學能力'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(mathBefore, { layers: 4, panels: 4, visible: 1, selected: 'formal', noEffectClaim: true, overflow: false });
    await evaluate(cdp, `document.querySelector('#w3 button[data-relation="unknown"]').click()`);
    const mathUnknown = await evaluate(cdp, `({
      visible: document.querySelectorAll('#w3 [data-relation-panel]:not([hidden])').length,
      selected: document.querySelector('#w3 button[data-relation][aria-pressed="true"]')?.dataset.relation,
      bounded: document.querySelector('#w3 [data-relation-panel="unknown"]').innerText.includes('尚未驗證')
    })`);
    assert.deepEqual(mathUnknown, { visible: 1, selected: 'unknown', bounded: true });
    await screenshot(cdp, 'desktop-w3.png');

    await evaluate(cdp, `document.querySelector('[data-view="w4"]').click()`);
    const bridgeBefore = await evaluate(cdp, `({
      arms: document.querySelectorAll('#w4 [data-study-arm]').length,
      selected: document.querySelectorAll('#w4 [data-study-arm][aria-pressed="true"]').length,
      proposed: document.querySelector('#w4 .lab-shell').innerText.includes('PROPOSED STUDY · NOT RUN'),
      criteriaDisplay: getComputedStyle(document.querySelector('#w4 .criteria-panel')).display,
      effectSize: /effect size|效果量\s*[:：]?\s*[0-9.]+/i.test(document.querySelector('#w4 .lab-shell').innerText),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(bridgeBefore, { arms: 3, selected: 1, proposed: true, criteriaDisplay: 'none', effectSize: false, overflow: false });
    await evaluate(cdp, `document.querySelector('#w4 [data-study-arm="b"]').click(); document.querySelector('#criteria-toggle').click()`);
    await waitFor(cdp, `getComputedStyle(document.querySelector('#w4 .criteria-panel')).display === 'grid'`, 'transfer criteria');
    const bridgeAfter = await evaluate(cdp, `({
      selected: document.querySelector('#w4 [data-study-arm][aria-pressed="true"]')?.dataset.studyArm,
      criteria: document.querySelectorAll('#w4 .criteria-panel > div').length,
      labels: document.querySelector('#w4 .criteria-panel').innerText
    })`);
    assert.equal(bridgeAfter.selected, 'b');
    assert.equal(bridgeAfter.criteria, 4);
    for (const label of ['全新題', '無提示', '可比較', '延後再測']) assert.ok(bridgeAfter.labels.includes(label), label);
    await screenshot(cdp, 'desktop-w4.png');

    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const metrics = await evaluate(cdp, `({
      selectors: document.querySelectorAll('#w5 [data-metric]').length,
      active: document.querySelector('#w5 .global-surface').dataset.activeMetric,
      rows: document.querySelectorAll('#w5 .ranking-row').length,
      values: [...document.querySelectorAll('#w5 .ranking-row')].map((row) => Number(row.dataset.value)),
      scope: document.querySelector('#w5 .scope-stamp').innerText,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(metrics.values, [1021,924,437,353,309,242,233,217,196,186]);
    assert.equal(metrics.selectors, 4);
    assert.equal(metrics.active, 'g5');
    assert.equal(metrics.rows, 10);
    assert.match(metrics.scope, /NOT A WORLD RANKING/);
    assert.equal(metrics.overflow, false);
    await evaluate(cdp, `document.querySelector('#w5 [data-metric="g2"]').click()`);
    const nonComparable = await evaluate(cdp, `({
      active: document.querySelector('#w5 .global-surface').dataset.activeMetric,
      ranking: getComputedStyle(document.querySelector('#w5 .ranking-panel')).display,
      warning: getComputedStyle(document.querySelector('#w5 .noncomparable-panel')).display,
      text: document.querySelector('#w5 .noncomparable-panel').innerText
    })`);
    assert.equal(nonComparable.active, 'g2');
    assert.equal(nonComparable.ranking, 'none');
    assert.equal(nonComparable.warning, 'grid');
    assert.match(nonComparable.text, /不.*共享世界榜|拒絕把異質數字/s);
    await evaluate(cdp, `document.querySelector('#w5 [data-metric="g5"]').click()`);
    await screenshot(cdp, 'desktop-w5.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await evaluate(cdp, `document.querySelector('[data-view="w6"]').click()`);
    const mobileBefore = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      phoneWidth: Math.round(document.querySelector('#w6 .profile-phone').getBoundingClientRect().width),
      cards: document.querySelectorAll('#w6 [data-source-type]').length,
      visible: [...document.querySelectorAll('#w6 [data-source-type]')].filter((card) => !card.hidden).length,
      filters: document.querySelectorAll('#w6 [data-source-filter]').length,
      unknownNotZero: document.querySelector('#w6 [data-source-type="unknown"]').innerText.includes('UNKNOWN ≠ 0')
    })`);
    assert.equal(mobileBefore.overflow, false, JSON.stringify(mobileBefore));
    assert.ok(mobileBefore.phoneWidth <= 355, JSON.stringify(mobileBefore));
    assert.deepEqual({ cards: mobileBefore.cards, visible: mobileBefore.visible, filters: mobileBefore.filters, unknownNotZero: mobileBefore.unknownNotZero }, { cards: 4, visible: 4, filters: 5, unknownNotZero: true });
    await evaluate(cdp, `document.querySelector('#w6 [data-source-filter="unknown"]').click()`);
    const mobileUnknown = await evaluate(cdp, `({
      selected: document.querySelector('#w6 [data-source-filter][aria-pressed="true"]')?.dataset.sourceFilter,
      visibleTypes: [...document.querySelectorAll('#w6 [data-source-type]')].filter((card) => !card.hidden).map((card) => card.dataset.sourceType),
      unknownText: document.querySelector('#w6 [data-source-type="unknown"]').innerText,
      scope: document.querySelector('#filter-scope').innerText,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })`);
    assert.deepEqual(mobileUnknown.visibleTypes, ['unknown']);
    assert.equal(mobileUnknown.selected, 'unknown');
    assert.match(mobileUnknown.unknownText, /現況未知/);
    assert.match(mobileUnknown.scope, /未知 1 張資料卡；不是排名/);
    assert.equal(mobileUnknown.overflow, false);
    await screenshot(cdp, 'mobile-w6.png');

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      minTarget: Math.min(...[...document.querySelectorAll('#w6 [data-source-filter]')].map((node) => Math.round(node.getBoundingClientRect().height)))
    })`);
    assert.equal(narrow.overflow, false, JSON.stringify(narrow));
    assert.ok(narrow.minTarget >= 44, JSON.stringify(narrow));

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 640, height: 900, deviceScaleFactor: 2, mobile: false });
    await evaluate(cdp, `document.querySelector('[data-view="w5"]').click()`);
    const zoom = await evaluate(cdp, `({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      rows: document.querySelectorAll('#w5 .ranking-row').length
    })`);
    assert.deepEqual(zoom, { overflow: false, rows: 10 });

    await cdp.command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await evaluate(cdp, `document.querySelector('[data-view="w2"]').click(); if (!document.querySelector('#history-causal-demo').classList.contains('show-barrier')) document.querySelector('#causal-toggle').click()`);
    await waitFor(cdp, `getComputedStyle(document.querySelector('#w2 .causal-verdict')).display === 'block'`, 'reduced motion end state');
    assert.equal(await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`), true);

    process.stdout.write('PASS: Explore Trilogy A1 verified — 3 production-grounded pages, 6 views/6 Award Intents, History evidence lens, Math transfer boundary, Global metric comparability, no-write semantics, 1440/375/320/200% reflow, and reduced motion.\n');
  } finally {
    cdp?.close();
    terminateBrowserTree(child, profile);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
