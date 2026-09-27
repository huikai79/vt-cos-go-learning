(function () {
  "use strict";

  const Catalog = window.GoClassicShapeCatalog;
  const Practice = window.GoClassicShapePractice;
  const PracticeContract = window.GoClassicShapePracticeContract;
  const CrossFive = window.GoCrossFivePractice;
  const CrossFiveContract = window.GoCrossFiveContract;
  const BentThree = window.GoBentThreePractice;
  const BentThreeContract = window.GoBentThreeContract;
  const FourSpaceStatus = window.GoFourSpaceStatusPractice;
  const FourSpaceStatusContract = window.GoFourSpaceStatusContract;
  const PyramidFour = window.GoPyramidFourPractice;
  const PyramidFourContract = window.GoPyramidFourContract;
  const FlowerSix = window.GoFlowerSixPractice;
  const FlowerSixContract = window.GoFlowerSixContract;
  const GoldenChicken = window.GoGoldenChickenPractice;
  const GoldenChickenContract = window.GoGoldenChickenContract;
  const BigPigsMouth = window.GoBigPigsMouthSourcePractice;
  const BigPigsMouthContract = window.GoBigPigsMouthSourceCaseContract;
  const Contrast = window.GoClassicContrastPractice;
  const ContrastContract = window.GoClassicContrastContract;
  const ShortRead = window.GoClassicShapeRead;
  const ShortReadContract = window.GoClassicShapeReadContract;
  const Reduction = window.GoClassicShapeReduction;
  const ReductionContract = window.GoClassicShapeReductionContract;
  const Go = window.GoCore;
  if (!Catalog) throw new Error("Classic shape catalog missing.");
  if (!Practice || !PracticeContract || !CrossFive || !CrossFiveContract || !BentThree || !BentThreeContract || !FourSpaceStatus || !FourSpaceStatusContract || !PyramidFour || !PyramidFourContract || !FlowerSix || !FlowerSixContract || !GoldenChicken || !GoldenChickenContract || !BigPigsMouth || !BigPigsMouthContract || !Contrast || !ContrastContract || !ShortRead || !ShortReadContract || !Reduction || !ReductionContract || !Go) throw new Error("Classic shape practice runtime missing.");
  const practiceValidation = PracticeContract.validateAll(Practice.items, Go);
  if (!practiceValidation.ok) throw new Error("Classic shape practice contract invalid: " + practiceValidation.errors.join("; "));
  const crossFiveValidation = CrossFiveContract.validateAll(CrossFive.items, { Go, PracticeContract });
  if (!crossFiveValidation.ok) throw new Error("Cross Five practice contract invalid: " + crossFiveValidation.errors.join("; "));
  const bentThreeValidation = BentThreeContract.validateAll(BentThree.items, { Go, PracticeContract });
  if (!bentThreeValidation.ok) throw new Error("Bent Three practice contract invalid: " + bentThreeValidation.errors.join("; "));
  const fourSpaceStatusValidation = FourSpaceStatusContract.validateAll(FourSpaceStatus.items, { Go, PracticeContract, BentThreeContract });
  if (!fourSpaceStatusValidation.ok) throw new Error("Four-space status contract invalid: " + fourSpaceStatusValidation.errors.join("; "));
  const pyramidFourValidation = PyramidFourContract.validateAll(PyramidFour.items, { Go, PracticeContract });
  if (!pyramidFourValidation.ok) throw new Error("Pyramid Four practice contract invalid: " + pyramidFourValidation.errors.join("; "));
  const flowerSixValidation = FlowerSixContract.validateAll(FlowerSix.items, { Go, PracticeContract });
  if (!flowerSixValidation.ok) throw new Error("Flower Six practice contract invalid: " + flowerSixValidation.errors.join("; "));
  const goldenChickenValidation = GoldenChickenContract.validateAll(GoldenChicken.items, Go);
  if (!goldenChickenValidation.ok) throw new Error("Golden Chicken practice contract invalid: " + goldenChickenValidation.errors.join("; "));
  const bigPigsMouthValidation = BigPigsMouthContract.validateAll(BigPigsMouth.items, Go);
  if (!bigPigsMouthValidation.ok) throw new Error("Big Pig's Mouth source-case contract invalid: " + bigPigsMouthValidation.errors.join("; "));
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
  let bentThreeIndex = 0;
  let bentThreeSolved = false;
  let bentThreeHintShown = false;
  let bentThreeCursor = [3, 3];
  let fourStatusIndex = 0;
  let fourStatusSolved = false;
  let fourStatusHintShown = false;
  let pyramidFourIndex = 0;
  let pyramidFourSolved = false;
  let pyramidFourHintShown = false;
  let pyramidFourCursor = [3, 3];
  let flowerSixIndex = 0;
  let flowerSixSolved = false;
  let flowerSixHintShown = false;
  let flowerSixCursor = [2, 2];
  let goldenChickenIndex = 0;
  let goldenChickenSolved = false;
  let goldenChickenHintShown = false;
  let goldenChickenCursor = [3, 0];
  let bigPigsMouthIndex = 0;
  let bigPigsMouthSolved = false;
  let bigPigsMouthHintShown = false;
  let bigPigsMouthCursor = [16, 18];
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
    return entry.displayName || entry.preferredZhTW || entry.teachingTranslation || entry.teachingLabel;
  }

  function entityTypeLabel(type) {
    const T = Catalog.ENTITY_TYPE;
    if (type === T.NAKADE_SHAPE) return "中手棋形";
    if (type === T.NAKADE_CATEGORY) return "中手分類";
    if (type === T.CORNER_LIFE_DEATH_FAMILY) return "角部死活 family";
    if (type === T.TESUJI_MECHANISM) return "手筋機制";
    if (type === T.RULES_SENSITIVE_POSITION) return "規則敏感局面";
    return type;
  }

  function geometryReviewLabel(status) {
    if (status === Catalog.REVIEW.VERIFIED) return "geometry 已驗";
    if (status === Catalog.REVIEW.PARTIAL) return "geometry 部分驗證";
    return "geometry 待核對";
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
      const ambiguities = entry.nameAmbiguities.length
        ? '<div class="catalog-ambiguity"><strong>名稱歧義</strong>' + entry.nameAmbiguities.map((item) => '<span>' + escapeHtml(item.name) + ' · ' + escapeHtml(item.status) + ' · ' + escapeHtml(item.note) + '</span>').join("") + '</div>'
        : '';
      const taxonomy = entry.taxonomyMemberships.length || entry.taxonomyRelations.length
        ? '<div class="catalog-taxonomy"><strong>Taxonomy</strong><span>' +
            escapeHtml([
              ...entry.taxonomyMemberships.map((item) => item.taxonomyId + ' / ' + item.familyId + ' / ' + item.role),
              ...entry.taxonomyRelations.map((item) => item.taxonomyId + ' / ' + item.relation)
            ].join('；')) +
          '</span></div>'
        : '';
      const geometryRelations = entry.geometryRelations.length
        ? '<div class="catalog-geometry-rel"><strong>Geometry relation</strong><span>' +
            escapeHtml(entry.geometryRelations.map((item) => item.relation + ' · ' + item.note).join('；')) +
          '</span></div>'
        : '';
      const geometryEvidence = entry.geometryEvidence.length
        ? '<div class="catalog-geometry-evidence"><strong>Geometry evidence</strong><span>' +
            escapeHtml(entry.geometryEvidence.map((item) =>
              item.evidenceStatus +
              (item.licenseStatus ? ' · rights=' + item.licenseStatus : '') +
              (item.publicGeometryPromotion ? ' · public=' + item.publicGeometryPromotion : '') +
              (item.note ? ' · ' + item.note : '')
            ).join('；')) +
          '</span></div>'
        : '<div class="catalog-geometry-evidence pending"><strong>Geometry evidence</strong><span>尚無可重算幾何證據。</span></div>';
      const sources = entry.sources.length
        ? '<div class="catalog-sources"><span>來源</span>' + entry.sources.map((source) => '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(source.label) + '</a>').join("") + '</div>'
        : '<div class="catalog-sources pending"><span>來源</span><em>待補可靠來源與幾何核對</em></div>';
      return '<article class="classic-catalog-card" data-concept-id="' + escapeHtml(entry.id) + '" data-review="' + escapeHtml(entry.reviewStatus) + '">' +
        '<div class="catalog-card-top"><span>' + escapeHtml(Catalog.categories[entry.category]) + '</span><strong>' + reviewLabel(entry.reviewStatus) + '</strong></div>' +
        '<h3>' + escapeHtml(displayZh(entry)) + '</h3>' +
        '<p class="catalog-ontology-meta"><strong>' + escapeHtml(entityTypeLabel(entry.entityType)) + '</strong><span>' + escapeHtml(geometryReviewLabel(entry.geometryIdentity.reviewStatus)) + '</span></p>' +
        '<div class="catalog-zh-status"><strong>' + zhNameStatusLabel(entry.zhNameStatus) + '</strong><span>' + escapeHtml(entry.zhNameNote) + '</span></div>' +
        zhAliases +
        '<p class="catalog-teaching-label">' + escapeHtml(entry.teachingLabel) + '</p>' +
        '<ul class="catalog-aliases">' + aliases + '</ul>' +
        '<p class="catalog-note">' + escapeHtml(entry.note) + '</p>' +
        ambiguities +
        taxonomy +
        geometryRelations +
        geometryEvidence +
        (entry.negativeMappings.length ? '<p class="catalog-warning">禁止自動合併：' + escapeHtml(entry.negativeMappings.map((item) => item.name + ' · ' + item.reason).join('；')) + '</p>' : '') +
        (entry.rulesetSensitive ? '<p class="catalog-warning">規則敏感：已記錄 ' + entry.rulesetBehavior.length + ' 個 ruleset behavior；未指定規則與程序階段前不建立單一評分答案。</p>' : '') +
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

  function renderBentThreeBoard() {
    const item=BentThree.items[bentThreeIndex];
    const validation=BentThreeContract.validateItem(item,{ Go, PracticeContract });
    if (!validation.ok) throw new Error("Bent Three item invalid: " + validation.errors.join("; "));
    const size=item.boardSize;
    const pad=7;
    const span=86;
    const step=span/(size-1);
    const setup=new Map(validation.setupStones.map(([x,y,color])=>[pointKey(x,y),color]));
    const eye=new Set(item.eyeSpace.map(([x,y])=>pointKey(x,y)));
    const lines=[];
    const nodes=[];
    for(let i=0;i<size;i+=1){
      const p=pad+i*step;
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="' + (pad+span) + '" y2="' + p + '" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (pad+span) + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for(let y=0;y<size;y+=1) for(let x=0;x<size;x+=1){
      const px=pad+x*step;
      const py=pad+y*step;
      const color=setup.get(pointKey(x,y));
      if(color===Go.BLACK) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-black"/>');
      if(color===Go.WHITE) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-white"/>');
      if(eye.has(pointKey(x,y))) nodes.push('<circle data-bent-three-x="' + x + '" data-bent-three-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0,cy0]=bentThreeCursor;
    nodes.push('<circle cx="' + (pad+cx0*step) + '" cy="' + (pad+cy0*step) + '" r="6.4" class="classic-cursor-ring"/>');
    $("bent-three-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("bent-three-cursor-status").textContent="游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderBentThree() {
    const item=BentThree.items[bentThreeIndex];
    const validation=BentThreeContract.validateItem(item,{ Go, PracticeContract });
    if(!validation.ok) throw new Error("Bent Three item invalid: " + validation.errors.join("; "));
    bentThreeSolved=false;
    bentThreeHintShown=false;
    bentThreeCursor=item.eyeSpace[0].slice();
    $("bent-three-tag").textContent=(bentThreeIndex+1) + " / " + BentThree.items.length + " · answer derived from geometry";
    $("bent-three-title").textContent=bentThreeIndex===0 ? "找 L 形唯一彎點" : "換角色／方向，再找共同急所";
    $("bent-three-prompt").textContent=item.prompt;
    $("bent-three-feedback").className="feedback";
    $("bent-three-feedback").textContent="";
    $("bent-three-reveal").hidden=true;
    $("bent-three-hint").disabled=false;
    $("bent-three-next").disabled=true;
    $("bent-three-next").textContent=bentThreeIndex===BentThree.items.length-1 ? "完成曲三練習" : "下一題 →";
    $("bent-three-side").textContent=item.playerColor===Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderBentThreeBoard();
  }

  function attemptBentThree(x,y) {
    if(bentThreeSolved) return;
    const item=BentThree.items[bentThreeIndex];
    if(!item.eyeSpace.some(([ex,ey])=>ex===x&&ey===y)){
      $("bent-three-feedback").className="feedback error";
      $("bent-three-feedback").textContent="這一區只比較三個眼空中的候選點。";
      return;
    }
    const result=BentThreeContract.score(item,[x,y],{ Go, PracticeContract });
    if(!result.ok){
      $("bent-three-feedback").className="feedback error";
      $("bent-three-feedback").textContent="曲三 geometry contract 驗證失敗；本題停止評分。";
      return;
    }
    if(result.correct){
      bentThreeSolved=true;
      $("bent-three-feedback").className="feedback success";
      $("bent-three-feedback").textContent=item.success;
      $("bent-three-reveal").hidden=false;
      $("bent-three-hint").disabled=true;
      $("bent-three-next").disabled=false;
    }else{
      $("bent-three-feedback").className="feedback error";
      $("bent-three-feedback").textContent=bentThreeHintShown
        ? "還不是。重新數三個眼空的直接鄰點；只有彎點會同時碰到另外兩點。"
        : "這手合法，但不是 L 形 geometry 推導出的共同急所。";
    }
  }

  function moveBentThreeCursor(dx,dy){
    const item=BentThree.items[bentThreeIndex];
    const next=[bentThreeCursor[0]+dx,bentThreeCursor[1]+dy];
    if(item.eyeSpace.some(([x,y])=>x===next[0]&&y===next[1])){
      bentThreeCursor=next;
      renderBentThreeBoard();
    }
  }

  function renderFourStatusBoard() {
    const item=FourSpaceStatus.items[fourStatusIndex];
    const validation=FourSpaceStatusContract.validateItem(item,{ Go, PracticeContract, BentThreeContract });
    if (!validation.ok) throw new Error("Four-space status item invalid: " + validation.errors.join("; "));
    const size=item.boardSize;
    const pad=7;
    const span=86;
    const step=span/(size-1);
    const setup=new Map(validation.setupStones.map(([x,y,color])=>[pointKey(x,y),color]));
    const eye=new Set(item.eyeSpace.map(([x,y])=>pointKey(x,y)));
    const lines=[];
    const nodes=[];
    for(let i=0;i<size;i+=1){
      const p=pad+i*step;
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="' + (pad+span) + '" y2="' + p + '" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (pad+span) + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for(let y=0;y<size;y+=1) for(let x=0;x<size;x+=1){
      const px=pad+x*step;
      const py=pad+y*step;
      const color=setup.get(pointKey(x,y));
      if(color===Go.BLACK) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-black"/>');
      if(color===Go.WHITE) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-white"/>');
      if(eye.has(pointKey(x,y))) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="4.0" class="classic-eye-marker"/>');
    }
    $("four-status-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
  }

  function fourStatusProofText(item,validation) {
    if (validation.shapeKind==="square-four") {
      return "proof：守方四種第一手全部留下曲三；每一支都有合法的攻方彎點回應。因此在本 contract 的 sealed eye-space 前提下仍死。";
    }
    return "proof：攻方四種第一手逐一檢查後，守方每一支都至少有一手回應，使剩餘兩個分離眼點互不相鄰。因此在本 contract 的 sealed eye-space 前提下仍活。";
  }

  function renderFourStatus() {
    const item=FourSpaceStatus.items[fourStatusIndex];
    const validation=FourSpaceStatusContract.validateItem(item,{ Go, PracticeContract, BentThreeContract });
    if(!validation.ok) throw new Error("Four-space status item invalid: " + validation.errors.join("; "));
    fourStatusSolved=false;
    fourStatusHintShown=false;
    $("four-status-tag").textContent=(fourStatusIndex+1) + " / " + FourSpaceStatus.items.length + " · rules-backed status";
    $("four-status-question").textContent=validation.shapeKind==="square-four" ? "守方先走，還救得活嗎？" : "攻方先走，殺得死嗎？";
    $("four-status-prompt").textContent=item.prompt;
    $("four-status-feedback").className="feedback";
    $("four-status-feedback").textContent="";
    $("four-status-reveal").hidden=true;
    $("four-status-name").textContent=item.revealName;
    $("four-status-proof").textContent="";
    $("four-status-hint").disabled=false;
    $("four-status-next").disabled=true;
    $("four-status-alive").disabled=false;
    $("four-status-dead").disabled=false;
    $("four-status-next").textContent=fourStatusIndex===FourSpaceStatus.items.length-1 ? "完成四目眼比較" : "下一題 →";
    $("four-status-board-size").textContent=item.boardSize + " × " + item.boardSize + " bounded proof";
    $("four-status-side").textContent=item.defenderColor===Go.BLACK ? "● 黑棋守" : "○ 白棋守";
    renderFourStatusBoard();
  }

  function attemptFourStatus(response) {
    if(fourStatusSolved) return;
    const item=FourSpaceStatus.items[fourStatusIndex];
    const result=FourSpaceStatusContract.score(item,response,{ Go, PracticeContract, BentThreeContract });
    if(!result.ok){
      $("four-status-feedback").className="feedback error";
      $("four-status-feedback").textContent="四目眼 status contract 驗證失敗；本題停止評分。";
      return;
    }
    if(result.correct){
      fourStatusSolved=true;
      $("four-status-feedback").className="feedback success";
      $("four-status-feedback").textContent=item.success;
      $("four-status-reveal").hidden=false;
      $("four-status-proof").textContent=fourStatusProofText(item,FourSpaceStatusContract.validateItem(item,{ Go, PracticeContract, BentThreeContract }));
      $("four-status-hint").disabled=true;
      $("four-status-next").disabled=false;
      $("four-status-alive").disabled=true;
      $("four-status-dead").disabled=true;
    }else{
      $("four-status-feedback").className="feedback error";
      $("four-status-feedback").textContent=fourStatusHintShown
        ? item.hint
        : "這個判斷不符合 rules-backed proof。不要假設所有四目眼都一樣。";
    }
  }

  function renderPyramidFourBoard() {
    const item=PyramidFour.items[pyramidFourIndex];
    const validation=PyramidFourContract.validateItem(item,{ Go, PracticeContract });
    if (!validation.ok) throw new Error("Pyramid Four item invalid: " + validation.errors.join("; "));
    const size=item.boardSize;
    const pad=7;
    const span=86;
    const step=span/(size-1);
    const setup=new Map(validation.setupStones.map(([x,y,color])=>[pointKey(x,y),color]));
    const eye=new Set(item.eyeSpace.map(([x,y])=>pointKey(x,y)));
    const lines=[];
    const nodes=[];
    for(let i=0;i<size;i+=1){
      const p=pad+i*step;
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="' + (pad+span) + '" y2="' + p + '" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (pad+span) + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for(let y=0;y<size;y+=1) for(let x=0;x<size;x+=1){
      const px=pad+x*step;
      const py=pad+y*step;
      const color=setup.get(pointKey(x,y));
      if(color===Go.BLACK) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-black"/>');
      if(color===Go.WHITE) nodes.push('<circle cx="' + px + '" cy="' + py + '" r="5.3" class="stone-white"/>');
      if(eye.has(pointKey(x,y))) nodes.push('<circle data-pyramid-four-x="' + x + '" data-pyramid-four-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0,cy0]=pyramidFourCursor;
    nodes.push('<circle cx="' + (pad+cx0*step) + '" cy="' + (pad+cy0*step) + '" r="6.4" class="classic-cursor-ring"/>');
    $("pyramid-four-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("pyramid-four-cursor-status").textContent="游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderPyramidFour() {
    const item=PyramidFour.items[pyramidFourIndex];
    const validation=PyramidFourContract.validateItem(item,{ Go, PracticeContract });
    if(!validation.ok) throw new Error("Pyramid Four item invalid: " + validation.errors.join("; "));
    pyramidFourSolved=false;
    pyramidFourHintShown=false;
    pyramidFourCursor=item.eyeSpace[0].slice();
    $("pyramid-four-tag").textContent=(pyramidFourIndex+1) + " / " + PyramidFour.items.length + " · answer derived from geometry";
    $("pyramid-four-title").textContent=pyramidFourIndex===0 ? "找 T 形唯一中心" : "換角色／方向，再找共同急所";
    $("pyramid-four-prompt").textContent=item.prompt;
    $("pyramid-four-feedback").className="feedback";
    $("pyramid-four-feedback").textContent="";
    $("pyramid-four-reveal").hidden=true;
    $("pyramid-four-hint").disabled=false;
    $("pyramid-four-next").disabled=true;
    $("pyramid-four-next").textContent=pyramidFourIndex===PyramidFour.items.length-1 ? "完成丁四練習" : "下一題 →";
    $("pyramid-four-side").textContent=item.playerColor===Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderPyramidFourBoard();
  }

  function attemptPyramidFour(x,y) {
    if(pyramidFourSolved) return;
    const item=PyramidFour.items[pyramidFourIndex];
    if(!item.eyeSpace.some(([ex,ey])=>ex===x&&ey===y)){
      $("pyramid-four-feedback").className="feedback error";
      $("pyramid-four-feedback").textContent="這一區只比較四個眼空中的候選點。";
      return;
    }
    const result=PyramidFourContract.score(item,[x,y],{ Go, PracticeContract });
    if(!result.ok){
      $("pyramid-four-feedback").className="feedback error";
      $("pyramid-four-feedback").textContent="丁四 geometry contract 驗證失敗；本題停止評分。";
      return;
    }
    if(result.correct){
      pyramidFourSolved=true;
      $("pyramid-four-feedback").className="feedback success";
      $("pyramid-four-feedback").textContent=item.success;
      $("pyramid-four-reveal").hidden=false;
      $("pyramid-four-hint").disabled=true;
      $("pyramid-four-next").disabled=false;
    }else{
      $("pyramid-four-feedback").className="feedback error";
      $("pyramid-four-feedback").textContent=pyramidFourHintShown
        ? "還不是。重新數四個眼空的直接鄰點；只有一點會同時碰到另外三點。"
        : "這手合法，但不是 T 形 geometry 推導出的共同急所。";
    }
  }

  function movePyramidFourCursor(dx,dy){
    const item=PyramidFour.items[pyramidFourIndex];
    const next=[pyramidFourCursor[0]+dx,pyramidFourCursor[1]+dy];
    if(item.eyeSpace.some(([x,y])=>x===next[0]&&y===next[1])){
      pyramidFourCursor=next;
      renderPyramidFourBoard();
    }
  }

  function renderFlowerSixBoard() {
    const item = FlowerSix.items[flowerSixIndex];
    const validation = FlowerSixContract.validateItem(item,{ Go, PracticeContract });
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
      if (eye.has(pointKey(x,y))) nodes.push('<circle data-flower-six-x="' + x + '" data-flower-six-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit bulky-hit"/>');
    }
    const [cx0,cy0] = flowerSixCursor;
    nodes.push('<circle cx="' + (pad+cx0*step) + '" cy="' + (pad+cy0*step) + '" r="6.4" class="classic-cursor-ring"/>');
    $("flower-six-board").innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("flower-six-cursor-status").textContent = "游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderFlowerSix() {
    const item = FlowerSix.items[flowerSixIndex];
    flowerSixSolved = false;
    flowerSixHintShown = false;
    flowerSixCursor = item.eyeSpace[0].slice();
    $("flower-six-tag").textContent = (flowerSixIndex+1) + " / " + FlowerSix.items.length + " · 名稱不提示答案";
    $("flower-six-title").textContent = flowerSixIndex === 0 ? "找六點眼空共同急所" : "換角色／方向／位置再找急所";
    $("flower-six-prompt").textContent = item.prompt;
    $("flower-six-feedback").className = "feedback";
    $("flower-six-feedback").textContent = "";
    $("flower-six-reveal").hidden = true;
    $("flower-six-hint").disabled = false;
    $("flower-six-next").disabled = true;
    $("flower-six-next").textContent = flowerSixIndex === FlowerSix.items.length-1 ? "完成花六練習" : "下一題 →";
    $("flower-six-side").textContent = item.playerColor === Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderFlowerSixBoard();
  }

  function attemptFlowerSix(x,y) {
    if (flowerSixSolved) return;
    const item = FlowerSix.items[flowerSixIndex];
    if (!item.eyeSpace.some(([ex,ey]) => ex===x && ey===y)) {
      $("flower-six-feedback").className = "feedback error";
      $("flower-six-feedback").textContent = "這一區只比較六個眼空中的候選點。";
      return;
    }
    const result = FlowerSixContract.score(item,[x,y],{ Go, PracticeContract });
    if (!result.ok) {
      $("flower-six-feedback").className = "feedback error";
      $("flower-six-feedback").textContent = "花六 contract 驗證失敗；本題停止評分。";
      return;
    }
    if (result.correct) {
      flowerSixSolved = true;
      $("flower-six-feedback").className = "feedback success";
      $("flower-six-feedback").textContent = item.success;
      $("flower-six-reveal").hidden = false;
      $("flower-six-hint").disabled = true;
      $("flower-six-next").disabled = false;
    } else {
      $("flower-six-feedback").className = "feedback error";
      $("flower-six-feedback").textContent = flowerSixHintShown
        ? "還不是。重新數每個眼空直接相鄰的眼空；只有一點是 degree-4。"
        : "這一點不是兩個突出點的根部。不要記座標，請重新看六點 adjacency。";
    }
  }

  function moveFlowerSixCursor(dx,dy) {
    const item = FlowerSix.items[flowerSixIndex];
    const next = [flowerSixCursor[0]+dx,flowerSixCursor[1]+dy];
    if (item.eyeSpace.some(([x,y]) => x===next[0] && y===next[1])) {
      flowerSixCursor = next;
      renderFlowerSixBoard();
    }
  }

  function initialGoldenChickenCursor(item,position) {
    const occupied=new Set(position.setupStones.map(([x,y]) => pointKey(x,y)));
    for (let y=0; y<item.boardSize; y+=1) for (let x=0; x<item.boardSize; x+=1) {
      if (!occupied.has(pointKey(x,y)) && !GoldenChickenContract.samePoint([x,y],position.descent)) return [x,y];
    }
    return position.descent.slice();
  }

  function renderGoldenChickenBoard() {
    const item=GoldenChicken.items[goldenChickenIndex];
    const validation=GoldenChickenContract.validateItem(item,Go);
    if (!validation.ok) throw new Error("Golden Chicken item invalid: " + validation.errors.join("; "));
    const position=validation.position;
    const size=item.boardSize;
    const pad=7;
    const span=86;
    const step=span/(size-1);
    const setup=new Map(position.setupStones.map(([x,y,color]) => [pointKey(x,y),color]));
    const lines=[];
    const nodes=[];
    for (let i=0;i<size;i+=1) {
      const p=pad+i*step;
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="' + (pad+span) + '" y2="' + p + '" stroke="#70502c" stroke-width=".55"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (pad+span) + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for (let y=0;y<size;y+=1) for (let x=0;x<size;x+=1) {
      const px=pad+x*step;
      const py=pad+y*step;
      const color=setup.get(pointKey(x,y));
      if (color===Go.BLACK) nodes.push('<circle data-golden-x="' + x + '" data-golden-y="' + y + '" cx="' + px + '" cy="' + py + '" r="5.3" class="stone-black classic-occupied"/>');
      else if (color===Go.WHITE) nodes.push('<circle data-golden-x="' + x + '" data-golden-y="' + y + '" cx="' + px + '" cy="' + py + '" r="5.3" class="stone-white classic-occupied"/>');
      else nodes.push('<circle data-golden-x="' + x + '" data-golden-y="' + y + '" cx="' + px + '" cy="' + py + '" r="6.2" class="classic-hit"/>');
    }
    const [cx0,cy0]=goldenChickenCursor;
    nodes.push('<circle cx="' + (pad+cx0*step) + '" cy="' + (pad+cy0*step) + '" r="6.4" class="classic-cursor-ring"/>');
    $("golden-chicken-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("golden-chicken-cursor-status").textContent="游標：第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderGoldenChicken() {
    const item=GoldenChicken.items[goldenChickenIndex];
    const validation=GoldenChickenContract.validateItem(item,Go);
    if (!validation.ok) throw new Error("Golden Chicken item invalid: " + validation.errors.join("; "));
    goldenChickenSolved=false;
    goldenChickenHintShown=false;
    goldenChickenCursor=initialGoldenChickenCursor(item,validation.position);
    $("golden-chicken-tag").textContent=(goldenChickenIndex+1) + " / " + GoldenChicken.items.length + " · tesuji mechanism";
    $("golden-chicken-title").textContent=goldenChickenIndex===0 ? "找讓 1 氣變 2 氣的一路立" : "換方向／棋色，再找同一機制";
    $("golden-chicken-prompt").textContent=item.prompt;
    $("golden-chicken-feedback").className="feedback";
    $("golden-chicken-feedback").textContent="";
    $("golden-chicken-reveal").hidden=true;
    $("golden-chicken-hint").disabled=false;
    $("golden-chicken-next").disabled=true;
    $("golden-chicken-next").textContent=goldenChickenIndex===GoldenChicken.items.length-1 ? "完成金雞獨立練習" : "下一題 →";
    $("golden-chicken-side").textContent=validation.position.playerColor===Go.BLACK ? "● 黑棋" : "○ 白棋";
    renderGoldenChickenBoard();
  }

  function attemptGoldenChicken(x,y) {
    if (goldenChickenSolved) return;
    const item=GoldenChicken.items[goldenChickenIndex];
    const result=GoldenChickenContract.score(item,[x,y],Go);
    if (!result.ok) {
      $("golden-chicken-feedback").className="feedback error";
      $("golden-chicken-feedback").textContent="金雞獨立 mechanism contract 驗證失敗；本題停止評分。";
      return;
    }
    if (result.status==="ILLEGAL_MOVE") {
      $("golden-chicken-feedback").className="feedback error";
      $("golden-chicken-feedback").textContent="這裡不是目前可合法落子的空點。";
      return;
    }
    if (result.correct) {
      goldenChickenSolved=true;
      $("golden-chicken-feedback").className="feedback success";
      $("golden-chicken-feedback").textContent=item.success;
      $("golden-chicken-reveal").hidden=false;
      $("golden-chicken-hint").disabled=true;
      $("golden-chicken-next").disabled=false;
    } else {
      $("golden-chicken-feedback").className="feedback error";
      $("golden-chicken-feedback").textContent=goldenChickenHintShown
        ? "還不是。先找己方只剩的一口氣；正解走完後，這一串必須恰好變成兩口氣。"
        : "這手合法，但沒有完成本題的「一路立 → 1 氣變 2 氣 → 對手兩側不入」機制。";
    }
  }

  function moveGoldenChickenCursor(dx,dy) {
    const item=GoldenChicken.items[goldenChickenIndex];
    const next=[goldenChickenCursor[0]+dx,goldenChickenCursor[1]+dy];
    if (next[0]>=0 && next[0]<item.boardSize && next[1]>=0 && next[1]<item.boardSize) {
      goldenChickenCursor=next;
      renderGoldenChickenBoard();
    }
  }

  function initialBigPigsMouthCursor(item,position) {
    const board=Go.boardFromStones(position.setupStones,item.boardSize);
    for (let y=position.viewport.minY; y<=position.viewport.maxY; y+=1) {
      for (let x=position.viewport.minX; x<=position.viewport.maxX; x+=1) {
        if (board[y][x]===Go.EMPTY && !BigPigsMouthContract.samePoint([x,y],position.expectedMove)) return [x,y];
      }
    }
    return position.expectedMove.slice();
  }

  function renderBigPigsMouthBoard() {
    const item=BigPigsMouth.items[bigPigsMouthIndex];
    const validation=BigPigsMouthContract.validateItem(item,Go);
    if (!validation.ok) throw new Error("Big Pig's Mouth item invalid: " + validation.errors.join("; "));
    const position=validation.position;
    const {minX,maxX,minY,maxY}=position.viewport;
    const pad=7;
    const span=86;
    const width=maxX-minX;
    const height=maxY-minY;
    const step=span/Math.max(width,height);
    const setup=new Map(position.setupStones.map(([x,y,color])=>[pointKey(x,y),color]));
    const lines=[];
    const nodes=[];
    for (let y=minY;y<=maxY;y+=1) {
      const py=pad+(y-minY)*step;
      lines.push('<line x1="' + pad + '" y1="' + py + '" x2="' + (pad+width*step) + '" y2="' + py + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for (let x=minX;x<=maxX;x+=1) {
      const px=pad+(x-minX)*step;
      lines.push('<line x1="' + px + '" y1="' + pad + '" x2="' + px + '" y2="' + (pad+height*step) + '" stroke="#70502c" stroke-width=".55"/>');
    }
    for (let y=minY;y<=maxY;y+=1) for (let x=minX;x<=maxX;x+=1) {
      const px=pad+(x-minX)*step;
      const py=pad+(y-minY)*step;
      const color=setup.get(pointKey(x,y));
      if (color===Go.BLACK) nodes.push('<circle data-big-pig-x="' + x + '" data-big-pig-y="' + y + '" cx="' + px + '" cy="' + py + '" r="4.5" class="stone-black classic-occupied"/>');
      else if (color===Go.WHITE) nodes.push('<circle data-big-pig-x="' + x + '" data-big-pig-y="' + y + '" cx="' + px + '" cy="' + py + '" r="4.5" class="stone-white classic-occupied"/>');
      else nodes.push('<circle data-big-pig-x="' + x + '" data-big-pig-y="' + y + '" cx="' + px + '" cy="' + py + '" r="5.3" class="classic-hit"/>');
    }
    const [cx0,cy0]=bigPigsMouthCursor;
    nodes.push('<circle cx="' + (pad+(cx0-minX)*step) + '" cy="' + (pad+(cy0-minY)*step) + '" r="5.6" class="classic-cursor-ring"/>');
    $("big-pigs-mouth-board").innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + '</svg>';
    $("big-pigs-mouth-cursor-status").textContent="游標：全盤第 " + (cy0+1) + " 行，第 " + (cx0+1) + " 列";
  }

  function renderBigPigsMouth() {
    const item=BigPigsMouth.items[bigPigsMouthIndex];
    const validation=BigPigsMouthContract.validateItem(item,Go);
    if (!validation.ok) throw new Error("Big Pig's Mouth item invalid: " + validation.errors.join("; "));
    bigPigsMouthSolved=false;
    bigPigsMouthHintShown=false;
    bigPigsMouthCursor=initialBigPigsMouthCursor(item,validation.position);
    $("big-pigs-mouth-tag").textContent=(bigPigsMouthIndex+1) + " / " + BigPigsMouth.items.length + " · exact source case";
    $("big-pigs-mouth-title").textContent=bigPigsMouthIndex===0 ? "固定實戰局面的第一手" : "旋轉後重新定位第一手";
    $("big-pigs-mouth-prompt").textContent=item.prompt;
    $("big-pigs-mouth-feedback").className="feedback";
    $("big-pigs-mouth-feedback").textContent="";
    $("big-pigs-mouth-reveal").hidden=true;
    $("big-pigs-mouth-hint").disabled=false;
    $("big-pigs-mouth-next").disabled=true;
    $("big-pigs-mouth-next").textContent=bigPigsMouthIndex===BigPigsMouth.items.length-1 ? "完成大豬嘴 source-case" : "下一題 →";
    renderBigPigsMouthBoard();
  }

  function attemptBigPigsMouth(x,y) {
    if (bigPigsMouthSolved) return;
    const item=BigPigsMouth.items[bigPigsMouthIndex];
    const result=BigPigsMouthContract.score(item,[x,y],Go);
    if (!result.ok) {
      $("big-pigs-mouth-feedback").className="feedback error";
      $("big-pigs-mouth-feedback").textContent="大豬嘴 source-case contract 驗證失敗；本題停止評分。";
      return;
    }
    if (result.status==="ILLEGAL_MOVE") {
      $("big-pigs-mouth-feedback").className="feedback error";
      $("big-pigs-mouth-feedback").textContent="這裡已有棋子或不是目前規則下可落子的點。";
      return;
    }
    if (result.correct) {
      bigPigsMouthSolved=true;
      $("big-pigs-mouth-feedback").className="feedback success";
      $("big-pigs-mouth-feedback").textContent=item.success;
      $("big-pigs-mouth-reveal").hidden=false;
      $("big-pigs-mouth-hint").disabled=true;
      $("big-pigs-mouth-next").disabled=false;
    } else {
      $("big-pigs-mouth-feedback").className="feedback error";
      $("big-pigs-mouth-feedback").textContent=bigPigsMouthHintShown
        ? "還不是。只針對這個 exact source case，重新看目前角部一線附近可做活的第一手。"
        : "這手合法，但不是 upstream regression 對此 exact source case 指定的 expected move。";
    }
  }

  function moveBigPigsMouthCursor(dx,dy) {
    const item=BigPigsMouth.items[bigPigsMouthIndex];
    const validation=BigPigsMouthContract.validateItem(item,Go);
    const v=validation.position.viewport;
    const next=[bigPigsMouthCursor[0]+dx,bigPigsMouthCursor[1]+dy];
    if (next[0]>=v.minX && next[0]<=v.maxX && next[1]>=v.minY && next[1]<=v.maxY) {
      bigPigsMouthCursor=next;
      renderBigPigsMouthBoard();
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

  $("bent-three-board").addEventListener("click",(event) => {
    const hit=event.target.closest("[data-bent-three-x][data-bent-three-y]");
    if(!hit) return;
    bentThreeCursor=[Number(hit.dataset.bentThreeX),Number(hit.dataset.bentThreeY)];
    renderBentThreeBoard();
    attemptBentThree(bentThreeCursor[0],bentThreeCursor[1]);
  });

  $("bent-three-board").addEventListener("keydown",(event) => {
    if(event.key==="ArrowLeft"){ event.preventDefault(); moveBentThreeCursor(-1,0); }
    else if(event.key==="ArrowRight"){ event.preventDefault(); moveBentThreeCursor(1,0); }
    else if(event.key==="ArrowUp"){ event.preventDefault(); moveBentThreeCursor(0,-1); }
    else if(event.key==="ArrowDown"){ event.preventDefault(); moveBentThreeCursor(0,1); }
    else if(event.key==="Enter" || event.key===" "){
      event.preventDefault();
      attemptBentThree(bentThreeCursor[0],bentThreeCursor[1]);
    }
  });

  $("bent-three-hint").addEventListener("click",() => {
    bentThreeHintShown=true;
    $("bent-three-feedback").className="feedback";
    $("bent-three-feedback").textContent=BentThree.items[bentThreeIndex].hint;
  });

  $("bent-three-next").addEventListener("click",() => {
    if(!bentThreeSolved) return;
    if(bentThreeIndex<BentThree.items.length-1){
      bentThreeIndex+=1;
      renderBentThree();
    }else{
      $("bent-three-feedback").className="feedback success";
      $("bent-three-feedback").textContent="曲三／Bent Three 練習完成。這只表示完成四個 geometry-derived first-move variant，不代表完整答案樹、mastery 或 transfer。";
      $("bent-three-next").disabled=true;
    }
  });

  $("four-status-alive").addEventListener("click",() => attemptFourStatus(FourSpaceStatusContract.STATUS.ALIVE));
  $("four-status-dead").addEventListener("click",() => attemptFourStatus(FourSpaceStatusContract.STATUS.DEAD));

  $("four-status-hint").addEventListener("click",() => {
    fourStatusHintShown=true;
    $("four-status-feedback").className="feedback";
    $("four-status-feedback").textContent=FourSpaceStatus.items[fourStatusIndex].hint;
  });

  $("four-status-next").addEventListener("click",() => {
    if(!fourStatusSolved) return;
    if(fourStatusIndex<FourSpaceStatus.items.length-1){
      fourStatusIndex+=1;
      renderFourStatus();
    }else{
      $("four-status-feedback").className="feedback success";
      $("four-status-feedback").textContent="四目眼狀態比較完成。這只支持 sealed eye-space 的局部 proof，不代表所有實戰四點空都可脫離外部條件直接判死活。";
      $("four-status-next").disabled=true;
    }
  });

  $("pyramid-four-board").addEventListener("click",(event) => {
    const hit=event.target.closest("[data-pyramid-four-x][data-pyramid-four-y]");
    if(!hit) return;
    pyramidFourCursor=[Number(hit.dataset.pyramidFourX),Number(hit.dataset.pyramidFourY)];
    renderPyramidFourBoard();
    attemptPyramidFour(pyramidFourCursor[0],pyramidFourCursor[1]);
  });

  $("pyramid-four-board").addEventListener("keydown",(event) => {
    if(event.key==="ArrowLeft"){ event.preventDefault(); movePyramidFourCursor(-1,0); }
    else if(event.key==="ArrowRight"){ event.preventDefault(); movePyramidFourCursor(1,0); }
    else if(event.key==="ArrowUp"){ event.preventDefault(); movePyramidFourCursor(0,-1); }
    else if(event.key==="ArrowDown"){ event.preventDefault(); movePyramidFourCursor(0,1); }
    else if(event.key==="Enter" || event.key===" "){
      event.preventDefault();
      attemptPyramidFour(pyramidFourCursor[0],pyramidFourCursor[1]);
    }
  });

  $("pyramid-four-hint").addEventListener("click",() => {
    pyramidFourHintShown=true;
    $("pyramid-four-feedback").className="feedback";
    $("pyramid-four-feedback").textContent=PyramidFour.items[pyramidFourIndex].hint;
  });

  $("pyramid-four-next").addEventListener("click",() => {
    if(!pyramidFourSolved) return;
    if(pyramidFourIndex<PyramidFour.items.length-1){
      pyramidFourIndex+=1;
      renderPyramidFour();
    }else{
      $("pyramid-four-feedback").className="feedback success";
      $("pyramid-four-feedback").textContent="丁四／Pyramid Four 練習完成。這只表示完成四個 geometry-derived first-move variant，不代表完整吃淨答案樹、mastery 或 transfer。";
      $("pyramid-four-next").disabled=true;
    }
  });

  $("flower-six-board").addEventListener("click",(event) => {
    const hit = event.target.closest("[data-flower-six-x][data-flower-six-y]");
    if (!hit) return;
    flowerSixCursor = [Number(hit.dataset.flowerSixX),Number(hit.dataset.flowerSixY)];
    renderFlowerSixBoard();
    attemptFlowerSix(flowerSixCursor[0],flowerSixCursor[1]);
  });

  $("flower-six-board").addEventListener("keydown",(event) => {
    if (event.key==="ArrowLeft") { event.preventDefault(); moveFlowerSixCursor(-1,0); }
    else if (event.key==="ArrowRight") { event.preventDefault(); moveFlowerSixCursor(1,0); }
    else if (event.key==="ArrowUp") { event.preventDefault(); moveFlowerSixCursor(0,-1); }
    else if (event.key==="ArrowDown") { event.preventDefault(); moveFlowerSixCursor(0,1); }
    else if (event.key==="Enter" || event.key===" ") {
      event.preventDefault();
      attemptFlowerSix(flowerSixCursor[0],flowerSixCursor[1]);
    }
  });

  $("flower-six-hint").addEventListener("click",() => {
    flowerSixHintShown = true;
    $("flower-six-feedback").className = "feedback";
    $("flower-six-feedback").textContent = FlowerSix.items[flowerSixIndex].hint;
  });

  $("flower-six-next").addEventListener("click",() => {
    if (!flowerSixSolved) return;
    if (flowerSixIndex < FlowerSix.items.length-1) {
      flowerSixIndex += 1;
      renderFlowerSix();
    } else {
      $("flower-six-feedback").className = "feedback success";
      $("flower-six-feedback").textContent = "花六共同急所練習完成。這只表示完成四個 bounded variant，不代表完整六目中手長變化、mastery 或 transfer。";
      $("flower-six-next").disabled = true;
    }
  });

  $("golden-chicken-board").addEventListener("click",(event) => {
    const hit=event.target.closest("[data-golden-x][data-golden-y]");
    if (!hit) return;
    goldenChickenCursor=[Number(hit.dataset.goldenX),Number(hit.dataset.goldenY)];
    renderGoldenChickenBoard();
    attemptGoldenChicken(goldenChickenCursor[0],goldenChickenCursor[1]);
  });

  $("golden-chicken-board").addEventListener("keydown",(event) => {
    if (event.key==="ArrowLeft") { event.preventDefault(); moveGoldenChickenCursor(-1,0); }
    else if (event.key==="ArrowRight") { event.preventDefault(); moveGoldenChickenCursor(1,0); }
    else if (event.key==="ArrowUp") { event.preventDefault(); moveGoldenChickenCursor(0,-1); }
    else if (event.key==="ArrowDown") { event.preventDefault(); moveGoldenChickenCursor(0,1); }
    else if (event.key==="Enter" || event.key===" ") {
      event.preventDefault();
      attemptGoldenChicken(goldenChickenCursor[0],goldenChickenCursor[1]);
    }
  });

  $("golden-chicken-hint").addEventListener("click",() => {
    goldenChickenHintShown=true;
    $("golden-chicken-feedback").className="feedback";
    $("golden-chicken-feedback").textContent=GoldenChicken.items[goldenChickenIndex].hint;
  });

  $("golden-chicken-next").addEventListener("click",() => {
    if (!goldenChickenSolved) return;
    if (goldenChickenIndex < GoldenChicken.items.length-1) {
      goldenChickenIndex+=1;
      renderGoldenChicken();
    } else {
      $("golden-chicken-feedback").className="feedback success";
      $("golden-chicken-feedback").textContent="金雞獨立 mechanism practice 完成。這只表示四個原創變形都完成了同一 rules-backed 手筋機制，不代表所有實戰金雞獨立、mastery、transfer 或 formal evaluation 已驗證。";
      $("golden-chicken-next").disabled=true;
    }
  });

  $("big-pigs-mouth-board").addEventListener("click",(event) => {
    const hit=event.target.closest("[data-big-pig-x][data-big-pig-y]");
    if (!hit) return;
    bigPigsMouthCursor=[Number(hit.dataset.bigPigX),Number(hit.dataset.bigPigY)];
    renderBigPigsMouthBoard();
    attemptBigPigsMouth(bigPigsMouthCursor[0],bigPigsMouthCursor[1]);
  });

  $("big-pigs-mouth-board").addEventListener("keydown",(event) => {
    if (event.key==="ArrowLeft") { event.preventDefault(); moveBigPigsMouthCursor(-1,0); }
    else if (event.key==="ArrowRight") { event.preventDefault(); moveBigPigsMouthCursor(1,0); }
    else if (event.key==="ArrowUp") { event.preventDefault(); moveBigPigsMouthCursor(0,-1); }
    else if (event.key==="ArrowDown") { event.preventDefault(); moveBigPigsMouthCursor(0,1); }
    else if (event.key==="Enter" || event.key===" ") {
      event.preventDefault();
      attemptBigPigsMouth(bigPigsMouthCursor[0],bigPigsMouthCursor[1]);
    }
  });

  $("big-pigs-mouth-hint").addEventListener("click",() => {
    bigPigsMouthHintShown=true;
    $("big-pigs-mouth-feedback").className="feedback";
    $("big-pigs-mouth-feedback").textContent=BigPigsMouth.items[bigPigsMouthIndex].hint;
  });

  $("big-pigs-mouth-next").addEventListener("click",() => {
    if (!bigPigsMouthSolved) return;
    if (bigPigsMouthIndex<BigPigsMouth.items.length-1) {
      bigPigsMouthIndex+=1;
      renderBigPigsMouth();
    } else {
      $("big-pigs-mouth-feedback").className="feedback success";
      $("big-pigs-mouth-feedback").textContent="大豬嘴 source-case 練習完成。這只支持同一 MIT regression 局面的四向 first-move oracle；標準 family geometry、主要 variation 與一般化仍是 UNKNOWN。";
      $("big-pigs-mouth-next").disabled=true;
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
  renderBentThree();
  renderFourStatus();
  renderPyramidFour();
  renderFlowerSix();
  renderGoldenChicken();
  renderBigPigsMouth();
  renderBulky();
  renderRead();
  renderReduction();
  render();
})();
