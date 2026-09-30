const assert = require("node:assert/strict");
const { test } = require("node:test");
const { lessons } = require("../content.js");
const Go = require("../go.js");

const DIAGRAM_LESSONS = lessons.map((_, index) => index);

function key([x, y]) { return `${x},${y}`; }

test("每課都有概念、棋盤示範與解題前檢查點", () => {
  assert.equal(lessons.length, 19);
  for (const lesson of lessons) {
    assert.match(lesson.text, /\S/, `${lesson.title} 缺少概念`);
    assert.ok(Array.isArray(lesson.demoSteps) && lesson.demoSteps.length >= 1, `${lesson.title} 缺少棋盤示範`);
    assert.match(lesson.takeaway, /\S/, `${lesson.title} 缺少解題前檢查點`);
  }
});

function validateDiagram(title, diagram) {
  const stones = new Set();
  for (const [x, y, color] of diagram.stones) {
    assert.ok(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 5 && y >= 0 && y < 5, `${title} 有盤外棋子`);
    assert.ok(color === 1 || color === 2, `${title} 有未知棋色`);
    assert.ok(!stones.has(`${x},${y}`), `${title} 有重疊棋子`);
    stones.add(`${x},${y}`);
  }
  for (const marker of ["highlights", "blocked", "emphasis", "reference"]) {
    const points = new Set();
    for (const point of diagram[marker] || []) {
      const [x, y] = point;
      assert.ok(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 5 && y >= 0 && y < 5, `${title} 有盤外 ${marker} 標記`);
      assert.ok(!points.has(key(point)), `${title} 有重複 ${marker} 標記`);
      points.add(key(point));
      if (marker === "emphasis") assert.ok(stones.has(key(point)), `${title} 的強調圈未落在棋子上`);
      else if (marker !== "reference") assert.ok(!stones.has(key(point)), `${title} 的 ${marker} 標記被棋子佔住`);
    }
  }
  assert.match(diagram.label, /\S/, `${title} 缺少棋形替代文字`);
}

function sortedPoints(points = []) {
  return points
    .map((point) => [...point])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || String(a[2] || "").localeCompare(String(b[2] || "")));
}

function visualSignature(step) {
  return JSON.stringify({
    stones: sortedPoints(step.stones),
    highlights: sortedPoints(step.highlights),
    emphasis: sortedPoints(step.emphasis),
    blocked: sortedPoints(step.blocked),
    reference: sortedPoints(step.reference)
  });
}

test("全部十九課都有有效棋盤示範，且相鄰步驟不能是完全相同畫面", () => {
  for (const index of DIAGRAM_LESSONS) {
    const { title, demoSteps } = lessons[index];
    assert.ok(Array.isArray(demoSteps) && demoSteps.length >= 1, `${title} 缺少棋盤示範`);
    for (const step of demoSteps) {
      assert.match(step.caption, /\S/, `${title} 的示範步驟缺少說明`);
      assert.ok(Array.isArray(step.stones), `${title} 的示範步驟缺少棋形`);
      validateDiagram(title, step);
    }
    for (let stepIndex = 1; stepIndex < demoSteps.length; stepIndex += 1) {
      assert.notEqual(
        visualSignature(demoSteps[stepIndex - 1]),
        visualSignature(demoSteps[stepIndex]),
        `${title} 第 ${stepIndex}→${stepIndex + 1} 步沒有可見變化`
      );
    }
  }
});

test("認識氣先聚焦角上黑棋，再揭示兩口氣", () => {
  const [observeStone, revealLiberties] = lessons[0].demoSteps;
  assert.equal((observeStone.highlights || []).length, 0);
  assert.deepEqual(observeStone.emphasis, [[0, 0]]);
  assert.deepEqual(revealLiberties.highlights, [[1, 0], [0, 1]]);
  assert.match(revealLiberties.caption, /2 口氣/);
});

test("中高級縮圖明示比較或示意邊界，不把五路圖寫成唯一全局答案", () => {
  for (let index = 8; index < lessons.length; index += 1) {
    const captions = lessons[index].demoSteps.map((step) => step.caption).join(" ");
    assert.match(captions, /示意|縮圖|不是.*答案|不是.*唯一|不代表固定|不保證|只示範|不能只|實際.*比較|仍.*比較|假設|逐項比較/, `${lessons[index].title} 缺少示意邊界`);
  }
});

