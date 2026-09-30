const test = require("node:test");
const assert = require("node:assert/strict");
const Go = require("../go.js");
const catalog = require("../enclosure-capture-fixtures.js");

function key(point) {
  return point.join(",");
}

function uniqueGroups(board, color) {
  const seen = new Set();
  const groups = [];
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board.length; x += 1) {
      if (board[y][x] !== color || seen.has(key([x,y]))) continue;
      const group = Go.groupAt(board, x, y);
      for (const stone of group.stones) seen.add(key(stone));
      groups.push(group);
    }
  }
  return groups;
}

test("四個原創 enclosure-capture fixtures 都通過共同 rules-backed 機制", () => {
  assert.equal(catalog.version, 1);
  assert.equal(catalog.familyId, "enclosure_capture");
  assert.equal(catalog.fixtures.length, 4);

  for (const fixture of catalog.fixtures) {
    const board = Go.boardFromStones(fixture.setupStones, fixture.boardSize);
    const targetBefore = Go.groupAt(board, ...fixture.targetPoint);
    const supportBefore = Go.groupAt(board, ...fixture.supportPoint);

    assert.equal(targetBefore.stones.length, fixture.expectedTargetSizeBefore, fixture.id);
    assert.equal(targetBefore.liberties.length, 2, fixture.id);
    assert.ok(targetBefore.liberties.some((point) => key(point) === key(fixture.cutMove)), fixture.id);
    assert.ok(supportBefore.liberties.some((point) => key(point) === key(fixture.cutMove)), fixture.id);

    const cut = Go.playMove(board, ...fixture.cutMove, Go.BLACK);
    assert.equal(cut.legal, true, fixture.id);
    assert.equal(cut.captured.length, 0, fixture.id);
    const targetAfterCut = Go.groupAt(cut.board, ...fixture.targetPoint);
    assert.equal(targetAfterCut.liberties.length, 1, fixture.id);
    assert.deepEqual(targetAfterCut.liberties[0], fixture.forcedExtension, fixture.id);

    const extension = Go.playMove(cut.board, ...fixture.forcedExtension, Go.WHITE);
    assert.equal(extension.legal, true, fixture.id);
    const targetAfterExtension = Go.groupAt(extension.board, ...fixture.targetPoint);
    assert.equal(targetAfterExtension.liberties.length, 1, fixture.id);
    assert.deepEqual(targetAfterExtension.liberties[0], fixture.finishMove, fixture.id);

    const finish = Go.playMove(extension.board, ...fixture.finishMove, Go.BLACK);
    assert.equal(finish.legal, true, fixture.id);
    assert.equal(finish.captured.length, fixture.expectedCapturedCount, fixture.id);
  }
});

test("若不先切斷，白棋能在連接點和援兵連成一串；切斷是共同必要條件", () => {
  for (const fixture of catalog.fixtures) {
    const board = Go.boardFromStones(fixture.setupStones, fixture.boardSize);
    const connect = Go.playMove(board, ...fixture.cutMove, Go.WHITE);
    assert.equal(connect.legal, true, fixture.id);
    const connected = Go.groupAt(connect.board, ...fixture.targetPoint);
    assert.ok(connected.stones.some((point) => key(point) === key(fixture.supportPoint)), fixture.id);
    assert.ok(connected.liberties.length >= 2, fixture.id);
  }
});

test("四個 fixtures 至少跨 center/edge、single/chain，不只是旋轉或鏡射複製", () => {
  const axes = catalog.fixtures.map((fixture) => fixture.variationAxes.join("|"));
  assert.equal(new Set(axes).size, 4);
  assert.equal(catalog.fixtures.some((fixture) => fixture.variationAxes.includes("center")), true);
  assert.equal(catalog.fixtures.some((fixture) => fixture.variationAxes.includes("edge")), true);
  assert.equal(catalog.fixtures.some((fixture) => fixture.variationAxes.includes("single-stone-target")), true);
  assert.equal(catalog.fixtures.some((fixture) => fixture.variationAxes.includes("two-stone-target")), true);
});

test("rules-backed fixtures 不替門吃／抱吃猜標籤；目前只支持較粗 enclosure_capture family", () => {
  for (const fixture of catalog.fixtures) {
    assert.equal(fixture.sourceLabelCandidate, "unknown", fixture.id);
  }
  assert.equal(catalog.fixtures.some((fixture) => fixture.sourceLabelCandidate === "門吃"), false);
  assert.equal(catalog.fixtures.some((fixture) => fixture.sourceLabelCandidate === "抱吃"), false);
});

test("反例：把 cutMove 換成非連接氣，不應通過『切斷援兵』條件", () => {
  const fixture = catalog.fixtures[0];
  const board = Go.boardFromStones(fixture.setupStones, fixture.boardSize);
  const wrongMove = fixture.forcedExtension;
  const trial = Go.playMove(board, ...wrongMove, Go.BLACK);
  assert.equal(trial.legal, true);
  const target = Go.groupAt(trial.board, ...fixture.targetPoint);
  assert.equal(target.liberties.length, 1);
  assert.deepEqual(target.liberties[0], fixture.cutMove);
  const support = Go.groupAt(trial.board, ...fixture.supportPoint);
  assert.ok(support.liberties.some((point) => key(point) === key(fixture.cutMove)));
  assert.ok(target.liberties.some((point) => key(point) === key(fixture.cutMove)));
});
