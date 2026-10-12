"use strict";
(function (root) {
  // Presentation-only pilot: never edits GoContent, answer evaluation, events or storage.
  const TASK_ID = "u1-06";
  const EN = "en";
  const ZH = "zh-Hant-TW";
  const TERMS = Object.freeze({
    liberty: "liberty — an empty intersection next to a stone, along a board line",
    atari: "atari — a stone or connected group has only one liberty left",
    capture: "capture — fill the last liberty of an opposing group to remove it"
  });
  const CONTENT = Object.freeze({
    lesson: "Atari and capturing stones",
    questionTitle: "Capture a stone in the centre",
    prompt: "Black to play. Choose the white stone's last liberty to capture it.",
    hint: "The point immediately below the white stone is still empty.",
    explanation: "Black fills White's last liberty from below, so the white stone is captured.",
    error: "That move has not captured the marked white stone. Look for its last empty neighbouring point, then try again.",
    occupied: "There is already a stone here. Choose an empty intersection.",
    illegal: "This move is not legal in the current position. Choose another intersection."
  });
  const translations = Object.freeze({
    "#lesson-kicker": "Unit 1 · Beginner",
    "#question-number": "Question 1 of 4",
    "#lesson-title": CONTENT.lesson,
    "#lesson-subtitle": "Lesson 2 · 4 questions",
    "#lesson-badge": "Capture basics",
    "#question-tag": "Capture practice",
    "#question-title": CONTENT.questionTitle,
    "#question-prompt": CONTENT.prompt,
    ".question-prompt-label": "Question",
    ".workspace-task-cue strong": "Now",
    ".board-card .card-top > span:first-child": "9 × 9 practice board",
    ".board-card .board-status": "Local practice",
    "#player-color": "● Black to play",
    ".board-foot > span:nth-child(2)": "○ White",
    "#board-instruction": "Click an intersection, or use arrow keys and press Enter or Space",
    "#answer-policy": "Choose a point on the board. You can try again if your answer is incorrect.",
    "#hint-button": "Show a hint",
    ".takeaway > span": "Remember",
    "#takeaway-text": "Capture a group by filling its last liberty.",
    ".footer-note": "Practice only. Progress stays in this browser; completing a question is not a measure of mastery."
  });
  let locale = ZH;
  let active = false;
  let previous = new Map();
  let lastEnglish = new Map();
  let lastContext = null;\n  let requestedLocale = ZH;
  const dom = root.document || null;

  function getNode(selector) { return dom && dom.querySelector(selector); }
  function write(selector, value, html = false) {
    const node = getNode(selector);
    if (!node) return;
    const key = selector + (html ? ":html" : ":text");
    const current = html ? node.innerHTML : node.textContent;
    if (!previous.has(key) || (lastEnglish.has(key) && current !== lastEnglish.get(key))) previous.set(key, current);
    if (current !== value) {
      if (html) node.innerHTML = value;
      else node.textContent = value;
    }
    lastEnglish.set(key, html ? node.innerHTML : node.textContent);
  }
  function restore() {
    for (const [key, original] of previous.entries()) {
      const html = key.endsWith(":html");
      const selector = key.slice(0, -5);
      const node = getNode(selector);
      if (!node) continue;
      const current = html ? node.innerHTML : node.textContent;
      if (current === lastEnglish.get(key)) {
        if (html) node.innerHTML = original;
        else node.textContent = original;
      }
    }
    previous = new Map();
    lastEnglish = new Map();
  }
  function boardAria() {
    const board = getNode("#board");
    if (!board) return;
    const group = board.querySelector('svg[role="group"]');
    if (group) group.setAttribute("aria-label", "9 by 9 board: capture the white stone in the centre");
    board.querySelectorAll("[data-board-point]").forEach((point) => {
      const row = Number(point.dataset.y) + 1;
      const col = Number(point.dataset.x) + 1;
      const original = point.getAttribute("aria-label") || "";
      let status = "status unavailable";
      if (original.includes("空點，可落子") || original.includes("empty")) status = "empty; playable";
      else if (original.includes("黑棋，已有棋子") || original.includes("black stone")) status = "black stone; occupied";
      else if (original.includes("白棋，已有棋子") || original.includes("white stone")) status = "white stone; occupied";
      point.setAttribute("aria-label", "Row " + row + ", column " + col + ": " + status);
    });
  }
  function warningText(zh) {
    if (/舊進度格式損壞/.test(zh)) return "Previous progress could not be read or backed up. Changes have not been saved. Check browser storage before continuing.";
    if (/無法寫入|未保存/.test(zh)) return "Progress could not be saved. Check browser storage permissions and free space before continuing.";
    if (/原始內容已保留/.test(zh)) return "Older progress could not be read safely. A local recovery copy was kept; do not assume that older progress was restored.";
    return "A storage error occurred. Progress may not have been saved; do not assume the operation succeeded.";
  }
  function phaseLabel(context) {
    if (context.solved && context.answersThisTurn > 1) return "Task: practice · Status: corrected after retry";
    if (context.solved) return "Task: practice · Status: answer recorded";
    if (context.answersThisTurn > 0) return "Task: practice · Status: retry after an incorrect answer";
    if (context.hintShown) return "Task: practice · Status: hint viewed, answer pending";
    return "Task: practice · Status: try without the answer";
  }
  function nowLabel(context) {
    if (context.solved) return "Review why Black's move captured White. Then continue.";
    if (context.answersThisTurn > 0) return "Count White's remaining liberties and try another move. Your first answer is kept.";
    if (context.hintShown) return "Use the hint to choose a move. The hint does not count as an answer.";
    return "Find White's last liberty and play one black stone.";
  }
  function feedbackHtml(context, old) {
    if (!old) return "";
    if (context.solved) return '<span class="feedback-badge" aria-hidden="true">✓</span><strong class="feedback-title">Correct</strong><span class="answer-explanation">' + CONTENT.explanation + '</span>';
    if (context.answersThisTurn > 0) return '<span class="feedback-badge" aria-hidden="true">×</span><strong class="feedback-title">Not yet — try again</strong><span class="answer-explanation">' + CONTENT.error + '</span>';
    return "";
  }
  function refresh(context) {
    if (!dom) return;
    const valid = Boolean(context && context.problemId === TASK_ID && !context.externalMode);
    const chooser = getNode("#core-pilot-locale");
    const enOption = chooser && chooser.querySelector('option[value="en"]');
    if (enOption) enOption.disabled = !valid;
    if (!valid && locale === EN) { restore(); locale = ZH; }\n    if (valid && requestedLocale === EN) locale = EN;
    active = valid && locale === EN;
    const status = getNode("#core-pilot-status");
    if (status) status.textContent = valid
      ? (active ? "English pilot: this task only. Human language review is pending." : "English is available for this one capture task (pilot).")
      : "English for this task is not available here yet; Traditional Chinese remains in use.";
    if (chooser) chooser.value = active ? EN : ZH;
    dom.body.classList.toggle("i18n-core-pilot-en", active);
    dom.documentElement.lang = active ? EN : ZH;
    if (!active) return;
    for (const [selector, message] of Object.entries(translations)) write(selector, message);
    write("#learning-stage-badge", phaseLabel(context));
    write("#learning-now-summary", nowLabel(context));
    const answerArea = getNode("#answer-area");
    if (answerArea) write("#answer-area", '<span class="move-guide">Select a board intersection, or move with the arrow keys and press Enter or Space.<br>You can retry after an incorrect answer. Ask for a hint if needed.</span>', true);
    if (context.hintShown && !context.solved) {
      write("#hint-feedback", CONTENT.hint);
      write("#hint-button", "Hint shown");
    }
    if (context.solved) {
      write("#next-button", 'Next question <span aria-hidden="true">→</span>', true);
    }
    if (context.answersThisTurn > 0) {
      write("#feedback", feedbackHtml(context, getNode("#feedback")?.innerHTML), true);
    }
    const interaction = getNode("#interaction-feedback");
    if (interaction && !interaction.hidden && interaction.textContent) {
      const message = interaction.textContent;
      write("#interaction-feedback", /已有棋子|already a stone/.test(message) ? CONTENT.occupied : CONTENT.illegal);
    }
    const system = getNode("#system-status");
    if (system && !system.hidden && system.textContent) write("#system-status", warningText(system.textContent));
    getNode("#board-card")?.setAttribute("aria-label", "Interactive 9 by 9 Go board");
    boardAria();
  }
  function sync(context) {
    lastContext = context;
    if (active && (!context || context.problemId !== TASK_ID)) restore();\n
    refresh(context);
  }
  function choose(value) {
    if (value !== EN && value !== ZH) return;
    requestedLocale = value;\n    locale = value;
    if (value === ZH) restore();
    if (lastContext) refresh(lastContext);
    // Language preference is presentation-only: it never enters learner events.
    if (root.history && root.location) {
      const url = new URL(root.location.href);
      if (value === EN) url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      root.history.replaceState(null, "", url.toString());
    }
  }
  if (dom) {
    locale = new URL(root.location.href).searchParams.get("lang") === EN ? EN : ZH;\n    requestedLocale = locale;
    dom.addEventListener("DOMContentLoaded", () => {
      getNode("#core-pilot-locale")?.addEventListener("change", (event) => choose(event.target.value));
    }, { once: true });
  }
  const api = Object.freeze({ TASK_ID, EN, ZH, TERMS, CONTENT, phaseLabel, nowLabel, warningText, sync, choose });
  root.GoI18nPilot = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
