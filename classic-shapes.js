(function () {
  "use strict";

  const Catalog = window.GoClassicShapeCatalog;
  const Practice = window.GoClassicShapePractice;
  const PracticeContract = window.GoClassicShapePracticeContract;
  const CrossFive = window.GoCrossFivePractice;
  const CrossFiveContract = window.GoCrossFiveContract;
  const Contrast = window.GoClassicContrastPractice;
  const ContrastContract = window.GoClassicContrastContract;
  const ShortRead = window.GoClassicShapeRead;
  const ShortReadContract = window.GoClassicShapeReadContract;
  const Reduction = window.GoClassicShapeReduction;
  const ReductionContract = window.GoClassicShapeReductionContract;
  const Go = window.GoCore;
  if (!Catalog) throw new Error("Classic shape catalog missing.");
  if (!Practice || !PracticeContract || !CrossFive || !CrossFiveContract || !Contrast || !ContrastContract || !ShortRead || !ShortReadContract || !Reduction || !ReductionContract || !Go) throw new Error("Classic shape practice runtime missing.");
  const practiceValidation = PracticeContract.validateAll(Practice.items, Go);
  if (!practiceValidation.ok) throw new Error("Classic shape practice contract invalid: " + practiceValidation.errors.join("; "));
  const crossFiveValidation = CrossFiveContract.validateAll(CrossFive.items, { Go, PracticeContract });
  if (!crossFiveValidation.ok) throw new Error("Cross Five practice contract invalid: " + crossFiveValidation.errors.join("; "));
  const contrastValidation = ContrastContract.validateAll(Contrast.rounds, {
    Go,
    BulkyPractice: Practice,
    BulkyContract: PracticeContract,
    CrossPractice: CrossFive,
    CrossContract: CrossFiveContract
  });
  if (!contrastValidation.ok) throw new Error("Classic contrast contract invalid: " + contrastValidation.errors.join("; "));
  const shortReadValidation = ShortReadContract.validateAll(ShortRead.items, { Go, PracticeContract });
  if (!shortReadValidation.ok) throw new Error("Classic shape short-read contract invalid: " + shortReadValidation.errors.join("; "));
  const reductionValidation = ReductionContract.validateAll(Reduction.items, { Go, PracticeContract });
  if (!reductionValidation.ok) throw new Error("Classic shape reduction contract invalid: " + reductionValidation.errors.join("; "));

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
  let contrastIndex = 0;
  let contrastSolved = false;
  let contrastHintShown = false;
  let contrastCursor = [3,3];
  let crossIndex = 0;
  let crossSolved = false;
  let crossHintShown = false;
  let crossCursor = [3, 3];
  let bulkyIndex = 0;
  let bulkySolved = false;
  let bulkyHintShown = false;
  let bulkyCursor = [3, 3];
  let readIndex = 0;
  let readSolved = false;
  let readHintShown = false;
  let readCursor = [2, 2];
  let reductionIndex = 0;
  let reductionMoves = [];
  let reductionSolved = false;
  let reductionHintShown = false;
  let reductionCursor = [2, 2];

  const $ = (id) => document.getElementById(id);

  function pointKey(x, y) { return x + "," + y; }

  function initialClassicCursor(problem) {
    const occupied = new Set(problem.stones.map(([x,y]) => pointKey(x,y)));
    const candidates = Array.isArray(problem.focus) ? problem.focus : [];
    const preferred = candidates.find(([x,y]) =>
      !occupied.has(pointKey(x,y)) &&
      !(problem.answer && problem.answer[0] === x && problem.answer[1] === y)
    );
    if (preferred) return preferred.slice();
    for (let y=0; y<9; y+=1) for (let x=0; x<9; x+=1) {
      if (!occupied.has(pointKey(x,y)) && !(problem.answer && problem.answer[0] === x && problem.answer[1] === y)) return [x,y];
    }
    return problem.answer ? problem.answer.slice() : [0,0];
  }

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



  function contrastDeps() {
    return {
      Go,
      BulkyPractice: Practice,
      BulkyContract: PracticeContract,
      CrossPractice: CrossFive,
      CrossContract: CrossFiveContract
    };
  }

  function currentContrast() {
    const round = Contrast.rounds[contrastIndex];
    const resolved = ContrastContract.resolveSource(round,contrastDeps());
    if (!resolved) throw new Error(round.id + " contrast source missing");
    return { round, ...resolved };
  }

  function renderContrastBoard() {
    const { item, set } = currentContrast();
    const validation = set.validate(item);
    const size = item.boardSize;
    const pad = 7;
    const span = 86;
    const step = span/(size-1);
    const setup = new Map(validation.setupStones.map(([x,y,color]) => [pointKey(x,y),color]));
    const eye = new Set(item.eyeSpace.map(([x,y]) => pointKey(x,y)));
    const lines=[];
    const nodes=[];
    for(let i=0;i<size;i+=1){
      const p=pad+i*step;
      lines.push('<line x1="'+pad+'" y1="'+p+'" x2="'+(pad+span)+'" y2="'+p+'" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="'+p+'" y1="'+pad+'" x2="'+p+'" y2="'+(pad+span)+'" stroke="#70502c" stroke-width=".55"/>');
    }
    for(let y=0;y<size;y+=1) for(let x=0;x<size;x+=1){
      const px=pad+x*step, py=pad+y*step;
      const color=setup.get(pointKey(x,y));
      if(color===Go.BLACK) nodes.push('<circle cx="'+px+'" cy="'+py+'" r="5.3" class="stone-black"/>');
      if(color===Go.WHITE) nodes.push('<circle cx="'+px+'" cy="'+py+'" r="5.3" class="stone-white"/>');
      if(eye.has(pointKey(x,y))) nodes.push('<circle data-contrast-x="'+x+'" data-contrast-y="'+y+'" cx="'+px+'" cy="'+py+'" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0,cy0]=contrastCursor;
    nodes.push('<circle cx="'+(pad+cx0*step)+'" cy="'+(pad+cy0*step)+'" r="6.4" class="classic-cursor-ring"/>');
    $("contrast-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">'+lines.join("")+nodes.join("")+'</svg>';
    $("contrast-cursor-status").textContent="游標：第 "+(cy0+1)+" 行，第 "+(cx0+1)+" 列";
  }

  function renderContrast() {
    const { round, item } = currentContrast();
    contrastSolved=false;
    contrastHintShown=false;
    contrastCursor=item.eyeSpace[0].slice();
    $("contrast-tag").textContent=(contrastIndex+1)+" / "+Contrast.rounds.length+" · family hidden";
    $("contrast-title").textContent="先看幾何，再找第一手";
    $("contrast-prompt").textContent=round.prompt;
    $("contrast-feedback").className="feedback";
    $("contrast-feedback").textContent="";
    $("contrast-reveal").hidden=true;
    $("contrast-name").textContent="";
    $("contrast-note").textContent="";
    $("contrast-hint").disabled=false;
    $("contrast-next").disabled=true;
    $("contrast-next").textContent=contrastIndex===Contrast.rounds.length-1?"完成混合辨形":"下一題 →";
    $("contrast-side").textContent=item.playerColor===Go.BLACK?"● 黑棋":"○ 白棋";
    renderContrastBoard();
  }

  function attemptContrast(x,y) {
    if(contrastSolved) return;
    const { round, item }=currentContrast();
    if(!item.eyeSpace.some(([ex,ey]) => ex===x && ey===y)){
      $("contrast-feedback").className="feedback error";
      $("contrast-feedback").textContent="這一區只比較五個眼空中的候選點。";
      return;
    }
    const result=ContrastContract.score(round,[x,y],contrastDeps());
    if(!result.ok){
      $("contrast-feedback").className="feedback error";
      $("contrast-feedback").textContent="contrast contract 驗證失敗；本題停止評分。";
      return;
    }
    if(result.correct){
      contrastSolved=true;
      $("contrast-feedback").className="feedback success";
      $("contrast-feedback").textContent="第一手正確。現在才揭示 family 與結構依據。";
      $("contrast-reveal").hidden=false;
      $("contrast-name").textContent=result.familyLabel;
      $("contrast-note").textContent=round.revealNote;
      $("contrast-hint").disabled=true;
      $("contrast-next").disabled=false;
    } else {
      $("contrast-feedback").className="feedback error";
      $("contrast-feedback").textContent=contrastHintShown
        ? "還不是。請先判斷這題是 degree-3 急所結構，還是 degree-4 十字中心。"
        : "這一點不是該 family 的共同急所。不要猜名稱，先比較眼空 adjacency。";
    }
  }

  function moveContrastCursor(dx,dy) {
    const {item}=currentContrast();
    const next=[contrastCursor[0]+dx,contrastCursor[1]+dy];
    if(item.eyeSpace.some(([x,y]) => x===next[0] && y===next[1])){
      contrastCursor=next;
      renderContrastBoard();
    }
  }

  function renderCrossBoard() {
    const item = CrossFive.items[crossIndex];
    const validation = CrossFiveContract.validateItem(item,{ Go, PracticeContract });
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
      if (eye.has(pointKey(x,y))) nodes.push('<circle data-cross-x="' + x + '" data-cross-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0,cy0] = crossCursor;
    nodes.push('<circle cx="' + (pad+cx0*step) + '" cy="' + (pad+cy0*step) + '" r="6.4" class="classic-cursor-ring"/>');
    $("cross-board").innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("cross-cursor-status").textContent = "游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderCross() {
    const item = CrossFive.items[crossIndex];
    crossSolved = false;
    crossHintShown = false;
    crossCursor = item.eyeSpace[0].slice();
    $("cross-tag").textContent = (crossIndex+1) + " / " + CrossFive.items.length + " · 名稱不提示答案";
    $("cross-title").textContent = crossIndex === 0 ? "找十字形共同急所" : "換角色／位置再找中心";
    $("cross-prompt").textContent = item.prompt;
    $("cross-feedback").className = "feedback";
    $("cross-feedback").textContent = "";
    $("cross-reveal").hidden = true;
    $("cross-hint").disabled = false;
    $("cross-next").disabled = true;
    $("cross-next").textContent = crossIndex === CrossFive.items.length-1 ? "完成梅花五練習" : "下一題 →";
    $("cross-side").textContent = item.playerColor === Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderCrossBoard();
  }

  function attemptCross(x,y) {
    if (crossSolved) return;
    const item = CrossFive.items[crossIndex];
    if (!item.eyeSpace.some(([ex,ey]) => ex===x && ey===y)) {
      $("cross-feedback").className = "feedback error";
      $("cross-feedback").textContent = "這一區只比較五個眼空中的候選點。";
      return;
    }
    const result = CrossFiveContract.score(item,[x,y],{ Go, PracticeContract });
    if (!result.ok) {
      $("cross-feedback").className = "feedback error";
      $("cross-feedback").textContent = "梅花五 contract 驗證失敗；本題停止評分。";
      return;
    }
    if (result.correct) {
      crossSolved = true;
      $("cross-feedback").className = "feedback success";
      $("cross-feedback").textContent = item.success;
      $("cross-reveal").hidden = false;
      $("cross-hint").disabled = true;
      $("cross-next").disabled = false;
    } else {
      $("cross-feedback").className = "feedback error";
      $("cross-feedback").textContent = crossHintShown
        ? "還不是。重新數每個眼空直接相鄰的眼空；只有一點會同時接觸四個。"
        : "這一點不是十字形中心。不要找棋盤中心，請找棋形裡唯一的 degree-4 點。";
    }
  }

  function moveCrossCursor(dx,dy) {
    const item = CrossFive.items[crossIndex];
    const next = [crossCursor[0]+dx,crossCursor[1]+dy];
    if (item.eyeSpace.some(([x,y]) => x===next[0] && y===next[1])) {
      crossCursor = next;
      renderCrossBoard();
    }
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

  function buildReadBoard(item) {
    const base = item.baseItem;
    const baseValidation = PracticeContract.validateItem(base, Go);
    let board = Go.boardFromStones(baseValidation.setupStones, base.boardSize);
    let played = Go.playMove(board, base.vitalPoint[0], base.vitalPoint[1], base.playerColor);
    if (!played.legal) throw new Error(item.id + " vital replay failed");
    board = played.board;
    played = Go.playMove(board, item.defenderReply[0], item.defenderReply[1], base.defenderColor);
    if (!played.legal) throw new Error(item.id + " defender replay failed");
    return played.board;
  }

  function readCandidates(item, board) {
    return item.baseItem.eyeSpace.filter(([x,y]) => board[y][x] === Go.EMPTY);
  }

  function renderReadBoard() {
    const item = ShortRead.items[readIndex];
    const board = buildReadBoard(item);
    const size = item.baseItem.boardSize;
    const pad = 7;
    const span = 86;
    const step = span / (size - 1);
    const candidates = new Set(readCandidates(item, board).map(([x,y]) => pointKey(x,y)));
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
      if (board[y][x] === Go.BLACK) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-black"/>');
      if (board[y][x] === Go.WHITE) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-white"/>');
      if (candidates.has(pointKey(x,y))) nodes.push('<circle data-read-x="' + x + '" data-read-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0,cy0] = readCursor;
    const cx = pad + cx0 * step;
    const cy = pad + cy0 * step;
    nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="6.4" class="classic-cursor-ring"/>');
    $("read-board").innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("read-cursor-status").textContent = "游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderRead() {
    const item = ShortRead.items[readIndex];
    const board = buildReadBoard(item);
    const candidates = readCandidates(item, board);
    readSolved = false;
    readHintShown = false;
    readCursor = candidates[0].slice();
    $("read-tag").textContent = (readIndex+1) + " / " + ShortRead.items.length + " · 第 3 手";
    $("read-title").textContent = readIndex === 0 ? "補另一個 A/B 點" : "換一條 A/B 應手再讀";
    $("read-prompt").textContent = item.prompt;
    $("read-feedback").className = "feedback";
    $("read-feedback").textContent = "";
    $("read-hint").disabled = false;
    $("read-next").disabled = true;
    $("read-next").textContent = readIndex === ShortRead.items.length-1 ? "完成短讀" : "下一題 →";
    $("read-side").textContent = item.baseItem.playerColor === Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderReadBoard();
  }

  function attemptRead(x,y) {
    if (readSolved) return;
    const item = ShortRead.items[readIndex];
    const board = buildReadBoard(item);
    if (!readCandidates(item, board).some(([cx,cy]) => cx === x && cy === y)) {
      $("read-feedback").className = "feedback error";
      $("read-feedback").textContent = "這一手不在目前仍空的眼空候選裡。";
      return;
    }
    const result = ShortReadContract.scoreFollowup(item,[x,y],{ Go, PracticeContract });
    if (!result.ok) {
      $("read-feedback").className = "feedback error";
      $("read-feedback").textContent = "短讀 contract 驗證失敗；本題停止評分。";
      return;
    }
    if (result.correct) {
      readSolved = true;
      $("read-feedback").className = "feedback success";
      $("read-feedback").textContent = item.success;
      $("read-hint").disabled = true;
      $("read-next").disabled = false;
    } else {
      $("read-feedback").className = "feedback error";
      $("read-feedback").textContent = readHintShown
        ? "還不是。守方已佔 A/B 其中一點；找另一個尚未被佔的互補點。"
        : "這一手不符合 A/B 主分支。先比較守方剛走的位置與另一個對稱點。";
    }
  }

  function moveReadCursor(dx,dy) {
    const item = ShortRead.items[readIndex];
    const board = buildReadBoard(item);
    const candidates = readCandidates(item,board);
    const next = [readCursor[0]+dx,readCursor[1]+dy];
    if (candidates.some(([x,y]) => x === next[0] && y === next[1])) {
      readCursor = next;
      renderReadBoard();
    }
  }

  function reductionState(item) {
    const validation = ReductionContract.validateItem(item,{ Go, PracticeContract });
    if (!validation.ok) throw new Error(item.id + " reduction contract invalid");
    const setup = ReductionContract.buildSetupStones(item,Go,{sealed:true});
    let board = Go.boardFromStones(setup,item.boardSize);
    let played = Go.playMove(board,validation.vitalPoint[0],validation.vitalPoint[1],item.attackerColor);
    if (!played.legal) throw new Error(item.id + " reduction vital replay failed");
    board = played.board;
    for (const point of reductionMoves) {
      played = Go.playMove(board,point[0],point[1],item.attackerColor);
      if (!played.legal) throw new Error(item.id + " reduction replay failed");
      board = played.board;
    }
    return { validation, board };
  }

  function reductionCandidates(item,state) {
    const used = new Set(reductionMoves.map(([x,y]) => pointKey(x,y)));
    return state.validation.reductionPoints.filter(([x,y]) => !used.has(pointKey(x,y)) && state.board[y][x] === Go.EMPTY);
  }

  function renderReductionBoard(finalResult) {
    const item = Reduction.items[reductionIndex];
    const current = finalResult && finalResult.result
      ? { validation:ReductionContract.validateItem(item,{ Go, PracticeContract }), board:finalResult.result.board }
      : reductionState(item);
    const board = current.board;
    const size = item.boardSize;
    const pad = 7;
    const span = 86;
    const step = span / (size - 1);
    const candidates = new Set((finalResult ? [] : reductionCandidates(item,current)).map(([x,y]) => pointKey(x,y)));
    const lines = [];
    const nodes = [];
    for (let i=0;i<size;i+=1) {
      const p=pad+i*step;
      lines.push('<line x1="'+pad+'" y1="'+p+'" x2="'+(pad+span)+'" y2="'+p+'" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="'+p+'" y1="'+pad+'" x2="'+p+'" y2="'+(pad+span)+'" stroke="#70502c" stroke-width=".55"/>');
    }
    for (let y=0;y<size;y+=1) for (let x=0;x<size;x+=1) {
      const px=pad+x*step;
      const py=pad+y*step;
      if (board[y][x]===Go.BLACK) nodes.push('<circle cx="'+px+'" cy="'+py+'" r="5.3" class="stone-black"/>');
      if (board[y][x]===Go.WHITE) nodes.push('<circle cx="'+px+'" cy="'+py+'" r="5.3" class="stone-white"/>');
      if (candidates.has(pointKey(x,y))) nodes.push('<circle data-reduction-x="'+x+'" data-reduction-y="'+y+'" cx="'+px+'" cy="'+py+'" r="6.2" class="classic-hit bulky-hit"/>');
    }
    if (!finalResult) {
      const [cx0,cy0]=reductionCursor;
      nodes.push('<circle cx="'+(pad+cx0*step)+'" cy="'+(pad+cy0*step)+'" r="6.4" class="classic-cursor-ring"/>');
    }
    $("reduction-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">'+lines.join("")+nodes.join("")+'</svg>';
    if (!finalResult) $("reduction-cursor-status").textContent="游標：第 "+(reductionCursor[1]+1)+" 行，第 "+(reductionCursor[0]+1)+" 列";
    else $("reduction-cursor-status").textContent="終局：黑棋提四子後留下 2×2 方四";
  }

  function renderReduction() {
    const item=Reduction.items[reductionIndex];
    reductionMoves=[];
    const state=reductionState(item);
    const candidates=reductionCandidates(item,state);
    reductionSolved=false;
    reductionHintShown=false;
    reductionCursor=candidates[0].slice();
    $("reduction-tag").textContent=(reductionIndex+1)+" / "+Reduction.items.length+" · sealed local branch";
    $("reduction-title").textContent=reductionIndex===0?"填滿 2×2 核心":"鏡像後再找 2×2 核心";
    $("reduction-prompt").textContent=item.prompt;
    $("reduction-feedback").className="feedback";
    $("reduction-feedback").textContent="";
    $("reduction-terminal").hidden=true;
    $("reduction-hint").disabled=false;
    $("reduction-next").disabled=true;
    $("reduction-next").textContent=reductionIndex===Reduction.items.length-1?"完成 sealed reduction":"下一題 →";
    renderReductionBoard();
  }

  function attemptReduction(x,y) {
    if (reductionSolved) return;
    const item=Reduction.items[reductionIndex];
    const result=ReductionContract.scoreNext(item,reductionMoves,[x,y],{ Go, PracticeContract });
    if (!result.ok) {
      $("reduction-feedback").className="feedback error";
      $("reduction-feedback").textContent="sealed reduction contract 驗證失敗；本題停止評分。";
      return;
    }
    if (!result.correct) {
      $("reduction-feedback").className="feedback error";
      $("reduction-feedback").textContent=reductionHintShown
        ? "這一點不是 2×2 核心剩餘空點。突出點要留給黑棋最後提子。"
        : "這一手不屬於本分支的縮眼核心。先重新找包含急所的 2×2 方形。";
      return;
    }
    reductionMoves.push([x,y]);
    if (reductionMoves.length<3) {
      const state=reductionState(item);
      const candidates=reductionCandidates(item,state);
      reductionCursor=candidates[0].slice();
      $("reduction-feedback").className="feedback success";
      $("reduction-feedback").textContent="這一顆正確。再補一顆 2×2 核心空點。";
      renderReductionBoard();
      return;
    }
    const finalResult=ReductionContract.finalize(item,reductionMoves,{ Go, PracticeContract });
    if (!finalResult.ok || !finalResult.complete) {
      $("reduction-feedback").className="feedback error";
      $("reduction-feedback").textContent="終局 contract 未能證明提四子後形成方四；本題停止。";
      return;
    }
    reductionSolved=true;
    $("reduction-feedback").className="feedback success";
    $("reduction-feedback").textContent=item.success;
    $("reduction-terminal").hidden=false;
    $("reduction-hint").disabled=true;
    $("reduction-next").disabled=false;
    renderReductionBoard(finalResult);
  }

  function moveReductionCursor(dx,dy) {
    const item=Reduction.items[reductionIndex];
    const state=reductionState(item);
    const candidates=reductionCandidates(item,state);
    const next=[reductionCursor[0]+dx,reductionCursor[1]+dy];
    if (candidates.some(([x,y]) => x===next[0] && y===next[1])) {
      reductionCursor=next;
      renderReductionBoard();
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
      if (color === 1) nodes.push('<circle data-x="' + x + '" data-y="' + y + '" cx="' + cx + '" cy="' + cy + '" r="4.2" class="stone-black classic-occupied"/>');
      if (color === 2) nodes.push('<circle data-x="' + x + '" data-y="' + y + '" cx="' + cx + '" cy="' + cy + '" r="4.2" class="stone-white classic-occupied"/>');
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
    cursor = initialClassicCursor(problem);
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

  $("contrast-board").addEventListener("click",(event) => {
    const hit=event.target.closest("[data-contrast-x][data-contrast-y]");
    if(!hit) return;
    contrastCursor=[Number(hit.dataset.contrastX),Number(hit.dataset.contrastY)];
    renderContrastBoard();
    attemptContrast(contrastCursor[0],contrastCursor[1]);
  });

  $("contrast-board").addEventListener("keydown",(event) => {
    if(event.key==="ArrowLeft"){event.preventDefault();moveContrastCursor(-1,0);}
    else if(event.key==="ArrowRight"){event.preventDefault();moveContrastCursor(1,0);}
    else if(event.key==="ArrowUp"){event.preventDefault();moveContrastCursor(0,-1);}
    else if(event.key==="ArrowDown"){event.preventDefault();moveContrastCursor(0,1);}
    else if(event.key==="Enter" || event.key===" "){event.preventDefault();attemptContrast(contrastCursor[0],contrastCursor[1]);}
  });

  $("contrast-hint").addEventListener("click",() => {
    contrastHintShown=true;
    $("contrast-feedback").className="feedback";
    $("contrast-feedback").textContent="只比較兩種結構：刀把五急所是唯一 degree-3 點；梅花五急所是唯一 degree-4 中心。";
  });

  $("contrast-next").addEventListener("click",() => {
    if(!contrastSolved) return;
    if(contrastIndex<Contrast.rounds.length-1){
      contrastIndex+=1;
      renderContrast();
    } else {
      $("contrast-feedback").className="feedback success";
      $("contrast-feedback").textContent="六題混合辨形完成。這只代表完成 interleaved practice，不代表已證明跨 family transfer。";
      $("contrast-next").disabled=true;
    }
  });

  $("cross-board").addEventListener("click",(event) => {
    const hit = event.target.closest("[data-cross-x][data-cross-y]");
    if (!hit) return;
    crossCursor = [Number(hit.dataset.crossX),Number(hit.dataset.crossY)];
    renderCrossBoard();
    attemptCross(crossCursor[0],crossCursor[1]);
  });

  $("cross-board").addEventListener("keydown",(event) => {
    if (event.key==="ArrowLeft") { event.preventDefault(); moveCrossCursor(-1,0); }
    else if (event.key==="ArrowRight") { event.preventDefault(); moveCrossCursor(1,0); }
    else if (event.key==="ArrowUp") { event.preventDefault(); moveCrossCursor(0,-1); }
    else if (event.key==="ArrowDown") { event.preventDefault(); moveCrossCursor(0,1); }
    else if (event.key==="Enter" || event.key===" ") {
      event.preventDefault();
      attemptCross(crossCursor[0],crossCursor[1]);
    }
  });

  $("cross-hint").addEventListener("click",() => {
    crossHintShown = true;
    $("cross-feedback").className = "feedback";
    $("cross-feedback").textContent = CrossFive.items[crossIndex].hint;
  });

  $("cross-next").addEventListener("click",() => {
    if (!crossSolved) return;
    if (crossIndex < CrossFive.items.length-1) {
      crossIndex += 1;
      renderCross();
    } else {
      $("cross-feedback").className = "feedback success";
      $("cross-feedback").textContent = "梅花五中央急所練習完成。這只表示完成四個 bounded variant，不代表完整五目中手答案樹或 mastery。";
      $("cross-next").disabled = true;
    }
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

  $("read-board").addEventListener("click", (event) => {
    const hit = event.target.closest("[data-read-x][data-read-y]");
    if (!hit) return;
    readCursor = [Number(hit.dataset.readX), Number(hit.dataset.readY)];
    renderReadBoard();
    attemptRead(readCursor[0],readCursor[1]);
  });

  $("read-board").addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); moveReadCursor(-1,0); }
    else if (event.key === "ArrowRight") { event.preventDefault(); moveReadCursor(1,0); }
    else if (event.key === "ArrowUp") { event.preventDefault(); moveReadCursor(0,-1); }
    else if (event.key === "ArrowDown") { event.preventDefault(); moveReadCursor(0,1); }
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      attemptRead(readCursor[0],readCursor[1]);
    }
  });

  $("read-hint").addEventListener("click", () => {
    readHintShown = true;
    $("read-feedback").className = "feedback";
    $("read-feedback").textContent = ShortRead.items[readIndex].hint;
  });

  $("read-next").addEventListener("click", () => {
    if (!readSolved) return;
    if (readIndex < ShortRead.items.length - 1) {
      readIndex += 1;
      renderRead();
    } else {
      $("read-feedback").className = "feedback success";
      $("read-feedback").textContent = "A/B 三手短讀完成。這只表示完成來源支持的主分支練習；未列分支仍是 UNKNOWN。";
      $("read-next").disabled = true;
    }
  });

  $("reduction-board").addEventListener("click",(event) => {
    const hit=event.target.closest("[data-reduction-x][data-reduction-y]");
    if (!hit) return;
    reductionCursor=[Number(hit.dataset.reductionX),Number(hit.dataset.reductionY)];
    renderReductionBoard();
    attemptReduction(reductionCursor[0],reductionCursor[1]);
  });

  $("reduction-board").addEventListener("keydown",(event) => {
    if (event.key==="ArrowLeft") { event.preventDefault(); moveReductionCursor(-1,0); }
    else if (event.key==="ArrowRight") { event.preventDefault(); moveReductionCursor(1,0); }
    else if (event.key==="ArrowUp") { event.preventDefault(); moveReductionCursor(0,-1); }
    else if (event.key==="ArrowDown") { event.preventDefault(); moveReductionCursor(0,1); }
    else if (event.key==="Enter" || event.key===" ") {
      event.preventDefault();
      attemptReduction(reductionCursor[0],reductionCursor[1]);
    }
  });

  $("reduction-hint").addEventListener("click",() => {
    reductionHintShown=true;
    $("reduction-feedback").className="feedback";
    $("reduction-feedback").textContent=Reduction.items[reductionIndex].hint;
  });

  $("reduction-next").addEventListener("click",() => {
    if (!reductionSolved) return;
    if (reductionIndex<Reduction.items.length-1) {
      reductionIndex+=1;
      renderReduction();
    } else {
      $("reduction-feedback").className="feedback success";
      $("reduction-feedback").textContent="sealed reduction 練習完成。這只支持零外氣＋局部手抜き條件下的縮眼分支；其他應手與有外氣局面仍是 UNKNOWN。";
      $("reduction-next").disabled=true;
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
  renderContrast();
  renderCross();
  renderBulky();
  renderRead();
  renderReduction();
  render();
})();