function emptyRegions(step, blockedColor = null) {
  const occupied = new Set(step.stones.filter(([, , color]) => blockedColor === null || color === blockedColor).map(key));
  const seen = new Set();
  const regions = [];
  for (let y = 0; y < 5; y += 1) for (let x = 0; x < 5; x += 1) {
    const start = `${x},${y}`;
    if (occupied.has(start) || seen.has(start)) continue;
    const region = new Set([start]);
    const queue = [[x, y]];
    seen.add(start);
    let touchesEdge = false;
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (cx === 0 || cx === 4 || cy === 0 || cy === 4) touchesEdge = true;
      for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
        const next = `${nx},${ny}`;
        if (nx < 0 || nx > 4 || ny < 0 || ny > 4 || occupied.has(next) || seen.has(next)) continue;
        seen.add(next);
        region.add(next);
        queue.push([nx, ny]);
      }
    }
    regions.push({ region, touchesEdge });
  }
  return regions;
}

test("直三示範先呈現同一眼空間，再以中央急所分成兩眼", () => {
  const initial = lessons[7].demoSteps[0];
  const initialRegions = emptyRegions(initial);
  const initialEyeRegions = initial.highlights.map((point) => initialRegions.find(({ region }) => region.has(key(point))));
  assert.equal(new Set(initialEyeRegions).size, 1);
  assert.ok(initialEyeRegions.every(({ touchesEdge }) => !touchesEdge));

  const madeAlive = lessons[7].demoSteps[1];
  const regions = emptyRegions(madeAlive);
  const eyeRegions = madeAlive.highlights.map((point) => regions.find(({ region }) => region.has(key(point))));
  assert.equal(new Set(eyeRegions).size, 2);
  assert.ok(eyeRegions.every(({ touchesEdge }) => !touchesEdge));
  assert.ok(madeAlive.stones.some(([x, y, color]) => x === 2 && y === 1 && color === 1));
});


test("修改過的正式題目文案保留獨立 contentVersion", () => {
  const { problems } = require("../content.js");
  for (const id of ["u4-06", "u9-06", "u10-06", "u12-02", "u12-04", "u14-04"]) {
    assert.equal(problems.find((problem) => problem.id === id).contentVersion, 2, `${id} 應升為 contentVersion 2`);
  }
  assert.equal(problems.find((problem) => problem.id === "u4-05").contentVersion, 1);
});

test("厚勢、外勢與先手使用有邊界的學習者定義", () => {
  const thickness = lessons[10].terms.find((entry) => entry.term === "厚勢");
  const influence = lessons[10].terms.find((entry) => entry.term === "外勢");
  const sente = lessons[13].terms.find((entry) => entry.term === "先手");
  assert.ok(thickness && influence && sente);
  assert.notEqual(thickness.definition, influence.definition);
  assert.match(thickness.definition, /安定|厚實棋形/);
  assert.match(influence.definition, /中央|外側|力量|影響/);
  assert.match(sente.definition, /不回應/);
  assert.match(sente.definition, /通常需要回應/);
  assert.doesNotMatch(sente.definition, /必須回應/);
});

test("尚未完成中文概念邊界查核的薄味不作 Core 必學術語", () => {
  const { problems } = require("../content.js");
  const learnerCopy = JSON.stringify({ lessons, problems });
  assert.doesNotMatch(learnerCopy, /薄味/);
  const weakPoint = problems.find((problem) => problem.id === "u12-04");
  const josekiWeakness = problems.find((problem) => problem.id === "u14-04");
  assert.match(weakPoint.title + " " + weakPoint.explanation, /弱點|尚未安定/);
  assert.match(josekiWeakness.explanation, /弱點|後續手段/);
});

