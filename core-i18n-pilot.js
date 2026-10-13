(function (root) {
  "use strict";
  // A single public Core task. All text here is presentation only.
  // Scoring, source items, exposure, learner events and saved schema stay authoritative in app.js.
  const TASK_ID = "u1-06";
  const EN = "en";
  const ZH = "zh-Hant-TW";
  const TERMS = Object.freeze({
    liberty: "Liberty: an empty point directly next to a stone along a board line.",
    atari: "Atari: a stone or connected group has just one liberty left.",
    capture: "Capture: fill an opposing group's last liberty so its stones are removed."
  });
  const COPY = Object.freeze({
    title: "Capture one white stone",
    prompt: "Black to play. Find White's last liberty and play there to capture the white stone.",
    hint: "Look at the empty point immediately below the white stone.",
    success: "Black filled White's last liberty. White has no liberties left, so the stone is removed.",
    error: "That move has not captured White. Count the empty points directly next to the white stone, then try again.",
    occupied: "A stone is already on that point. Choose an empty point.",
    illegal: "The rules did not allow that move. Try a different empty point.",
    storageFailure: "Progress could not be saved in this browser. Check your storage permissions or available space. Do not assume this answer was saved.",
    recoveryFailure: "An older progress file could not be read, and the browser could not save a recovery copy. Changes have not been saved.",
    recoverySaved: "Older progress could not be loaded safely. A local recovery copy was kept; this does not mean the old progress was restored."
  });
  const doc = root.document || null;
  const originals = new Map();
  let requested = ZH;
  let context = null;
  let active = false;

  function remember(node, property, newValue) {
    if (!node) return;
    let properties = originals.get(node);
    if (!properties) { properties = new Map(); originals.set(node, properties); }
    if (!properties.has(property)) properties.set(property, { original: property.startsWith("attr:") ? node.getAttribute(property.slice(5)) : node[property], translated: null });
    if (property.startsWith("attr:")) node.setAttribute(property.slice(5), newValue);
    else node[property] = newValue;
    properties.get(property).translated = property.startsWith("attr:") ? node.getAttribute(property.slice(5)) : node[property];
  }
  function restore() {
    for (const [node, fields] of originals) {
      for (const [property, record] of fields) {
        const isAttr = property.startsWith("attr:");
        const name = property.slice(5);
        const current = isAttr ? node.getAttribute(name) : node[property];
        // Never restore stale text over a newly rendered learner state.
        if (current !== record.translated) continue;
        if (isAttr) {
          if (record.original === null) node.removeAttribute(name);
          else node.setAttribute(name, record.original);
        } else node[property] = record.original;
      }
    }
    originals.clear();
  }
  function node(selector) { return doc && doc.querySelector(selector); }
  function text(selector, value) {
    const el = node(selector);
    if (el) { remember(el, "textContent", value); remember(el, "attr:lang", EN); }
  }
  function html(selector, value) {
    const el = node(selector);
    if (el) { remember(el, "innerHTML", value); remember(el, "attr:lang", EN); }
  }
  function attribute(selector, key, value) {
    const el = node(selector);
    if (el) remember(el, "attr:" + key, value);
  }
  function phaseLabel(s) {
    if (s.solved && s.answersThisTurn > 1) return "Practice · Correct after retry";
    if (s.solved) return "Practice · Correct answer recorded";
    if (s.answersThisTurn > 0) return "Practice · Try again";
    if (s.hintShown) return "Practice · Hint viewed; first answer pending";
    return "Practice · Answer independently";
  }
  function nowLabel(s) {
    if (s.solved) return "Read the reason for the capture, then go to the next question.";
    if (s.answersThisTurn > 0) return "Count the white stone's liberties again. Your first answer remains recorded.";
    if (s.hintShown) return "Use the hint to find a move. Showing a hint is not an answer.";
    return "Find the last liberty of the white stone and play there.";
  }
  function warningText(message) {
    if (message.includes("舊進度格式損壞")) return COPY.recoveryFailure;
    if (message.includes("復原副本") || message.includes("原始內容已保留")) return COPY.recoverySaved;
    if (message.includes("無法寫入") || message.includes("未保存")) return COPY.storageFailure;
    return "A browser storage problem was reported; the save result is not confirmed.";
  }
  function localeFromUrl() {
    if (!root.location || !root.location.href || typeof URL === "undefined") return ZH;
    return new URL(root.location.href).searchParams.get("lang") === EN ? EN : ZH;
  }
  function feedbackHtml(s) {
    if (s.solved) return '<span class="feedback-badge" aria-hidden="true">✓</span><strong class="feedback-title">Correct</strong><span class="answer-explanation">' + COPY.success + '</span>';
    return '<span class="feedback-badge" aria-hidden="true">×</span><strong class="feedback-title">Not yet — try again</strong><span class="answer-explanation">' + COPY.error + '</span>';
  }
  function apply(s) {
    restore();
    const supported = Boolean(s && s.problemId === TASK_ID && !s.externalMode);
    active = supported && requested === EN;
    const chooser = node("#core-pilot-locale");
    if (chooser) {
      const option = chooser.querySelector('option[value="en"]');
      if (option) option.disabled = !supported;
      chooser.value = active ? EN : ZH;
    }
    const availability = node("#core-pilot-status");
    if (availability) availability.textContent = supported
      ? (active ? "English candidate for this capture task only. Language and Go-content review are pending." : "English is available as an unreviewed pilot for this capture task.")
      : "English is not yet available for this question. The original Chinese text is shown.";
    if (!active) return;

    // The rest of the website is not translated: keep html[lang=zh-Hant-TW].
    // Mark only genuinely translated surfaces with lang=en.
    attribute(".practice-grid", "lang", EN);
    const fixed = {
      "#lesson-kicker": "Unit 1 · Beginner",
      "#lesson-title": "Atari and capturing",
      "#lesson-subtitle": "Lesson 2 · Four questions",
      "#lesson-badge": "Capture practice",
      "#question-number": "Question 1 of 4",
      "#question-tag": "Play a move",
      "#question-title": COPY.title,
      "#question-prompt": COPY.prompt,
      ".question-prompt-label": "Question",
      ".workspace-task-cue strong": "Now",
      "#player-color": "● Black to play",
      ".board-foot > span:nth-child(2)": "○ White",
      "#board-instruction": "Click a board point, or use arrow keys, then Enter or Space.",
      "#answer-policy": "Choose a point on the board. If the move is wrong, you can retry.",
      "#hint-button": "Show a hint",
      ".board-card .card-top > span:first-child": "9 × 9 practice board",
      ".board-card .board-status": "Local practice",
      ".takeaway > span": "Remember",
      "#takeaway-text": "Find the opponent's last liberty before trying to capture.",
      "#teaching-text": "A stone or connected group is in atari when it has one liberty left. If the opponent fills that last liberty, the group is captured and removed.",
      "#teaching-check": "Find the last liberty before playing the capturing move.",
      "#lesson-intro-title": "Learn first: Atari and capturing",
      "#lesson-intro-kicker": "Short lesson · one automatic introduction per lesson",
      "#lesson-intro-button": "Review this short lesson",
      "#lesson-intro-first-use": "Look at the example, then try the board question yourself. The next review will use another position.",
      "#sidebar-current-task-label": "Practice",
      "#sidebar-current-task-description": "Play a move and review the result",
      "#top-course-context": "Unit 1 · Lesson 2",
      "#current-course-context": "Unit 1 · Lesson 2",
      "#learning-stage-badge": phaseLabel(s),
      "#sidebar-question-phase": s.solved ? "Answer recorded" : s.answersThisTurn ? "Retry" : s.hintShown ? "Hint viewed" : "Your turn",
      "#learning-now": nowLabel(s),
      "#learning-now-summary": nowLabel(s),
      "#learning-why": "This is an existing public practice question, not a private or formal evaluation.",
      "#learning-next": s.solved ? "Continue to the next question." : "Choose one move and check the result.",
      "#workspace-next-summary": s.solved ? "Continue to the next question." : "Choose a move on the board.",
      "#lesson-term-count": "(2 terms)"
    };
    for (const [selector, value] of Object.entries(fixed)) text(selector, value);
    html("#lesson-term-list", "<div><dt>Atari</dt><dd>" + TERMS.atari + "</dd></div><div><dt>Capture</dt><dd>" + TERMS.capture + "</dd></div>");
    html("#answer-area", '<span class="move-guide">Choose a point on the board, or move with the arrow keys and press Enter or Space. You may retry after an incorrect answer.</span>');
    html("#lesson-intro-start-button", 'Start this question <span aria-hidden="true">→</span>');
    const captions = [
      "White is surrounded above, left and right. The marked empty point is its last liberty.",
      "Black plays on White's last liberty, so the white stone is removed."
    ];
    text("#teaching-demo-caption", captions[s.demoStepIndex === 1 ? 1 : 0]);
    if (s.hintShown && !s.solved) {
      text("#hint-feedback", COPY.hint);
      text("#hint-button", "Hint shown");
    }
    if (s.answersThisTurn > 0) html("#feedback", feedbackHtml(s));
    if (s.solved) html("#next-button", 'Next question <span aria-hidden="true">→</span>');
    const issue = node("#interaction-feedback");
    if (issue && !issue.hidden && issue.textContent) text("#interaction-feedback", /已有棋子/.test(issue.textContent) ? COPY.occupied : COPY.illegal);
    const system = node("#system-status");
    if (system && !system.hidden && system.textContent) text("#system-status", warningText(system.textContent));

    attribute("#board-card", "aria-label", "Interactive 9 by 9 Go board");
    attribute("#board", "aria-label", "9 by 9 Go board");
    const boardSvg = node('#board svg[role="group"]');
    if (boardSvg) remember(boardSvg, "attr:aria-label", "9 by 9 Go board for capturing one white stone");
    const board = node("#board");
    if (board) board.querySelectorAll("[data-board-point]").forEach((point) => {
      const existing = point.getAttribute("aria-label") || "";
      const status = /黑棋/.test(existing) ? "black stone; occupied"
        : /白棋/.test(existing) ? "white stone; occupied"
        : point.dataset.occupied === "true" ? "occupied" : "empty point; playable";
      remember(point, "attr:aria-label", "Row " + (Number(point.dataset.y) + 1) + ", column " + (Number(point.dataset.x) + 1) + ": " + status);
    });
    // Dynamic task names and ARIA are translated, but storage/export keys never change.
  }
  function sync(nextContext) {
    context = nextContext;
    apply(context);
  }
  function choose(value) {
    if (value !== EN && value !== ZH) return;
    if (value === EN && (!context || context.problemId !== TASK_ID || context.externalMode)) return;
    requested = value;
    apply(context);
    if (root.history && root.location && root.location.href && typeof URL !== "undefined") {
      const url = new URL(root.location.href);
      if (value === EN) url.searchParams.set("lang", EN);
      else url.searchParams.delete("lang");
      root.history.replaceState(null, "", url.toString());
    }
  }
  requested = localeFromUrl();
  if (doc && typeof doc.addEventListener === "function") doc.addEventListener("DOMContentLoaded", () => {
    const chooser = node("#core-pilot-locale");
    if (chooser) chooser.addEventListener("change", () => choose(chooser.value));
  }, { once: true });
  const api = Object.freeze({ TASK_ID, EN, ZH, TERMS, COPY, sync, choose, phaseLabel, nowLabel, warningText });
  root.GoI18nPilot = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
