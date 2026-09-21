(function () {
  "use strict";
  const { BLACK, boardFromStones, groupAt, playMove } = window.GoCore;
  const { units, lessons, problems, skills } = window.GoContent;
  const { phase2Problems } = window.GoPhase2Content;
  const { fixedApplicationProbes, sampleSgf } = window.GoPhase4Content;
  const Sgf = window.GoSgf;
  const Scheduler = window.GoScheduler;
  const Trial = window.GoTrial;
  const Metrics = window.GoLearningMetrics;
  const storageKey = "go-learning-prototype-v7";
  const storageRecoveryKey = "go-learning-prototype-recovery-v1";
  const legacyStorageKeys = ["go-learning-prototype-v6", "go-learning-prototype-v5", "go-learning-prototype-v4", "go-learning-prototype-v3", "go-learning-prototype-v2", "go-learning-prototype-v1"];
  const eventPolicyVersion = "trial-events-v4";
  const uiVersion = "learner-flow-v29";
  const contentCatalogVersion = 3;
  let pendingSgf = null;
  let storageReadIssue = null;
  let storageRecoveryNotice = "";
  let storageWarningMessage = "";
  const saved = readSaved();
  const savedHasStarted = Boolean(saved.hasStarted || (saved.completed && saved.completed.length) || (saved.events && saved.events.length) || (saved.attempts && Object.keys(saved.attempts).length));
  const state = {
    index: Number.isInteger(saved.index) && saved.index >= 0 && saved.index < problems.length ? saved.index : 0,
    navUnitIndex: Number.isInteger(saved.navUnitIndex) && saved.navUnitIndex >= 0 && saved.navUnitIndex < units.length
      ? saved.navUnitIndex
      : lessons[Number.isInteger(saved.index) && problems[saved.index] ? problems[saved.index].lesson : 0].unit,
    hasStarted: savedHasStarted,
    lessonIntroPending: typeof saved.lessonIntroPending === "boolean" ? saved.lessonIntroPending : !savedHasStarted,
    seenLessonIntros: new Set((Array.isArray(saved.seenLessonIntros) ? saved.seenLessonIntros : []).filter((lessonIndex) => Number.isInteger(lessonIndex) && lessons[lessonIndex])),
    reviewMode: false,
    reviewQueue: [],
    solved: false,
    wrongThisTurn: 0,
    answersThisTurn: 0,
    hintShown: false,
    presentedAt: null,
    presentationId: null,
    activePresentation: asRecord(saved.activePresentation),
    board: null,
    boardCursor: null,
    lastMove: null,
    scheduledProblem: null,
    externalMode: null,
    applicationIndex: Number.isInteger(saved.applicationIndex) && saved.applicationIndex >= 0 ? saved.applicationIndex : 0,
    applicationResults: Array.isArray(saved.applicationResults) ? saved.applicationResults : [],
    applicationEvents: Array.isArray(saved.applicationEvents) ? saved.applicationEvents : [],
    activeApplicationPresentation: asRecord(saved.activeApplicationPresentation),
    localExercises: Array.isArray(saved.localExercises) ? saved.localExercises.filter((entry) => asRecord(entry)) : [],
    activeLocalSgfReflection: asRecord(saved.activeLocalSgfReflection),
    trial: Trial.stateFrom(saved.trial),
    evaluationBatch: null,
    schedulerPolicy: ["fixed-spacing-v1", "adaptive-candidate-v1"].includes(saved.schedulerPolicy) ? saved.schedulerPolicy : "fixed-spacing-v1",
    scheduler: Scheduler.stateFrom(saved.scheduler),
    completed: new Set((Array.isArray(saved.completed) ? saved.completed : []).filter((id) => problems.some((problem) => problem.id === id))),
    missed: new Set((Array.isArray(saved.missed) ? saved.missed : []).filter((id) => problems.some((problem) => problem.id === id))),
    attempts: asRecord(saved.attempts) || {},
    events: Array.isArray(saved.events) ? saved.events : [],
    exposures: buildExposures(saved)
  };
  let storageWriteFailed = false;
  let demoLessonTitle = null;
  let demoStepIndex = 0;
  const $ = (id) => document.getElementById(id);

  function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  }

  function parseSaved(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      const value = JSON.parse(raw);
      if (key === storageKey && !savedShapeIsSafe(value)) {
        storageReadIssue = { key, raw, reason: "invalid_field_types" };
        return null;
      }
      return value || null;
    }
    catch (_) {
      if (key === storageKey) storageReadIssue = { key, raw, reason: "malformed_json" };
      return null;
    }
  }

  function savedShapeIsSafe(value) {
    if (value === null) return true;
    if (!asRecord(value)) return false;
    for (const key of ["completed", "missed", "events", "applicationResults", "applicationEvents", "localExercises", "seenLessonIntros"]) {
      if (value[key] !== undefined && !Array.isArray(value[key])) return false;
    }
    for (const key of ["attempts", "exposures"]) {
      if (value[key] !== undefined && !asRecord(value[key])) return false;
    }
    return value.index === undefined || Number.isInteger(value.index);
  }

  function readSaved() {
    const value = parseSaved(storageKey) || legacyStorageKeys.map(parseSaved).find(Boolean) || {};
    if (value.contentCatalogVersion === contentCatalogVersion) return value;
    const oldIndex = Number.isInteger(value.index) ? value.index : 0;
    const priorCatalogVersion = value.contentCatalogVersion || 1;
    const migratedIndex = priorCatalogVersion === 1
      ? (oldIndex >= 26 ? oldIndex + 8 : oldIndex)
      : (oldIndex >= 30 ? oldIndex + 4 : oldIndex);
    return { ...value, index: migratedIndex, contentCatalogVersion, migratedCourseIndexFromCatalogVersion: value.contentCatalogVersion || 1 };
  }

  function buildExposures(data) {
    if (asRecord(data.exposures)) return data.exposures;
    const exposures = {};
    for (const event of Array.isArray(data.events) ? data.events : []) {
      if (!event.problemId || exposures[event.problemId]) continue;
      exposures[event.problemId] = {
        firstExposedAt: event.presentedAt || event.occurredAt,
        firstPresentationId: event.presentationId || null,
        contentVersion: event.problemContentVersion || null,
        inferredFromLegacyEvent: true
      };
    }
    return exposures;
  }

  function save() {
    if (storageReadIssue) {
      try {
        localStorage.setItem(storageRecoveryKey, JSON.stringify({
          schemaVersion: 1,
          preservedAt: new Date().toISOString(),
          sourceKey: storageReadIssue.key,
          reason: storageReadIssue.reason,
          rawValue: storageReadIssue.raw
        }));
        storageReadIssue = null;
        storageRecoveryNotice = "偵測到無法安全載入的舊進度；原始內容已保留在本機復原副本，課程已用可讀狀態啟動。";
      }
      catch (_) {
        storageWriteFailed = true;
        storageWarningMessage = "舊進度格式損壞，而且無法建立復原副本；為避免覆寫，本次變更未保存。請先檢查瀏覽器儲存空間。";
        showStorageWarning();
        return false;
      }
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        schemaVersion: 7,
        eventPolicyVersion,
        uiVersion,
        contentCatalogVersion,
        index: state.index,
        currentProblemId: problems[state.index] && problems[state.index].id,
        navUnitIndex: state.navUnitIndex,
        hasStarted: state.hasStarted,
        lessonIntroPending: state.lessonIntroPending,
        seenLessonIntros: [...state.seenLessonIntros],
        completed: [...state.completed],
        missed: [...state.missed],
        attempts: state.attempts,
        events: state.events,
        exposures: state.exposures,
        activePresentation: state.activePresentation,
        schedulerPolicy: state.schedulerPolicy,
        scheduler: state.scheduler,
        applicationIndex: state.applicationIndex,
        applicationResults: state.applicationResults,
        applicationEvents: state.applicationEvents,
        activeApplicationPresentation: state.activeApplicationPresentation,
        localExercises: state.localExercises,
        activeLocalSgfReflection: state.activeLocalSgfReflection,
        trial: state.trial
      }));
      storageWriteFailed = false;
      storageWarningMessage = "";
      return true;
    }
    catch (_) {
      storageWriteFailed = true;
      storageWarningMessage = "無法寫入瀏覽器儲存空間；本次變更未保存。請先匯出可用資料，並檢查瀏覽器的儲存權限或剩餘空間。";
      showStorageWarning();
      return false;
    }
  }

  function showStorageWarning() {
    const feedback = $("feedback");
    if (!feedback) return;
    if (storageWriteFailed) {
      feedback.className = "feedback error";
      feedback.textContent = storageWarningMessage;
    } else if (storageRecoveryNotice) {
      feedback.className = "feedback error";
      feedback.textContent = storageRecoveryNotice;
      storageRecoveryNotice = "";
    }
  }

  function current() { return state.scheduledProblem || problems[state.index]; }
  function currentLesson() {
    if (current().lesson !== undefined) return lessons[current().lesson];
    if (state.externalMode === "application") return { unit: 0, title: "固定應用探測", subtitle: "減少技能線索的固定局面", badge: "局部應用檢核", text: "先找能由局部規則直接判定的手；這類固定局面只檢查局部技能的自行發現，與完整全局判斷及自然實戰分開。", demo: "先在沒有技能名稱提示下，說出你觀察到的棋形，再決定是否落子。", takeaway: "局部沒有明確強制手時，保留判斷並回到全局。" };
    if (state.externalMode === "evaluation") return { unit: 0, title: "個人流程試行", subtitle: "已曝光題的無提示首答批次", badge: "pilot · 不作正式驗收", text: "每題只記第一次作答；整批完成前不顯示正誤。這些題目已在舊 R1 自我審查中看過，只用來檢查操作流程、資料完整性、七天返回與負擔。", demo: "先完成自己的第一個答案；本批不提供逐題講解。", takeaway: "兩批結果只作個人描述，不代表未見保留、遷移或學習成效。" };
    if (state.externalMode === "local_sgf") return { unit: 0, title: "棋譜局部複習", subtitle: "原局著手重建", badge: "人工確認", text: "先回想原局的候選手，再重建原著。外部引擎只能提供線索，教學結論仍需人工確認。", demo: "先說出你當時最想下的一手與理由，再看原局怎麼走。", takeaway: "記下漏看的棋形，日後用新題再檢查。" };
    return { unit: 0, title: "基礎題庫｜間隔練習", subtitle: "固定間隔或候選自適應", badge: "間隔練習", text: "依目前選題政策完成一題；保留驗收題不會自動混入。", demo: "先在沒有答案提示下完成這題，之後再比較具體理由。", takeaway: "先自己找答案；回饋後再安排下一次間隔。" };
  }
  function currentUnit() { return units[currentLesson().unit]; }
  function currentSkill() { return skills.find((skill) => skill.id === current().skillId) || null; }

  function elapsedMs() {
    return state.presentedAt ? Math.max(0, Date.now() - new Date(state.presentedAt).getTime()) : null;
  }

  function eventId() {
    return `${Date.now()}-${state.events.length + 1}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function appendEvent(details) {
    state.events.push({
      schemaVersion: 3,
      eventPolicyVersion,
      id: eventId(),
      occurredAt: new Date().toISOString(),
      ...details,
      uiVersion: details.uiVersion || uiVersion
    });
  }

  function recordEvent(type, details) {
    if (state.externalMode) return;
    const problem = current();
    const skill = currentSkill();
    if (!skill) return;
    appendEvent({
      type,
      presentedAt: state.presentedAt,
      elapsedMs: elapsedMs(),
      presentationId: state.presentationId,
      problemId: problem.id,
      problemContentVersion: problem.contentVersion || 1,
      taskFeatureVersion: problem.taskFeatureVersion || null,
      skillId: skill.id,
      skillVersion: skill.version,
      taskMode: problem.taskMode,
      pool: problem.pool,
      familyId: problem.familyId || problem.motherFamilyId || null,
      transferLevel: problem.transferLevel || "T0",
      ...details
    });
  }

  function sameGroup(board, first, second) {
    const group = groupAt(board, first[0], first[1]);
    return Boolean(group && group.stones.some(([x, y]) => x === second[0] && y === second[1]));
  }

  function goalReached(problem, before, result, point) {
    const goal = problem.goal;
    if (goal.type === "capture") return result.captured.length === goal.count && result.captured.some(([x, y]) => x === goal.target[0] && y === goal.target[1]);
    if (goal.type === "exact") return point[0] === goal.answer[0] && point[1] === goal.answer[1];
    if (goal.type === "rescue") {
      const [x, y] = goal.target;
      return groupAt(before, x, y).liberties.length === 1 && groupAt(result.board, x, y).liberties.length > 1;
    }
    const [first, second] = goal.targets;
    if (goal.type === "join") return !sameGroup(before, first, second) && sameGroup(result.board, first, second);
    if (goal.type === "block") {
      const firstLiberties = groupAt(before, first[0], first[1]).liberties;
      const secondLiberties = new Set(groupAt(before, second[0], second[1]).liberties.map(([x, y]) => `${x},${y}`));
      const common = firstLiberties.filter(([x, y]) => secondLiberties.has(`${x},${y}`));
      return common.length === 1 && common[0][0] === point[0] && common[0][1] === point[1] && !sameGroup(result.board, first, second);
    }
    return false;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function endPresentation(reason) {
    const active = state.activePresentation;
    if (!active) return;
    const outcome = state.solved ? "solved" : state.answersThisTurn ? "unfinished_after_attempt" : "unanswered";
    appendEvent({
      type: "presentation_end",
      presentedAt: active.presentedAt,
      elapsedMs: elapsedMs(),
      presentationId: active.presentationId,
      problemId: active.problemId,
      problemContentVersion: active.problemContentVersion,
      taskFeatureVersion: active.taskFeatureVersion,
      skillId: active.skillId,
      skillVersion: active.skillVersion,
      taskMode: active.taskMode,
      pool: active.pool,
      uiVersion: active.uiVersion || "unknown_pre_navigation-v2",
      firstExposure: active.firstExposure,
      answerCount: state.answersThisTurn,
      hintShown: state.hintShown,
      outcome,
      endedReason: reason
    });
    state.activePresentation = null;
    state.presentationId = null;
    save();
  }

  function recoverInterruptedPresentation() {
    const active = state.activePresentation;
    if (!active) return;
    appendEvent({
      type: "presentation_end",
      presentedAt: active.presentedAt,
      elapsedMs: null,
      presentationId: active.presentationId,
      problemId: active.problemId,
      problemContentVersion: active.problemContentVersion,
      taskFeatureVersion: active.taskFeatureVersion,
      skillId: active.skillId,
      skillVersion: active.skillVersion,
      taskMode: active.taskMode,
      pool: active.pool,
      uiVersion: active.uiVersion || "unknown_pre_navigation-v2",
      firstExposure: active.firstExposure,
      answerCount: null,
      hintShown: null,
      outcome: "interrupted",
      endedReason: "session_reloaded",
      recovered: true
    });
    state.activePresentation = null;
    state.presentationId = null;
    save();
  }

  function endApplicationPresentation(reason, recovered = false) {
    const active = state.activeApplicationPresentation;
    if (!active) return;
    state.applicationEvents.push({
      type: "presentation_end",
      occurredAt: new Date().toISOString(),
      presentationId: active.presentationId,
      problemId: active.problemId,
      presentedAt: active.presentedAt,
      elapsedMs: recovered ? null : elapsedMs(),
      outcome: recovered ? "interrupted" : state.solved ? "solved" : state.answersThisTurn ? "unfinished_after_attempt" : "unanswered",
      answerCount: recovered ? null : state.answersThisTurn,
      hintShown: recovered ? null : state.hintShown,
      endedReason: reason,
      recovered,
      uiVersion: active.uiVersion || "unknown_pre_navigation-v2"
    });
    state.activeApplicationPresentation = null;
  }

  function beginApplicationPresentation(problem) {
    const presentationId = eventId();
    const presentedAt = new Date().toISOString();
    state.activeApplicationPresentation = { presentationId, problemId: problem.id, presentedAt, uiVersion };
    state.applicationEvents.push({ type: "presented", occurredAt: presentedAt, presentedAt, presentationId, problemId: problem.id, applicability: problem.applicability || "applicable", uiVersion });
    save();
  }

  function recoverInterruptedApplicationPresentation() {
    if (!state.activeApplicationPresentation) return;
    endApplicationPresentation("session_reloaded", true);
    save();
  }

  function startProblem(index, endReason = "navigation", updateNavUnit = true, showLessonIntro = false) {
    endPresentation(endReason);
    endApplicationPresentation(endReason);
    state.scheduledProblem = null;
    state.externalMode = null;
    state.index = index;
    state.lessonIntroPending = Boolean(showLessonIntro && !state.seenLessonIntros.has(problems[index].lesson));
    if (updateNavUnit) state.navUnitIndex = lessons[problems[index].lesson].unit;
    state.solved = false;
    state.wrongThisTurn = 0;
    state.answersThisTurn = 0;
    state.hintShown = false;
    state.presentedAt = new Date().toISOString();
    state.board = boardFromStones(current().stones);
    state.boardCursor = null;
    state.lastMove = null;
    const problem = current();
    const skill = currentSkill();
    if (skill) {
      const firstExposure = !state.exposures[problem.id];
      state.presentationId = eventId();
      state.activePresentation = {
        presentationId: state.presentationId,
        problemId: problem.id,
        problemContentVersion: problem.contentVersion || 1,
        taskFeatureVersion: problem.taskFeatureVersion || null,
        skillId: skill.id,
        skillVersion: skill.version,
        taskMode: problem.taskMode,
        pool: problem.pool,
        presentedAt: state.presentedAt,
        firstExposure,
        uiVersion
      };
      if (firstExposure) {
        state.exposures[problem.id] = {
          firstExposedAt: state.presentedAt,
          firstPresentationId: state.presentationId,
          contentVersion: problem.contentVersion || 1
        };
      }
      recordEvent("presented", { firstExposure, qualifiedOpportunity: false });
    }
    save();
    render();
  }

  function scrollBehavior() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function revealElement(id) {
    const title = $(id);
    if (title && typeof title.scrollIntoView === "function") title.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    if (title && typeof title.focus === "function") title.focus({ preventScroll: true });
  }

  function revealLessonStart() { revealElement($("lesson-intro-dialog").open ? "lesson-intro-title" : "lesson-title"); }
  function revealQuestionStart() { revealElement("question-title"); }

  function markCurrentLessonIntroSeen() {
    const lessonIndex = current().lesson;
    if (Number.isInteger(lessonIndex)) state.seenLessonIntros.add(lessonIndex);
    state.lessonIntroPending = false;
  }

  function showLessonIntroDialog() {
    const dialog = $("lesson-intro-dialog");
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    revealElement("lesson-intro-title");
  }

  function syncLessonIntroDialog() {
    if (state.lessonIntroPending && !state.externalMode && !state.reviewMode) showLessonIntroDialog();
  }

  function dismissLessonIntro() {
    if (!state.externalMode) {
      state.hasStarted = true;
      markCurrentLessonIntroSeen();
      save();
      renderLearningFlow();
      renderProgress();
    }
    const dialog = $("lesson-intro-dialog");
    if (dialog && dialog.open) dialog.close();
    revealQuestionStart();
  }

  function closeTools() {
    const tools = $("tools-menu");
    if (tools) tools.open = false;
  }

  function openLesson(index) {
    startProblem(index, "navigation", true, true);
    revealLessonStart();
  }

  function selectUnit(unitIndex) {
    if (!Number.isInteger(unitIndex) || unitIndex < 0 || unitIndex >= units.length) return;
    state.navUnitIndex = unitIndex;
    save();
    renderNav();
  }

  function startScheduledPractice() {
    closeTools();
    const decision = Scheduler.chooseNext(phase2Problems, state.scheduler, state.schedulerPolicy);
    if (!decision) {
      $("feedback").className = "feedback";
      $("feedback").textContent = "目前沒有可安排的新題；可改天再回來做延後複習。";
      return;
    }
    state.scheduler = decision.state;
    startExternalProblem(decision.problem, "scheduled");
  }

  function startExternalProblem(problem, mode) {
    closeTools();
    endPresentation(mode);
    endApplicationPresentation(mode);
    state.reviewMode = false;
    state.scheduledProblem = problem;
    state.externalMode = mode;
    state.activeLocalSgfReflection = mode === "local_sgf" ? {
      id: eventId(),
      problemId: problem.id,
      source: problem.source,
      candidate: "",
      reason: "",
      expectedOpponentResponse: "",
      savedAt: null,
      savedBeforeAnswer: null
    } : null;
    state.solved = false;
    state.wrongThisTurn = 0;
    state.answersThisTurn = 0;
    state.hintShown = false;
    state.presentedAt = new Date().toISOString();
    state.board = boardFromStones(current().stones);
    state.boardCursor = null;
    state.lastMove = null;
    save();
    render();
  }

  function renderSgfReflection() {
    const section = $("sgf-reflection");
    const reflection = state.activeLocalSgfReflection;
    const visible = state.externalMode === "local_sgf" && Boolean(reflection) && !state.solved;
    section.hidden = !visible;
    if (!visible) return;
    $("sgf-candidate-input").value = reflection.candidate || "";
    $("sgf-reason-input").value = reflection.reason || "";
    $("sgf-opponent-response-input").value = reflection.expectedOpponentResponse || "";
    $("sgf-reflection-save-button").textContent = reflection.savedAt ? "更新原判斷" : "保存原判斷";
    $("sgf-reflection-status").textContent = reflection.savedAt ? `已在作答${reflection.savedBeforeAnswer ? "前" : "後"}保存。` : "";
  }

  function currentLocalExercise() {
    const problem = current();
    return state.localExercises.find((entry) => entry.id === problem.id && entry.completed) || null;
  }

  function reviewStatusLabel(status) {
    return status === "original_confirmed" ? "已確認原著可接受" : status === "alternative_confirmed" ? "已確認另一候選可接受" : "尚未確認";
  }

  function renderSgfReview() {
    const section = $("sgf-review");
    const entry = currentLocalExercise();
    const visible = state.externalMode === "local_sgf" && state.solved && Boolean(entry);
    section.hidden = !visible;
    if (!visible) return;
    const review = entry.review || {};
    $("sgf-review-status-input").value = review.status || "unconfirmed";
    $("sgf-acceptable-answer-input").value = review.acceptableAnswer || "";
    $("sgf-next-cue-input").value = review.nextCue || "";
    $("sgf-review-save-button").textContent = review.savedAt ? "更新確認紀錄" : "保存確認紀錄";
    $("sgf-review-status").textContent = review.savedAt ? `已保存：${reviewStatusLabel(review.status)}。` : "";
    $("sgf-export-button").disabled = !Array.isArray(entry.source.originalStones);
    $("sgf-export-button").textContent = Array.isArray(entry.source.originalStones) ? "匯出這筆 SGF 復盤，交給 KaTrain 分析" : "這筆舊紀錄沒有原局面，無法匯出 SGF";
  }

  function saveSgfReflection() {
    const reflection = state.activeLocalSgfReflection;
    if (state.externalMode !== "local_sgf" || !reflection || state.solved) return;
    reflection.candidate = $("sgf-candidate-input").value.trim();
    reflection.reason = $("sgf-reason-input").value.trim();
    reflection.expectedOpponentResponse = $("sgf-opponent-response-input").value.trim();
    reflection.savedAt = new Date().toISOString();
    reflection.savedBeforeAnswer = state.answersThisTurn === 0;
    const savedSuccessfully = save();
    if (!savedSuccessfully) reflection.savedAt = null;
    renderSgfReflection();
    if (!savedSuccessfully) $("sgf-reflection-status").textContent = "未保存：瀏覽器儲存空間目前無法寫入。";
  }

  function saveSgfReview() {
    const entry = currentLocalExercise();
    if (state.externalMode !== "local_sgf" || !state.solved || !entry) return;
    const previousReview = entry.review;
    entry.review = {
      status: $("sgf-review-status-input").value,
      acceptableAnswer: $("sgf-acceptable-answer-input").value.trim(),
      nextCue: $("sgf-next-cue-input").value.trim(),
      savedAt: new Date().toISOString()
    };
    const savedSuccessfully = save();
    if (!savedSuccessfully) entry.review = previousReview;
    renderSgfReview();
    if (!savedSuccessfully) $("sgf-review-status").textContent = "未保存：瀏覽器儲存空間目前無法寫入。";
  }

  function sgfCoordinate(point) {
    return String.fromCharCode(97 + point[0]) + String.fromCharCode(97 + point[1]);
  }

  function escapeSgf(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
  }

  function exportLocalSgf() {
    const entry = currentLocalExercise();
    if (!entry || !Array.isArray(entry.source.originalStones)) return;
    const source = entry.source;
    const black = source.originalStones.filter((stone) => stone[2] === BLACK).map((stone) => `[${sgfCoordinate(stone)}]`).join("");
    const white = source.originalStones.filter((stone) => stone[2] === 2).map((stone) => `[${sgfCoordinate(stone)}]`).join("");
    const reflection = entry.reflection || {};
    const review = entry.review || {};
    const note = [
      "本檔由『一手一懂』局部復盤匯出。原著手僅是棋譜事實，不代表唯一最佳手。",
      `來源：${source.sourceName}；來源指紋：${source.sourceId || "舊紀錄未提供"}；原局第 ${source.moveNumber} 手。`,
      `候選手：${reflection.candidate || "未填寫"}`,
      `預期對方應手：${reflection.expectedOpponentResponse || "未填寫"}`,
      `理由／不確定點：${reflection.reason || "未填寫"}`,
      `可接受答案確認：${reviewStatusLabel(review.status)}`,
      `人工確認依據：${review.acceptableAnswer || "未填寫"}`,
      `下次提醒：${review.nextCue || "未填寫"}`
    ].join("\n");
    const moveProperty = source.playerColor === BLACK ? "B" : "W";
    const sgf = `(;GM[1]FF[4]CA[UTF-8]SZ[${source.boardSize || 9}]${black ? `AB${black}` : ""}${white ? `AW${white}` : ""}C[${escapeSgf(note)}];${moveProperty}[${sgfCoordinate(source.originalMove)}])`;
    downloadFile(sgf, "application/x-go-sgf;charset=utf-8", `局部復盤_${source.sourceId || "舊紀錄"}_第${source.moveNumber}手.sgf`);
  }

  function startStandardApplication() {
    const problem = fixedApplicationProbes[state.applicationIndex % fixedApplicationProbes.length];
    state.applicationIndex += 1;
    startExternalProblem(problem, "application");
    beginApplicationPresentation(problem);
    revealQuestionStart();
  }

  function startLocalSgf(text, sourceName, moveNumber = 1) {
    try {
      startExternalProblem(Sgf.makeLocalExercise(text, moveNumber, sourceName), "local_sgf");
      revealQuestionStart();
    }
    catch (error) {
      $("feedback").className = "feedback error";
      $("feedback").textContent = error.message;
    }
  }

  function openSgfPicker(text, sourceName) {
    try {
      const game = Sgf.parseSgf(text);
      if (!game.moves.length) throw new Error("SGF 無法匯入：找不到可重建的著手。");
      pendingSgf = { text, sourceName, moves: game.moves };
      $("sgf-picker-move").innerHTML = game.moves.map((move) => `<option value="${move.number}">第 ${move.number} 手 · ${move.color === BLACK ? "黑" : "白"}棋</option>`).join("");
      $("sgf-picker-move").value = String(game.moves[0].number);
      $("sgf-picker-dialog").showModal();
    }
    catch (error) {
      $("feedback").className = "feedback error";
      $("feedback").textContent = error.message;
    }
  }

  function trialSummaryText(summary) {
    const batches = summary.batchResults.map((batch) => `${batch.role === "baseline" ? "基線" : "追蹤"} ${batch.correct}/${batch.total}`).join("；");
    const directions = summary.bySkillDirection ? Object.entries(summary.bySkillDirection).map(([skillId, result]) => `${(skills.find((skill) => skill.id === skillId) || { name: skillId }).name} ${result.direction}`).join("；") : "";
    return `${summary.label}${batches ? `（${batches}）` : ""}${directions ? `；按技能：${directions}` : ""}：${summary.reason}`;
  }

  function startEvaluation() {
    closeTools();
    const decision = Trial.startOrResume(state.trial, phase2Problems, Date.now(), { reviewGate: "personal_pilot_only" });
    state.trial = decision.state;
    if (!decision.batch) {
      const summary = Trial.summarize(state.trial, state.applicationResults, state.applicationEvents);
      const due = decision.reason === "followup_not_due" ? `追蹤批次將於 ${new Date(decision.dueAt).toLocaleString("zh-TW")} 開放。` : "兩個批次皆已完成。";
      if (state.externalMode) startProblem(0, "evaluation_wait");
      $("feedback").className = "feedback success";
      $("feedback").textContent = `${due} ${trialSummaryText(summary)}`;
      save();
      return;
    }
    const problem = Trial.nextProblem(state.trial, decision.batch, phase2Problems);
    if (!problem) {
      $("feedback").className = "feedback error";
      $("feedback").textContent = "驗收批次狀態不完整，請匯出原始資料後檢查。";
      return;
    }
    state.evaluationBatch = decision.batch;
    startExternalProblem(problem, "evaluation");
    state.trial = Trial.markPresented(state.trial, decision.batch, problem, Date.now(), { uiVersion });
    save();
  }

  function renderNav() {
    const unitIndex = state.navUnitIndex;
    const unit = units[unitIndex];
    $("unit-select").innerHTML = units.map((item, index) => `<option value="${index}" ${index === unitIndex ? "selected" : ""}>第 ${index + 1} 單元 · ${escapeHtml(item.title)}</option>`).join("");
    $("unit-select").value = String(unitIndex);
    $("previous-unit-button").disabled = unitIndex === 0;
    $("next-unit-button").disabled = unitIndex === units.length - 1;
    $("unit-meta").textContent = `${state.externalMode ? "目前課程：" : "第 " + (unitIndex + 1) + " 單元 · "}${state.externalMode ? `第 ${unitIndex + 1} 單元 · ` : ""}${unit.title}`;
    $("lesson-nav").innerHTML = `<div class="nav-unit"><div class="nav-unit-title">第 ${unitIndex + 1} 單元 · ${escapeHtml(unit.title)}</div>${lessons.map((lesson, index) => {
      const active = !state.externalMode && current().lesson === index;
      return lesson.unit === unitIndex ? `<button type="button" class="lesson-link ${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""} data-lesson="${index}"><span class="lesson-index">${String(index + 1).padStart(2, "0")}</span><span class="lesson-copy"><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.subtitle)}</small></span></button>` : "";
    }).join("")}</div>`;
  }

  function renderLearningFlow() {
    let activeStep = 1;
    let now = "不看答案，先自己數氣、找候選手或落子。";
    let why = "這是本課的第一個獨立判斷機會，用來分辨已理解與只是看過。";
    let next = "作答後比較具體理由；答錯時回到棋盤重算。";
    const atLessonOpening = state.lessonIntroPending && !state.externalMode && !state.reviewMode && state.answersThisTurn === 0 && !state.hintShown;
    if (atLessonOpening) {
      activeStep = 0;
      now = "先看本課短講，再用棋盤示範確認要觀察的變化。";
      why = "每一課先建立一個明確概念，才進入無提示練習。";
      next = !state.hasStarted && state.index === 0 ? "按下開始後，不看答案自己回答第一題。" : "看完示範後，向下進入本課第一題。";
    } else if (state.reviewMode) {
      activeStep = 2;
      now = "回看這道錯題時，先不看答案，重新數氣、找候選手或落子。";
      why = "這是同一原題的修正練習，目的是釐清剛才漏看的資訊；它不是延後新棋形驗證。";
      next = "答對後處理下一張錯題；延後新題會在之後的今日複習或七天檢查出現。";
    } else if (state.externalMode === "scheduled" || state.externalMode === "evaluation") {
      if (state.externalMode === "evaluation") {
        activeStep = 3;
        now = "用未見新棋形完成延後首答；整批完成前不揭露答案。";
        why = "這是七天後的個人流程檢查，用來觀察保留情況，不能單獨證明棋力改變。";
      } else {
        const selection = [...state.scheduler.selections].reverse().find((item) => item.problemId === current().id);
        const reasons = {
          scheduled_review_due: "這題已到複習時間；目的是檢查隔一段時間後是否仍能自行判斷。",
          immediate_unseen_variant_after_error: "剛才首答未成功；改用未見變形確認規則，而不是立刻重播同一題。",
          new_practice_item: "目前沒有到期題；安排一題新練習，讓複習時間仍有具體任務。"
        };
        const reason = selection && selection.selectionReason;
        activeStep = reason === "new_practice_item" ? 1 : 3;
        now = reason === "new_practice_item" ? "這是一題新練習；不看答案，先自己數氣、找候選手或落子。" : "隔一段時間重新提取，不直接回放原答案。";
        why = reasons[selection && selection.selectionReason] || "這是你主動開啟的複習；它不會改變新課進度。";
      }
      next = "保存首答與實際間隔；結果不足時維持待驗證。";
    } else if (state.externalMode === "application" || state.externalMode === "local_sgf") {
      activeStep = 4;
      if (state.externalMode === "local_sgf") {
        now = "在棋譜局面先回想自己的候選手，再重建原著。";
        why = "這題來自你選擇的棋譜局部，目的在回想原局，而不是評定整盤棋力。";
      } else {
        now = "在沒有技能名稱提示的局面，自行判斷是否該使用學過的技巧。";
        why = "這是固定局面小測驗，用來檢查能否辨識技巧；結果會與課內題分開保存。";
      }
      next = "把局面結果與課內題分開保存；局部答對不等於完整棋力。";
    } else if (state.solved || state.answersThisTurn > 0 || state.hintShown) {
      activeStep = 2;
      if (state.solved) {
        now = "比較答案理由，先用自己的話或棋盤重建為什麼這手成立。";
        why = "答對只表示當下題目完成；理解理由才能降低下次犯同類錯誤的距離。";
        next = "進入下一題；日後仍要用未見新棋形與局面應用驗證。";
      } else {
        now = "找出剛才漏看的氣、連接或反擊，再從頭重算。";
        why = "首答未成功時，先定位漏看的資訊；重試答對不會覆蓋第一次錯誤。";
        next = "回到棋盤重新作答；重試答對不會改寫第一次錯誤。";
      }
    }
    for (let index = 0; index < 5; index += 1) {
      const step = $(`learning-step-${index}`);
      step.classList.toggle("active", index === activeStep);
      step.classList.toggle("passed", index < activeStep);
      step.setAttribute("aria-current", index === activeStep ? "step" : "false");
    }
    $("learning-now").textContent = now;
    $("learning-now-summary").textContent = now;
    $("learning-why").textContent = why;
    $("learning-next").textContent = next;
    $("learning-stage-badge").textContent = `目前 ${activeStep + 1}/5 · ${["先看懂", "自己作答", "修正重算", "延後新題", "局面應用"][activeStep]}`;

    const courseUnit = lessons[problems[state.index].lesson].unit;
    const courseLevel = courseUnit < 5 ? 0 : courseUnit < 10 ? 1 : 2;
    ["level-beginner", "level-intermediate", "level-advanced"].forEach((id, index) => {
      const level = $(id);
      level.classList.toggle("active", index === courseLevel);
      level.setAttribute("aria-current", index === courseLevel ? "step" : "false");
    });
  }

  function renderBoard() {
    const problem = current();
    const pointSelection = problem.type === "move" || problem.type === "spot";
    const focus = new Set(problem.focus.map(([x, y]) => `${x},${y}`));
    const lines = [];
    for (let i = 0; i < 9; i += 1) {
      const position = 40 + i * 50;
      lines.push(`<line x1="40" y1="${position}" x2="440" y2="${position}" stroke="#5d503a" stroke-width="1.3"/>`);
      lines.push(`<line x1="${position}" y1="40" x2="${position}" y2="440" stroke="#5d503a" stroke-width="1.3"/>`);
    }
    const stars = [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].map(([x, y]) => `<circle cx="${40 + x * 50}" cy="${40 + y * 50}" r="4" fill="#51442e"/>`);
    const marks = [];
    const points = [];
    if (pointSelection && !state.solved && !state.boardCursor) state.boardCursor = [4, 4];
    for (let y = 0; y < 9; y += 1) for (let x = 0; x < 9; x += 1) {
      const px = 40 + x * 50;
      const py = 40 + y * 50;
      const color = state.board[y][x];
      if (focus.has(`${x},${y}`) && color) marks.push(`<circle class="focus-ring" cx="${px}" cy="${py}" r="26"/>`);
      if (color) marks.push(`<circle class="${color === BLACK ? "stone-black" : "stone-white"}" cx="${px}" cy="${py}" r="20"/>`);
      if (pointSelection && !state.solved) {
        const active = state.boardCursor[0] === x && state.boardCursor[1] === y;
        const pointState = problem.type === "spot" ? (color === 0 ? "空點，可選擇" : color === BLACK ? "黑棋，可選擇" : "白棋，可選擇") : (color === 0 ? "空點，可落子" : color === BLACK ? "黑棋，已有棋子" : "白棋，已有棋子");
        const disabled = problem.type === "move" && color !== 0;
        points.push(`<circle class="board-point ${color === 0 ? "board-hit" : "board-occupied"}" cx="${px}" cy="${py}" r="23" tabindex="${active ? 0 : -1}" role="button" aria-disabled="${disabled}" aria-label="第 ${y + 1} 行第 ${x + 1} 列，${pointState}" data-board-point="true" data-occupied="${disabled}" data-x="${x}" data-y="${y}"/>`);
      }
    }
    if (state.solved && state.lastMove) marks.push(`<circle class="last-move" cx="${40 + state.lastMove[0] * 50}" cy="${40 + state.lastMove[1] * 50}" r="10"/>`);
    const keyboardHelp = pointSelection && !state.solved ? `。使用方向鍵逐點移動，Enter 或 Space ${problem.type === "spot" ? "選擇位置" : "落子"}` : "";
    $("board").innerHTML = `<svg viewBox="0 0 480 480" role="group" aria-label="${escapeHtml(problem.title)}的 9 路棋盤${keyboardHelp}"><rect x="0" y="0" width="480" height="480" fill="#e7ba78"/>${lines.join("")}${stars.join("")}${marks.join("")}${points.join("")}</svg>`;
  }

  function demoBoardMarkup(diagram) {
    if (!diagram) return "";
    const size = 5;
    const pitch = 32;
    const offset = 20;
    const length = pitch * (size - 1);
    const highlights = new Set((diagram.highlights || []).map(([x, y]) => `${x},${y}`));
    const emphasis = new Set((diagram.emphasis || []).map(([x, y]) => `${x},${y}`));
    const blocked = new Set((diagram.blocked || []).map(([x, y]) => `${x},${y}`));
    const lines = [];
    for (let index = 0; index < size; index += 1) {
      const position = offset + index * pitch;
      lines.push(`<line x1="${offset}" y1="${position}" x2="${offset + length}" y2="${position}"/>`);
      lines.push(`<line x1="${position}" y1="${offset}" x2="${position}" y2="${offset + length}"/>`);
    }
    const points = [];
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      if (highlights.has(`${x},${y}`)) points.push(`<circle class="demo-liberty" cx="${offset + x * pitch}" cy="${offset + y * pitch}" r="8"/>`);
    }
    const stones = (diagram.stones || []).map(([x, y, color]) => `<circle class="${color === BLACK ? "stone-black" : "stone-white"}" cx="${offset + x * pitch}" cy="${offset + y * pitch}" r="12"/>`);
    const rings = [...emphasis].map((point) => {
      const [x, y] = point.split(",").map(Number);
      return `<circle class="demo-emphasis" cx="${offset + x * pitch}" cy="${offset + y * pitch}" r="15"/>`;
    });
    const crosses = [...blocked].map((point) => {
      const [x, y] = point.split(",").map(Number);
      const cx = offset + x * pitch;
      const cy = offset + y * pitch;
      return `<path class="demo-blocked" d="M ${cx - 8} ${cy - 8} L ${cx + 8} ${cy + 8} M ${cx + 8} ${cy - 8} L ${cx - 8} ${cy + 8}"/>`;
    });
    const caption = diagram.caption || (highlights.size ? "金色圈出的空點是這一步要找的地方。" : "留意金色圈出的棋子或紅色叉記的落點。 ");
    return `<svg viewBox="0 0 168 168" role="img" aria-label="${escapeHtml(diagram.label || "示範棋形")}"><rect width="168" height="168" rx="8" class="demo-board-background"/>${lines.join("")}${points.join("")}${stones.join("")}${rings.join("")}${crosses.join("")}</svg><figcaption>${escapeHtml(caption)}</figcaption>`;
  }

  function renderTeachingDemoStep(lesson) {
    const steps = lesson.demoSteps || [];
    const stepper = $("teaching-demo-stepper");
    if (steps.length < 2) {
      stepper.hidden = true;
      return;
    }
    const step = steps[demoStepIndex];
    $("teaching-demo-board").innerHTML = demoBoardMarkup(step);
    $("teaching-demo-caption").textContent = step.caption;
    $("teaching-demo-count").textContent = `第 ${demoStepIndex + 1} / ${steps.length} 步`;
    $("teaching-demo-previous").disabled = demoStepIndex === 0;
    $("teaching-demo-next").disabled = demoStepIndex === steps.length - 1;
    $("teaching-demo-next").textContent = demoStepIndex === steps.length - 1 ? "示範看完" : "看下一步 →";
    stepper.hidden = false;
  }

  function renderDemoBoards(lesson) {
    const markup = demoBoardMarkup(lesson.demoBoard);
    if (demoLessonTitle !== lesson.title) {
      demoLessonTitle = lesson.title;
      demoStepIndex = 0;
    }
    const teachingBoard = $("teaching-demo-board");
    teachingBoard.hidden = !markup;
    teachingBoard.innerHTML = markup;
    renderTeachingDemoStep(lesson);
    $("teaching-demo-previous").onclick = () => {
      if (demoStepIndex <= 0) return;
      demoStepIndex -= 1;
      renderTeachingDemoStep(lesson);
    };
    $("teaching-demo-next").onclick = () => {
      if (demoStepIndex >= (lesson.demoSteps || []).length - 1) return;
      demoStepIndex += 1;
      renderTeachingDemoStep(lesson);
    };
  }

  function setBoardCursor(x, y, moveFocus) {
    state.boardCursor = [x, y];
    let target = null;
    for (const point of $("board").querySelectorAll("[data-board-point]")) {
      const active = Number(point.dataset.x) === x && Number(point.dataset.y) === y;
      point.setAttribute("tabindex", active ? "0" : "-1");
      if (active) target = point;
    }
    if (moveFocus && target && typeof target.focus === "function") target.focus();
  }

  function moveBoardCursor(key) {
    if (!state.boardCursor) return;
    const delta = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0]
    }[key];
    if (!delta) return;
    const x = Math.max(0, Math.min(8, state.boardCursor[0] + delta[0]));
    const y = Math.max(0, Math.min(8, state.boardCursor[1] + delta[1]));
    setBoardCursor(x, y, true);
  }

  function renderAnswer() {
    const problem = current();
    if (problem.type === "move") {
      $("answer-area").innerHTML = `<span class="move-guide">點選棋盤，或用方向鍵逐點移動，再按 Enter／Space 落子。<br>答錯可再試；需要時可先看提示。</span>`;
      $("board-instruction").textContent = "點選落子；鍵盤可用方向鍵移動，Enter／Space 落子";
      $("answer-policy").textContent = state.externalMode === "evaluation" ? "點選後會立即記錄首答，完成整批前不顯示正誤。" : "請在棋盤上選一點；答錯可以再試。";
      $("board-card").setAttribute("aria-label", "可落子的題目棋盤");
      return;
    }
    if (problem.type === "choice") {
      $("answer-area").innerHTML = problem.options.map((label, index) => `<button class="option-button choice-button" type="button" data-answer="${index}">${escapeHtml(label)}</button>`).join("");
      $("board-instruction").textContent = problem.focus.length ? "觀察金色圈出的棋子" : "閱讀題幹後選擇答案";
      $("answer-policy").textContent = state.externalMode === "evaluation" ? "選擇後會立即記錄首答，完成整批前不顯示正誤。" : "選擇答案後會立即作答；答錯可以再試。";
      $("board-card").setAttribute("aria-label", "觀察用題目棋盤");
      return;
    }
    if (problem.type === "spot") {
      $("answer-area").innerHTML = `<span class="move-guide">點選棋盤上的位置，或用方向鍵移動後按 Enter／Space 選擇。<br>這題只判定題幹指定的局部觀察點，不代表全局唯一最佳手。</span>`;
      $("board-instruction").textContent = "點選要比較的位置；鍵盤可用方向鍵移動，Enter／Space 選擇";
      $("answer-policy").textContent = "選擇位置後會立即作答；答錯可以再試。";
      $("board-card").setAttribute("aria-label", "可選擇位置的局部棋盤示意");
      return;
    }
    const values = problem.type === "count" ? [1, 2, 3, 4, 5, 6] : [true, false];
    $("answer-area").innerHTML = values.map((value) => `<button class="option-button" type="button" data-answer="${value}">${problem.type === "connect" ? (value ? "有，同一串" : "沒有，分兩串") : value + " 口"}</button>`).join("");
    $("board-instruction").textContent = "觀察金色圈出的棋子";
    $("answer-policy").textContent = state.externalMode === "evaluation" ? "選擇後會立即記錄首答，完成整批前不顯示正誤。" : "選擇答案後會立即作答；答錯可以再試。";
    $("board-card").setAttribute("aria-label", "觀察用題目棋盤");
  }

  function render() {
    const problem = current();
    const lesson = currentLesson();
    document.querySelector(".practice-grid").classList.toggle("text-practice", problem.type === "choice" && problem.stones.length === 0);
    $("lesson-kicker").textContent = problem.lesson === undefined ? "外部題庫 · 本機資料" : `第 ${currentLesson().unit + 1} 單元 · 課程 ${String(problem.lesson + 1).padStart(2, "0")} / ${String(lessons.length).padStart(2, "0")}`;
    $("question-number").textContent = state.externalMode === "scheduled" ? `間隔練習 · ${state.schedulerPolicy === "fixed-spacing-v1" ? "固定方案" : "候選自適應"}` : state.externalMode === "application" ? "固定應用探測 · 局部局面" : state.externalMode === "evaluation" ? `個人 pilot · ${state.evaluationBatch && state.evaluationBatch.role === "baseline" ? "基線" : "追蹤"}批次` : state.externalMode === "local_sgf" ? "棋譜局部 · 人工複習" : `題目 ${String(state.index + 1).padStart(2, "0")} / ${problems.length}`;
    $("lesson-title").textContent = lesson.title;
    $("lesson-subtitle").textContent = lesson.subtitle;
    $("lesson-badge").textContent = lesson.badge || "概念練習";
    $("teaching-text").textContent = lesson.text;
    $("teaching-demo").textContent = (lesson.demo || "先依題目找出本課要觀察的棋形，再作答。").replace(/^示範：\s*/, "");
    $("teaching-check").textContent = lesson.takeaway;
    $("lesson-intro-title").textContent = `現在先學：${lesson.title}`;
    $("lesson-intro-kicker").textContent = state.hasStarted ? "本課短講 · 每課只自動顯示一次" : "第一次使用 · 看完即可開始";
    $("lesson-intro-first-use").hidden = state.hasStarted;
    $("lesson-intro-start-button").innerHTML = `${state.hasStarted ? "開始本課練習" : "看完，開始第 1 題"} <span aria-hidden="true">→</span>`;
    $("lesson-intro-button").textContent = state.externalMode ? "查看本題說明" : "查看本課短講";
    renderDemoBoards(lesson);
    const skill = currentSkill();
    $("question-tag").textContent = state.externalMode === "application" ? "固定應用探測" : state.externalMode === "evaluation" ? "無提示個人試行" : state.externalMode === "local_sgf" ? "棋譜局部複習" : skill ? `練習技能 · ${skill.name}` : (problem.type === "move" ? "落子題" : "觀察題");
    $("question-title").textContent = problem.title;
    $("question-prompt").textContent = problem.prompt;
    $("takeaway-text").textContent = lesson.takeaway;
    $("feedback").className = "feedback";
    $("feedback").textContent = "";
    $("hint-button").textContent = "給我一點提示";
    $("hint-button").disabled = state.externalMode === "evaluation";
    $("next-button").disabled = true;
    const nextCourseProblem = !state.scheduledProblem && state.index < problems.length - 1 ? problems[state.index + 1] : null;
    const nextLesson = nextCourseProblem ? lessons[nextCourseProblem.lesson] : null;
    const nextUnit = nextLesson ? nextLesson.unit : null;
    const crossesLesson = nextCourseProblem && nextCourseProblem.lesson !== current().lesson;
    const nextLabel = !state.reviewMode && state.index === problems.length - 1
      ? "完成課程"
      : !state.reviewMode && crossesLesson && nextUnit !== currentLesson().unit
        ? `進入第 ${nextUnit + 1} 單元短講`
        : !state.reviewMode && crossesLesson
          ? "進入下一課短講"
          : "下一題";
    $("next-button").innerHTML = `${nextLabel} <span aria-hidden="true">→</span>`;
    $("player-color").textContent = problem.type === "spot" ? "◎ 選擇要點" : ((problem.playerColor || BLACK) === BLACK ? "● 黑棋" : "○ 白棋");
    renderNav();
    renderBoard();
    renderAnswer();
    renderSgfReflection();
    renderSgfReview();
    renderLearningFlow();
    renderProgress();
    showStorageWarning();
    syncLessonIntroDialog();
  }

  function renderProgress() {
    $("progress-count").textContent = `${state.completed.size} / ${problems.length}`;
    $("progress-bar").style.width = `${state.completed.size / problems.length * 100}%`;
    $("progress-caption").textContent = state.completed.size === problems.length ? `目前 ${units.length} 個單元已完成` : `還有 ${problems.length - state.completed.size} 題待完成`;
    $("review-count").textContent = state.missed.size;
    $("review-button").disabled = state.missed.size === 0;
    $("review-button").hidden = state.missed.size === 0;
    const dueCount = phase2Problems.filter((problem) => problem.pool !== "holdout" && state.scheduler.reviews[problem.id] && state.scheduler.reviews[problem.id].dueAt <= Date.now()).length;
    $("due-review-count").textContent = dueCount;
    $("due-review-button").hidden = dueCount === 0;
    $("due-review-button").setAttribute("aria-label", `今日有 ${dueCount} 題到期複習`);
    $("resume-button").textContent = state.externalMode ? "返回目前課程" : state.hasStarted ? "前往目前題目" : state.index === 0 ? "開始第 1 題" : "開始這一題";
    const diagnostics = Metrics.summarize({ events: state.events, schedulerResponses: state.scheduler.responses });
    $("diagnostic-summary").textContent = diagnosticSummaryText(diagnostics);
  }

  function diagnosticSummaryText(diagnostics) {
    const excluded = diagnostics.excludedResponsesWithoutQualification
      ? `另有 ${diagnostics.excludedResponsesWithoutQualification} 筆提示後或資格不明的作答未納入。`
      : "";
    if (!diagnostics.skills.length) return `尚無可比較的未提示首答；完成技能題後才會顯示。${excluded}`;
    const skillText = diagnostics.skills.map((skill) => {
      if (!skill.observedErrors) return `${skill.errorTypeLabel}：${skill.qualifiedOpportunities} 次機會，尚無首答錯誤。`;
      const scd = skill.scd.active
        ? `最近一次錯誤後已累積 ${skill.scd.active.relevantOpportunityCount} 次機會，${skill.scd.active.firstDelayedProbeAt ? "待第二次延後 T2" : "待第一次延後 T2"}`
        : skill.scd.completed.length
          ? `已有 ${skill.scd.completed.length} 次完成的穩定修正距離樣本`
          : "尚無可完成的穩定修正距離樣本";
      const recurrence = skill.recurrence.intervals.length
        ? `；最近已觀察 ${skill.recurrence.intervals.length} 段再犯間隔`
        : `；未再犯下限 ${skill.recurrence.latestLowerBound?.successfulOpportunitiesWithoutRecurrence || 0} 次成功機會`;
      return `${skill.errorTypeLabel}：${skill.observedErrors} 次首答錯誤；${scd}${recurrence}。`;
    }).join(" ");
    return `${skillText}${excluded}`;
  }

  function reportAnswer(correct, reason, answerValue) {
    const problem = current();
    if (!state.externalMode) {
      state.hasStarted = true;
      markCurrentLessonIntroSeen();
    }
    const isFirstAnswer = state.answersThisTurn === 0;
    state.answersThisTurn += 1;
    if (state.externalMode === "evaluation") {
      state.trial = Trial.recordAnswer(state.trial, state.evaluationBatch, problem, correct, answerValue, elapsedMs(), Date.now(), { uiVersion });
      state.solved = true;
      const feedback = $("feedback");
      feedback.className = "feedback";
      feedback.textContent = "首答已記錄；完成整批前不顯示正誤。";
      $("next-button").disabled = false;
      for (const button of $("answer-area").querySelectorAll("button")) button.disabled = true;
      renderLearningFlow();
      save();
      return;
    }
    state.attempts[problem.id] = (state.attempts[problem.id] || 0) + 1;
    recordEvent("answer", {
      answerValue,
      outcome: correct ? "correct" : "incorrect",
      answerAttempt: state.answersThisTurn,
      firstExposure: state.activePresentation ? state.activePresentation.firstExposure : false,
      firstAnswer: isFirstAnswer,
      unhinted: !state.hintShown,
      qualifiedOpportunity: isFirstAnswer && !state.hintShown,
      errorTypeId: !correct && isFirstAnswer && !state.hintShown ? Metrics.errorTypeForSkill(problem.skillId)?.id || null : null
    });
    if (state.externalMode === "application" && isFirstAnswer) {
      state.applicationResults.push({ occurredAt: new Date().toISOString(), problemId: problem.id, correct: Boolean(correct), unhinted: !state.hintShown, applicability: problem.applicability || "applicable", answerValue, uiVersion });
    }
    if (state.externalMode === "application") {
      const active = state.activeApplicationPresentation;
      state.applicationEvents.push({ type: "answer", occurredAt: new Date().toISOString(), presentationId: active && active.presentationId, problemId: problem.id, answerValue, correct: Boolean(correct), firstAnswer: isFirstAnswer, unhinted: !state.hintShown, answerAttempt: state.answersThisTurn, uiVersion: active && active.uiVersion || uiVersion });
    }
    if (state.externalMode === "scheduled" && isFirstAnswer) state.scheduler = Scheduler.recordResponse(state.scheduler, problem, state.schedulerPolicy, correct, Date.now(), {
      unhinted: !state.hintShown,
      errorTypeId: !correct ? Metrics.errorTypeForSkill(problem.skillId)?.id || null : null
    });
    if (state.externalMode === "scheduled" && correct) state.scheduler = Scheduler.completeOpportunity(state.scheduler, problem, state.answersThisTurn);
    const feedback = $("feedback");
    if (correct) {
      state.solved = true;
      if (!state.externalMode) state.completed.add(problem.id);
      if (state.externalMode === "local_sgf" && !state.localExercises.some((entry) => entry.id === problem.id && entry.completed)) {
        const reflection = state.activeLocalSgfReflection && state.activeLocalSgfReflection.savedAt ? { ...state.activeLocalSgfReflection } : null;
        state.localExercises.push({ id: problem.id, completed: true, completedAt: new Date().toISOString(), source: problem.source, linkedSkill: problem.linkedSkill, reflection, uiVersion });
      }
      if (!state.externalMode && state.reviewMode && state.wrongThisTurn === 0) state.missed.delete(problem.id);
      feedback.className = "feedback success";
      feedback.innerHTML = `答對了。<span class="answer-explanation">${escapeHtml(problem.explanation)}</span>`;
      $("next-button").disabled = false;
      renderBoard();
      for (const button of $("answer-area").querySelectorAll("button")) button.disabled = true;
    } else {
      state.wrongThisTurn += 1;
      if (!state.externalMode) state.missed.add(problem.id);
      feedback.className = "feedback error";
      feedback.textContent = `${reason} 再試一次，或看看提示。`;
    }
    save();
    renderSgfReflection();
    renderSgfReview();
    renderProgress();
    renderLearningFlow();
  }

  function onMove(x, y) {
    if (state.solved) return;
    const problem = current();
    if (problem.type === "spot") {
      const correct = x === problem.answer[0] && y === problem.answer[1];
      if (correct) state.lastMove = [x, y];
      reportAnswer(correct, "這個位置沒有對應題幹指定的局部要點。", `${x + 1},${y + 1}`);
      return;
    }
    if (problem.type !== "move") return;
    const result = playMove(state.board, x, y, current().playerColor || BLACK);
    if (!result.legal) {
      $("feedback").className = "feedback error";
      $("feedback").textContent = result.reason;
      return;
    }
    const correct = goalReached(problem, state.board, result, [x, y]);
    if (correct && state.externalMode !== "evaluation") {
      state.board = result.board;
      state.lastMove = [x, y];
    }
    reportAnswer(correct, "這一手還沒達成題目目標。", `${x + 1},${y + 1}`);
  }

  function nextProblem() {
    if (!state.solved) return;
    if (state.externalMode === "scheduled") { startScheduledPractice(); revealQuestionStart(); return; }
    if (state.externalMode === "evaluation") { startEvaluation(); revealQuestionStart(); return; }
    if (state.externalMode) {
      const completedMode = state.externalMode;
      startProblem(0, "external_complete");
      $("feedback").className = storageWriteFailed ? "feedback error" : "feedback success";
      $("feedback").textContent = storageWriteFailed
        ? "本次結果仍在目前頁面，但無法寫入瀏覽器儲存空間；離開前請先匯出可用資料。"
        : completedMode === "local_sgf" ? "局部複習已保存；原判斷會一併寫入匯出紀錄。" : "固定應用探測已完成；它與自然實戰分開記錄。";
      revealQuestionStart();
      return;
    }
    if (state.reviewMode) {
      state.reviewQueue.shift();
      if (state.reviewQueue.length) { startProblem(problems.findIndex((problem) => problem.id === state.reviewQueue[0])); revealQuestionStart(); return; }
      state.reviewMode = false;
      startProblem(0);
      $("feedback").className = "feedback success";
      $("feedback").textContent = "錯題複習結束；再從第一課開始，也可以選課程目錄。";
      revealQuestionStart();
      return;
    }
    if (state.index < problems.length - 1) {
      const previousLesson = current().lesson;
      const entersNewLesson = problems[state.index + 1].lesson !== previousLesson;
      startProblem(state.index + 1, "navigation", true, entersNewLesson);
      if (current().lesson !== previousLesson) revealLessonStart();
      else revealQuestionStart();
    }
    else {
      startProblem(0);
      $("feedback").className = "feedback success";
      $("feedback").textContent = state.missed.size ? `目前 ${units.length} 個單元完成！有 ${state.missed.size} 題可複習。` : `目前 ${units.length} 個單元完成！${problems.length} 題都答過了。`;
      revealQuestionStart();
    }
  }

  function downloadFile(contents, type, filename) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportNotes() {
    const lines = ["# 個人圍棋練習紀錄", "", `匯出時間：${new Date().toLocaleString("zh-TW")}`, `介面版本：${uiVersion}`, "", `已完成：${state.completed.size} / ${problems.length}`, `待複習：${state.missed.size} 題`, "", "## 題目紀錄", ""];
    for (const problem of problems) lines.push(`- ${problem.title}：${state.completed.has(problem.id) ? "已完成" : "未完成"}；作答 ${state.attempts[problem.id] || 0} 次${state.missed.has(problem.id) ? "；待複習" : ""}`);
    const skillEvents = state.events.filter((event) => event.skillId);
    if (skills.length) {
      lines.push("", "## 試行技能摘要", "", "這些是指定棋形的練習紀錄，不是獨立保留題或實戰成效。只把每次題目首次、未提示的作答列為可比較機會。", "");
      for (const skill of skills) {
        const eligible = skillEvents.filter((event) => event.type === "answer" && event.skillId === skill.id && event.qualifiedOpportunity);
        const correct = eligible.filter((event) => event.outcome === "correct").length;
        lines.push(`- ${skill.name}（${skill.id} v${skill.version}）：可比較機會 ${eligible.length} 次；首答正確 ${correct} 次。`);
      }
    }
    const diagnostics = Metrics.summarize({ events: state.events, schedulerResponses: state.scheduler.responses });
    lines.push("", "## 錯誤修正診斷", "", diagnostics.interpretationBoundary, "");
    if (!diagnostics.skills.length) lines.push("- 尚無可比較的未提示首答。", "");
    for (const skill of diagnostics.skills) lines.push(`- ${diagnosticSummaryText({ skills: [skill] })}`);
    lines.push(`- 未納入診斷的提示後或資格不明作答：${diagnostics.excludedResponsesWithoutQualification} 筆。`, "");
    if (skillEvents.length) {
      lines.push("", "## 試行技能事件", "", "| 時間 | 技能 | 題目 | 事件 | 條件 | 結果 | 經過時間 |", "| --- | --- | --- | --- | --- | --- | --- |");
      for (const event of skillEvents) {
        const eventName = event.type === "presented" ? "顯示題目" : event.type === "presentation_end" ? "結束題目" : event.type === "hint" ? "顯示提示" : (event.firstAnswer ? "首次作答" : "重試作答");
        const condition = event.type === "answer" ? (event.unhinted ? "未提示" : "提示後") : event.type === "hint" ? "提示" : "—";
        const outcome = event.type === "answer" ? (event.outcome === "correct" ? "正確" : "錯誤") : event.type === "presentation_end" ? (event.outcome === "solved" ? "已解出" : event.outcome === "unanswered" ? "未作答" : "中斷") : "—";
        const duration = Number.isFinite(event.elapsedMs) ? `${Math.round(event.elapsedMs / 1000)} 秒` : "—";
        lines.push(`| ${event.occurredAt} | ${event.skillId} | ${event.problemId} | ${eventName} | ${condition} | ${outcome} | ${duration} |`);
      }
    }
    const trialSummary = Trial.summarize(state.trial, state.applicationResults, state.applicationEvents);
    lines.push("", "## 個人縱向試行", "", `- 目前判斷：${trialSummaryText(trialSummary)}`, `- 固定應用探測：${trialSummary.application.correct} / ${trialSummary.application.total}；呈現 ${trialSummary.application.presented} 次；未答／中斷 ${trialSummary.application.unansweredOrInterrupted} 次；不適用局面誤用 ${trialSummary.application.inappropriateUseErrors} 次；提示後或重複結果排除 ${trialSummary.application.excludedHintedOrRepeated} 次`, `- 判讀限制：${Trial.protocol.interpretation}`);
    if (state.localExercises.length) {
      lines.push("", "## 棋譜局部複習", "", "以下是原局著手重建，不能單獨證明實戰改善；原判斷僅供日後人工復盤。", "");
      for (const entry of state.localExercises) {
        lines.push(`- ${entry.source.sourceName}｜第 ${entry.source.moveNumber} 手｜規則連結：${entry.linkedSkill}｜完成：${entry.completedAt}`);
        const originalStones = entry.source.originalStones || [];
        const boardCoordinates = (color) => originalStones.filter((stone) => stone[2] === color).map((stone) => `(${stone[0] + 1},${stone[1] + 1})`).join("、") || "無";
        lines.push(`  - 原局面（${entry.source.boardSize || 9} 路）：黑 ${boardCoordinates(BLACK)}；白 ${boardCoordinates(2)}`);
        const reflection = entry.reflection;
        lines.push(`  - 我先考慮的候選手：${reflection && reflection.candidate || "未填寫"}`);
        lines.push(`  - 理由或不確定點：${reflection && reflection.reason || "未填寫"}`);
        lines.push(`  - 我預期對方會怎麼應手：${reflection && reflection.expectedOpponentResponse || "未填寫"}`);
        lines.push(`  - 保存時點：${reflection ? (reflection.savedBeforeAnswer ? "作答前" : "作答後") : "未保存"}`);
        const review = entry.review;
        lines.push(`  - 可接受答案確認：${review ? reviewStatusLabel(review.status) : "尚未確認"}`);
        lines.push(`  - 經確認的可接受答案或分析依據：${review && review.acceptableAnswer || "未填寫"}`);
        lines.push(`  - 下一次看到相似局面時的提醒：${review && review.nextCue || "未填寫"}`);
      }
    }
    lines.push("", "## 我的觀察", "", "- 這次我原本怎麼想：", "- 現在我知道：", "- 下次提醒自己：", "");
    downloadFile(lines.join("\n"), "text/markdown;charset=utf-8", "個人圍棋練習紀錄.md");
  }

  function exportRawEvents() {
    const trialProblemIds = new Set(problems.filter((problem) => problem.skillId).map((problem) => problem.id));
    const phase2Catalog = phase2Problems.map((problem) => problem.pool !== "holdout" ? problem : {
      id: problem.id,
      familyId: problem.familyId,
      variantFamily: problem.variantFamily,
      skillId: problem.skillId,
      contentVersion: problem.contentVersion,
      itemVersion: problem.itemVersion,
      boardSize: problem.boardSize,
      pool: problem.pool,
      transferLevel: problem.transferLevel,
      evaluationBatch: problem.evaluationBatch,
      feedbackPolicy: problem.feedbackPolicy,
      taskFeatures: problem.taskFeatures,
      redacted: true
    });
    const payload = {
      schemaVersion: 2,
      eventPolicyVersion,
      uiVersion,
      exportedAt: new Date().toISOString(),
      scope: "收錄兩個試行技能、排程、固定應用探測、SGF 局部複習及個人 pilot 資料；只作個人描述，不推論正式未見、保留、遷移、因果或實戰棋力。",
      claimMode: Trial.protocol.claimMode,
      formalEvaluationAvailable: Trial.protocol.formalEvaluationAvailable,
      skills,
      trialProblems: problems.filter((problem) => trialProblemIds.has(problem.id)),
      phase2Catalog,
      holdoutAnswersRedacted: true,
      fixedApplicationProbes,
      applicationResults: state.applicationResults,
      applicationEvents: state.applicationEvents,
      localExercises: state.localExercises,
      trialProtocol: Trial.protocol,
      trial: state.trial,
      trialSummary: Trial.summarize(state.trial, state.applicationResults, state.applicationEvents),
      exposures: Object.fromEntries(Object.entries(state.exposures).filter(([problemId]) => trialProblemIds.has(problemId))),
      activePresentation: state.activePresentation,
      events: state.events.filter((event) => trialProblemIds.has(event.problemId)),
      schedulerPolicy: state.schedulerPolicy,
      scheduler: state.scheduler,
      learningDiagnostics: Metrics.summarize({ events: state.events, schedulerResponses: state.scheduler.responses })
    };
    downloadFile(JSON.stringify(payload, null, 2), "application/json;charset=utf-8", "個人圍棋原始事件.json");
  }

  $("lesson-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lesson]");
    if (!button) return;
    state.reviewMode = false;
    openLesson(problems.findIndex((problem) => problem.lesson === Number(button.dataset.lesson)));
  });
  $("answer-area").addEventListener("click", (event) => {
    const button = event.target.closest("[data-answer]");
    if (!button || state.solved) return;
    const value = current().type === "count" || current().type === "choice" ? Number(button.dataset.answer) : button.dataset.answer === "true";
    const correct = value === current().answer;
    button.classList.add(correct ? "correct" : "wrong");
    reportAnswer(correct, current().retry || "再找一次沿線相鄰的交叉點。", button.textContent.trim());
  });
  $("board").addEventListener("click", (event) => {
    const point = event.target.closest("[data-x]");
    if (!point) return;
    const x = Number(point.dataset.x);
    const y = Number(point.dataset.y);
    if (state.externalMode !== "evaluation") setBoardCursor(x, y, false);
    if (point.dataset.occupied === "true") return;
    onMove(x, y);
  });
  $("board").addEventListener("keydown", (event) => {
    const point = event.target.closest("[data-x]");
    if (!point) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      state.boardCursor = [Number(point.dataset.x), Number(point.dataset.y)];
      moveBoardCursor(event.key);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (point.dataset.occupied === "true") return;
      onMove(Number(point.dataset.x), Number(point.dataset.y));
    }
  });
  $("hint-button").addEventListener("click", () => {
    if (state.solved || state.hintShown || state.externalMode === "evaluation") return;
    $("feedback").className = "feedback";
    $("feedback").textContent = current().hint;
    state.hintShown = true;
    markCurrentLessonIntroSeen();
    recordEvent("hint", {
      firstAnswerPending: state.answersThisTurn === 0,
      firstExposure: state.activePresentation ? state.activePresentation.firstExposure : false,
      unhinted: false,
      qualifiedOpportunity: false
    });
    if (state.externalMode === "application") {
      const active = state.activeApplicationPresentation;
      state.applicationEvents.push({ type: "hint", occurredAt: new Date().toISOString(), presentationId: active && active.presentationId, problemId: current().id, firstAnswerPending: state.answersThisTurn === 0, uiVersion: active && active.uiVersion || uiVersion });
    }
    $("hint-button").textContent = "提示已顯示";
    $("hint-button").disabled = true;
    renderLearningFlow();
    save();
  });
  $("next-button").addEventListener("click", nextProblem);
  $("resume-button").addEventListener("click", () => {
    closeTools();
    if (state.externalMode) startProblem(state.index, "return_to_course");
    state.hasStarted = true;
    markCurrentLessonIntroSeen();
    save();
    render();
    revealQuestionStart();
  });
  $("lesson-intro-button").addEventListener("click", showLessonIntroDialog);
  $("lesson-intro-dismiss-button").addEventListener("click", dismissLessonIntro);
  $("lesson-intro-start-button").addEventListener("click", dismissLessonIntro);
  $("lesson-intro-dialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    dismissLessonIntro();
  });
  $("learning-flow-button").addEventListener("click", () => {
    const dialog = $("learning-flow-dialog");
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    else if (dialog) dialog.setAttribute("open", "");
  });
  $("learning-flow-close-button").addEventListener("click", () => $("learning-flow-dialog").close());
  $("unit-select").addEventListener("change", (event) => selectUnit(Number(event.target.value)));
  $("previous-unit-button").addEventListener("click", () => selectUnit(Math.max(0, state.navUnitIndex - 1)));
  $("next-unit-button").addEventListener("click", () => selectUnit(Math.min(units.length - 1, state.navUnitIndex + 1)));
  $("review-button").addEventListener("click", () => {
    state.reviewQueue = problems.filter((problem) => state.missed.has(problem.id)).map((problem) => problem.id);
    if (!state.reviewQueue.length) return;
    state.reviewMode = true;
    startProblem(problems.findIndex((problem) => problem.id === state.reviewQueue[0]));
    revealQuestionStart();
  });
  $("scheduled-practice-button").addEventListener("click", () => {
    startScheduledPractice();
    revealQuestionStart();
  });
  $("due-review-button").addEventListener("click", () => {
    startScheduledPractice();
    revealQuestionStart();
  });
  $("application-button").addEventListener("click", startStandardApplication);
  $("evaluation-button").addEventListener("click", () => {
    closeTools();
    const dialog = $("evaluation-dialog");
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    else startEvaluation();
  });
  $("evaluation-cancel-button").addEventListener("click", () => $("evaluation-dialog").close());
  $("evaluation-confirm-button").addEventListener("click", () => {
    $("evaluation-dialog").close();
    startEvaluation();
    revealQuestionStart();
  });
  $("sample-sgf-button").addEventListener("click", () => openSgfPicker(sampleSgf, "內建示範棋譜"));
  $("sgf-file-input").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > Sgf.MAX_SGF_FILE_BYTES) {
      $("feedback").className = "feedback error";
      $("feedback").textContent = `SGF 無法匯入：檔案過大（上限 ${Sgf.MAX_SGF_FILE_BYTES} bytes）。`;
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => openSgfPicker(String(reader.result || ""), file.name);
    reader.onerror = () => { $("feedback").className = "feedback error"; $("feedback").textContent = "無法讀取這個 SGF 檔案。"; };
    reader.readAsText(file, "UTF-8");
  });
  $("sgf-picker-cancel-button").addEventListener("click", () => {
    pendingSgf = null;
    $("sgf-picker-dialog").close();
  });
  $("sgf-picker-confirm-button").addEventListener("click", () => {
    if (!pendingSgf) return;
    const { text, sourceName } = pendingSgf;
    const moveNumber = Number($("sgf-picker-move").value);
    pendingSgf = null;
    $("sgf-picker-dialog").close();
    startLocalSgf(text, sourceName, moveNumber);
  });
  $("sgf-reflection-save-button").addEventListener("click", saveSgfReflection);
  $("sgf-review-save-button").addEventListener("click", saveSgfReview);
  $("sgf-export-button").addEventListener("click", exportLocalSgf);
  function setSchedulerPolicy(policy) {
    if (policy !== "fixed-spacing-v1" && policy !== "adaptive-candidate-v1") return;
    state.schedulerPolicy = policy;
    $("policy-fixed").checked = policy === "fixed-spacing-v1";
    $("policy-adaptive").checked = policy === "adaptive-candidate-v1";
    save();
  }
  $("policy-fixed").addEventListener("change", () => setSchedulerPolicy("fixed-spacing-v1"));
  $("policy-adaptive").addEventListener("change", () => setSchedulerPolicy("adaptive-candidate-v1"));
  $("export-button").addEventListener("click", exportNotes);
  $("export-events-button").addEventListener("click", exportRawEvents);
  recoverInterruptedApplicationPresentation();
  recoverInterruptedPresentation();
  setSchedulerPolicy(state.schedulerPolicy);
  startProblem(state.index, "initial_load", false, state.lessonIntroPending);
})();
