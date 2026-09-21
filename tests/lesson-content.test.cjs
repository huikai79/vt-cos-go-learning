const assert = require("node:assert/strict");
const { test } = require("node:test");
const { lessons } = require("../content.js");

const DIAGRAM_LESSONS = lessons.map((_, index) => index);

function key([x, y]) { return `${x},${y}`; }

test("每課都有概念、示範與解題前檢查點", () => {
  assert.equal(lessons.length, 19);
  for (const lesson of lessons) {
    assert.match(lesson.text, /\S/, `${lesson.title} 缺少概念`);
    assert.match(lesson.demo, /\S/, `${lesson.title} 缺少示範`);
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
  for (const marker of ["highlights", "blocked", "emphasis"]) {
    const points = new Set();
    for (const point of diagram[marker] || []) {
      const [x, y] = point;
      assert.ok(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 5 && y >= 0 && y < 5, `${title} 有盤外 ${marker} 標記`);
      assert.ok(!points.has(key(point)), `${title} 有重複 ${marker} 標記`);
      points.add(key(point));
      if (marker === "emphasis") assert.ok(stones.has(key(point)), `${title} 的強調圈未落在棋子上`);
      else assert.ok(!stones.has(key(point)), `${title} 的 ${marker} 標記被棋子佔住`);
    }
  }
  assert.match(diagram.label, /\S/, `${title} 缺少棋形替代文字`);
}

test("全部課程的示範棋盤與標記都在盤內且沒有互相衝突", () => {
  assert.deepEqual(lessons.map((lesson, index) => lesson.demoBoard ? index : null).filter(Number.isInteger), DIAGRAM_LESSONS);
  for (const index of DIAGRAM_LESSONS) {
    const { title, demoBoard } = lessons[index];
    validateDiagram(title, demoBoard);
  }
});

test("全部十九課都有至少兩步、可逐步閱讀的棋形示範", () => {
  for (const index of DIAGRAM_LESSONS) {
    const { title, demoSteps } = lessons[index];
    assert.ok(Array.isArray(demoSteps) && demoSteps.length >= 2, `${title} 缺少逐步示範`);
    for (const step of demoSteps) {
      assert.match(step.caption, /\S/, `${title} 的示範步驟缺少說明`);
      assert.ok(Array.isArray(step.stones), `${title} 的示範步驟缺少棋形`);
      validateDiagram(title, step);
    }
  }
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