test("術語內容查核保留 Core 概念邊界並阻止舊用語回歸", () => {
  const { problems } = require("../content.js");
  const thicknessLesson = lessons.find((lesson) => lesson.title === "實地與厚勢");
  const endgameLesson = lessons.find((lesson) => lesson.title === "收官與數目");

  assert.ok(thicknessLesson, "缺少實地與厚勢課");
  assert.ok(endgameLesson, "缺少收官與數目課");
  assert.match(thicknessLesson.text, /本課把「厚勢」.*厚實棋形.*「外勢」.*力量與影響/);

  const thickness = thicknessLesson.terms.find((entry) => entry.term === "厚勢");
  const influence = thicknessLesson.terms.find((entry) => entry.term === "外勢");
  const sente = endgameLesson.terms.find((entry) => entry.term === "先手");
  assert.match(thickness.definition, /本課指.*安定.*厚實棋形/);
  assert.match(influence.definition, /本課指.*中央或外側.*力量與影響/);
  assert.match(sente.definition, /通常需要回應/);
  assert.doesNotMatch(sente.definition, /必須回應/);

  const learnerText = JSON.stringify({ lessons, problems });
  assert.equal(learnerText.includes("薄味"), false, "中文概念邊界未核清前不把「薄味」當 Core 正式術語");

  for (const id of ["u10-06", "u12-02", "u12-04", "u14-04"]) {
    assert.equal(problems.find((problem) => problem.id === id).contentVersion, 2, `${id} 實質文案修改後必須升版`);
  }
});
test("每課都有精簡關鍵詞定義，避免核心術語只靠上下文猜", () => {
  for (const lesson of lessons) {
    assert.ok(Array.isArray(lesson.terms) && lesson.terms.length >= 1, `${lesson.title} 缺少關鍵詞`);
    for (const entry of lesson.terms) {
      assert.match(entry.term, /\S/, `${lesson.title} 有空白術語`);
      assert.match(entry.definition, /\S/, `${lesson.title} 的 ${entry.term} 缺少定義`);
    }
  }
  assert.ok(lessons[6].terms.some((entry) => entry.term === "劫"));
  assert.ok(lessons[7].terms.some((entry) => entry.term === "假眼"));
  assert.ok(lessons[13].terms.some((entry) => entry.term === "目"));
  assert.ok(lessons[15].terms.some((entry) => entry.term === "棄子"));
  assert.ok(lessons[18].terms.some((entry) => entry.term === "原棋譜著手"));
});

test("關鍵抽象概念使用多步對照，而不是只用一張結果圖", () => {
  assert.ok(lessons[6].demoSteps.length >= 6, "劫課必須包含禁著、提劫、禁止回提與隔手後再爭");
  assert.match(lessons[6].demoSteps.map((step) => step.caption).join(" "), /不能立刻|別處走|再回劫/);
  assert.ok(lessons[7].demoSteps.length >= 5, "兩眼課必須包含真假眼對照");
  assert.match(lessons[7].demoSteps.map((step) => step.caption).join(" "), /假眼|不能當作真眼/);
  assert.ok(lessons[12].demoSteps.length >= 4, "死活閱讀課必須示範候選、應手與反例檢查");
  assert.match(lessons[12].demoSteps.map((step) => step.caption).join(" "), /最強應手|反例|合法/);
  assert.ok(lessons[13].demoSteps.length >= 3, "官子課必須比較雙方先走結果");
  assert.match(lessons[13].demoSteps.map((step) => step.caption).join(" "), /結果 A|結果 B|點數差/);
  assert.ok(lessons[15].demoSteps.length >= 3, "棄子課必須比較救與棄兩條路");
  assert.match(lessons[15].demoSteps.map((step) => step.caption).join(" "), /路線 A|路線 B|救棋成本/);
  assert.ok(lessons[18].demoSteps.some((step) => Array.isArray(step.reference) && step.reference.length), "複盤課要用中性 reference 標記原著位置");
  assert.equal(lessons[18].demoSteps.some((step) => Array.isArray(step.blocked) && step.blocked.length), false, "紅叉只保留給禁著，不再表示複盤原著");
});

test("劫示範的提子與回提符合規則引擎，不留下已被提走的棋", () => {
  const koStart = lessons[6].demoSteps[2];
  const board = Go.boardFromStones(koStart.stones, 5);
  const whiteCapture = Go.playMove(board, 2, 1, Go.WHITE);
  assert.equal(whiteCapture.legal, true);
  assert.equal(whiteCapture.board[2][2], Go.EMPTY);
  const immediateRecapture = Go.playMove(whiteCapture.board, 2, 2, Go.BLACK, { previousBoard: board });
  assert.equal(immediateRecapture.legal, false);

  const finalDiagram = lessons[6].demoSteps.at(-1);
  const finalBoard = Go.boardFromStones(finalDiagram.stones, 5);
  assert.equal(finalBoard[1][2], Go.EMPTY, "回劫後原白棋應已被提走");
  assert.equal(finalBoard[2][2], Go.BLACK, "回劫點應為黑棋");
});

test("Unit 2 明確區分同一串與功能性連絡，不把斜接誤教成一定可切", () => {
  const lesson = content.lessons.find((entry) => entry.title === "辨認棋串");
  assert.ok(lesson);
  assert.match(lesson.text, /不是同一串/);
  assert.match(lesson.text, /不等於一定沒有連絡作用/);
  assert.match(lesson.text, /是否容易被切斷還要看附近棋形/);
  assert.match(lesson.takeaway, /「同一串」與「有連絡作用」/);
  assert.doesNotMatch(lesson.text, /斜接.*一定.*切斷/);
});
