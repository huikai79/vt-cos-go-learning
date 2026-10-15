(function (root) {
  "use strict";
  // Presentation-only Core adapter. It must not replace GoContent, whose
  // item IDs, boards, legal moves, answer and events remain authoritative.
  const USER_FIELDS = ["title", "prompt", "hint", "explanation"];
  const LESSON_FIELDS = ["title", "text", "takeaway", "badge"];
  const forbidden = new Set(["answer", "goal", "stones", "rules", "scoring", "skillId", "lesson", "unit", "type", "id", "events", "firstResponse", "exposure"]);
  function blocked(reason) {
    const error = new Error("Core locale copy unavailable: " + reason);
    error.code = "LOCALE_COPY_BLOCKED";
    throw error;
  }
  function assertKeys(copy, allowed, id) {
    if (!copy || typeof copy !== "object" || Array.isArray(copy)) blocked(id + " is missing");
    for (const name of Object.keys(copy)) {
      if (forbidden.has(name) && !(name === "id" && allowed.includes("id"))) blocked(id + " contains protected field " + name);
      if (!allowed.includes(name)) blocked(id + " has unexpected field " + name);
    }
  }
  function checkedText(value, id) {
    if (typeof value !== "string" || !value.trim()) blocked(id + " has no reviewed text");
    return value;
  }
  function accepted(meta) {
    return meta && meta.editorialStatus === "approved"
      && meta.goReview === "approved"
      && meta.nativeReview === "approved";
  }
  function languageView(source, bundle, locale) {
    if (locale === "zh-Hant-TW") {
      return Object.freeze({ locale, status: "source",
        unit: (index) => source.units[index],
        lesson: (index) => source.lessons[index],
        problem: (id) => source.problems.find((p) => p.id === id)
      });
    }
    if (locale !== "en") blocked("locale " + String(locale));
    if (!bundle || bundle.schemaVersion !== 1 || bundle.locale !== locale || bundle.status !== "approved-for-runtime") blocked("English bundle not promoted");
    const { lessons, items, demos, terms } = bundle;
    if (!lessons || !items || !demos || !terms) blocked("incomplete English bundle");
    if (lessons.lessons.length !== source.lessons.length || lessons.units.length !== source.units.length
      || demos.lessons.length !== source.lessons.length || terms.lessons.length !== source.lessons.length
      || Object.keys(items.items).length !== source.problems.length) blocked("incomplete canonical coverage");
    if (!lessons.units.every(accepted) || !lessons.lessons.every(accepted)
      || !demos.lessons.every(l => l.steps.every(accepted))
      || !terms.lessons.every(l => l.terms.every(t => accepted(t) || accepted(l)))
      || !Object.values(items.items).every(accepted)) blocked("human or Go review incomplete");
    const allProblems = new Map(source.problems.map(p => [p.id, p]));
    const localizedProblems = new Map();
    for (const [id, copy] of Object.entries(items.items)) {
      const original = allProblems.get(id);
      if (!original || copy.id !== id) blocked("unknown canonical item " + id);
      // Draft provenance metadata is never used as a source of legal moves.
      assertKeys(copy, ["id", ...USER_FIELDS, "options", "sourceVersion", "editorialStatus", "goReview", "nativeReview"], id);
      const text = Object.fromEntries(USER_FIELDS.map(k => [k, checkedText(copy[k], id + "." + k)]));
      if (original.type === "choice") {
        if (!Array.isArray(copy.options) || copy.options.length !== original.options.length) blocked("option count " + id);
        text.options = copy.options.map((value, i) => checkedText(value, id + ".options." + i));
      } else if (Object.hasOwn(copy, "options")) blocked("non-choice has options " + id);
      localizedProblems.set(id, Object.freeze(text));
    }
    const lessonViews = source.lessons.map((original, i) => {
      const copy = lessons.lessons[i], demo = demos.lessons[i], glossary = terms.lessons[i];
      if (!copy || !demo || !glossary || copy.lessonIndex !== i || demo.lessonIndex !== i || glossary.lessonIndex !== i) blocked("lesson index " + i);
      if (original.demoSteps.length !== demo.steps.length || original.terms.length !== glossary.terms.length) blocked("demo or glossary count " + i);
      const view = Object.fromEntries(LESSON_FIELDS.map(k => [k, checkedText(copy[k], "lesson " + i + "." + k)]));
      view.demoSteps = demo.steps.map((entry, j) => {
        if (entry.stepIndex !== j) blocked("demo index " + i + ":" + j);
        assertKeys(entry, ["stepIndex", "label", "caption", "editorialStatus", "goReview", "nativeReview"], "demo " + i + ":" + j);
        return Object.freeze({ label: checkedText(entry.label, "demo label"), caption: checkedText(entry.caption, "demo caption") });
      });
      view.terms = glossary.terms.map((entry, j) => {
        if (entry.termIndex !== j) blocked("term index " + i + ":" + j);
        assertKeys(entry, ["termIndex", "term", "definition", "editorialStatus", "goReview", "nativeReview"], "term " + i + ":" + j);
        return Object.freeze({ term: checkedText(entry.term, "term"), definition: checkedText(entry.definition, "definition") });
      });
      return Object.freeze(view);
    });
    return Object.freeze({
      locale, status: "approved",
      unit: (index) => {
        const v = lessons.units[index];
        if (!v || v.unitIndex !== index) blocked("unit index " + index);
        return Object.freeze({ title: checkedText(v.title, "unit title") });
      },
      lesson: (index) => lessonViews[index],
      problem: (id) => localizedProblems.get(id) || blocked("missing item " + id)
    });
  }
  // DRAFT English UI copy. This is only a presentation dictionary:
  // selecting "en" is impossible while the full-site locale gate is closed.
  // In particular, an evaluation first answer must never reveal correctness.
  const englishUi = Object.freeze({
    hintButton: "Show a hint",
    hintShown: "Hint shown",
    correctTitle: "Correct",
    incorrectTitle: "Not quite",
    localSgfCorrect: "Matches the recorded move",
    localSgfIncorrect: "Different from the recorded move",
    evaluationRecorded: "Your first answer has been recorded. Results stay hidden until this batch is complete.",
    retryAfterWrong: "This answer does not meet the task. Check the board, then try again or open a hint.",
    localSgfRetry: "You can try again. This compares the recorded move, not whether your move is necessarily bad.",
    occupiedPoint: "There is already a stone here. Choose an empty intersection.",
    demoCount: ({current,total}) => "Step " + current + " of " + total,
    demoRestart: "Review from the start ↺",
    demoNext: "Next step →",
    introTitle: ({title}) => "First, explore: " + title,
    termCount: ({count}) => "(" + count + " " + (count === 1 ? "term" : "terms") + ")",
    firstLessonStart: "Ready? Start question 1",
    lessonStart: "Start this lesson’s practice",
    firstLessonIntro: "First visit · Start after the example",
    lessonIntro: "Lesson overview · Shown automatically once per lesson",
    showLessonIntro: "Review this lesson",
    showProblemIntro: "Read the explanation for this question",
    nextQuestion: "Next question",
    nextLesson: "Explore the next lesson",
    nextUnit: ({unit}) => "Explore Unit " + unit,
    finishCore: "Finish the Core course",
    playerBlack: "● Black to play",
    playerWhite: "○ White to play",
    pickPoint: "◎ Select a point",
    moveGuide: "Select a point on the board, or use the arrow keys and Enter or Space. You can retry an incorrect answer or ask for a hint.",
    moveInstruction: "Select an intersection. With a keyboard, use the arrow keys and Enter or Space.",
    movePolicy: "Choose an intersection. You can try again if your answer is incorrect.",
    evaluationPolicy: "Your first answer is recorded immediately. Correctness stays hidden until the batch is complete.",
    localSgfPolicy: "Play the move you remember from the game record. A different choice can be retried; it is not necessarily a bad move.",
    choiceFocused: "Look at the stones marked with gold circles.",
    choiceRead: "Read the question and choose an answer.",
    choicePolicy: "Choose an answer to submit it. You can retry an incorrect choice.",
    spotGuide: "Select an intersection, or use the arrow keys and Enter or Space. This question asks about a local point; it does not identify the only best move on the whole board.",
    spotInstruction: "Select the point to compare, using the arrow keys and Enter or Space if preferred.",
    spotPolicy: "Your selected point is submitted immediately. You can retry an incorrect answer.",
    observedBoard: "Board for observing the position",
    playableBoard: "Board where you can play a move",
    selectedPointBoard: "Board where you can select a local point",
    connectYes: "Yes, one connected group",
    connectNo: "No, two separate groups",
    liberties: ({count}) => count + " " + (count === 1 ? "liberty" : "liberties"),
    questionCounter: ({index,total}) => "Question " + index + " of " + total + " in this lesson",
    currentQuestion: "Current question",
    unknownProblemCopy: "This question's English wording is unavailable. No answer has been submitted."
  });
  function uiText(locale, key, sourceText, params = {}) {
    if (locale === "zh-Hant-TW") return sourceText;
    if (locale !== "en" || !Object.hasOwn(englishUi, key)) blocked("missing UI string " + locale + ":" + key);
    const entry = englishUi[key];
    const result = typeof entry === "function" ? entry(params) : entry;
    if (typeof result !== "string" || !result.trim() || result.includes("undefined") || result.includes("NaN")) blocked("invalid UI text " + key);
    return result;
  }
  const api = Object.freeze({ languageView, uiText, englishUi });
  root.GoCoreLocaleView = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
