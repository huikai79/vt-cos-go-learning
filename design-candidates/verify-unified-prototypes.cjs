const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const { terminateBrowserTree } = require('./browser-verifier-cleanup.cjs');

const browser = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find((candidate) => fs.existsSync(candidate));

const pages = [
  ['00 index-homepage-a1', '首頁'],
  ['01 award-experience-a2-integrated', '學習'],
  ['02 explore-trilogy-a1', '探索'],
  ['03 advanced-live-a1', '進階與實戰'],
  ['04 classic-shapes-a1', '名型館']
].map(([directory, label]) => ({
  directory,
  label,
  file: path.join(__dirname, directory, 'prototype.html')
}));

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
      const timeout = setTimeout(() => reject(new Error(`CDP ${method} timed out`)), 20000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.socket.close(); }
}

async function connectToPage(profile, page) {
  const marker = path.join(profile, 'DevToolsActivePort');
  let port;
  for (let attempt = 0; attempt < 150; attempt += 1) {
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
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = targets.find((candidate) => candidate.type === 'page' && candidate.url === page);
    if (target) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(target, 'Initial prototype page did not load');
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await evaluate(cdp, expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function verifyStaticContract(page) {
  const html = fs.readFileSync(page.file, 'utf8');
  assert.match(html, /\.\.\/prototype-system\.css/, `${page.label}: shared stylesheet missing`);
  assert.match(html, /class="suite-header"/, `${page.label}: suite header missing`);
  assert.equal((html.match(/class="suite-nav"/g) || []).length, 1, `${page.label}: suite navigation count`);
  const suiteMarkup = html.match(/class="suite-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
  assert.equal((suiteMarkup.match(/aria-current="page"/g) || []).length, 1, `${page.label}: current section count`);
  const hrefs = [...suiteMarkup.matchAll(/href="([^"]+)"/g)].map((item) => item[1]);
  assert.equal(hrefs.length, 5, `${page.label}: suite navigation must expose five destinations`);
  for (const href of hrefs) {
    const target = fileURLToPath(new URL(href, pathToFileURL(page.file)));
    assert.ok(fs.existsSync(target), `${page.label}: broken suite link ${href}`);
  }
}

async function inspectView(cdp, page, viewId) {
  await evaluate(cdp, `document.querySelector('[data-view="${viewId}"]').click()`);
  await waitFor(cdp, `document.querySelector('.review-view:not([hidden])')?.id === '${viewId}'`, `${page.label} ${viewId}`);
  const result = await evaluate(cdp, `(() => {
    window.scrollTo(0, 0);
    const header = document.querySelector('.suite-header').getBoundingClientRect();
    const tabs = document.querySelector('.review-tabs').getBoundingClientRect();
    const active = document.querySelector('.review-view:not([hidden])');
    const frame = active.querySelector('.experience-frame, .artifact-shell');
    const award = active.querySelector('.award-intent');
    const title = active.querySelector('[data-view-title]');
    const frameRect = frame.getBoundingClientRect();
    const awardRect = award.getBoundingClientRect();
    const titleLines = [...title.querySelectorAll('.title-line')];
    const fullyPainted = (node, frameRect) => {
      const rect = node.getBoundingClientRect();
      for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (/(hidden|auto|scroll|clip)/.test(style.overflow + ' ' + style.overflowX + ' ' + style.overflowY)) {
          const clip = ancestor.getBoundingClientRect();
          if (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1 || rect.left < clip.left - 1 || rect.right > clip.right + 1) return ancestor !== frame;
        }
        if (ancestor === frame) break;
      }
      return rect.top >= frameRect.top - 1 && rect.bottom <= frameRect.bottom + 1 && rect.left >= frameRect.left - 1 && rect.right <= frameRect.right + 1;
    };
    const focusables = [...frame.querySelectorAll('button:not([hidden]), a[href], input:not([type="hidden"]), select, textarea, [tabindex="0"]')]
      .filter((node) => {
        const style = getComputedStyle(node);
      const painted = typeof node.checkVisibility === 'function'
        ? node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
          : true;
        const rect = node.getBoundingClientRect();
        return painted && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
    const offscreen = focusables.filter((node) => {
      return !fullyPainted(node, frameRect);
    }).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        label: (node.textContent || node.getAttribute('aria-label') || node.tagName).trim().slice(0, 48),
        rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.right), Math.round(rect.bottom)],
        frame: [Math.round(frameRect.left), Math.round(frameRect.top), Math.round(frameRect.right), Math.round(frameRect.bottom)]
      };
    });
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      headerHeight: Math.round(header.height),
      headerBackground: getComputedStyle(document.querySelector('.suite-header')).backgroundColor,
      tabsHeight: Math.round(tabs.height),
      tabsBackground: getComputedStyle(document.querySelector('.review-tabs')).backgroundColor,
      awardBackground: getComputedStyle(award).backgroundColor,
      awardWidth: Math.round(awardRect.width),
      pageScroll: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      frameInViewport: frameRect.top >= tabs.bottom - 1 && frameRect.bottom <= innerHeight + 1,
      awardInViewport: awardRect.top >= tabs.bottom - 1 && awardRect.bottom <= innerHeight + 1,
      frameOverflow: frame.scrollHeight - frame.clientHeight,
      frameClient: frame.clientHeight,
      frameScroll: frame.scrollHeight,
      frameClass: frame.className,
      frameChildren: [...frame.children].map((node) => ({ className: node.className, client: node.clientHeight, scroll: node.scrollHeight, rect: Math.round(node.getBoundingClientRect().height) })),
      keyRects: [...frame.querySelectorAll('.live-board-stage, .live-board-stage .go-board, .game-side-panel')].map((node) => ({ className: node.className, width: Math.round(node.getBoundingClientRect().width), height: Math.round(node.getBoundingClientRect().height), scroll: node.scrollHeight })),
      titleOverflow: title.scrollWidth > title.clientWidth + 1 || titleLines.some((line) => line.scrollWidth > line.clientWidth + 1),
      offscreen,
      sharedGold: rootStyle.getPropertyValue('--suite-gold').trim()
    };
  })()`);
  assert.equal(result.headerHeight, 64, `${page.label} ${viewId}: suite header geometry`);
  assert.equal(result.tabsHeight, 48, `${page.label} ${viewId}: tab geometry`);
  assert.ok(result.pageScroll <= 1, `${page.label} ${viewId}: desktop page requires vertical wheel (${result.pageScroll}px)`);
  assert.ok(result.horizontalOverflow <= 1, `${page.label} ${viewId}: horizontal overflow (${result.horizontalOverflow}px)`);
  assert.equal(result.frameInViewport, true, `${page.label} ${viewId}: product frame leaves viewport`);
  assert.equal(result.awardInViewport, true, `${page.label} ${viewId}: Award Intent leaves viewport`);
  assert.ok(result.frameOverflow <= 2, `${page.label} ${viewId}: clipped frame content ${JSON.stringify({ overflow: result.frameOverflow, client: result.frameClient, scroll: result.frameScroll, className: result.frameClass, children: result.frameChildren, keyRects: result.keyRects })}`);
  assert.equal(result.titleOverflow, false, `${page.label} ${viewId}: semantic title overflow`);
  assert.deepEqual(result.offscreen, [], `${page.label} ${viewId}: interactive controls outside frame`);
  return result;
}

async function inspectShortView(cdp, page, viewId) {
  await evaluate(cdp, `document.querySelector('[data-view="${viewId}"]').click()`);
  await waitFor(cdp, `document.querySelector('.review-view:not([hidden])')?.id === '${viewId}'`, `${page.label} ${viewId} short window`);
  const result = await evaluate(cdp, `(() => {
    window.scrollTo(0, 0);
    const active = document.querySelector('.review-view:not([hidden])');
    const frame = active.querySelector('.experience-frame, .artifact-shell');
    const title = active.querySelector('[data-view-title]');
    const titleLines = [...title.querySelectorAll('.title-line')];
    const focusables = [...frame.querySelectorAll('button:not([hidden]), a[href], input:not([type="hidden"]), select, textarea, [tabindex="0"]')]
      .filter((node) => {
        const style = getComputedStyle(node);
        const painted = typeof node.checkVisibility === 'function'
          ? node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
          : true;
        const rect = node.getBoundingClientRect();
        return painted && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
    const unreachable = [];
    for (const node of focusables) {
      node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      const rect = node.getBoundingClientRect();
      if (rect.top < -1 || rect.bottom > innerHeight + 1 || rect.left < -1 || rect.right > innerWidth + 1) {
        unreachable.push((node.textContent || node.getAttribute('aria-label') || node.tagName).trim().slice(0, 48));
      }
    }
    window.scrollTo(0, 0);
    return {
      bodyOverflow: getComputedStyle(document.body).overflowY,
      rootOverflow: getComputedStyle(document.documentElement).overflowY,
      pageScroll: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      frameOverflow: frame.scrollHeight - frame.clientHeight,
      titleOverflow: title.scrollWidth > title.clientWidth + 1 || titleLines.some((line) => line.scrollWidth > line.clientWidth + 1),
      titleGeometry: {
        client: title.clientWidth,
        scroll: title.scrollWidth,
        lines: titleLines.map((line) => ({ text: line.textContent.trim(), client: line.clientWidth, scroll: line.scrollWidth }))
      },
      interactiveCount: focusables.length,
      unreachable
    };
  })()`);
  assert.notEqual(result.bodyOverflow, 'hidden', `${page.label} ${viewId}: short window suppresses body scrolling`);
  assert.notEqual(result.rootOverflow, 'hidden', `${page.label} ${viewId}: short window suppresses root scrolling`);
  assert.ok(result.horizontalOverflow <= 1, `${page.label} ${viewId}: short-window horizontal overflow (${result.horizontalOverflow}px)`);
  assert.ok(result.frameOverflow <= 2, `${page.label} ${viewId}: short-window frame clips content (${result.frameOverflow}px)`);
  assert.equal(result.titleOverflow, false, `${page.label} ${viewId}: short-window semantic title overflow ${JSON.stringify(result.titleGeometry)}`);
  assert.deepEqual(result.unreachable, [], `${page.label} ${viewId}: short-window controls are unreachable`);
  return result;
}

async function main() {
  assert.ok(browser, 'Edge or Chrome is required');
  const sharedCss = fs.readFileSync(path.join(__dirname, 'prototype-system.css'), 'utf8');
  assert.match(sharedCss, /overflow:\s*hidden/);
  assert.match(sharedCss, /prefers-reduced-motion:\s*reduce/);
  pages.forEach(verifyStaticContract);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'go-unified-prototypes-'));
  const firstPage = pathToFileURL(pages[0].file).href;
  const child = spawn(browser, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--disable-background-mode',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, firstPage
  ], { stdio: 'ignore' });
  let cdp;
  try {
    cdp = await connectToPage(profile, firstPage);
    await cdp.command('Page.enable');
    await cdp.command('Runtime.enable');
    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

    let common;
    let checkedViews = 0;
    for (const page of pages) {
      await cdp.command('Page.navigate', { url: pathToFileURL(page.file).href });
      await waitFor(cdp, `document.readyState === 'complete' && document.querySelectorAll('.review-tabs [data-view]').length === 6`, `${page.label} load`);
      await evaluate(cdp, 'document.fonts ? document.fonts.ready : Promise.resolve()');
      for (let index = 1; index <= 6; index += 1) {
        const result = await inspectView(cdp, page, `w${index}`);
        const geometry = {
          headerHeight: result.headerHeight,
          headerBackground: result.headerBackground,
          tabsHeight: result.tabsHeight,
          tabsBackground: result.tabsBackground,
          awardBackground: result.awardBackground,
          awardWidth: result.awardWidth,
          sharedGold: result.sharedGold
        };
        if (!common) common = geometry;
        else assert.deepEqual(geometry, common, `${page.label} w${index}: shared chrome drift`);
        checkedViews += 1;
      }
    }

    // Do not let the default playable Atlas record stand in for every evidence state.
    // The unknown record is the longest/most constrained branch: it must retain all
    // evidence layers, its warning, and a deliberately disabled action in the fixed stage.
    const atlasPage = pages.find((page) => page.directory === '04 classic-shapes-a1');
    await cdp.command('Page.navigate', { url: pathToFileURL(atlasPage.file).href });
    await waitFor(cdp, `document.readyState === 'complete' && document.querySelectorAll('.review-tabs [data-view]').length === 6`, 'Atlas alternate-state load');
    await evaluate(cdp, `document.querySelector('[data-view="w6"]').click()`);
    await waitFor(cdp, `document.querySelector('.review-view:not([hidden])')?.id === 'w6'`, 'Atlas alternate-state view');
    const alternateAtlas = await evaluate(cdp, `(() => {
      document.querySelector('[data-atlas-id="ruler"]').click();
      const frame = document.querySelector('#w6 .atlas-shell').getBoundingClientRect();
      const detail = document.querySelector('#atlas-detail').getBoundingClientRect();
      const action = document.querySelector('#atlas-practice-link');
      const warning = document.querySelector('#atlas-warning').textContent.trim();
      return {
        title: document.querySelector('#atlas-detail-title').textContent.trim(),
        fields: ['#atlas-name-state', '#atlas-geometry-state', '#atlas-practice-state'].map((selector) => document.querySelector(selector).textContent.trim()),
        warning,
        actionDisabled: action.disabled,
        detailInFrame: detail.top >= frame.top - 1 && detail.bottom <= frame.bottom + 1,
        actionInViewport: (() => { const rect = action.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight; })()
      };
    })()`);
    assert.equal(alternateAtlas.title, '小曲尺', `Atlas alternate state title: ${JSON.stringify(alternateAtlas)}`);
    assert.equal(alternateAtlas.actionDisabled, true, `Atlas unknown item must keep its action disabled: ${JSON.stringify(alternateAtlas)}`);
    assert.ok(alternateAtlas.fields.every(Boolean), `Atlas alternate evidence layers missing: ${JSON.stringify(alternateAtlas)}`);
    assert.match(alternateAtlas.fields[1], /INSUFFICIENT_GEOMETRY_EVIDENCE/, `Atlas alternate geometry evidence: ${JSON.stringify(alternateAtlas)}`);
    assert.match(alternateAtlas.warning, /未知保持未知/, `Atlas alternate warning: ${JSON.stringify(alternateAtlas)}`);
    assert.equal(alternateAtlas.detailInFrame, true, `Atlas alternate detail leaves fixed frame: ${JSON.stringify(alternateAtlas)}`);
    assert.equal(alternateAtlas.actionInViewport, true, `Atlas alternate action leaves fixed viewport: ${JSON.stringify(alternateAtlas)}`);

    // A short desktop window must favor complete information over a forced one-screen fit.
    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 830, deviceScaleFactor: 1, mobile: false });
    let checkedShortViews = 0;
    for (const page of pages) {
      await cdp.command('Page.navigate', { url: pathToFileURL(page.file).href });
      await waitFor(cdp, `document.readyState === 'complete' && document.querySelectorAll('.review-tabs [data-view]').length === 6`, `${page.label} short-window load`);
      await evaluate(cdp, 'document.fonts ? document.fonts.ready : Promise.resolve()');
      for (let index = 1; index <= 6; index += 1) {
        await inspectShortView(cdp, page, `w${index}`);
        checkedShortViews += 1;
      }
    }

    // Atlas gets a deeper short-window check because its detail carries a warning
    // and an action after three distinct evidence layers.
    await cdp.command('Page.navigate', { url: pathToFileURL(atlasPage.file).href });
    await waitFor(cdp, `document.readyState === 'complete' && document.querySelectorAll('.review-tabs [data-view]').length === 6`, 'Atlas short-window load');
    await evaluate(cdp, `document.querySelector('[data-view="w6"]').click()`);
    await waitFor(cdp, `document.querySelector('.review-view:not([hidden])')?.id === 'w6'`, 'Atlas short-window view');
    const shortAtlasStart = await evaluate(cdp, `(() => {
      window.scrollTo(0, 0);
      const frame = document.querySelector('#w6 .atlas-shell');
      return {
        pageScroll: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight,
        frameOverflow: frame.scrollHeight - frame.clientHeight,
        warningExists: Boolean(document.querySelector('#atlas-warning')),
        actionExists: Boolean(document.querySelector('#atlas-practice-link')),
        bodyOverflow: getComputedStyle(document.body).overflowY
      };
    })()`);
    assert.ok(shortAtlasStart.pageScroll > 0, `Atlas short window should use natural page scrolling: ${JSON.stringify(shortAtlasStart)}`);
    assert.ok(shortAtlasStart.frameOverflow <= 2, `Atlas must not clip its detail in a short window: ${JSON.stringify(shortAtlasStart)}`);
    assert.equal(shortAtlasStart.warningExists, true);
    assert.equal(shortAtlasStart.actionExists, true);
    assert.notEqual(shortAtlasStart.bodyOverflow, 'hidden', `Atlas short window must not suppress scrolling: ${JSON.stringify(shortAtlasStart)}`);
    const shortAtlasEnd = await evaluate(cdp, `(() => {
      const action = document.querySelector('#atlas-practice-link');
      action.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rect = action.getBoundingClientRect();
      const detail = document.querySelector('#atlas-detail');
      const frame = document.querySelector('#w6 .atlas-shell');
      return {
        scrollY,
        action: [Math.round(rect.top), Math.round(rect.bottom)],
        viewport: innerHeight,
        detail: [Math.round(detail.getBoundingClientRect().top), Math.round(detail.getBoundingClientRect().bottom)],
        detailOverflow: getComputedStyle(detail).overflowY,
        frame: [Math.round(frame.getBoundingClientRect().top), Math.round(frame.getBoundingClientRect().bottom)]
      };
    })()`);
    assert.ok(shortAtlasEnd.scrollY > 0 && shortAtlasEnd.action[0] >= 0 && shortAtlasEnd.action[1] <= shortAtlasEnd.viewport,
      `Atlas action must be reachable by natural scrolling: ${JSON.stringify(shortAtlasEnd)}`);

    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    for (const page of pages) {
      await cdp.command('Page.navigate', { url: pathToFileURL(page.file).href });
      await waitFor(cdp, `document.readyState === 'complete' && document.querySelector('.suite-header')`, `${page.label} mobile load`);
      const mobile = await evaluate(cdp, `({
        horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        headerWidth: Math.round(document.querySelector('.suite-header').getBoundingClientRect().width),
        navScrollable: document.querySelector('.suite-nav').scrollWidth >= document.querySelector('.suite-nav').clientWidth
      })`);
      assert.ok(mobile.horizontalOverflow <= 1, `${page.label}: mobile suite causes horizontal page overflow`);
      assert.equal(mobile.headerWidth, 375, `${page.label}: mobile suite header width`);
      assert.equal(mobile.navScrollable, true, `${page.label}: mobile suite navigation must remain locally scrollable`);
    }

    console.log(`PASS: unified prototype website verified — ${pages.length} sections, ${checkedViews} complete 1440×1000 desktop views without body-wheel scrolling, ${checkedShortViews} complete/reachable 1440×830 natural-flow views, valid cross-section links, a deep Atlas warning/action fallback, an intact unknown-state branch, mobile horizontal containment, and reduced motion.`);
  } finally {
    if (cdp) cdp.close();
    terminateBrowserTree(child, profile);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 125 }); } catch {}
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
