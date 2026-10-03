const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const browser = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
].find((candidate) => fs.existsSync(candidate));
const requestedBaseUrl = process.env.GO_UI_BASE_URL;
const baseUrl = requestedBaseUrl ? new URL(requestedBaseUrl.endsWith("/") ? requestedBaseUrl : `${requestedBaseUrl}/`) : null;
const page = baseUrl ? new URL("index.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../index.html")).href;
const reviewPage = baseUrl ? new URL("r1-review.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../r1-review.html")).href;
const advancedPage = baseUrl ? new URL("advanced.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../advanced.html")).href;
const classicPage = baseUrl ? new URL("classic-shapes.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../classic-shapes.html")).href;
const historyPage = baseUrl ? new URL("history.html", baseUrl).href : pathToFileURL(path.resolve(__dirname, "../history.html")).href;

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function connectToPage(profile, expectedPage) {
  const marker = path.join(profile, "DevToolsActivePort");
  let port;
  for (let retry = 0; retry < 100; retry += 1) {
    if (fs.existsSync(marker)) {
      port = Number(fs.readFileSync(marker, "utf8").split(/\r?\n/, 1)[0]);
      if (Number.isInteger(port) && port > 0) break;
    }
    await delay(100);
  }
  assert.ok(port, "Edge did not open the debugging port");
  let target;
  for (let retry = 0; retry < 50; retry += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await response.json();
    target = targets.find((item) => item.type === "page" && item.url === expectedPage)
      || targets.find((item) => item.type === "page");
    if (target) break;
    await delay(100);
  }
  assert.ok(target && target.webSocketDebuggerUrl, "local file page did not load");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("CDP WebSocket open timed out")), 10000);
    socket.addEventListener("open", () => { clearTimeout(timeout); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("CDP WebSocket failed")); }, { once: true });
  });
  return socket;
}

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
    const timeout = setTimeout(() => { socket.removeEventListener("message", onMessage); reject(new Error(`CDP ${method} timed out`)); }, 10000);
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
  const m2Html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
  const m2Css = fs.readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");
  const m2App = fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8");
  assert.match(m2Html, /id="course-nav-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="course-navigation"/);
  assert.match(m2Html, /id="current-course-context"/);
  assert.match(m2Html, /id="today-navigation"[^>]*hidden/);
  assert.match(m2Html, /class="advanced-priority-label">目前紀錄與證據<\/div>/);
  for (const id of ["advanced-evidence-brief", "advanced-evidence-note", "live-practice-summary", "live-evidence-summary", "integrated-progress-summary", "diagnostic-summary"]) {
    assert.match(m2Html, new RegExp(`id="${id}"`));
  }
  for (const retiredId of ["live-practice-brief", "live-evidence-brief", "integrated-progress-brief", "diagnostic-brief"]) {
    assert.doesNotMatch(m2Html, new RegExp(`id="${retiredId}"`));
  }
  const advancedStatusPosition = m2Html.indexOf('class="advanced-priority-label"');
  const overviewPosition = m2Html.indexOf('class="advanced-evidence-overview"');
  const detailPosition = m2Html.indexOf('class="advanced-evidence-details"');
  const courseMapPosition = m2Html.indexOf('class="advanced-course-map"');
  const toolsPosition = m2Html.indexOf('id="sidebar-tools-button"');
  assert.ok(advancedStatusPosition < overviewPosition && overviewPosition < detailPosition && detailPosition < courseMapPosition && courseMapPosition < toolsPosition);
  assert.match(m2Html, /class="advanced-evidence-overview" aria-labelledby="advanced-evidence-brief"/);
  assert.match(m2Html, /<summary>查看資料來源與診斷 <span aria-hidden="true">⌄<\/span><\/summary>/);
  assert.match(m2Css, /\.advanced-evidence-overview\{[^}]*padding:/);
  assert.match(m2Css, /\.evidence-detail-row p\{[^}]*white-space:pre-line/);
  assert.match(m2App, /function renderAdvancedEvidenceOverview\(diagnostics = null\)/);
  assert.match(m2App, /const currentLessonIndex = problems\[state\.index\]\.lesson/);
  assert.match(m2App, /state\.navUnitIndex/);
  assert.match(m2Css, /\.course-navigation\.is-open\{display:block\}/);
  const sourceHtml = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
  const sourceCss = fs.readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");
  const sourceApp = fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8");
  assert.match(sourceHtml, /id="system-status"[^>]*role="alert"[^>]*hidden/);
  assert.match(sourceHtml, /id="feedback"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(sourceHtml, /id="interaction-feedback"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
  assert.match(sourceHtml, /id="hint-feedback"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
  assert.match(sourceCss, /\.hint-feedback\{[^}]*background:/);
  assert.match(sourceCss, /\.interaction-feedback\{[^}]*background:/);
  assert.match(sourceCss, /\.system-status\{[^}]*background:/);
  assert.match(sourceApp, /showAuxiliaryFeedback\("hint-feedback", current\(\)\.hint\)/);
  assert.match(sourceApp, /showAuxiliaryFeedback\("interaction-feedback", result\.reason\)/);
  assert.doesNotMatch(sourceApp, /\$\("feedback"\)\.textContent = current\(\)\.hint/);
  assert.match(sourceHtml, /<details class="advanced-evidence-details">/);
  assert.match(sourceHtml, /id="advanced-evidence-brief">尚無足夠資料<\/strong>/);
  assert.match(sourceHtml, /id="advanced-evidence-note">完成練習、延後複習或實戰後/);
  assert.doesNotMatch(sourceHtml, /id="(?:live-practice|live-evidence|integrated-progress|diagnostic)-brief"/);
  assert.doesNotMatch(sourceApp, /advanced-evidence-brief[^\n]*(?:掌握|熟練|通過)/);
  assert.ok(browser, "Chrome or Edge is required for this local UI test");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "go-learning-ui-"));
  const child = spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions", "--disable-background-mode", "--remote-debugging-port=0", `--user-data-dir=${profile}`, page], { stdio: ["ignore", "ignore", "pipe"] });
  let socket;
  try {
    socket = await connectToPage(profile, page);
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
        siteIntroVisible: !document.querySelector('#site-introduction').hidden,
        siteIntroTitle: document.querySelector('#site-introduction-title').textContent,
        landingHeaderVisible: getComputedStyle(document.querySelector('.landing-header')).display !== 'none',
        sidebarDisplay: getComputedStyle(document.querySelector('.sidebar')).display,
        topbarDisplay: getComputedStyle(document.querySelector('.topbar')).display,
        trustItems: document.querySelectorAll('.intro-trust-row > span').length,
        loopSteps: document.querySelectorAll('.intro-loop > li').length,
        assessmentCards: document.querySelectorAll('.intro-evidence-grid > article').length,
        siteIntroSources: document.querySelectorAll('.intro-source-grid a').length,
        researchOpen: document.querySelector('.intro-research-details').open,
        curriculumBoundary: document.querySelector('.intro-course-count').textContent,
        courseEntryCards: document.querySelectorAll('.intro-path-card').length,
        evidenceSummaryCards: document.querySelectorAll('[data-evidence-role="summary"]').length,
        localCoreEntry: document.querySelector('[data-site-intro-unit="5"]')?.textContent.trim(),
        globalCoreEntry: document.querySelector('[data-site-intro-unit="10"]')?.textContent.trim(),
        landingAction: document.querySelector('.intro-hero [data-site-intro-start]').textContent.trim(),
        coreEntryStatus: document.querySelector('#core-entry-status').textContent,
        introOpen: document.querySelector('#lesson-intro-dialog').open,
        introTitle: document.querySelector('#lesson-intro-title').textContent,
        startLabel: document.querySelector('#resume-button').textContent,
        reviewHidden: document.querySelector('#review-button').hidden,
        promptBeforeBoard: Boolean(title.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING),
        policy: document.querySelector('#answer-policy').textContent,
        flowSteps: document.querySelectorAll('.learning-steps li').length,
        activeFlow: document.querySelector('.learning-steps li.active')?.id || null,
        passedFlowCount: document.querySelectorAll('.learning-steps li.passed').length,
        flowCurrentCount: document.querySelectorAll('.learning-steps [aria-current]').length,
        taskLabel: document.querySelector('#sidebar-current-task-label').textContent,
        taskPhase: document.querySelector('#sidebar-question-phase').textContent,
        taskGuideOpen: document.querySelector('.sidebar-task-guide').open,
        flowNow: document.querySelector('#learning-now').textContent,
        flowWhy: document.querySelector('#learning-why').textContent,
        concept: document.querySelector('#teaching-text').textContent,
        check: document.querySelector('#teaching-check').textContent,
        visualDemo: document.querySelectorAll('#teaching-demo-board .demo-liberty').length,
        termCount: document.querySelector('#lesson-term-count').textContent,
        firstTerm: document.querySelector('#lesson-term-list dt')?.textContent,
        legendItems: document.querySelectorAll('.demo-legend span').length,
        compactGuidance: document.querySelector('#learning-now-summary').textContent,
        currentLevel: document.querySelector('.level-path > .active')?.id,
        heroImage: document.querySelector('.intro-hero-image')?.getAttribute('src'),
        heroAtmosphere: document.querySelector('.intro-hero-atmosphere')?.getAttribute('src'),
        philosophyImages: document.querySelectorAll('.intro-philosophy-art').length,
        finalLandscape: document.querySelector('.intro-final-landscape')?.getAttribute('src'),
        duplicateScienceSection: Boolean(document.querySelector('.intro-science')),
        pathImages: document.querySelectorAll('.intro-path-image').length,
        evidenceImages: document.querySelectorAll('.intro-evidence-image').length,
        stageBadge: document.querySelector('#learning-stage-badge').textContent,
        stageBadgeRole: document.querySelector('#learning-stage-badge').getAttribute('role'),
        stageBadgeLive: document.querySelector('#learning-stage-badge').getAttribute('aria-live'),
        sidebarTaskRole: document.querySelector('.sidebar-current-task').getAttribute('role')
      };
    })()`);
    assert.deepEqual(firstUse, { siteIntroVisible: true, siteIntroTitle: "從 0 開始，先學氣與提子，再走進 9 路棋局。", landingHeaderVisible: true, sidebarDisplay: "none", topbarDisplay: "none", trustItems: 2, loopSteps: 4, assessmentCards: 4, siteIntroSources: 9, researchOpen: false, curriculumBoundary: "目前課程：15 單元 · 19 課 · 106 題。這些數字只描述內容量，不代表學習成效或棋力。", courseEntryCards: 3, evidenceSummaryCards: 0, localCoreEntry: "開始這個單元 →", globalCoreEntry: "開始這個單元 →", landingAction: "從第一課開始 →", coreEntryStatus: "適合完全零基礎，從第一口氣開始。", introOpen: false, introTitle: "現在先學：認識氣", startLabel: "開始第 1 題", reviewHidden: true, promptBeforeBoard: true, policy: "選擇答案後會立即作答；答錯可以再試。", flowSteps: 5, activeFlow: null, passedFlowCount: 0, flowCurrentCount: 0, taskLabel: "課程", taskPhase: "先看懂", taskGuideOpen: false, flowNow: "先看本課短講，再用棋盤示範確認要觀察的變化。", flowWhy: "先抓住本課要觀察的核心線索，再進入不看答案的練習。", concept: "棋子放在交叉點上。沿線上下左右相鄰的空點叫做「氣」；斜對角不算。連成一串的棋子共用氣。", check: "先找沿線相鄰的空點，再數氣；同一個空點只算一次。", visualDemo: 0, termCount: "（1 個）", firstTerm: "氣", legendItems: 2, compactGuidance: "先看本課短講，再用棋盤示範確認要觀察的變化。", currentLevel: "level-beginner", heroImage: "assets/homepage/hero.png", heroAtmosphere: "assets/homepage/hero-atmosphere.svg", philosophyImages: 2, finalLandscape: "assets/homepage/footer-landscape.svg", duplicateScienceSection: false, pathImages: 3, evidenceImages: 4, stageBadge: "目前任務：課程 · 本題：先看懂", stageBadgeRole: "status", stageBadgeLive: "polite", sidebarTaskRole: null });
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
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    const catalogNavigation = await evaluate(socket, `(() => {
      const routeLink = document.querySelector('.landing-nav a[href="#learning-entry"]');
      const catalogLink = document.querySelector('.landing-nav [data-site-intro-courses]');
      const catalog = document.querySelector('#all-courses');
      const summary = catalog.querySelector('summary');
      const beforeStorage = JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));
      const beforeLesson = document.querySelector('#lesson-title').textContent;
      const initiallyClosed = !catalog.open;
      catalogLink.click();
      const buttons = [...catalog.querySelectorAll('#intro-core-course-list [data-site-intro-unit]')];
      const opened = catalog.open;
      const focusInCatalog = catalog.contains(document.activeElement);
      const titlesAndCountsMatch = buttons.length === window.GoContent.units.length && buttons.every((button, index) => {
        const title = window.GoContent.units[index].title;
        const count = window.GoContent.lessons.filter(lesson => lesson.unit === index).length;
        return button.textContent.includes(title) && new RegExp(count + ' *課').test(button.textContent);
      });
      const visible = buttons.every(button => button.getBoundingClientRect().height > 0);
      summary.click();
      return { routeDestination: routeLink.getAttribute('href'), catalogDestination: catalogLink.getAttribute('href'),
        initiallyClosed, opened, focusInCatalog, closedBySummary: !catalog.open,
        unitIndices: buttons.map(button => Number(button.dataset.siteIntroUnit)), titlesAndCountsMatch, visible,
        advancedDestination: catalog.querySelector('a[href="advanced.html"]')?.getAttribute('href'),
        boardDestination: catalog.querySelector('a[href^="live-game.html"]')?.getAttribute('href'),
        coreEntryPresent: Boolean(catalog.querySelector('[data-site-intro-start]')),
        storageUnchanged: beforeStorage === JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])),
        lessonUnchanged: beforeLesson === document.querySelector('#lesson-title').textContent };
    })()`);
    assert.equal(catalogNavigation.routeDestination, "#learning-entry");
    assert.equal(catalogNavigation.catalogDestination, "#all-courses");
    assert.notEqual(catalogNavigation.routeDestination, catalogNavigation.catalogDestination, "學習路線與全站課程必須有不同目的地");
    assert.deepEqual(catalogNavigation.unitIndices, Array.from({ length: 15 }, (_, index) => index));
    for (const flag of ["initiallyClosed", "opened", "focusInCatalog", "closedBySummary", "titlesAndCountsMatch", "visible", "coreEntryPresent", "storageUnchanged", "lessonUnchanged"]) {
      assert.equal(catalogNavigation[flag], true, `全站課程目錄 ${flag} 未符合契約`);
    }
    assert.equal(catalogNavigation.advancedDestination, "advanced.html");
    assert.match(catalogNavigation.boardDestination, /^live-game\.html(?:\?|$)/);
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const mobileCatalog = await evaluate(socket, `(() => {
      const catalog = document.querySelector('#all-courses');
      const summary = catalog.querySelector('summary');
      const storage = localStorage.getItem('go-learning-prototype-v7');
      summary.scrollIntoView({block: 'start', behavior: 'instant'});
      const summaryRect = summary.getBoundingClientRect();
      summary.click();
      const result = { summaryVisible: summaryRect.height > 0 && summaryRect.width > 0,
        opened: catalog.open, unitButtonsFit: [...catalog.querySelectorAll('[data-site-intro-unit]')].every(button => {
          const rect = button.getBoundingClientRect(); return rect.height > 0 && rect.left >= 0 && rect.right <= innerWidth + 1;
        }), overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      summary.click();
      return { ...result, closed: !catalog.open, storageUnchanged: storage === localStorage.getItem('go-learning-prototype-v7') };
    })()`);
    assert.deepEqual(mobileCatalog, { summaryVisible: true, opened: true, unitButtonsFit: true, overflow: false, closed: true, storageUnchanged: true });
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    const landingMobile = await evaluate(socket, "({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, siteIntroVisible: !document.querySelector('#site-introduction').hidden, sidebarDisplay: getComputedStyle(document.querySelector('.sidebar')).display, topbarDisplay: getComputedStyle(document.querySelector('.topbar')).display, pathColumns: getComputedStyle(document.querySelector('.intro-path-grid')).gridTemplateColumns.split(' ').length})");
    assert.deepEqual(landingMobile, { overflow: false, siteIntroVisible: true, sidebarDisplay: "none", topbarDisplay: "none", pathColumns: 1 });
    // Check both sides of the responsive breakpoint, including the restored
    // capability list and disclaimer that must remain clear of decorative art.
    for (const width of [320, 390, 760, 768, 1024, 1440, 1920]) {
      await command(socket, "Emulation.setDeviceMetricsOverride", { width, height: 960, deviceScaleFactor: 1, mobile: width <= 760 });
      const layout = await evaluate(socket, `(() => {
        const artwork = document.querySelector('.intro-philosophy-capability').getBoundingClientRect();
        const textOverlapsArtwork = [...document.querySelectorAll('.intro-outcome .intro-section-head h3, .intro-outcome .intro-section-head > p, .intro-outcome .intro-outcome-list, .intro-outcome .intro-boundary')].some(element => {
          const text = element.getBoundingClientRect();
          return text.left < artwork.right - 1 && text.right > artwork.left + 1 && text.top < artwork.bottom - 1 && text.bottom > artwork.top + 1;
        });
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          textOverlapsArtwork,
          entryButtonsFit: [...document.querySelectorAll('.intro-path-action')].every(button => {
            const rect = button.getBoundingClientRect(); return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth + 1;
          }) };
      })()`);
      assert.ok(layout.scrollWidth <= layout.width + 1, `${width}px landing horizontal overflow: ${JSON.stringify(layout)}`);
      assert.equal(layout.entryButtonsFit, true, `${width}px course entry button outside viewport`);
      if (width <= 760) assert.equal(layout.textOverlapsArtwork, false, `${width}px philosophy text overlaps stones: ${JSON.stringify(layout)}`);
    }
    const retainedDisclosures = await evaluate(socket, `(() => {
      const research = document.querySelector('.intro-research-details');
      const readingLinks = [...document.querySelectorAll('#explore-go .intro-explore-links a')];
      const capabilityList = document.querySelector('#intro-outcome .intro-outcome-list');
      const boundary = document.querySelector('#intro-outcome .intro-boundary');
      research.open = true;
      const result = { visible: research.getBoundingClientRect().height > 0, researchOutsideFaq: !research.closest('#faq'),
        sourceLinks: research.querySelectorAll('.intro-source-grid a').length,
        researchReadingLinks: research.querySelectorAll('.intro-explore-links a').length,
        readingDestinations: readingLinks.map(link => link.getAttribute('href')),
        readingVisible: readingLinks.every(link => link.getBoundingClientRect().height > 0 && !link.closest('details')),
        uniqueReadingGroup: document.querySelectorAll('.intro-explore-links').length === 1,
        capabilityItems: capabilityList.children.length,
        capabilityVisible: capabilityList.getBoundingClientRect().height > 0 && !capabilityList.closest('details'),
        boundaryVisible: boundary.getBoundingClientRect().height > 0 && !boundary.closest('details'),
        boundaryKeepsLimit: boundary.textContent.includes('目前不能換算') && boundary.textContent.includes('本站尚未做外部棋力對照與真人校準'),
        freshStatusHidden: document.querySelector('#core-entry-status').hidden };
      research.open = false; return result;
    })()`);
    assert.deepEqual(retainedDisclosures, { visible: true, researchOutsideFaq: true, sourceLinks: 9, researchReadingLinks: 0,
      readingDestinations: ["history.html", "math.html", "global-go-observatory.html"], readingVisible: true,
      uniqueReadingGroup: true, capabilityItems: 3, capabilityVisible: true, boundaryVisible: true, boundaryKeepsLimit: true, freshStatusHidden: true });
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    const landingStart = await evaluate(socket, `(() => { document.querySelector('[data-site-intro-start]').click(); return {siteIntroHidden: document.querySelector('#site-introduction').hidden, introOpen: document.querySelector('#lesson-intro-dialog').open, introTitle: document.querySelector('#lesson-intro-title').textContent, hash: location.hash}; })()`);
    assert.deepEqual(landingStart, { siteIntroHidden: true, introOpen: true, introTitle: "現在先學：認識氣", hash: "#core" });
    const steppedDemo = await evaluate(socket, `(() => {
      const before = {
        step: document.querySelector('#teaching-demo-count').textContent,
        caption: document.querySelector('#teaching-demo-caption').textContent,
        previousDisabled: document.querySelector('#teaching-demo-previous').disabled,
        libertyRings: document.querySelectorAll('#teaching-demo-board .demo-liberty').length,
        emphasisRings: document.querySelectorAll('#teaching-demo-board .demo-emphasis').length
      };
      document.querySelector('#teaching-demo-next').click();
      return {
        before,
        after: {
          step: document.querySelector('#teaching-demo-count').textContent,
          caption: document.querySelector('#teaching-demo-caption').textContent,
          libertyRings: document.querySelectorAll('#teaching-demo-board .demo-liberty').length,
          nextLabel: document.querySelector('#teaching-demo-next').textContent
        }
      };
    })()`);
    assert.deepEqual(steppedDemo, {
      before: {step: "第 1 / 2 步", caption: "先看角上的黑棋。棋盤外沒有交叉點，所以不能算氣。", previousDisabled: true, libertyRings: 0, emphasisRings: 1},
      after: {step: "第 2 / 2 步", caption: "只有右邊和下邊兩個盤內空點與它沿線相鄰，所以有 2 口氣；斜對角不算。", libertyRings: 2, nextLabel: "從頭再看 ↺"}
    });
    const demoStructure = await evaluate(socket, `({
      captionNodes: document.querySelectorAll('#teaching-demo-caption').length,
      duplicateFigureCaptions: document.querySelectorAll('#teaching-demo-board figcaption').length,
      legendText: document.querySelector('#demo-legend').textContent
    })`);
    assert.equal(demoStructure.captionNodes, 1);
    assert.equal(demoStructure.duplicateFigureCaptions, 0);
    assert.match(demoStructure.legendText, /金色小圈/);
    assert.match(demoStructure.legendText, /金色大圈/);
    assert.doesNotMatch(demoStructure.legendText, /紅叉|藍框/);

    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 320, height: 812, deviceScaleFactor: 1, mobile: true });
    const shortTalkNarrow = await evaluate(socket, `(() => {
      const dialog = document.querySelector('#lesson-intro-dialog');
      const stage = document.querySelector('.teaching-demo-stage');
      const board = document.querySelector('#teaching-demo-board');
      dialog.scrollTop = dialog.scrollHeight;
      const dialogRect = dialog.getBoundingClientRect();
      const startRect = document.querySelector('#lesson-intro-start-button').getBoundingClientRect();
      return {
        open: dialog.open,
        columns: getComputedStyle(stage).gridTemplateColumns.split(/\\s+/).filter(Boolean).length,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        dialogOverflow: dialog.scrollWidth > dialog.clientWidth + 1,
        boardOverflow: board.scrollWidth > board.clientWidth + 1,
        ctaReachable: startRect.bottom <= dialogRect.bottom + 2
      };
    })()`);
    assert.deepEqual(shortTalkNarrow, { open: true, columns: 1, pageOverflow: false, dialogOverflow: false, boardOverflow: false, ctaReachable: true });

    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    const shortTalkZoom = await evaluate(socket, `(async () => {
      document.documentElement.style.fontSize = '32px';
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const dialog = document.querySelector('#lesson-intro-dialog');
      const result = {
        open: dialog.open,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        dialogOverflow: dialog.scrollWidth > dialog.clientWidth + 1
      };
      document.documentElement.style.fontSize = '';
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return result;
    })()`);
    assert.deepEqual(shortTalkZoom, { open: true, pageOverflow: false, dialogOverflow: false });
    const started = await evaluate(socket, `(async () => { document.querySelector('#lesson-intro-start-button').click(); await new Promise((resolve) => requestAnimationFrame(() => resolve())); return {introOpen: document.querySelector('#lesson-intro-dialog').open, label: document.querySelector('#resume-button').textContent, focused: document.activeElement.id, activeFlow: document.querySelector('.learning-steps li.active')?.id || null, task: document.querySelector('#sidebar-current-task-label').textContent, phase: document.querySelector('#sidebar-question-phase').textContent, stage: document.querySelector('#learning-stage-badge').textContent, seen: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).seenLessonIntros, takeawayHidden: document.querySelector('.takeaway').hidden}; })()`);
    assert.deepEqual(started, { introOpen: false, label: "前往目前題目", focused: "question-prompt", activeFlow: null, task: "練習", phase: "自己判斷", stage: "目前任務：練習 · 本題：自己判斷", seen: [0], takeawayHidden: true });
    const domDocument = await command(socket, "DOM.getDocument");
    const statusDomNode = await command(socket, "DOM.querySelector", { nodeId: domDocument.root.nodeId, selector: "#learning-stage-badge" });
    const statusDescription = await command(socket, "DOM.describeNode", { nodeId: statusDomNode.nodeId });
    const desktopStatusAx = await command(socket, "Accessibility.getPartialAXTree", { backendNodeId: statusDescription.node.backendNodeId, fetchRelatives: false });
    assert.equal(desktopStatusAx.nodes[0].ignored, false);
    assert.equal(desktopStatusAx.nodes[0].role.value, "status");
    const flowDialog = await evaluate(socket, `(() => { const inlineFlow = document.querySelector('.content-wrap .learning-flow'); document.querySelector('#learning-flow-button').click(); const dialog = document.querySelector('#learning-flow-dialog'); const result = {inlineFlow: Boolean(inlineFlow), open: dialog.open, title: document.querySelector('#learning-flow-title').textContent, note: document.querySelector('.learning-flow-head > p').textContent, stepLabels: [...document.querySelectorAll('.learning-steps strong')].map((node) => node.textContent), progressMarkers: document.querySelectorAll('.learning-steps li.active, .learning-steps li.passed, .learning-steps [aria-current]').length}; document.querySelector('#learning-flow-close-button').click(); return {...result, closed: !dialog.open}; })()`);
    assert.deepEqual(flowDialog, { inlineFlow: false, open: true, title: "從理解概念，到在棋局裡用得出來", note: "這是可能反覆使用的方法，不是每題都要依序走完的目前進度；當下任務與本題狀態請看題目上方。", stepLabels: ["理解概念", "獨立作答", "比較與修正", "隔時再判", "局面應用"], progressMarkers: 0, closed: true });
    let courseShape = await evaluate(socket, "({units: document.querySelector('#unit-select').options.length, shownUnits: document.querySelectorAll('.nav-unit').length, lessons: document.querySelectorAll('[data-lesson]').length, toolDescriptions: document.querySelectorAll('.tool-item p').length, advancedTrainingLink: document.querySelector('a[href=\"advanced.html\"]')?.textContent, r1LinkAbsent: document.querySelector('a[href=\"r1-review.html\"]') === null, contextBars: document.querySelectorAll('.lesson-context-bar').length, advancedClosed: !document.querySelector('#advanced-tools').open, advancedLabel: document.querySelector('#advanced-tools summary').textContent.trim(), rawBackupHint: document.querySelector('#export-events-button').nextElementSibling.textContent})");
    assert.deepEqual(courseShape, { units: 15, shownUnits: 1, lessons: 3, toolDescriptions: 9, advancedTrainingLink: "進階訓練", r1LinkAbsent: true, contextBars: 1, advancedClosed: true, advancedLabel: "進階設定與資料 通常不需要現在處理", rawBackupHint: "下載 Core、固定應用探測、局部復盤與實戰的可重算 JSON；獨立進階訓練請到「進階訓練」頁另行匯出。請自行妥善保存，不需要每天匯出。" });
    const advancedTools = await evaluate(socket, `(() => { const section = document.querySelector('#advanced-tools'); section.open = true; const visible = section.offsetHeight > 0 && getComputedStyle(section).display !== 'none'; const labels = [...section.querySelectorAll('.tool-item button')].map((button) => button.textContent.trim()); section.open = false; return {visible, labels, closed: !section.open}; })()`);
    assert.deepEqual(advancedTools, { visible: true, labels: ["七天流程試行", "匯出學習摘要", "備份核心與實戰資料"], closed: true });
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
    assert.match(finalLessonDemo.after.caption, /比較原棋譜著手|候選方向/);
    const reproducedTextTask = await evaluate(socket, `(() => {
      const select = document.querySelector('#unit-select');
      select.value = '8';
      select.dispatchEvent(new Event('change', {bubbles:true}));
      document.querySelector('[data-lesson="12"]').click();
      const intro = document.querySelector('#lesson-intro-dialog');
      if (intro.open) document.querySelector('#lesson-intro-start-button').click();
      return {id: GoContent.problems.find((item) => item.title === document.querySelector('#question-title').textContent)?.id, title: document.querySelector('#question-title').textContent};
    })()`);
    assert.deepEqual(reproducedTextTask, {id:"u9-01", title:"死活不是猜圖"});
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    const textTaskLayout = await evaluate(socket, `(() => {
      const grid = document.querySelector('.practice-grid');
      const wrap = document.querySelector('.content-wrap');
      const sidebar = document.querySelector('.sidebar');
      const sectionHead = document.querySelector('.section-head');
      const titleRow = document.querySelector('.title-row');
      const context = document.querySelector('.lesson-context-bar');
      const question = document.querySelector('.question-card');
      const answer = document.querySelector('.answer-card');
      const aside = document.querySelector('.workspace-aside');
      const rect = (node) => { const value = node.getBoundingClientRect(); return {top:value.top,bottom:value.bottom,left:value.left,right:value.right,width:value.width}; };
      const typeCounts = GoContent.problems.reduce((counts, problem) => { counts[problem.type] = (counts[problem.type] || 0) + 1; return counts; }, {});
      const textChoiceCount = GoContent.problems.filter((problem) => problem.type === 'choice' && problem.stones.length === 0).length;
      const wrapStyle = getComputedStyle(wrap);
      const titleStyle = getComputedStyle(titleRow);
      const contextStyle = getComputedStyle(context);
      const activeTask = document.querySelector('.sidebar-current-task');
      const option = document.querySelector('.option-button');
      return {
        isTextPractice: grid.classList.contains('text-practice'),
        sidebar: rect(sidebar), wrap: rect(wrap), grid: rect(grid), sectionHead: rect(sectionHead), titleRow: rect(titleRow), context: rect(context), question: rect(question), answer: rect(answer),
        cueInContext: context.contains(document.querySelector('#learning-now-summary')),
        cueInQuestion: question.contains(document.querySelector('#learning-now-summary')),
        spacing: {
          contentPaddingTop: parseFloat(wrapStyle.paddingTop),
          titleMarginTop: parseFloat(titleStyle.marginTop),
          titleMarginBottom: parseFloat(titleStyle.marginBottom),
          contextPaddingTop: parseFloat(contextStyle.paddingTop),
          contextPaddingBottom: parseFloat(contextStyle.paddingBottom),
          contextMarginBottom: parseFloat(contextStyle.marginBottom)
        },
        palette: {
          canvas: getComputedStyle(document.querySelector('.main-content')).backgroundColor,
          question: getComputedStyle(question).backgroundColor,
          answer: getComputedStyle(answer).backgroundColor,
          currentTask: activeTask ? getComputedStyle(activeTask).backgroundColor : null,
          optionBorder: option ? getComputedStyle(option).borderTopColor : null,
          focusAccent: getComputedStyle(document.documentElement).getPropertyValue('--focus-accent').trim()
        },
        asideHidden: aside.hidden && getComputedStyle(aside).display === 'none',
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        typeCounts,
        textChoiceCount
      };
    })()`);
    assert.equal(textTaskLayout.isTextPractice, true);
    assert.ok(textTaskLayout.sidebar.width > 304, `桌面左欄必須比公開舊版 304px 更寬：${JSON.stringify(textTaskLayout)}`);
    assert.equal(textTaskLayout.asideHidden, true, `純文字題不得再顯示孤立的進階工具卡：${JSON.stringify(textTaskLayout)}`);
    assert.equal(textTaskLayout.cueInContext, false, `題卡內容不得移入外部學習提示列：${JSON.stringify(textTaskLayout)}`);
    assert.equal(textTaskLayout.cueInQuestion, true, `目前任務提示應維持在 Question 題卡內：${JSON.stringify(textTaskLayout)}`);
    assert.deepEqual(textTaskLayout.spacing, {contentPaddingTop:30,titleMarginTop:10,titleMarginBottom:20,contextPaddingTop:12,contextPaddingBottom:12,contextMarginBottom:20});
    assert.deepEqual(textTaskLayout.palette, {
      canvas:"rgb(244, 245, 239)",
      question:"rgb(255, 255, 255)",
      answer:"rgb(247, 250, 247)",
      currentTask:"rgb(255, 243, 220)",
      optionBorder:"rgb(113, 132, 119)",
      focusAccent:"#a86a10"
    });
    for (const name of ['sectionHead', 'titleRow', 'context', 'grid', 'question', 'answer']) {
      assert.ok(Math.abs(textTaskLayout[name].left - textTaskLayout.question.left) <= 1 && Math.abs(textTaskLayout[name].right - textTaskLayout.question.right) <= 1, `純文字題 ${name} 未與 Question 共用寬度基準：${JSON.stringify(textTaskLayout)}`);
    }
    const leftGap = textTaskLayout.question.left - textTaskLayout.wrap.left;
    const rightGap = textTaskLayout.wrap.right - textTaskLayout.question.right;
    assert.ok(Math.abs(leftGap - rightGap) <= 1, `純文字作答欄未在主要內容區置中：${JSON.stringify({leftGap,rightGap,textTaskLayout})}`);
    assert.ok(Math.abs(textTaskLayout.question.left - textTaskLayout.answer.left) <= 1 && Math.abs(textTaskLayout.question.right - textTaskLayout.answer.right) <= 1, `純文字題 Question／Response 未對齊：${JSON.stringify(textTaskLayout)}`);
    assert.ok(textTaskLayout.grid.width >= 900 && textTaskLayout.grid.width <= 960, `純文字題寬度不符候選契約：${JSON.stringify(textTaskLayout)}`);
    assert.equal(textTaskLayout.overflow, false);
    assert.deepEqual(textTaskLayout.typeCounts, {count:4, connect:5, move:19, choice:68, spot:10});
    assert.equal(textTaskLayout.textChoiceCount, 68);
    if (screenshotDirectory) {
      const textTaskDesktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-text-choice-desktop.png"), Buffer.from(textTaskDesktop.data, "base64"));
    }
    await evaluate(socket, "(() => { const select = document.querySelector('#unit-select'); select.value = '0'; select.dispatchEvent(new Event('change', {bubbles: true})); document.querySelector('[data-lesson=\"0\"]').click(); })()");
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    const desktopTaskBefore = await evaluate(socket, `(async () => {
      scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const ids = ['question-prompt', 'board-card', 'answer-area', 'hint-button', 'next-button'];
      const rects = Object.fromEntries(ids.map((id) => { const rect = document.getElementById(id).getBoundingClientRect(); return [id, {top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right}]; }));
      const withinViewport = Object.values(rects).every((rect) => rect.top >= -1 && rect.bottom <= innerHeight + 1 && rect.left >= -1 && rect.right <= innerWidth + 1);
      return {withinViewport, rects, nextHidden: document.querySelector('#next-button').hidden, scrollY, width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth};
    })()`);
    assert.equal(desktopTaskBefore.withinViewport, true, `1440×900 首答前核心操作未同屏：${JSON.stringify(desktopTaskBefore)}`);
    assert.ok(desktopTaskBefore.scrollWidth <= desktopTaskBefore.width + 1, `1440×900 工作區水平溢位：${JSON.stringify(desktopTaskBefore)}`);
    assert.equal(desktopTaskBefore.nextHidden, true, `首答前不得顯示不可用的下一題：${JSON.stringify(desktopTaskBefore)}`);
    assert.equal(desktopTaskBefore.scrollY, 0);
    let response = await evaluate(socket, `document.querySelector('[data-answer="4"]').click(); (() => { const feedback = document.querySelector('#feedback'); return {feedback: feedback.textContent, feedbackClass: feedback.className, feedbackTitle: feedback.querySelector('.feedback-title')?.textContent, feedbackBadge: feedback.querySelector('.feedback-badge')?.textContent, explanation: feedback.querySelector('.answer-explanation')?.textContent, takeawayHidden: document.querySelector('.takeaway').hidden, nextDisabled: document.querySelector('#next-button').disabled, progress: document.querySelector('#progress-count').textContent, task: document.querySelector('#sidebar-current-task-label').textContent, phase: document.querySelector('#sidebar-question-phase').textContent, stage: document.querySelector('#learning-stage-badge').textContent}; })()`);
    const desktopTaskAfter = await evaluate(socket, `(() => {
      const ids = ['board-card', 'feedback', 'next-button'];
      const rects = Object.fromEntries(ids.map((id) => { const rect = document.getElementById(id).getBoundingClientRect(); return [id, {top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right}]; }));
      return {withinViewport: Object.values(rects).every((rect) => rect.top >= -1 && rect.bottom <= innerHeight + 1 && rect.left >= -1 && rect.right <= innerWidth + 1), nextHidden: document.querySelector('#next-button').hidden, rects, scrollY};
    })()`);
    assert.equal(desktopTaskAfter.withinViewport, true, `1440×900 首答後回饋／下一步未同屏：${JSON.stringify(desktopTaskAfter)}`);
    assert.equal(desktopTaskAfter.nextHidden, false, `有效作答後必須顯示下一題：${JSON.stringify(desktopTaskAfter)}`);
    assert.ok(Math.abs(desktopTaskAfter.rects['feedback'].left - desktopTaskAfter.rects['next-button'].left) <= 1, `首答後下一題應固定在回饋左基準：${JSON.stringify(desktopTaskAfter)}`);
    assert.equal(desktopTaskAfter.scrollY, 0, `作答後不應要求額外捲動：${JSON.stringify(desktopTaskAfter)}`);
    if (screenshotDirectory) {
      const answeredDesktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-answered-desktop.png"), Buffer.from(answeredDesktop.data, "base64"));
    }
    assert.match(response.feedback, /答對了/);
    assert.match(response.feedbackClass, /answer-result/);
    assert.match(response.feedbackClass, /success/);
    assert.equal(response.feedbackTitle, "答對了");
    assert.equal(response.feedbackBadge, "✓");
    assert.ok(response.explanation.length > 0);
    assert.equal(response.takeawayHidden, false);
    assert.equal(response.task, "練習");
    assert.equal(response.phase, "比較理由");
    assert.equal(response.stage, "目前任務：練習 · 本題：比較理由");
    const stateAfterCorrect = await evaluate(socket, "localStorage.getItem('go-learning-prototype-v7')");
    const wrongPhase = await evaluate(socket, `(() => {
      document.querySelector('[data-lesson="0"]').click();
      document.querySelector('[data-answer="3"]').click();
      return {
        task: document.querySelector('#sidebar-current-task-label').textContent,
        phase: document.querySelector('#sidebar-question-phase').textContent,
        stage: document.querySelector('#learning-stage-badge').textContent,
        feedback: document.querySelector('#feedback').textContent
      };
    })()`);
    assert.deepEqual({task:wrongPhase.task, phase:wrongPhase.phase, stage:wrongPhase.stage}, {task:"練習", phase:"修正重算", stage:"目前任務：練習 · 本題：修正重算"});
    assert.match(wrongPhase.feedback, /答錯，再看一次/);
    if (screenshotDirectory) {
      await evaluate(socket, "scrollTo(0, 0)");
      const wrongDesktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-wrong-desktop.png"), Buffer.from(wrongDesktop.data, "base64"));
    }
    const correctedPhase = await evaluate(socket, `(() => {
      document.querySelector('[data-answer="4"]').click();
      return {
        task: document.querySelector('#sidebar-current-task-label').textContent,
        phase: document.querySelector('#sidebar-question-phase').textContent,
        stage: document.querySelector('#learning-stage-badge').textContent
      };
    })()`);
    assert.deepEqual(correctedPhase, {task:"練習", phase:"完成修正", stage:"目前任務：練習 · 本題：完成修正"});
    if (screenshotDirectory) {
      await evaluate(socket, "scrollTo(0, 0)");
      const correctedDesktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-corrected-desktop.png"), Buffer.from(correctedDesktop.data, "base64"));
    }
    await evaluate(socket, `localStorage.setItem('go-learning-prototype-v7', ${JSON.stringify(stateAfterCorrect)})`);
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#sidebar-question-phase')?.textContent === '自己判斷'")) break;
      await delay(100);
    }
    assert.equal(await evaluate(socket, "document.querySelector('#sidebar-question-phase').textContent"), "自己判斷");
    await evaluate(socket, "document.querySelector('[data-answer=\"4\"]').click()");
    assert.equal(await evaluate(socket, "document.querySelector('#sidebar-question-phase').textContent"), "比較理由");
    assert.equal(response.nextDisabled, false);
    assert.equal(response.progress, "1 / 106");
    assert.equal(await evaluate(socket, "document.querySelector('.learning-steps li.active')?.id || null"), null);
    assert.equal(await evaluate(socket, "document.querySelectorAll('.learning-steps li.passed, .learning-steps [aria-current]').length"), 0);
    const nextQuestion = await evaluate(socket, `(() => { document.querySelector('#next-button').click(); return {title: document.querySelector('#question-title').textContent, focused: document.activeElement.id}; })()`);
    assert.deepEqual(nextQuestion, { title: "邊上的一顆棋", focused: "question-prompt" });
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
      const feedback = document.querySelector('#feedback');
      return {before, afterMove, feedback: feedback.textContent, feedbackClass: feedback.className, feedbackTitle: feedback.querySelector('.feedback-title')?.textContent, feedbackBadge: feedback.querySelector('.feedback-badge')?.textContent, nextDisabled: document.querySelector('#next-button').disabled, hintDisabled: document.querySelector('#hint-button').disabled, missed: document.querySelector('#review-count').textContent};
    })()`);
    assert.deepEqual(response.before, { points: 81, tabbable: 1, x: "4", y: "4", label: "第 5 行第 5 列，白棋，已有棋子" });
    assert.deepEqual(response.afterMove, { x: "5", y: "5", label: "第 6 行第 6 列，空點，可落子", tabbable: 1 });
    assert.match(response.feedback, /再試一次/);
    assert.match(response.feedbackClass, /answer-result/);
    assert.match(response.feedbackClass, /error/);
    assert.equal(response.feedbackTitle, "答錯，再看一次");
    assert.equal(response.feedbackBadge, "×");
    assert.equal(response.nextDisabled, true);
    assert.equal(response.hintDisabled, false);
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
    assert.ok(captureEvents.every((event) => event.uiVersion === "learner-workspace-v70"));
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
    assert.equal(lifeAndDeath.before.step, "第 1 / 5 步");
    assert.match(lifeAndDeath.before.caption, /三個連成一直線/);
    assert.equal(lifeAndDeath.before.boardPoints, 81);
    assert.equal(lifeAndDeath.after.step, "第 3 / 5 步");
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
    assert.match(notes.text, /指定棋串的一手提子：可比較機會/);
    assert.match(notes.text, /\| .* \| 指定棋串的一手提子 \| 中央提一顆 \| 首次作答 \| 未提示 \| 錯誤 \|/);
    assert.match(notes.text, /## 錯誤修正診斷/);
    assert.match(notes.text, /不代表已確認心理或認知根因/);
    const scheduled = await evaluate(socket, `document.querySelector('#scheduled-practice-button').click(); ({number: document.querySelector('#question-number').textContent, prompt: document.querySelector('#question-prompt').textContent, why: document.querySelector('#learning-why').textContent})`);
    assert.match(scheduled.number, /固定方案/);
    assert.match(scheduled.prompt, /輪到黑棋/);
    assert.match(scheduled.why, /安排一題新練習|已到複習時間/);
    assert.equal(await evaluate(socket, "document.querySelector('.learning-steps li.active')?.id || null"), null);
    await evaluate(socket, `(() => { const key = 'go-learning-prototype-v7'; const saved = JSON.parse(localStorage.getItem(key)); const id = saved.scheduler.selections.at(-1).problemId; saved.scheduler.reviews[id] = {stage: 0, dueAt: 0, scheduledBy: 'fixed-spacing-v1'}; localStorage.setItem(key, JSON.stringify(saved)); return id; })()`);
    await command(socket, "Page.reload");
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "Boolean(document.querySelector('#due-review-button')?.getAttribute('aria-label'))")) break;
      await delay(100);
    }
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    const mobileDomDocument = await command(socket, "DOM.getDocument");
    const mobileStatusDomNode = await command(socket, "DOM.querySelector", { nodeId: mobileDomDocument.root.nodeId, selector: "#learning-stage-badge" });
    const mobileStatusDescription = await command(socket, "DOM.describeNode", { nodeId: mobileStatusDomNode.nodeId });
    const mobileStatusAx = await command(socket, "Accessibility.getPartialAXTree", { backendNodeId: mobileStatusDescription.node.backendNodeId, fetchRelatives: false });
    assert.equal(mobileStatusAx.nodes[0].ignored, false);
    assert.equal(mobileStatusAx.nodes[0].role.value, "status");
    const mobileReturnReview = await evaluate(socket, `(() => {
      const due = document.querySelector('#due-review-button');
      const nav = document.querySelector('#course-navigation');
      const toggle = document.querySelector('#course-nav-toggle');
      const resume = document.querySelector('#resume-button');
      const status = document.querySelector('#learning-stage-badge');
      return {
        dueVisible: !due.hidden && getComputedStyle(due).display !== 'none',
        dueCount: document.querySelector('#due-review-count').textContent,
        navCollapsed: getComputedStyle(nav).display === 'none' && toggle.getAttribute('aria-expanded') === 'false',
        resumeVisible: !resume.hidden && getComputedStyle(resume).display !== 'none',
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        statusVisible: getComputedStyle(status).display !== 'none',
        statusRole: status.getAttribute('role'),
        statusLive: status.getAttribute('aria-live'),
        taskStatusRegions: document.querySelectorAll('#learning-stage-badge[role="status"]').length
      };
    })()`);
    assert.deepEqual(mobileReturnReview, { dueVisible: true, dueCount: "1", navCollapsed: true, resumeVisible: true, overflow: false, statusVisible: true, statusRole: "status", statusLive: "polite", taskStatusRegions: 1 });
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    const dueReview = await evaluate(socket, `(() => { const button = document.querySelector('#due-review-button'); const before = {hidden: button.hidden, count: document.querySelector('#due-review-count').textContent, label: button.getAttribute('aria-label')}; button.click(); return {...before, number: document.querySelector('#question-number').textContent, stage: document.querySelector('#learning-stage-badge').textContent}; })()`);
    assert.equal(dueReview.hidden, false);
    assert.equal(dueReview.count, "1");
    assert.match(dueReview.label, /1 題到期複習/);
    assert.match(dueReview.number, /間隔練習/);
    assert.equal(dueReview.stage, "目前任務：到期複習 · 本題：重新判斷");
    assert.equal(await evaluate(socket, "document.querySelector('#sidebar-current-task-label').textContent"), "到期複習");
    await delay(30);
    assert.equal(await evaluate(socket, "document.activeElement.id"), "question-prompt");
    const phase4 = await evaluate(socket, `document.querySelector('#tools-menu').open = true; document.querySelector('#application-button').click(); const application = {number: document.querySelector('#question-number').textContent, tag: document.querySelector('#question-tag').textContent, why: document.querySelector('#learning-why').textContent, task: document.querySelector('#sidebar-current-task-label').textContent, toolsClosed: !document.querySelector('#tools-menu').open, focused: document.activeElement.id}; document.querySelector('[data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); document.querySelector('#sample-sgf-button').click(); const picker = {open: document.querySelector('#sgf-picker-dialog').open, choices: document.querySelector('#sgf-picker-move').options.length}; document.querySelector('#sgf-picker-confirm-button').click(); const candidate = document.querySelector('#sgf-candidate-input'); const reason = document.querySelector('#sgf-reason-input'); const expectedResponse = document.querySelector('#sgf-opponent-response-input'); candidate.value = '第 5 行第 5 列'; reason.value = '先確認中央氣數'; expectedResponse.value = '預期白棋會先補氣'; document.querySelector('#sgf-reflection-save-button').click(); const local = {number: document.querySelector('#question-number').textContent, player: document.querySelector('#player-color').textContent, status: document.querySelector('#sgf-reflection-status').textContent}; document.querySelector('[data-x="4"][data-y="5"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); document.querySelector('#sgf-review-status-input').value = 'original_confirmed'; document.querySelector('#sgf-acceptable-answer-input').value = '人工複盤確認原棋譜著手可接受'; document.querySelector('#sgf-review-save-button').click(); const review = document.querySelector('#sgf-review-status').textContent; ({application, picker, local, review, feedback: document.querySelector('#feedback').textContent})`);
    assert.match(phase4.application.number, /局面應用練習/);
    assert.equal(phase4.application.tag, "局面應用練習");
    assert.match(phase4.application.why, /固定局面應用練習/);
    assert.equal(phase4.application.task, "局面應用");
    assert.equal(phase4.application.toolsClosed, true);
    assert.equal(phase4.application.focused, "question-prompt");
    assert.deepEqual(phase4.picker, {open: true, choices: 1});
    assert.equal(await evaluate(socket, "document.querySelector('.learning-steps li.active')?.id || null"), null);
    assert.match(phase4.local.number, /棋譜單點復盤/);
    assert.equal(phase4.local.player, "● 黑棋");
    assert.match(phase4.local.status, /作答前保存/);
    assert.match(phase4.review, /已確認原棋譜著手可接受/);
    assert.match(phase4.feedback, /與原棋譜一致/);
    const localSgfExport = await evaluate(socket, `(async () => { URL.createObjectURL = (blob) => { window.__localSgfBlob = blob; return 'blob:local-sgf'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function () { window.__localSgfName = this.download; }; document.querySelector('#sgf-export-button').click(); return {name: window.__localSgfName, text: await window.__localSgfBlob.text()}; })()`);
    assert.match(localSgfExport.name, /^局部復盤_sgf-[0-9a-f]{8}_第1手\.sgf$/);
    assert.match(localSgfExport.text, /^\(;GM\[1\]FF\[4\]CA\[UTF-8\]SZ\[9\]AB/);
    assert.match(localSgfExport.text, /預期對方應手：預期白棋會先補氣/);
    assert.match(await evaluate(socket, "document.querySelector('#sgf-export-help').textContent"), /可用 KaTrain 開啟/);
    const evaluation = await evaluate(socket, `document.querySelector('#evaluation-button').click(); const preflight = {open: document.querySelector('#evaluation-dialog').open, text: document.querySelector('#evaluation-dialog').textContent}; document.querySelector('#evaluation-confirm-button').click(); const evaluationMeta = {number: document.querySelector('#question-number').textContent, tag: document.querySelector('#question-tag').textContent, hintDisabled: document.querySelector('#hint-button').disabled, stage: document.querySelector('#learning-stage-badge').textContent, guidance: document.querySelector('#learning-now').textContent}; document.querySelector('[data-x="8"][data-y="8"]').dispatchEvent(new MouseEvent('click', {bubbles:true})); ({preflight, ...evaluationMeta, feedback: document.querySelector('#feedback').textContent, progress: document.querySelector('#progress-count').textContent, missed: document.querySelector('#review-count').textContent})`);
    assert.equal(evaluation.preflight.open, true);
    assert.match(evaluation.preflight.text, /每題只記第一次作答/);
    assert.match(evaluation.preflight.text, /已在舊 R1 自我審查中看過/);
    assert.match(evaluation.number, /個人流程試行.*第一次/);
    assert.equal(evaluation.tag, "無提示流程試行");
    assert.equal(evaluation.hintDisabled, true);
    assert.equal(evaluation.stage, "目前任務：練習 · 本題：自己判斷");
    assert.match(evaluation.guidance, /已看過題目的無提示首答/);
    assert.match(evaluation.feedback, /完成整批前不顯示正誤/);
    assert.equal(evaluation.progress, "7 / 106");
    assert.equal(evaluation.missed, "0");
    const rawEvents = await evaluate(socket, `(async () => { URL.createObjectURL = (blob) => { window.__rawEventBlob = blob; return 'blob:captured'; }; document.querySelector('#export-events-button').click(); return JSON.parse(await window.__rawEventBlob.text()); })()`);
    assert.equal(rawEvents.eventPolicyVersion, "trial-events-v4");
    assert.equal(rawEvents.uiVersion, "learner-workspace-v70");
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
    assert.equal(rawEvents.applicationResults[0].uiVersion, "learner-workspace-v70");
    assert.equal(rawEvents.trial.answers.length, 1);
    assert.equal(rawEvents.trial.answers[0].uiVersion, "learner-workspace-v70");
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
    await evaluate(socket, "document.querySelector('[data-site-intro-start]').click()");
    assert.equal(await evaluate(socket, "document.querySelector('#lesson-intro-dialog').open"), true);
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
    assert.deepEqual(lessonTransition.opening, {lesson: "逃出打吃", stage: "目前任務：課程 · 本題：先看懂", focused: "lesson-intro-title", introOpen: true});
    assert.match(lessonTransition.boundaryButton, /進入第 2 單元短講/);
    assert.equal(lessonTransition.nextLesson, "辨認棋串");
    assert.equal(lessonTransition.nextQuestion, "左右相鄰");
    assert.equal(lessonTransition.nextStage, "目前任務：課程 · 本題：先看懂");
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
    assert.deepEqual(restoredLessonIntro, {lesson: "辨認棋串", stage: "目前任務：課程 · 本題：先看懂", guidance: "先看本課短講，再用棋盤示範確認要觀察的變化。", pending: true, introOpen: true});
    const seenAfterDismiss = await evaluate(socket, `(() => {
      document.querySelector('#lesson-intro-start-button').click();
      document.querySelector('[data-lesson="4"]').click();
      const autoLabel = document.querySelector('#lesson-intro-dismiss-button').textContent;
      document.querySelector('#lesson-intro-dismiss-button').click();
      document.querySelector('[data-lesson="4"]').click();
      const repeatedOpen = document.querySelector('#lesson-intro-dialog').open;
      document.querySelector('#lesson-intro-button').click();
      const manualLabel = document.querySelector('#lesson-intro-dismiss-button').textContent;
      document.querySelector('#teaching-demo-next').click();
      document.querySelector('#lesson-intro-dismiss-button').click();
      document.querySelector('#lesson-intro-button').click();
      const resetStep = document.querySelector('#teaching-demo-count').textContent;
      document.querySelector('#lesson-intro-dismiss-button').click();
      return {seen: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).seenLessonIntros, autoLabel, repeatedOpen, manualLabel, resetStep};
    })()`);
    assert.equal(seenAfterDismiss.autoLabel, "先跳過");
    assert.equal(seenAfterDismiss.repeatedOpen, false);
    assert.equal(seenAfterDismiss.manualLabel, "關閉");
    assert.equal(seenAfterDismiss.resetStep, "第 1 / 2 步");
    assert.ok(seenAfterDismiss.seen.includes(4));

    const manualCloseFocus = await evaluate(socket, `(() => {
      document.querySelector('#lesson-intro-button').click();
      document.querySelector('#lesson-intro-dismiss-button').click();
      return {open: document.querySelector('#lesson-intro-dialog').open, focused: document.activeElement.id};
    })()`);
    assert.deepEqual(manualCloseFocus, {open: false, focused: "lesson-intro-button"});

    const manualStartFocus = await evaluate(socket, `(() => {
      document.querySelector('#lesson-intro-button').click();
      document.querySelector('#lesson-intro-start-button').click();
      return {open: document.querySelector('#lesson-intro-dialog').open, focused: document.activeElement.id};
    })()`);
    assert.deepEqual(manualStartFocus, {open: false, focused: "question-prompt"});

    await evaluate(socket, "document.querySelector('#lesson-intro-button').click()");
    await command(socket, "Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await command(socket, "Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await delay(50);
    const manualEscapeFocus = await evaluate(socket, `({open: document.querySelector('#lesson-intro-dialog').open, focused: document.activeElement.id})`);
    assert.deepEqual(manualEscapeFocus, {open: false, focused: "lesson-intro-button"});

    await evaluate(socket, "document.querySelector('[data-lesson=\"5\"]').click()");
    assert.equal(await evaluate(socket, "document.querySelector('#lesson-intro-dialog').open"), true);
    await command(socket, "Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await command(socket, "Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await delay(50);
    const autoEscapeFocus = await evaluate(socket, `({
      open: document.querySelector('#lesson-intro-dialog').open,
      focused: document.activeElement.id,
      seen: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).seenLessonIntros
    })`);
    assert.equal(autoEscapeFocus.open, false);
    assert.equal(autoEscapeFocus.focused, "question-prompt");
    assert.ok(autoEscapeFocus.seen.includes(5));

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
      { index: 39, fromId: "u4-06", fromTitle: "誰先走很重要", fromLesson: 7, toUnit: 5, toLesson: "把一局下完", toQuestion: "9 路盤的用途" },
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
    const typography = await evaluate(socket, `({body: getComputedStyle(document.querySelector('.teaching-card p')).fontSize, topic: getComputedStyle(document.querySelector('.question-topic')).fontSize, prompt: getComputedStyle(document.querySelector('.question-prompt')).fontSize, policy: getComputedStyle(document.querySelector('.answer-policy')).fontSize, heading: getComputedStyle(document.querySelector('.title-row h2')).fontSize, promptLabel: document.querySelector('.question-prompt-label').textContent, contextText: document.querySelector('.question-context').textContent.replace(/\\s+/g,' ').trim(), labelledBy: document.querySelector('.question-card').getAttribute('aria-labelledby'), promptOutline: getComputedStyle(document.querySelector('.question-prompt')).outlineStyle})`);
    assert.ok(parseFloat(typography.prompt) >= 24 && parseFloat(typography.prompt) >= parseFloat(typography.heading) * 1.5, `題目未成為主層級：${JSON.stringify(typography)}`);
    assert.deepEqual({ ...typography, prompt: "readable", heading: "readable" }, { body: "16px", topic: "16px", prompt: "readable", policy: "16px", heading: "readable", promptLabel: "問題", contextText: "觀察題 · 中央的一顆棋", labelledBy: "question-prompt", promptOutline: "none" });
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
      const previousScrollY = await evaluate(socket, "scrollY");
      await evaluate(socket, "scrollTo(0, 0)");
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
      const desktop = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-desktop.png"), Buffer.from(desktop.data, "base64"));
      await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
      const mobileOverflow = await evaluate(socket, "({width: innerWidth, scrollWidth: document.documentElement.scrollWidth})");
      assert.ok(mobileOverflow.scrollWidth <= mobileOverflow.width + 1, `mobile horizontal overflow: ${JSON.stringify(mobileOverflow)}`);
      const mobile = await command(socket, "Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotDirectory, "go-learning-mobile.png"), Buffer.from(mobile.data, "base64"));
      await evaluate(socket, `scrollTo(0, ${previousScrollY})`);
    }
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    const rootUrl = await evaluate(socket, "location.href.split('#')[0]");
    await command(socket, "Page.navigate", { url: rootUrl });
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "Boolean(document.querySelector('#site-introduction') && !document.querySelector('#site-introduction').hidden)")) break;
      await delay(100);
    }
    const returningHome = await evaluate(socket, "({siteIntroVisible: !document.querySelector('#site-introduction').hidden, sidebarDisplay: getComputedStyle(document.querySelector('.sidebar')).display, landingAction: document.querySelector('.intro-hero [data-site-intro-start]').textContent.trim(), coreEntryStatus: document.querySelector('#core-entry-status').textContent, localCoreEntry: document.querySelector('[data-site-intro-unit=\"5\"]').textContent.trim(), globalCoreEntry: document.querySelector('[data-site-intro-unit=\"10\"]').textContent.trim()})");
    assert.equal(returningHome.siteIntroVisible, true);
    assert.equal(returningHome.sidebarDisplay, "none");
    assert.equal(returningHome.landingAction, "繼續核心課程 →");
    assert.match(returningHome.coreEntryStatus, /^上次停在：/);
    assert.equal(returningHome.localCoreEntry, "開始這個單元 →");
    assert.equal(returningHome.globalCoreEntry, "開始這個單元 →");
    const directLocalEntry = await evaluate(socket, `(() => {
      document.querySelector('[data-site-intro-unit="5"]').click();
      return {
        siteIntroHidden: document.querySelector('#site-introduction').hidden,
        hash: location.hash,
        selectedUnit: document.querySelector('#unit-select').value,
        introOpen: document.querySelector('#lesson-intro-dialog').open
      };
    })()`);
    assert.deepEqual(directLocalEntry, { siteIntroHidden: true, hash: "#core", selectedUnit: "5", introOpen: true });
    await command(socket, "Page.navigate", { url: rootUrl });
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "Boolean(document.querySelector('#site-introduction') && !document.querySelector('#site-introduction').hidden)")) break;
      await delay(100);
    }
    const directGlobalEntry = await evaluate(socket, `(() => {
      document.querySelector('[data-site-intro-unit="10"]').click();
      return {
        siteIntroHidden: document.querySelector('#site-introduction').hidden,
        hash: location.hash,
        selectedUnit: document.querySelector('#unit-select').value,
        introOpen: document.querySelector('#lesson-intro-dialog').open
      };
    })()`);
    assert.deepEqual(directGlobalEntry, { siteIntroHidden: true, hash: "#core", selectedUnit: "10", introOpen: true });
    await command(socket, "Page.navigate", { url: rootUrl });
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "Boolean(document.querySelector('#intro-core-course-list [data-site-intro-unit=\"14\"]'))")) break;
      await delay(100);
    }
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const catalogUnitEntry = await evaluate(socket, `(() => {
      const catalog = document.querySelector('#all-courses');
      catalog.querySelector('summary').click();
      const lastUnit = catalog.querySelector('#intro-core-course-list [data-site-intro-unit="14"]');
      lastUnit.scrollIntoView({block: 'center', behavior: 'instant'});
      const rect = lastUnit.getBoundingClientRect();
      const reachable = catalog.open && rect.height > 0 && rect.left >= 0 && rect.right <= innerWidth + 1;
      lastUnit.click();
      return { reachable, siteIntroHidden: document.querySelector('#site-introduction').hidden, hash: location.hash,
        selectedUnit: document.querySelector('#unit-select').value, introOpen: document.querySelector('#lesson-intro-dialog').open,
        lessonTitle: document.querySelector('#lesson-title').textContent };
    })()`);
    assert.deepEqual(catalogUnitEntry, { reachable: true, siteIntroHidden: true, hash: "#core", selectedUnit: "14",
      introOpen: true, lessonTitle: "從一局找到下一個課題" });
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    await command(socket, "Page.navigate", { url: advancedPage });
    let advancedReady = false;
    for (let retry = 0; retry < 30; retry += 1) {
      advancedReady = await evaluate(socket, "Boolean(window.GoAdvancedContent && window.GoAdvancedSequenceEvents && document.querySelector('#advanced-sequence-board [data-seq-x]'))");
      if (advancedReady) break;
      await delay(100);
    }
    assert.equal(advancedReady, true);
    const advancedTaskLanguage = await evaluate(socket, `({
      currentTask: document.querySelector('.task-type-context')?.getAttribute('aria-label'),
      delayedChips: [...document.querySelectorAll('.task-type-chip')].map(node => node.textContent.trim()),
      hasOldFlowCheck: document.body.innerText.includes('流程檢查'),
      hasImmediateBoundary: document.body.innerText.includes('練習與換形再判'),
      hasDelayedBoundary: document.body.innerText.includes('固定間隔的公開延後再判')
    })`);
    assert.deepEqual(advancedTaskLanguage, {
      currentTask: "目前任務：練習",
      delayedChips: ["延後再判", "延後再判"],
      hasOldFlowCheck: false,
      hasImmediateBoundary: true,
      hasDelayedBoundary: true
    });
    const advancedFlow = await evaluate(socket, `(() => {
      const clickPoint = (x, y) => {
        const point = document.querySelector('#advanced-sequence-board [data-seq-x="' + x + '"][data-seq-y="' + y + '"]');
        if (!point) throw new Error('advanced sequence point missing: ' + x + ',' + y);
        point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      };
      const beforeName = document.querySelector('#advanced-sequence-name').textContent;
      const beforeTarget = document.querySelector('#advanced-sequence-target').textContent;
      const variantDisabledBefore = document.querySelector('#advanced-sequence-list [data-sequence-index="4"]').disabled;
      const termsHiddenBefore = document.querySelector('#advanced-sequence-terms').hidden;
      clickPoint(4, 4);
      const afterWrong = document.querySelector('#advanced-sequence-feedback').textContent;
      clickPoint(0, 2);
      const afterFirstCorrect = document.querySelector('#advanced-sequence-feedback').textContent;
      const stepAfterOpponent = document.querySelector('#advanced-sequence-step').textContent;
      clickPoint(0, 2);
      const raw = JSON.parse(localStorage.getItem('go-advanced-sequence-events-v3'));
      return {
        sequenceTabs: document.querySelectorAll('#advanced-sequence-list [data-sequence-index]').length,
        beforeName,
        beforeTarget,
        variantDisabledBefore,
        termsHiddenBefore,
        afterWrong,
        afterFirstCorrect,
        stepAfterOpponent,
        finalFeedback: document.querySelector('#advanced-sequence-feedback').textContent,
        takeawayHidden: document.querySelector('#advanced-sequence-takeaway').hidden,
        revealedName: document.querySelector('#advanced-sequence-name').textContent,
        variantDisabledAfter: document.querySelector('#advanced-sequence-list [data-sequence-index="4"]').disabled,
        nextSeedDisabledAfter: document.querySelector('#advanced-sequence-list [data-sequence-index="1"]').disabled,
        termsHiddenAfter: document.querySelector('#advanced-sequence-terms').hidden,
        eventTypes: raw.events.map((event) => event.type),
        learnerMoves: raw.events.filter((event) => event.type === 'move_first' || event.type === 'move_retry').map((event) => ({type:event.type, step:event.stepIndex, correct:event.correct, firstResponse:event.firstResponse})),
        familyMeta: raw.events.filter((event) => event.type === 'move_first').map((event) => ({familyId:event.familyId, variantId:event.variantId, axes:event.variationAxes}))
      };
    })()`);
    assert.equal(advancedFlow.sequenceTabs, 8);
    assert.equal(advancedFlow.beforeName, "棋盤練習 1");
    assert.match(advancedFlow.beforeTarget, /完整名稱、術語與重點會在走完後揭露/);
    assert.equal(advancedFlow.variantDisabledBefore, true);
    assert.equal(advancedFlow.termsHiddenBefore, true);
    assert.match(advancedFlow.afterWrong, /這手合法，但不是本題預期的下一手/);
    assert.match(advancedFlow.afterFirstCorrect, /白棋依題目中的局部應手/);
    assert.equal(advancedFlow.stepAfterOpponent, "第 2 / 2 步");
    assert.match(advancedFlow.finalFeedback, /這條多手變化已走完/);
    assert.equal(advancedFlow.takeawayHidden, false);
    assert.equal(advancedFlow.revealedName, "倒撲實走：送一子後重新數氣");
    assert.equal(advancedFlow.variantDisabledAfter, true);
    assert.equal(advancedFlow.nextSeedDisabledAfter, false);
    assert.equal(advancedFlow.termsHiddenAfter, false);
    assert.deepEqual(advancedFlow.eventTypes, ["presented", "decision_presented", "move_first", "move_retry", "opponent_move", "decision_presented", "move_first", "completed"]);
    assert.deepEqual(advancedFlow.learnerMoves, [
      {type:"move_first", step:0, correct:false, firstResponse:true},
      {type:"move_retry", step:0, correct:true, firstResponse:false},
      {type:"move_first", step:1, correct:true, firstResponse:true}
    ]);
    assert.deepEqual(advancedFlow.familyMeta, [
      {familyId:"snapback", variantId:"seed", axes:["baseline"]},
      {familyId:"snapback", variantId:"seed", axes:["baseline"]}
    ]);
    const decisionReviewLoaded = await evaluate(socket, `(() => {
      const input = document.querySelector('#decision-review-file');
      const transfer = new DataTransfer();
      transfer.items.add(new File(['(;GM[1]FF[4]SZ[19]RU[Japanese]KM[6.5];B[pd];W[dd];B[qp])'], 'decision-review.sgf', {type:'application/x-go-sgf'}));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', {bubbles:true}));
      return true;
    })()`);
    assert.equal(decisionReviewLoaded, true);
    for (let retry = 0; retry < 30; retry += 1) {
      if (await evaluate(socket, "document.querySelector('#decision-review-move').options.length > 1")) break;
      await delay(100);
    }
    const decisionReview = await evaluate(socket, `(() => {
      const select = document.querySelector('#decision-review-move');
      select.value = '3';
      select.dispatchEvent(new Event('change', {bubbles:true}));
      const point = document.querySelector('#decision-review-board [data-review-x="4"][data-review-y="4"]');
      if (!point) throw new Error('decision review point missing');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      const beforeReveal = document.querySelector('#decision-review-feedback').textContent;
      document.querySelector('#decision-review-reveal').click();
      const raw = JSON.parse(localStorage.getItem('go-advanced-decision-review-events-v1'));
      const candidate = raw.events.find((event) => event.type === 'candidate_first');
      const reveal = raw.events.find((event) => event.type === 'original_revealed');
      return {
        source: document.querySelector('#decision-review-source').textContent,
        beforeReveal,
        afterReveal: document.querySelector('#decision-review-feedback').textContent,
        types: raw.events.map((event) => event.type),
        candidate: {legal:candidate.legal, originalMove:candidate.originalMove, matchesOriginal:candidate.matchesOriginal, exposed:candidate.originalExposed, hasCorrect:Object.prototype.hasOwnProperty.call(candidate,'correct')},
        reveal: {originalMove:reveal.originalMove, matches:reveal.firstCandidateMatchesOriginal, exposed:reveal.originalExposed, hasCorrect:Object.prototype.hasOwnProperty.call(reveal,'correct')},
        reflectionDisabled: document.querySelector('#decision-review-reflection').disabled
      };
    })()`);
    assert.match(decisionReview.source, /decision-review\.sgf/);
    assert.match(decisionReview.beforeReveal, /候選已保存/);
    assert.match(decisionReview.afterReveal, /和原棋譜著手不同|與原棋譜著手不同/);
    assert.match(decisionReview.afterReveal, /不是錯手判定/);
    assert.deepEqual(decisionReview.types, ["review_presented", "candidate_first", "original_revealed"]);
    assert.deepEqual(decisionReview.candidate, {legal:true, originalMove:null, matchesOriginal:null, exposed:false, hasCorrect:false});
    assert.deepEqual(decisionReview.reveal, {originalMove:[16,15], matches:false, exposed:true, hasCorrect:false});
    assert.equal(decisionReview.reflectionDisabled, false);
    const replayQueued = await evaluate(socket, `(() => {
      const button = document.querySelector('#decision-replay-queue');
      if (button.disabled) throw new Error('decision replay queue unexpectedly disabled');
      button.click();
      const raw = JSON.parse(localStorage.getItem('go-advanced-decision-replay-events-v1'));
      const queued = raw.events.find((event) => event.type === 'replay_queued');
      const listButton = document.querySelector('#decision-replay-list [data-replay-id]');
      if (!listButton) throw new Error('decision replay list item missing');
      listButton.click();
      const point = document.querySelector('#decision-replay-board [data-replay-x="4"][data-replay-y="4"]');
      if (!point) throw new Error('decision replay point missing');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      const beforeReveal = document.querySelector('#decision-replay-feedback').textContent;
      document.querySelector('#decision-replay-reveal').click();
      const replayRaw = JSON.parse(localStorage.getItem('go-advanced-decision-replay-events-v1'));
      const first = replayRaw.events.find((event) => event.type === 'replay_candidate_first');
      const reveal = replayRaw.events.find((event) => event.type === 'replay_original_revealed');
      return {
        queueText: button.textContent,
        queued: {
          exposure: queued.sourceExposure,
          transfer: queued.transferLevel,
          formal: queued.formalEligible,
          originalExposed: queued.sourceOriginalExposed
        },
        beforeReveal,
        afterReveal: document.querySelector('#decision-replay-feedback').textContent,
        eventTypes: replayRaw.events.map((event) => event.type),
        first: {
          originalMove: first.originalMove,
          matchesOriginal: first.matchesOriginal,
          originalExposed: first.originalExposed,
          hasCorrect: Object.prototype.hasOwnProperty.call(first,'correct')
        },
        reveal: {
          originalMove: reveal.originalMove,
          transfer: reveal.transferLevel,
          formal: reveal.formalEligible,
          hasCorrect: Object.prototype.hasOwnProperty.call(reveal,'correct'),
          hasMastery: Object.prototype.hasOwnProperty.call(reveal,'mastery')
        }
      };
    })()`);
    assert.match(replayQueued.queueText, /已加入重做清單|已在重做清單/);
    assert.deepEqual(replayQueued.queued, {exposure:"previously_exposed", transfer:"T0", formal:false, originalExposed:true});
    assert.match(replayQueued.beforeReveal, /同一局面|這次候選已保存/);
    assert.match(replayQueued.afterReveal, /同一局面的重做|已經看過原棋譜著手|新局面表現/);
    assert.deepEqual(replayQueued.eventTypes, ["replay_queued","replay_presented","replay_candidate_first","replay_original_revealed"]);
    assert.deepEqual(replayQueued.first, {originalMove:null, matchesOriginal:null, originalExposed:false, hasCorrect:false});
    assert.deepEqual(replayQueued.reveal, {originalMove:[16,15], transfer:"T0", formal:false, hasCorrect:false, hasMastery:false});
    const comparableFlow = await evaluate(socket, `(() => {
      const firstButton = document.querySelector('#comparable-list [data-comparable-item="urgent-rescue-a-practice"]');
      if (!firstButton || firstButton.disabled) throw new Error('first comparable item unavailable');
      firstButton.click();

      function clickPoint(x,y){
        const point = document.querySelector('#comparable-board [data-comparable-x="'+x+'"][data-comparable-y="'+y+'"]');
        if (!point) throw new Error('comparable point missing '+x+','+y);
        point.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      }

      clickPoint(10,10);
      const afterWrong = document.querySelector('#comparable-feedback').textContent;
      clickPoint(5,3);
      const afterPracticeA = document.querySelector('#comparable-feedback').textContent;
      document.querySelector('#comparable-next').click();

      clickPoint(0,7);
      document.querySelector('#comparable-next').click();

      const roleAtProcess = document.querySelector('#comparable-role').textContent;
      clickPoint(0,0);
      const processWrong = document.querySelector('#comparable-feedback').textContent;
      clickPoint(12,5);

      const raw = JSON.parse(localStorage.getItem('go-advanced-comparable-position-events-v1'));
      const practiceFirst = raw.events.find(event => event.itemId==='urgent-rescue-a-practice' && event.type==='comparable_first');
      const practiceCompleted = raw.events.find(event => event.itemId==='urgent-rescue-a-practice' && event.type==='comparable_completed');
      const processPresented = raw.events.find(event => event.itemId==='urgent-rescue-a-process' && event.type==='comparable_presented');
      const processFirst = raw.events.find(event => event.itemId==='urgent-rescue-a-process' && event.type==='comparable_first');
      const processCompleted = raw.events.find(event => event.itemId==='urgent-rescue-a-process' && event.type==='comparable_completed');
      const listButtons = [...document.querySelectorAll('#comparable-list [data-comparable-item]')].map(button=>({id:button.dataset.comparableItem,disabled:button.disabled}));

      return {
        afterWrong,
        afterPracticeA,
        roleAtProcess,
        processWrong,
        practiceFirst:{correct:practiceFirst.correct,transfer:practiceFirst.transferLevel,context:practiceFirst.evaluationContext,formal:practiceFirst.formalEligible},
        practiceCompleted:{firstCorrect:practiceCompleted.firstCorrect,eventualCorrect:practiceCompleted.eventualCorrect,attempts:practiceCompleted.attempts},
        processPresented:{transfer:processPresented.transferLevel,context:processPresented.evaluationContext,formal:processPresented.formalEligible,scheduler:processPresented.schedulerEligible,skillUpdate:processPresented.skillUpdateEligible,qualified:processPresented.qualifiedOpportunity,kc:processPresented.kcHypothesisId,validated:processPresented.constructValidated},
        processFirst:{correct:processFirst.correct,transfer:processFirst.transferLevel},
        processCompleted:{firstCorrect:processCompleted.firstCorrect,eventualCorrect:processCompleted.eventualCorrect,attempts:processCompleted.attempts},
        listButtons
      };
    })()`);
    assert.match(comparableFlow.afterWrong, /仍處在只剩一氣/);
    assert.match(comparableFlow.afterPracticeA, /脫離只剩一氣/);
    assert.equal(comparableFlow.roleAtProcess, "換個局面再判斷");
    assert.match(comparableFlow.processWrong, /仍處在只剩一氣/);
    assert.deepEqual(comparableFlow.practiceFirst,{correct:false,transfer:"T0",context:"practice",formal:false});
    assert.deepEqual(comparableFlow.practiceCompleted,{firstCorrect:false,eventualCorrect:true,attempts:2});
    assert.deepEqual(comparableFlow.processPresented,{transfer:"T2",context:"process_check",formal:false,scheduler:false,skillUpdate:false,qualified:false,kc:"urgent-atari-rescue-kc",validated:false});
    assert.deepEqual(comparableFlow.processFirst,{correct:false,transfer:"T2"});
    assert.deepEqual(comparableFlow.processCompleted,{firstCorrect:false,eventualCorrect:true,attempts:2});
    assert.equal(comparableFlow.listButtons.find(item=>item.id==="urgent-rescue-b-process").disabled,false);

    const delayedBeforeDue = await evaluate(socket, `(() => {
      window.GoAdvancedDelayedComparable.render();
      const button = document.querySelector('#delayed-comparable-list [data-delayed-item="urgent-rescue-a-delayed"]');
      return {
        disabled: button.disabled,
        text: button.textContent,
        summary: document.querySelector('#delayed-comparable-summary').textContent,
        rawAbsent: localStorage.getItem('go-advanced-delayed-comparable-events-v1') === null
      };
    })()`);
    assert.equal(delayedBeforeDue.disabled,true);
    assert.match(delayedBeforeDue.text,/還沒到時間/);
    assert.match(delayedBeforeDue.summary,/至少 24 小時後開放/);
    assert.equal(delayedBeforeDue.rawAbsent,true);

    const delayedFlow = await evaluate(socket, `(() => {
      const key='go-advanced-comparable-position-events-v1';
      const comparable=JSON.parse(localStorage.getItem(key));
      const shift=25*60*60*1000;
      comparable.events=comparable.events.map(event=>({...event,occurredAt:new Date(Date.parse(event.occurredAt)-shift).toISOString()}));
      localStorage.setItem(key,JSON.stringify(comparable));
      window.GoAdvancedDelayedComparable.render();

      const button=document.querySelector('#delayed-comparable-list [data-delayed-item="urgent-rescue-a-delayed"]');
      if(!button || button.disabled) throw new Error('delayed comparable item did not become due');
      const dueText=button.textContent;
      button.click();

      function clickPoint(x,y){
        const point=document.querySelector('#delayed-comparable-board [data-delayed-x="'+x+'"][data-delayed-y="'+y+'"]');
        if(!point) throw new Error('delayed comparable point missing '+x+','+y);
        point.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      }
      clickPoint(0,0);
      const afterWrong=document.querySelector('#delayed-comparable-feedback').textContent;
      clickPoint(8,9);
      const afterCorrect=document.querySelector('#delayed-comparable-feedback').textContent;

      const raw=JSON.parse(localStorage.getItem('go-advanced-delayed-comparable-events-v1'));
      const presented=raw.events.find(event=>event.type==='delayed_presented');
      const first=raw.events.find(event=>event.type==='delayed_first');
      const completed=raw.events.find(event=>event.type==='delayed_completed');
      return {
        dueText,
        afterWrong,
        afterCorrect,
        eventTypes:raw.events.map(event=>event.type),
        presented:{
          transfer:presented.transferLevel,
          timing:presented.retrievalTiming,
          delay:presented.actualDelayMs,
          formal:presented.formalEligible,
          scheduler:presented.schedulerEligible,
          skillUpdate:presented.skillUpdateEligible,
          independent:presented.independentEvaluation
        },
        first:{correct:first.correct,delay:first.actualDelayMs},
        completed:{firstCorrect:completed.firstCorrect,eventualCorrect:completed.eventualCorrect,attempts:completed.attempts,delay:completed.actualDelayMs}
      };
    })()`);
    assert.match(delayedFlow.dueText,/已到時間/);
    assert.match(delayedFlow.afterWrong,/仍處在只剩一氣/);
    assert.match(delayedFlow.afterCorrect,/實際相隔時間|第一次作答/);
    assert.match(delayedFlow.afterCorrect,/延後再判/);
    assert.doesNotMatch(delayedFlow.afterCorrect,/流程檢查/);
    assert.deepEqual(delayedFlow.eventTypes,["delayed_presented","delayed_first","delayed_retry","delayed_completed"]);
    assert.equal(delayedFlow.presented.transfer,"T2");
    assert.equal(delayedFlow.presented.timing,"delayed");
    assert.ok(delayedFlow.presented.delay>=24*60*60*1000);
    assert.deepEqual(
      {formal:delayedFlow.presented.formal,scheduler:delayedFlow.presented.scheduler,skillUpdate:delayedFlow.presented.skillUpdate,independent:delayedFlow.presented.independent},
      {formal:false,scheduler:false,skillUpdate:false,independent:false}
    );
    assert.equal(delayedFlow.first.correct,false);
    assert.ok(delayedFlow.first.delay>=24*60*60*1000);
    assert.deepEqual(
      {firstCorrect:delayedFlow.completed.firstCorrect,eventualCorrect:delayedFlow.completed.eventualCorrect,attempts:delayedFlow.completed.attempts},
      {firstCorrect:false,eventualCorrect:true,attempts:2}
    );

    const comparableV2Flow = await evaluate(socket, `(() => {
      const legacyBefore = localStorage.getItem('go-advanced-comparable-position-events-v1');
      const first = document.querySelector('#comparable-v2-list [data-comparable-v2-item="double-atari-fullboard-practice-v1"]');
      if (!first || first.disabled) throw new Error('Double Atari practice unavailable');
      first.click();

      function clickV2(x,y){
        const point=document.querySelector('#comparable-v2-board [data-comparable-v2-x="'+x+'"][data-comparable-v2-y="'+y+'"]');
        if(!point) throw new Error('Comparable v2 point missing '+x+','+y);
        point.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      }

      const beforeName=document.querySelector('#comparable-v2-feedback').textContent;
      clickV2(0,0);
      const practiceWrong=document.querySelector('#comparable-v2-feedback').textContent;
      clickV2(6,5);
      const practiceCorrect=document.querySelector('#comparable-v2-feedback').textContent;
      document.querySelector('#comparable-v2-next').click();

      const processRole=document.querySelector('#comparable-v2-role').textContent;
      clickV2(0,0);
      clickV2(13,10);
      const processCorrect=document.querySelector('#comparable-v2-feedback').textContent;
      document.querySelector('#comparable-v2-next').click();

      const delayedBefore=document.querySelector('#comparable-v2-list [data-comparable-v2-delayed="double-atari-fullboard-delayed-v1"]');
      const delayedBeforeState={disabled:delayedBefore.disabled,text:delayedBefore.textContent};

      const key='go-advanced-comparable-events-v2';
      const immediate=JSON.parse(localStorage.getItem(key));
      const shift=25*60*60*1000;
      immediate.events=immediate.events.map(event=>({...event,occurredAt:new Date(Date.parse(event.occurredAt)-shift).toISOString()}));
      localStorage.setItem(key,JSON.stringify(immediate));
      window.GoAdvancedComparableV2.renderList();

      const delayed=document.querySelector('#comparable-v2-list [data-comparable-v2-delayed="double-atari-fullboard-delayed-v1"]');
      if(!delayed || delayed.disabled) throw new Error('Double Atari delayed item did not become due');
      const delayedDueText=delayed.textContent;
      delayed.click();
      clickV2(0,0);
      const delayedWrong=document.querySelector('#comparable-v2-feedback').textContent;
      clickV2(2,14);
      const delayedCorrect=document.querySelector('#comparable-v2-feedback').textContent;

      const raw=JSON.parse(localStorage.getItem('go-advanced-comparable-events-v2'));
      const delayedRaw=JSON.parse(localStorage.getItem('go-advanced-delayed-comparable-events-v2'));
      const practiceCompleted=raw.events.find(e=>e.itemId==='double-atari-fullboard-practice-v1'&&e.type==='comparable_completed');
      const processPresented=raw.events.find(e=>e.itemId==='double-atari-fullboard-process-v1'&&e.type==='comparable_presented');
      const processFirst=raw.events.find(e=>e.itemId==='double-atari-fullboard-process-v1'&&e.type==='comparable_first');
      const processCompleted=raw.events.find(e=>e.itemId==='double-atari-fullboard-process-v1'&&e.type==='comparable_completed');
      const delayedPresented=delayedRaw.events.find(e=>e.type==='delayed_presented');
      const delayedFirst=delayedRaw.events.find(e=>e.type==='delayed_first');
      const delayedCompleted=delayedRaw.events.find(e=>e.type==='delayed_completed');

      return {
        beforeName,practiceWrong,practiceCorrect,processRole,processCorrect,
        delayedBeforeState,delayedDueText,delayedWrong,delayedCorrect,
        legacyUnchanged:localStorage.getItem('go-advanced-comparable-position-events-v1')===legacyBefore,
        immediateTypes:raw.events.map(e=>e.type),
        practiceCompleted:{firstCorrect:practiceCompleted.firstCorrect,eventualCorrect:practiceCompleted.eventualCorrect,attempts:practiceCompleted.attempts},
        processPresented:{family:processPresented.familyId,scoring:processPresented.scoringContractVersion,transfer:processPresented.transferLevel,formal:processPresented.formalEligible,skillUpdate:processPresented.skillUpdateEligible,scheduler:processPresented.schedulerEligible,kcStatus:processPresented.kcStatus},
        processFirst:{correct:processFirst.correct},
        processCompleted:{firstCorrect:processCompleted.firstCorrect,eventualCorrect:processCompleted.eventualCorrect,attempts:processCompleted.attempts},
        delayedTypes:delayedRaw.events.map(e=>e.type),
        delayedPresented:{family:delayedPresented.familyId,timing:delayedPresented.retrievalTiming,delay:delayedPresented.actualDelayMs,formal:delayedPresented.formalEligible,scheduler:delayedPresented.schedulerEligible},
        delayedFirst:{correct:delayedFirst.correct},
        delayedCompleted:{firstCorrect:delayedCompleted.firstCorrect,eventualCorrect:delayedCompleted.eventualCorrect,attempts:delayedCompleted.attempts}
      };
    })()`);
    assert.doesNotMatch(comparableV2Flow.beforeName,/雙打吃/);
    assert.match(comparableV2Flow.practiceWrong,/沒有同時讓恰好兩串|第一次作答已保存/);
    assert.match(comparableV2Flow.practiceCorrect,/雙打吃/);
    assert.equal(comparableV2Flow.processRole,"換個局面再判斷");
    assert.match(comparableV2Flow.processCorrect,/雙打吃/);
    assert.equal(comparableV2Flow.delayedBeforeState.disabled,true);
    assert.match(comparableV2Flow.delayedBeforeState.text,/還沒到時間/);
    assert.match(comparableV2Flow.delayedDueText,/已到時間/);
    assert.match(comparableV2Flow.delayedWrong,/沒有同時讓恰好兩串|第一次作答已保存/);
    assert.match(comparableV2Flow.delayedCorrect,/雙打吃/);
    assert.match(comparableV2Flow.delayedCorrect,/延後再判/);
    assert.doesNotMatch(comparableV2Flow.delayedCorrect,/流程檢查/);
    assert.equal(comparableV2Flow.legacyUnchanged,true);
    assert.deepEqual(comparableV2Flow.practiceCompleted,{firstCorrect:false,eventualCorrect:true,attempts:2});
    assert.deepEqual(comparableV2Flow.processPresented,{family:"double_atari",scoring:"double-atari-two-targets-rules-v1",transfer:"T2",formal:false,skillUpdate:false,scheduler:false,kcStatus:"not_promoted"});
    assert.equal(comparableV2Flow.processFirst.correct,false);
    assert.deepEqual(comparableV2Flow.processCompleted,{firstCorrect:false,eventualCorrect:true,attempts:2});
    assert.deepEqual(comparableV2Flow.delayedTypes,["delayed_presented","delayed_first","delayed_retry","delayed_completed"]);
    assert.equal(comparableV2Flow.delayedPresented.family,"double_atari");
    assert.equal(comparableV2Flow.delayedPresented.timing,"delayed");
    assert.ok(comparableV2Flow.delayedPresented.delay>=24*60*60*1000);
    assert.equal(comparableV2Flow.delayedPresented.formal,false);
    assert.equal(comparableV2Flow.delayedPresented.scheduler,false);
    assert.equal(comparableV2Flow.delayedFirst.correct,false);
    assert.deepEqual(comparableV2Flow.delayedCompleted,{firstCorrect:false,eventualCorrect:true,attempts:2});

    const enclosureFlow = await evaluate(socket, `(() => {
      const button=document.querySelector('#enclosure-comparable-list [data-enclosure-item="enclosure-fullboard-practice-v1"]');
      if(!button || button.disabled) throw new Error('Enclosure practice unavailable');
      button.click();
      function clickEnclosure(x,y){
        const point=document.querySelector('#enclosure-comparable-board [data-enclosure-x="'+x+'"][data-enclosure-y="'+y+'"]');
        if(!point) throw new Error('Enclosure point missing '+x+','+y);
        point.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      }
      clickEnclosure(0,0);
      const wrong=document.querySelector('#enclosure-comparable-feedback').textContent;
      clickEnclosure(5,4);
      const afterCut=document.querySelector('#enclosure-comparable-feedback').textContent;
      clickEnclosure(5,5);
      const completedText=document.querySelector('#enclosure-comparable-feedback').textContent;
      const raw=JSON.parse(localStorage.getItem('go-advanced-enclosure-comparable-events-v1'));
      const first0=raw.events.find(e=>e.type==='enclosure_move_first'&&e.decisionIndex===0);
      const retry0=raw.events.find(e=>e.type==='enclosure_move_retry'&&e.decisionIndex===0);
      const forced=raw.events.find(e=>e.type==='enclosure_opponent_move');
      const first1=raw.events.find(e=>e.type==='enclosure_move_first'&&e.decisionIndex===1);
      const done=raw.events.find(e=>e.type==='enclosure_completed');
      return {
        wrong,afterCut,completedText,
        types:raw.events.map(e=>e.type),
        first0:{correct:first0.correct,transfer:first0.transferLevel,formal:first0.formalEligible},
        retry0:{correct:retry0.correct},
        forced:{point:forced.point,forced:forced.forced,correct:forced.correct},
        first1:{correct:first1.correct},
        done:{first:done.decisionFirstCorrect,attempts:done.decisionAttempts,eventual:done.eventualCorrect}
      };
    })()`);
    assert.match(enclosureFlow.wrong,/還沒有完成|第一次作答已保存/);
    assert.match(enclosureFlow.afterCut,/唯一一口氣延長|第二手/);
    assert.match(enclosureFlow.completedText,/先切斷援兵|完成提子/);
    assert.match(enclosureFlow.completedText,/公開練習或換形再判/);
    assert.equal(enclosureFlow.first0.correct,false);
    assert.equal(enclosureFlow.first0.transfer,"T0");
    assert.equal(enclosureFlow.first0.formal,false);
    assert.equal(enclosureFlow.retry0.correct,true);
    assert.deepEqual(enclosureFlow.forced,{point:[4,5],forced:true,correct:null});
    assert.equal(enclosureFlow.first1.correct,true);
    assert.deepEqual(enclosureFlow.done,{first:[false,true],attempts:[2,1],eventual:true});

    const sevenDayLocked = await evaluate(socket, `(() => ({
      disabled: document.querySelector('#seven-day-comparable-start').disabled,
      summary: document.querySelector('#seven-day-comparable-summary').textContent,
      rawAbsent: localStorage.getItem('go-advanced-seven-day-comparable-events-v1')===null
    }))()`);
    assert.equal(sevenDayLocked.disabled,true);
    assert.match(sevenDayLocked.summary,/七天|一天後|還沒/);
    assert.equal(sevenDayLocked.rawAbsent,true);

    const comparisonStart = await evaluate(socket, `(() => {
      const Comparison = window.GoDecisionComparison;
      window.__originalDecisionComparisonProvider = window.GoDecisionComparisonProvider.requestComparison;
      window.GoDecisionComparisonProvider.requestComparison = async (request) => ({
        resultVersion: Comparison.RESULT_VERSION,
        comparisonContractVersion: Comparison.COMPARISON_CONTRACT_VERSION,
        requestId: request.requestId,
        sourceId: request.sourceId,
        positionFingerprint: request.positionFingerprint,
        boardSize: 19,
        rules: request.rules,
        komi: request.komi,
        maxVisits: request.maxVisits,
        analysisPVLen: request.analysisPVLen,
        searchScope: 'root_allow_moves_only',
        authority: 'bounded_search_estimate_only',
        formalEligible: false,
        providerVersion: 'ui-fixture-v1',
        engineVersion: '1.18.1',
        model: 'fixture.bin.gz',
        candidates: [
          {role:'learner_first', point:[4,4], order:0, visits:60, scoreLead:1.1, winrate:.54, pv:['E15','Q10']},
          {role:'original_game', point:[16,15], order:1, visits:40, scoreLead:.4, winrate:.51, pv:['R4','C10']}
        ]
      });
      const button = document.querySelector('#decision-comparison-run');
      const meta = {
        rules: document.querySelector('#decision-comparison-rules').value,
        komi: document.querySelector('#decision-comparison-komi').value,
        beforeDisabled: button.disabled
      };
      button.click();
      return meta;
    })()`);
    assert.equal(comparisonStart.rules, "japanese");
    assert.equal(comparisonStart.komi, "6.5");
    assert.equal(comparisonStart.beforeDisabled, false);
    let comparisonDone = false;
    for (let retry = 0; retry < 30; retry += 1) {
      comparisonDone = await evaluate(socket, `(() => {
        const text = document.querySelector('#decision-comparison-result').textContent || '';
        const raw = localStorage.getItem('go-advanced-decision-comparison-events-v1');
        if (!raw) return false;
        const events = JSON.parse(raw).events || [];
        return text.includes('KataGo 的排序較偏向') && events.some(event => event.type === 'comparison_completed');
      })()`);
      if (comparisonDone) break;
      await delay(50);
    }
    assert.equal(comparisonDone, true);
    const comparisonFlow = await evaluate(socket, `(() => {
      const raw = JSON.parse(localStorage.getItem('go-advanced-decision-comparison-events-v1'));
      const completed = raw.events.find(event => event.type === 'comparison_completed');
      const result = {
        text: document.querySelector('#decision-comparison-result').textContent,
        types: raw.events.map(event => event.type),
        authority: completed.result.authority,
        hasCorrect: Object.prototype.hasOwnProperty.call(completed.result, 'correct'),
        hasMastery: Object.prototype.hasOwnProperty.call(completed.result, 'mastery'),
        formalEligible: completed.formalEligible
      };
      window.GoDecisionComparisonProvider.requestComparison = window.__originalDecisionComparisonProvider;
      delete window.__originalDecisionComparisonProvider;
      return result;
    })()`);
    assert.match(comparisonFlow.text, /KataGo 的排序較偏向你的第一候選/);
    assert.match(comparisonFlow.text, /不代表另一手一定錯/);
    assert.deepEqual(comparisonFlow.types, ["comparison_requested", "comparison_completed"]);
    assert.equal(comparisonFlow.authority, "bounded_search_estimate_only");
    assert.equal(comparisonFlow.hasCorrect, false);
    assert.equal(comparisonFlow.hasMastery, false);
    assert.equal(comparisonFlow.formalEligible, false);
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    const advancedOverflow = await evaluate(socket, "({width: innerWidth, scrollWidth: document.documentElement.scrollWidth})");
    assert.ok(advancedOverflow.scrollWidth <= advancedOverflow.width + 1, `advanced mobile horizontal overflow: ${JSON.stringify(advancedOverflow)}`);
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await command(socket, "Page.navigate", { url: classicPage });
    let classicReady = false;
    for (let retry = 0; retry < 30; retry += 1) {
      classicReady = await evaluate(socket, "Boolean(document.querySelector('#classic-board [data-x]') && document.querySelector('#classic-prompt')?.textContent)");
      if (classicReady) break;
      await delay(100);
    }
    assert.equal(classicReady, true);
    const classicLayout = await evaluate(socket, `(() => {
      const question = document.querySelector('.classic-question');
      const board = document.querySelector('.classic-grid .board-card');
      const operation = document.querySelector('.classic-operation');
      const qr = question.getBoundingClientRect();
      const br = board.getBoundingClientRect();
      return {
        questionDisplay: getComputedStyle(question).display,
        questionVisible: qr.width > 100 && qr.height > 100,
        boardVisible: br.width > 100 && br.height > 100,
        questionBeforeBoard: qr.left < br.left,
        prompt: document.querySelector('#classic-prompt').textContent,
        operation: operation.textContent.replace(/\\s+/g,' ').trim(),
        intro: document.querySelector('.classic-practice-intro').textContent.replace(/\\s+/g,' ').trim(),
        stages: [...document.querySelectorAll('#classic-stage-list li')].map((node) => node.textContent.trim()),
        cursorPointerEvents: getComputedStyle(document.querySelector('#classic-board .classic-cursor-ring')).pointerEvents,
        cursorOnOccupied: (() => {
          const ring = document.querySelector('#classic-board .classic-cursor-ring');
          const occupied = [...document.querySelectorAll('#classic-board .classic-occupied')];
          if (!ring) return null;
          const cx = ring.getAttribute('cx'), cy = ring.getAttribute('cy');
          return occupied.some((stone) => stone.getAttribute('cx') === cx && stone.getAttribute('cy') === cy);
        })()
      };
    })()`);
    assert.equal(classicLayout.questionDisplay, "flex");
    assert.equal(classicLayout.questionVisible, true);
    assert.equal(classicLayout.boardVisible, true);
    assert.equal(classicLayout.questionBeforeBoard, true);
    assert.match(classicLayout.prompt, /輪到黑棋/);
    assert.match(classicLayout.operation, /單題落子練習/);
    assert.match(classicLayout.operation, /點|空點/);
    assert.match(classicLayout.intro, /直三專用/);
    assert.match(classicLayout.intro, /下面四格只用來練直三/);
    assert.deepEqual(classicLayout.stages, [
      "1 直三 · 找急所",
      "2 直三 · 換方向",
      "3 直三 · 換攻方",
      "4 直三 · 相似反例"
    ]);
    assert.equal(classicLayout.cursorPointerEvents, "none");
    assert.equal(classicLayout.cursorOnOccupied, false);

    const occupiedFeedback = await evaluate(socket, `(() => {
      const stone = document.querySelector('#classic-board .classic-occupied');
      stone.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return document.querySelector('#classic-feedback').textContent;
    })()`);
    assert.match(occupiedFeedback, /這裡已有棋子/);

    const wrongFeedback = await evaluate(socket, `(() => {
      const point = document.querySelector('#classic-board [data-x="2"][data-y="3"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {text: document.querySelector('#classic-feedback').textContent, revealHidden: document.querySelector('#classic-reveal').hidden, nextDisabled: document.querySelector('#classic-next').disabled};
    })()`);
    assert.match(wrongFeedback.text, /沒有達成本層目標/);
    assert.equal(wrongFeedback.revealHidden, true);
    assert.equal(wrongFeedback.nextDisabled, true);

    const correctFeedback = await evaluate(socket, `(() => {
      const point = document.querySelector('#classic-board [data-x="3"][data-y="3"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {text: document.querySelector('#classic-feedback').textContent, revealHidden: document.querySelector('#classic-reveal').hidden, name: document.querySelector('#classic-name').textContent, nextDisabled: document.querySelector('#classic-next').disabled};
    })()`);
    assert.match(correctFeedback.text, /找到急所/);
    assert.equal(correctFeedback.revealHidden, false);
    assert.equal(correctFeedback.name, "直三");
    assert.equal(correctFeedback.nextDisabled, false);

    const ontologyCatalogState = await evaluate(socket, `(() => {
      const carpenter = document.querySelector('[data-concept-id="carpenters-square-v1"]');
      const lGroup = document.querySelector('[data-concept-id="l-group-v1"]');
      const smallPig = document.querySelector('[data-concept-id="small-pigs-mouth-candidate-v1"]');
      const bent = document.querySelector('[data-concept-id="bent-four-corner-v1"]');
      return {
        cardCount: document.querySelectorAll('.classic-catalog-card').length,
        carpenterTitle: carpenter?.querySelector('h3')?.textContent || '',
        carpenterStatus: carpenter?.querySelector('.catalog-zh-status')?.textContent || '',
        carpenterAmbiguity: carpenter?.querySelector('.catalog-ambiguity')?.textContent || '',
        lGroupAmbiguity: lGroup?.querySelector('.catalog-ambiguity')?.textContent || '',
        lGroupTaxonomy: lGroup?.querySelector('.catalog-taxonomy')?.textContent || '',
        lGroupGeometryRelation: lGroup?.querySelector('.catalog-geometry-rel')?.textContent || '',
        carpenterGeometryEvidence: carpenter?.querySelector('.catalog-geometry-evidence')?.textContent || '',
        lGroupGeometryEvidence: lGroup?.querySelector('.catalog-geometry-evidence')?.textContent || '',
        smallPigWarning: smallPig?.querySelector('.catalog-warning')?.textContent || '',
        bentWarning: bent?.querySelector('.catalog-warning')?.textContent || '',
        ontologyMeta: Boolean(carpenter?.querySelector('.catalog-ontology-meta'))
      };
    })()`);
    assert.ok(ontologyCatalogState.cardCount >= 16);
    assert.equal(ontologyCatalogState.carpenterTitle, "一合マス／Carpenter's Square");
    assert.match(ontologyCatalogState.carpenterStatus, /尚未判定臺灣繁中首選名稱/);
    assert.match(ontologyCatalogState.carpenterAmbiguity, /小曲尺/);
    assert.match(ontologyCatalogState.lGroupAmbiguity, /名稱可能指不同棋形/);
    assert.match(ontologyCatalogState.lGroupTaxonomy, /分類資料.*內部分類關係/);
    assert.match(ontologyCatalogState.lGroupGeometryRelation, /相關棋形關係仍在整理/);
    assert.match(ontologyCatalogState.carpenterGeometryEvidence, /棋形核對/);
    assert.doesNotMatch(ontologyCatalogState.carpenterGeometryEvidence, /rights=|public=/);
    assert.match(ontologyCatalogState.carpenterGeometryEvidence, /詳細依據請看下方來源|還沒有足夠資料/);
    assert.match(ontologyCatalogState.lGroupGeometryEvidence, /棋形核對/);
    assert.doesNotMatch(ontologyCatalogState.lGroupGeometryEvidence, /rights=|public=/);
    assert.match(ontologyCatalogState.smallPigWarning, /Tripod Group/);
    assert.match(ontologyCatalogState.bentWarning, /不同規則下可能出現不同結果/);
    assert.equal(ontologyCatalogState.ontologyMeta, true);

    const bentThreeState = await evaluate(socket, `(() => ({
      points: document.querySelectorAll('#bent-three-board [data-bent-three-x][data-bent-three-y]').length,
      prompt: document.querySelector('#bent-three-prompt').textContent,
      revealHidden: document.querySelector('#bent-three-reveal').hidden,
      nextDisabled: document.querySelector('#bent-three-next').disabled
    }))()`);
    assert.equal(bentThreeState.points, 3);
    assert.match(bentThreeState.prompt, /輪到黑棋守/);
    assert.equal(bentThreeState.revealHidden, true);
    assert.equal(bentThreeState.nextDisabled, true);

    const bentThreeWrong = await evaluate(socket, `(() => {
      const point = document.querySelector('#bent-three-board [data-bent-three-x="3"][data-bent-three-y="2"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#bent-three-feedback').textContent,
        revealHidden: document.querySelector('#bent-three-reveal').hidden,
        nextDisabled: document.querySelector('#bent-three-next').disabled
      };
    })()`);
    assert.match(bentThreeWrong.feedback, /不是 L 形棋形/);
    assert.equal(bentThreeWrong.revealHidden, true);
    assert.equal(bentThreeWrong.nextDisabled, true);

    const bentThreeCorrect = await evaluate(socket, `(() => {
      const point = document.querySelector('#bent-three-board [data-bent-three-x="3"][data-bent-three-y="3"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#bent-three-feedback').textContent,
        revealHidden: document.querySelector('#bent-three-reveal').hidden,
        name: document.querySelector('#bent-three-name').textContent,
        nextDisabled: document.querySelector('#bent-three-next').disabled
      };
    })()`);
    assert.match(bentThreeCorrect.feedback, /共同急所|L 形彎點/);
    assert.equal(bentThreeCorrect.revealHidden, false);
    assert.equal(bentThreeCorrect.name, "曲三／Bent Three");
    assert.equal(bentThreeCorrect.nextDisabled, false);

    const fourStatusState = await evaluate(socket, `(() => ({
      prompt: document.querySelector('#four-status-prompt').textContent,
      revealHidden: document.querySelector('#four-status-reveal').hidden,
      nextDisabled: document.querySelector('#four-status-next').disabled,
      aliveDisabled: document.querySelector('#four-status-alive').disabled,
      deadDisabled: document.querySelector('#four-status-dead').disabled
    }))()`);
    assert.match(fourStatusState.prompt, /黑棋守方先走/);
    assert.equal(fourStatusState.revealHidden, true);
    assert.equal(fourStatusState.nextDisabled, true);
    assert.equal(fourStatusState.aliveDisabled, false);
    assert.equal(fourStatusState.deadDisabled, false);

    const fourStatusWrong = await evaluate(socket, `(() => {
      document.querySelector('#four-status-alive').click();
      return {
        feedback: document.querySelector('#four-status-feedback').textContent,
        revealHidden: document.querySelector('#four-status-reveal').hidden,
        nextDisabled: document.querySelector('#four-status-next').disabled
      };
    })()`);
    assert.match(fourStatusWrong.feedback, /和規則檢查結果不一致/);
    assert.equal(fourStatusWrong.revealHidden, true);
    assert.equal(fourStatusWrong.nextDisabled, true);

    const fourStatusCorrect = await evaluate(socket, `(() => {
      document.querySelector('#four-status-dead').click();
      return {
        feedback: document.querySelector('#four-status-feedback').textContent,
        revealHidden: document.querySelector('#four-status-reveal').hidden,
        name: document.querySelector('#four-status-name').textContent,
        proof: document.querySelector('#four-status-proof').textContent,
        nextDisabled: document.querySelector('#four-status-next').disabled,
        aliveDisabled: document.querySelector('#four-status-alive').disabled,
        deadDisabled: document.querySelector('#four-status-dead').disabled
      };
    })()`);
    assert.match(fourStatusCorrect.feedback, /方四沒有做活急所|仍死/);
    assert.equal(fourStatusCorrect.revealHidden, false);
    assert.equal(fourStatusCorrect.name, "方四／Square Four");
    assert.match(fourStatusCorrect.proof, /留下可被攻擊的曲三/);
    assert.equal(fourStatusCorrect.nextDisabled, false);
    assert.equal(fourStatusCorrect.aliveDisabled, true);
    assert.equal(fourStatusCorrect.deadDisabled, true);

    const fourStatusSecond = await evaluate(socket, `(() => {
      document.querySelector('#four-status-next').click();
      return {
        prompt: document.querySelector('#four-status-prompt').textContent,
        revealHidden: document.querySelector('#four-status-reveal').hidden,
        aliveDisabled: document.querySelector('#four-status-alive').disabled,
        deadDisabled: document.querySelector('#four-status-dead').disabled
      };
    })()`);
    assert.match(fourStatusSecond.prompt, /白棋攻方先走/);
    assert.equal(fourStatusSecond.revealHidden, true);
    assert.equal(fourStatusSecond.aliveDisabled, false);
    assert.equal(fourStatusSecond.deadDisabled, false);

    const straightFourCorrect = await evaluate(socket, `(() => {
      document.querySelector('#four-status-alive').click();
      return {
        feedback: document.querySelector('#four-status-feedback').textContent,
        name: document.querySelector('#four-status-name').textContent,
        proof: document.querySelector('#four-status-proof').textContent,
        nextDisabled: document.querySelector('#four-status-next').disabled
      };
    })()`);
    assert.match(straightFourCorrect.feedback, /直四是無條件活形|仍有回應/);
    assert.equal(straightFourCorrect.name, "直四／Straight Four");
    assert.match(straightFourCorrect.proof, /兩個分開的眼/);
    assert.equal(straightFourCorrect.nextDisabled, false);

    const curvedFourState = await evaluate(socket, `(() => {
      document.querySelector('#four-status-next').click();
      document.querySelector('#four-status-dead').click();
      document.querySelector('#four-status-next').click();
      document.querySelector('#four-status-alive').click();
      document.querySelector('#four-status-next').click();
      return {
        prompt: document.querySelector('#four-status-prompt').textContent,
        tag: document.querySelector('#four-status-tag').textContent,
        revealHidden: document.querySelector('#four-status-reveal').hidden
      };
    })()`);
    assert.match(curvedFourState.prompt, /折彎的四目眼/);
    assert.match(curvedFourState.tag, /5 \/ 6/);
    assert.equal(curvedFourState.revealHidden, true);

    const curvedFourCorrect = await evaluate(socket, `(() => {
      document.querySelector('#four-status-alive').click();
      return {
        feedback: document.querySelector('#four-status-feedback').textContent,
        name: document.querySelector('#four-status-name').textContent,
        proof: document.querySelector('#four-status-proof').textContent,
        nextDisabled: document.querySelector('#four-status-next').disabled
      };
    })()`);
    assert.match(curvedFourCorrect.feedback, /曲四是無條件活形|兩個分離眼點/);
    assert.equal(curvedFourCorrect.name, "曲四／Curved Four");
    assert.match(curvedFourCorrect.proof, /曲四仍然是活棋/);
    assert.equal(curvedFourCorrect.nextDisabled, false);

    const curvedFourShiftState = await evaluate(socket, `(() => {
      document.querySelector('#four-status-next').click();
      return {
        prompt: document.querySelector('#four-status-prompt').textContent,
        tag: document.querySelector('#four-status-tag').textContent
      };
    })()`);
    assert.match(curvedFourShiftState.prompt, /旋轉、平移並換成白棋守/);
    assert.match(curvedFourShiftState.tag, /6 \/ 6/);

    const pyramidFourState = await evaluate(socket, `(() => ({
      points: document.querySelectorAll('#pyramid-four-board [data-pyramid-four-x][data-pyramid-four-y]').length,
      prompt: document.querySelector('#pyramid-four-prompt').textContent,
      revealHidden: document.querySelector('#pyramid-four-reveal').hidden,
      nextDisabled: document.querySelector('#pyramid-four-next').disabled
    }))()`);
    assert.equal(pyramidFourState.points, 4);
    assert.match(pyramidFourState.prompt, /輪到黑棋守/);
    assert.equal(pyramidFourState.revealHidden, true);
    assert.equal(pyramidFourState.nextDisabled, true);

    const pyramidFourWrong = await evaluate(socket, `(() => {
      const point = document.querySelector('#pyramid-four-board [data-pyramid-four-x="3"][data-pyramid-four-y="2"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#pyramid-four-feedback').textContent,
        revealHidden: document.querySelector('#pyramid-four-reveal').hidden,
        nextDisabled: document.querySelector('#pyramid-four-next').disabled
      };
    })()`);
    assert.match(pyramidFourWrong.feedback, /不是 T 形棋形/);
    assert.equal(pyramidFourWrong.revealHidden, true);
    assert.equal(pyramidFourWrong.nextDisabled, true);

    const pyramidFourCorrect = await evaluate(socket, `(() => {
      const point = document.querySelector('#pyramid-four-board [data-pyramid-four-x="3"][data-pyramid-four-y="3"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#pyramid-four-feedback').textContent,
        revealHidden: document.querySelector('#pyramid-four-reveal').hidden,
        name: document.querySelector('#pyramid-four-name').textContent,
        nextDisabled: document.querySelector('#pyramid-four-next').disabled
      };
    })()`);
    assert.match(pyramidFourCorrect.feedback, /共同急所|T 形中心/);
    assert.equal(pyramidFourCorrect.revealHidden, false);
    assert.equal(pyramidFourCorrect.name, "丁四／Pyramid Four");
    assert.equal(pyramidFourCorrect.nextDisabled, false);

    const flowerSixState = await evaluate(socket, `(() => {
      const board = document.querySelector('#flower-six-board');
      const points = [...board.querySelectorAll('[data-flower-six-x][data-flower-six-y]')];
      return {
        pointCount: points.length,
        prompt: document.querySelector('#flower-six-prompt').textContent,
        revealHidden: document.querySelector('#flower-six-reveal').hidden,
        nextDisabled: document.querySelector('#flower-six-next').disabled
      };
    })()`);
    assert.equal(flowerSixState.pointCount, 6);
    assert.match(flowerSixState.prompt, /輪到黑棋守方/);
    assert.equal(flowerSixState.revealHidden, true);
    assert.equal(flowerSixState.nextDisabled, true);

    const flowerSixWrong = await evaluate(socket, `(() => {
      const point = document.querySelector('#flower-six-board [data-flower-six-x="3"][data-flower-six-y="3"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#flower-six-feedback').textContent,
        revealHidden: document.querySelector('#flower-six-reveal').hidden,
        nextDisabled: document.querySelector('#flower-six-next').disabled
      };
    })()`);
    assert.match(flowerSixWrong.feedback, /不是兩個突出點的根部|不是.*急所/);
    assert.equal(flowerSixWrong.revealHidden, true);
    assert.equal(flowerSixWrong.nextDisabled, true);

    const flowerSixCorrect = await evaluate(socket, `(() => {
      const point = document.querySelector('#flower-six-board [data-flower-six-x="2"][data-flower-six-y="2"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#flower-six-feedback').textContent,
        revealHidden: document.querySelector('#flower-six-reveal').hidden,
        name: document.querySelector('#flower-six-name').textContent,
        nextDisabled: document.querySelector('#flower-six-next').disabled
      };
    })()`);
    assert.match(flowerSixCorrect.feedback, /共同急所/);
    assert.equal(flowerSixCorrect.revealHidden, false);
    assert.equal(flowerSixCorrect.name, "花六／Rabbity Six");
    assert.equal(flowerSixCorrect.nextDisabled, false);

    const goldenChickenState = await evaluate(socket, `(() => ({
      points: document.querySelectorAll('#golden-chicken-board [data-golden-x][data-golden-y]').length,
      prompt: document.querySelector('#golden-chicken-prompt').textContent,
      revealHidden: document.querySelector('#golden-chicken-reveal').hidden,
      nextDisabled: document.querySelector('#golden-chicken-next').disabled
    }))()`);
    assert.equal(goldenChickenState.points, 49);
    assert.match(goldenChickenState.prompt, /輪到黑棋/);
    assert.equal(goldenChickenState.revealHidden, true);
    assert.equal(goldenChickenState.nextDisabled, true);

    const goldenChickenWrong = await evaluate(socket, `(() => {
      const point = document.querySelector('#golden-chicken-board [data-golden-x="0"][data-golden-y="1"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#golden-chicken-feedback').textContent,
        revealHidden: document.querySelector('#golden-chicken-reveal').hidden,
        nextDisabled: document.querySelector('#golden-chicken-next').disabled
      };
    })()`);
    assert.match(goldenChickenWrong.feedback, /沒有完成本題/);
    assert.equal(goldenChickenWrong.revealHidden, true);
    assert.equal(goldenChickenWrong.nextDisabled, true);

    const goldenChickenCorrect = await evaluate(socket, `(() => {
      const point = document.querySelector('#golden-chicken-board [data-golden-x="3"][data-golden-y="0"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#golden-chicken-feedback').textContent,
        revealHidden: document.querySelector('#golden-chicken-reveal').hidden,
        name: document.querySelector('#golden-chicken-name').textContent,
        nextDisabled: document.querySelector('#golden-chicken-next').disabled
      };
    })()`);
    assert.match(goldenChickenCorrect.feedback, /1 氣變成 2 氣/);
    assert.equal(goldenChickenCorrect.revealHidden, false);
    assert.equal(goldenChickenCorrect.name, "金雞獨立");
    assert.equal(goldenChickenCorrect.nextDisabled, false);

    const bigPigsMouthState = await evaluate(socket, `(() => ({
      points: document.querySelectorAll('#big-pigs-mouth-board [data-big-pig-x][data-big-pig-y]').length,
      prompt: document.querySelector('#big-pigs-mouth-prompt').textContent,
      revealHidden: document.querySelector('#big-pigs-mouth-reveal').hidden,
      nextDisabled: document.querySelector('#big-pigs-mouth-next').disabled
    }))()`);
    assert.equal(bigPigsMouthState.points, 81);
    assert.match(bigPigsMouthState.prompt, /輪到白棋/);
    assert.equal(bigPigsMouthState.revealHidden, true);
    assert.equal(bigPigsMouthState.nextDisabled, true);

    const bigPigsMouthWrong = await evaluate(socket, `(() => {
      const point = document.querySelector('#big-pigs-mouth-board [data-big-pig-x="18"][data-big-pig-y="18"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#big-pigs-mouth-feedback').textContent,
        revealHidden: document.querySelector('#big-pigs-mouth-reveal').hidden,
        nextDisabled: document.querySelector('#big-pigs-mouth-next').disabled
      };
    })()`);
    assert.match(bigPigsMouthWrong.feedback, /不是來源測試資料/);
    assert.equal(bigPigsMouthWrong.revealHidden, true);
    assert.equal(bigPigsMouthWrong.nextDisabled, true);

    const bigPigsMouthCorrect = await evaluate(socket, `(() => {
      const point = document.querySelector('#big-pigs-mouth-board [data-big-pig-x="16"][data-big-pig-y="18"]');
      point.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      return {
        feedback: document.querySelector('#big-pigs-mouth-feedback').textContent,
        revealHidden: document.querySelector('#big-pigs-mouth-reveal').hidden,
        name: document.querySelector('#big-pigs-mouth-name').textContent,
        nextDisabled: document.querySelector('#big-pigs-mouth-next').disabled
      };
    })()`);
    assert.match(bigPigsMouthCorrect.feedback, /MIT 測試資料/);
    assert.equal(bigPigsMouthCorrect.revealHidden, false);
    assert.equal(bigPigsMouthCorrect.name, "大豬嘴／J Group");
    assert.equal(bigPigsMouthCorrect.nextDisabled, false);

    await command(socket, "Page.navigate", { url: historyPage });
    let historyReady = false;
    for (let retry = 0; retry < 30; retry += 1) {
      historyReady = await evaluate(socket, "Boolean(document.querySelector('#history-title')?.textContent && document.querySelectorAll('.question-block').length === 5)");
      if (historyReady) break;
      await delay(100);
    }
    assert.equal(historyReady, true);
    const historyDesktop = await evaluate(socket, `(() => {
      const parseColor = (value) => {
        const match = value.match(/rgba?\\(([^)]+)\\)/);
        if (!match) return null;
        const parts = match[1].split(',').map((part) => Number(part.trim()));
        return {r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1};
      };
      const over = (fg, bg) => {
        const alpha = fg.a + bg.a * (1 - fg.a);
        if (alpha === 0) return {r:255,g:255,b:255,a:0};
        return {
          r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / alpha,
          g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / alpha,
          b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / alpha,
          a: alpha
        };
      };
      const effectiveBackground = (node) => {
        const layers = [];
        for (let current = node; current; current = current.parentElement) {
          const parsed = parseColor(getComputedStyle(current).backgroundColor);
          if (parsed && parsed.a > 0) layers.push(parsed);
        }
        let result = {r:255,g:255,b:255,a:1};
        for (let index = layers.length - 1; index >= 0; index -= 1) result = over(layers[index], result);
        return result;
      };
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (color) => 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
      const contrast = (foreground, background) => {
        const values = [luminance(foreground), luminance(background)].sort((a,b) => b-a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const auditSelectors = [
        '.history-brand small','.history-kicker','.section-head>span','.badge-grid p','.evidence-badge',
        '.question-number','.detail-body','.evidence-timeline p','.compare-head','.story-grid p',
        '.frontier-grid p','.source-audit-date','.source-list span','.history-cta>div>span','.history-cta p','footer'
      ];
      const explicitNodes = auditSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
      const visibleSmallTextNodes = [...document.querySelectorAll('body *')].filter((node) => {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (Number.parseFloat(style.fontSize) >= 16) return false;
        if (node.getClientRects().length === 0) return false;
        return [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
      });
      const audited = [...new Set([...explicitNodes, ...visibleSmallTextNodes])].map((node) => {
        const foreground = parseColor(getComputedStyle(node).color);
        const background = effectiveBackground(node);
        return {
          label: node.className || node.tagName,
          text: node.textContent.trim().slice(0, 32),
          ratio: contrast(foreground, background)
        };
      });
      return {
        title: document.querySelector('#history-title').textContent,
        questions: document.querySelectorAll('.question-block').length,
        evidenceLabels: [...new Set([...document.querySelectorAll('.evidence-guide .evidence-badge')].map((node) => node.textContent.trim()))],
        sourceAuditDate: document.querySelector('.source-audit-date')?.textContent.trim(),
        scripts: document.querySelectorAll('script').length,
        historyVersion: document.querySelector('footer')?.textContent.includes('歷史探索 v6'),
        minContrast: Math.min(...audited.map((item) => item.ratio)),
        lowContrast: audited.filter((item) => item.ratio < 4.5),
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    })()`);
    assert.match(historyDesktop.title, /圍棋為什麼會長成今天這個樣子/);
    assert.equal(historyDesktop.questions, 5);
    assert.deepEqual(historyDesktop.evidenceLabels, ["確證", "高度可信", "有爭議", "傳說", "研究假說", "未知"]);
    assert.equal(historyDesktop.sourceAuditDate, "本頁來源最後查核：2026-09-29");
    assert.equal(historyDesktop.scripts, 0);
    assert.equal(historyDesktop.historyVersion, true);
    assert.deepEqual(historyDesktop.lowContrast, [], `history low contrast: ${JSON.stringify(historyDesktop.lowContrast)}`);
    assert.ok(historyDesktop.minContrast >= 4.5, `history minimum contrast: ${historyDesktop.minContrast}`);
    assert.ok(historyDesktop.scrollWidth <= historyDesktop.width + 1, `history desktop horizontal overflow: ${JSON.stringify(historyDesktop)}`);

    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    const historyMobile = await evaluate(socket, `(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      sourceColumns: getComputedStyle(document.querySelector('.source-list')).gridTemplateColumns,
      frontierColumns: getComputedStyle(document.querySelector('.frontier-grid')).gridTemplateColumns,
      ctaDirection: getComputedStyle(document.querySelector('.history-cta')).flexDirection,
      advancedCtaVisible: (() => { const node = document.querySelector('.history-cta a[href="advanced.html"]'); return Boolean(node && node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0); })()
    }))()`);
    assert.ok(historyMobile.scrollWidth <= historyMobile.width + 1, `history mobile horizontal overflow: ${JSON.stringify(historyMobile)}`);
    assert.equal(historyMobile.ctaDirection, "column");
    assert.equal(historyMobile.advancedCtaVisible, true);
    assert.ok(historyMobile.sourceColumns.split(" ").length === 1);
    assert.ok(historyMobile.frontierColumns.split(" ").length === 1);
    await command(socket, "Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    const reducedMotionHistory = await evaluate(socket, "getComputedStyle(document.documentElement).scrollBehavior");
    assert.equal(reducedMotionHistory, "auto");
    await command(socket, "Emulation.setEmulatedMedia", { features: [] });
    await command(socket, "Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

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
    assert.equal(reviewPageState.fingerprint, "fnv1a32-c34ef6a4");
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
    assert.equal(reviewDraft.protocolId, "go-r1-independent-content-review-v5");
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
