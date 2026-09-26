(function () {
  "use strict";

  const Catalog = window.GoClassicShapeCatalog;
  const Practice = window.GoClassicShapePractice;
  const PracticeContract = window.GoClassicShapePracticeContract;
  const Go = window.GoCore;
  if (!Catalog) throw new Error("Classic shape catalog missing.");
  if (!Practice || !PracticeContract || !Go) throw new Error("Classic shape practice runtime missing.");
  const practiceValidation = PracticeContract.validateAll(Practice.items, Go);
  if (!practiceValidation.ok) throw new Error("Classic shape practice contract invalid: " + practiceValidation.errors.join("; "));

  const stageIds = ["u4-m01", "u4-m02", "u4-m03", "u4-m05"];
  const stageMeta = [
    { tag: "先不要看名稱", title: "自己找第一個急所", goal: "先看眼空結構，再決定第一手。", reveal: true },
    { tag: "名稱已拿掉", title: "換個方向再找", goal: "不要靠方向記座標；找相同的結構關係。", reveal: true },
    { tag: "角色交換", title: "換成攻方找急所", goal: "同一個急所，守方想佔、攻方也想搶。", reveal: true },
    { tag: "相似但不同", title: "不要看到眼形就硬套", goal: "這題不是直三；先判斷第二眼真正缺的是哪一面。", reveal: false }
  ];

  const problems = stageIds.map((id) => window.GoContent.problems.find((problem) => problem.id === id));
  if (problems.some((problem) => !problem)) throw new Error("Classic shape practice source problem missing.");

  let stage = 0;
  let cursor = [4, 4];
  let solved = false;
  let hintShown = false;
  let bulkyIndex = 0;
  let bulkySolved = false;
  let bulkyHintShown = false;
  let bulkyCursor = [3, 3];

  const $ = (id) => document.getElementById(id);

  function pointKey(x, y) { return x + "," + y; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]); }

  function reviewLabel(status) {
    if (status === Catalog.REVIEW.VERIFIED) return "已核實";
    if (status === Catalog.REVIEW.PARTIAL) return "部分核實";
    return "待棋形核對";
  }

  function zhNameStatusLabel(status) {
    const S = Catalog.ZH_NAME_STATUS;
    if (status === S.ESTABLISHED) return "中文既有名";
    if (status === S.ESTABLISHED_ALIAS) return "中文既有／常用別名";
    if (status === S.TEACHING_TRANSLATION) return "專案教學翻譯";
    if (status === S.DESCRIPTIVE_TRANSLATION) return "中文描述，不是專名";
    if (status === S.NO_ESTABLISHED_NAME_FOUND) return "本輪未找到固定中文名";
    return "中文名稱待核實";
  }

  function displayZh(entry) {
    if (entry.preferredZhTW) return entry.preferredZhTW;
    if (entry.teachingTranslation) return entry.teachingTranslation;
    return entry.teachingLabel;
  }

  function renderCatalog(filter) {
    const entries = Catalog.entries.filter((entry) => !filter || filter === "all" || entry.category === filter);
    $("classic-atlas-grid").innerHTML = entries.map((entry) => {
      const aliases = entry.aliases.length
        ? entry.aliases.map((alias) => '<li><strong>' + escapeHtml(alias.locale) + '</strong><span>' + escapeHtml(alias.name) + '</span><small>' + escapeHtml(alias.relationType) + ' · ' + reviewLabel(alias.reviewStatus) + '</small></li>').join("")
        : '<li class="alias-empty">其他語言名稱尚未完成可靠的一對一核對。</li>';
      const zhAliases = entry.zhAliases.length
        ? '<div class="catalog-zh-aliases"><span>中文別名候選</span>' + entry.zhAliases.map((alias) => '<small>' + escapeHtml(alias.name) + ' · ' + reviewLabel(alias.reviewStatus) + '</small>').join("") + '</div>'
        : "";
      const sources = entry.sources.length
        ? '<div class="catalog-sources"><span>來源</span>' + entry.sources.map((source) => '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(source.label) + '</a>').join("") + '</div>'
        : '<div class="catalog-sources pending"><span>來源</span><em>待補可靠來源與幾何核對</em></div>';
      return '<article class="classic-catalog-card" data-review="' + escapeHtml(entry.reviewStatus) + '">' +
        '<div class="catalog-card-top"><span>' + escapeHtml(Catalog.categories[entry.category]) + '</span><strong>' + reviewLabel(entry.reviewStatus) + '</strong></div>' +
        '<h3>' + escapeHtml(displayZh(entry)) + '</h3>' +
        '<div class="catalog-zh-status"><strong>' + zhNameStatusLabel(entry.zhNameStatus) + '</strong><span>' + escapeHtml(entry.zhNameNote) + '</span></div>' +
        zhAliases +
        '<p class="catalog-teaching-label">' + escapeHtml(entry.teachingLabel) + '</p>' +
        '<ul class="catalog-aliases">' + aliases + '</ul>' +
        '<p class="catalog-note">' + escapeHtml(entry.note) + '</p>' +
        (entry.rulesetSensitive ? '<p class="catalog-warning">規則敏感：未指定 ruleset 前不建立單一評分答案。</p>' : '') +
        sources +
        '</article>';
    }).join("");
  }

  function renderCatalogFilters() {
    const options = [["all", "全部"], ...Object.entries(Catalog.categories)];
    $("classic-filter-row").innerHTML = options.map(([id, label], index) =>
      '<button type="button" class="subtle-button classic-filter' + (index === 0 ? ' active' : '') + '" data-filter="' + escapeHtml(id) + '">' + escapeHtml(label) + '</button>'
    ).join("");
    $("classic-filter-row").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      document.querySelectorAll(".classic-filter").forEach((item) => item.classList.toggle("active", item === button));
      renderCatalog(button.dataset.filter);
    });
  }

  function renderBulkyBoard() {
    const item = Practice.items[bulkyIndex];
    const validation = PracticeContract.validateItem(item, Go);
    const size = item.boardSize;
    const pad = 7;
    const span = 86;
    const step = span / (size - 1);
    const setup = new Map(validation.setupStones.map(([x,y,color]) => [pointKey(x,y), color]));
    const eye = new Set(item.eyeSpace.map(([x,y]) => pointKey(x,y)));
    const lines = [];
    const nodes = [];
    for (let i=0; i<size; i+=1) {
      const p = pad + i * step;
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="' + (pad+span) + '" y2="' + p + '" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (pad+span) + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for (let y=0; y<size; y+=1) for (let x=0; x<size; x+=1) {
      const px = pad + x * step;
      const py = pad + y * step;
      const color = setup.get(pointKey(x,y));
      if (color === Go.BLACK) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-black"/>');
      if (color === Go.WHITE) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-white"/>');
      if (eye.has(pointKey(x,y))) nodes.push('<circle data-bulky-x="' + x + '" data-bulky-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0, cy0] = bulkyCursor;
    const cx = pad + cx0 * step;
    const cy = pad + cy0 * step;
    nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="6.4" class="classic-cursor-ring"/>');
    $("bulky-board").innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("bulky-cursor-status").textContent = "游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderBulky() {
    const item = Practice.items[bulkyIndex];
    bulkySolved = false;
    bulkyHintShown = false;
    bulkyCursor = item.eyeSpace[0].slice();
    $("bulky-tag").textContent = (bulkyIndex + 1) + " / " + Practice.items.length + " · 名稱不提示答案";
    $("bulky-title").textContent = bulkyIndex === 0 ? "找共同急所" : "同一 family，換條件再找";
    $("bulky-prompt").textContent = item.prompt;
    $("bulky-feedback").className = "feedback";
    $("bulky-feedback").textContent = "";
    $("bulky-reveal").hidden = true;
    $("bulky-hint").disabled = false;
    $("bulky-next").disabled = true;
    $("bulky-next").textContent = bulkyIndex === Practice.items.length - 1 ? "完成刀把五練習" : "下一題 →";
    $("bulky-side").textContent = item.playerColor === Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderBulkyBoard();
  }

  function attemptBulky(x, y) {
    if (bulkySolved) return;
    const item = Practice.items[bulkyIndex];
    if (!item.eyeSpace.some(([ex,ey]) => ex === x && ey === y)) {
      $("bulky-feedback").className = "feedback error";
      $("bulky-feedback").textContent = "這一區只比較五個眼空中的候選點。";
      return;
    }
    const result = PracticeContract.score(item, [x,y], Go);
    if (!result.ok) {
      $("bulky-feedback").className = "feedback error";
      $("bulky-feedback").textContent = "題目 contract 驗證失敗；本題停止評分。";
      return;
    }
    if (result.correct) {
      bulkySolved = true;
      $("bulky-feedback").className = "feedback success";
      $("bulky-feedback").textContent = item.success;
      $("bulky-reveal").hidden = false;
      $("bulky-name").textContent = item.revealName;
      $("bulky-story").textContent = "這個五點眼空是 2×2 方形加一個突出點；共同急所是眼空圖上唯一同時接觸三個鄰點的位置。這裡只練第一手急所，不把它升格成完整死活答案樹。";
      $("bulky-hint").disabled = true;
      $("bulky-next").disabled = false;
    } else {
      $("bulky-feedback").className = "feedback error";
      $("bulky-feedback").textContent = bulkyHintShown
        ? "還不是。重新數每個空點在眼空圖裡直接相鄰的空點數。"
        : "這一點不是共同急所。先不要看名稱，改用相鄰關係重新判斷。";
    }
  }

  function moveBulkyCursor(dx, dy) {
    const item = Practice.items[bulkyIndex];
    const next = [bulkyCursor[0] + dx, bulkyCursor[1] + dy];
    if (item.eyeSpace.some(([x,y]) => x === next[0] && y === next[1])) {
      bulkyCursor = next;
      renderBulkyBoard();
    }
  }

  function renderBoard() {
    const problem = problems[stage];
    const size = 9;
    const pad = 5;
    const step = 100 / (size - 1);
    const stoneByPoint = new Map(problem.stones.map(([x, y, color]) => [pointKey(x, y), color]));
    const lines = [];
    for (let i = 0; i < size; i += 1) {
      const p = pad + i * (90 / (size - 1));
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="95" y2="' + p + '" stroke="#70502c" stroke-width=".45"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="95" stroke="#70502c" stroke-width=".45"/>');
    }
    const nodes = [];
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = pad + x * (90 / (size - 1));
      const cy = pad + y * (90 / (size - 1));
      const color = stoneByPoint.get(pointKey(x, y));
      if (color === 1) nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="4.2" class="stone-black"/>');
      if (color === 2) nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="4.2" class="stone-white"/>');
      if (!color) nodes.push('<circle data-x="' + x + '" data-y="' + y + '" cx="' + cx + '" cy="' + cy + '" r="5.2" class="classic-hit"/>');
    }
    const [cx0, cy0] = cursor;
    const cx = pad + cx0 * (90 / (size - 1));
    const cy = pad + cy0 * (90 / (size - 1));
    nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="5.4" class="classic-cursor-ring"/>');
    $("classic-board").innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + "</svg>";
    $("classic-cursor-status").textContent = "游標：第 " + (cy0 + 1) + " 行，第 " + (cx0 + 1) + " 列";
  }

  function render() {
    const problem = problems[stage];
    const meta = stageMeta[stage];
    solved = false;
    hintShown = false;
    cursor = [4, 4];
    $("classic-tag").textContent = meta.tag;
    $("classic-title").textContent = meta.title;
    $("classic-prompt").textContent = problem.prompt;
    $("classic-goal").textContent = meta.goal;
    $("classic-feedback").className = "feedback";
    $("classic-feedback").textContent = "";
    $("classic-reveal").hidden = true;
    $("classic-hint").disabled = false;
    $("classic-next").disabled = true;
    $("classic-next").textContent = stage === problems.length - 1 ? "完成探索" : "下一層 →";
    $("classic-side").textContent = (problem.playerColor || 1) === 1 ? "● 黑棋" : "○ 白棋";
    document.querySelectorAll("#classic-stage-list li").forEach((item, index) => {
      item.classList.toggle("active", index === stage);
      item.classList.toggle("done", index < stage);
    });
    renderBoard();
    $("classic-title").focus();
  }

  function attempt(x, y) {
    if (solved) return;
    const problem = problems[stage];
    const occupied = problem.stones.some(([sx, sy]) => sx === x && sy === y);
    if (occupied) {
      $("classic-feedback").className = "feedback error";
      $("classic-feedback").textContent = "這裡已有棋子。先找眼空或邊界中的可落子點。";
      return;
    }
    if (problem.answer[0] === x && problem.answer[1] === y) {
      solved = true;
      $("classic-feedback").className = "feedback success";
      $("classic-feedback").innerHTML = "找到急所。<span class=\"answer-explanation\">" + problem.explanation + "</span>";
      if (stageMeta[stage].reveal) {
        $("classic-reveal").hidden = false;
        $("classic-name").textContent = "直三";
        $("classic-story").textContent = "三個眼空連成一直線，因此常稱「直三」。名稱是記憶鉤子；真正要記的是中央急所與先後手。";
      } else {
        $("classic-reveal").hidden = false;
        $("classic-name").textContent = "先判斷，再套名型";
        $("classic-story").textContent = "這題刻意換成第二眼缺口，提醒你不要只靠輪廓反射作答。";
      }
      $("classic-next").disabled = false;
      $("classic-hint").disabled = true;
      return;
    }
    $("classic-feedback").className = "feedback error";
    $("classic-feedback").textContent = hintShown ? "還不是。沿著提示重新檢查哪一點真正改變兩眼結構。" : "這一手沒有達成本層目標。先不要看名稱，再比較其他候選點。";
  }

  $("classic-board").addEventListener("click", (event) => {
    const hit = event.target.closest("[data-x][data-y]");
    if (!hit) return;
    cursor = [Number(hit.dataset.x), Number(hit.dataset.y)];
    renderBoard();
    attempt(cursor[0], cursor[1]);
  });

  $("classic-board").addEventListener("keydown", (event) => {
    let [x, y] = cursor;
    if (event.key === "ArrowLeft") x = Math.max(0, x - 1);
    else if (event.key === "ArrowRight") x = Math.min(8, x + 1);
    else if (event.key === "ArrowUp") y = Math.max(0, y - 1);
    else if (event.key === "ArrowDown") y = Math.min(8, y + 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      attempt(x, y);
      return;
    } else return;
    event.preventDefault();
    cursor = [x, y];
    renderBoard();
  });

  $("classic-hint").addEventListener("click", () => {
    hintShown = true;
    $("classic-feedback").className = "feedback";
    $("classic-feedback").textContent = problems[stage].hint;
  });

  $("bulky-board").addEventListener("click", (event) => {
    const hit = event.target.closest("[data-bulky-x][data-bulky-y]");
    if (!hit) return;
    bulkyCursor = [Number(hit.dataset.bulkyX), Number(hit.dataset.bulkyY)];
    renderBulkyBoard();
    attemptBulky(bulkyCursor[0], bulkyCursor[1]);
  });

  $("bulky-board").addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); moveBulkyCursor(-1, 0); }
    else if (event.key === "ArrowRight") { event.preventDefault(); moveBulkyCursor(1, 0); }
    else if (event.key === "ArrowUp") { event.preventDefault(); moveBulkyCursor(0, -1); }
    else if (event.key === "ArrowDown") { event.preventDefault(); moveBulkyCursor(0, 1); }
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      attemptBulky(bulkyCursor[0], bulkyCursor[1]);
    }
  });

  $("bulky-hint").addEventListener("click", () => {
    bulkyHintShown = true;
    $("bulky-feedback").className = "feedback";
    $("bulky-feedback").textContent = Practice.items[bulkyIndex].hint;
  });

  $("bulky-next").addEventListener("click", () => {
    if (!bulkySolved) return;
    if (bulkyIndex < Practice.items.length - 1) {
      bulkyIndex += 1;
      renderBulky();
    } else {
      $("bulky-feedback").className = "feedback success";
      $("bulky-feedback").textContent = "刀把五共同急所練習完成。這只表示你完成了四個 bounded practice variant，不代表 mastery 或完整死活已驗證。";
      $("bulky-next").disabled = true;
    }
  });

  $("classic-next").addEventListener("click", () => {
    if (!solved) return;
    if (stage < problems.length - 1) {
      stage += 1;
      render();
    } else {
      $("classic-feedback").className = "feedback success";
      $("classic-feedback").textContent = "探索完成。回到第 4 單元後，名稱會繼續退到背景；正式課程仍以無提示首答與後續新棋形為準。";
      $("classic-next").disabled = true;
    }
  });

  renderCatalogFilters();
  renderCatalog("all");
  renderBulky();
  render();
})();
