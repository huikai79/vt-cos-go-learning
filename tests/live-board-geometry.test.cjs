const test = require("node:test");
const assert = require("node:assert/strict");
const Geometry = require("../live-board-geometry.js");

test("19 路使用單一 grid pitch 派生棋子與邊距", () => {
  const layout = Geometry.layoutForSize(19);
  assert.equal(layout.boardSize, 19);
  assert.equal(layout.viewBoxSize, 520);
  assert.ok(Math.abs(layout.edgeUnits - 1.7) < 1e-9);
  assert.ok(Math.abs(layout.stoneToPitchRatio - 0.95) < 1e-9);
  assert.ok(layout.stoneDiameter <= layout.pitch);
  assert.ok(layout.hitRadius <= layout.pitch / 2);
  assert.ok(layout.offset < 60, "19 路應回收舊版過大的 60-unit 外框留白");
});

test("19 路棋線跨度比舊固定 60/460 geometry 更大", () => {
  const layout = Geometry.layoutForSize(19);
  const oldGridSpan = 460 - 60;
  const newGridSpan = layout.end - layout.offset;
  assert.ok(newGridSpan > oldGridSpan * 1.09);
  assert.ok(newGridSpan < oldGridSpan * 1.11);
});

test("9 路維持 compact board 外框但棋子不超過一格", () => {
  const layout = Geometry.layoutForSize(9);
  assert.equal(layout.offset, 60);
  assert.equal(layout.end, 460);
  assert.ok(Math.abs(layout.stoneToPitchRatio - 0.95) < 1e-9);
  assert.ok(layout.hitRadius <= layout.pitch / 2);
});

test("5／7 路仍受最大棋子半徑限制，不因共用契約膨脹", () => {
  for (const size of [5, 7]) {
    const layout = Geometry.layoutForSize(size);
    assert.ok(layout.stoneRadius <= Geometry.MAX_STONE_RADIUS);
    assert.ok(layout.stoneDiameter <= layout.pitch);
    assert.ok(layout.hitRadius <= layout.pitch / 2);
  }
});

test("座標映射與 grid geometry 共用同一來源", () => {
  const layout = Geometry.layoutForSize(19);
  const topLeft = Geometry.point(layout, 0, 0);
  const center = Geometry.point(layout, 9, 9);
  const bottomRight = Geometry.point(layout, 18, 18);
  assert.equal(topLeft.x, layout.offset);
  assert.equal(topLeft.y, layout.offset);
  assert.ok(Math.abs(center.x - 260) < 1e-9);
  assert.ok(Math.abs(center.y - 260) < 1e-9);
  assert.ok(Math.abs(bottomRight.x - layout.end) < 1e-9);
  assert.ok(Math.abs(bottomRight.y - layout.end) < 1e-9);
});

test("非法棋盤尺寸與越界座標 fail closed", () => {
  assert.throws(() => Geometry.layoutForSize(1), /board_size_invalid/);
  const layout = Geometry.layoutForSize(19);
  assert.throws(() => Geometry.point(layout, 19, 0), /board_point_out_of_range/);
  assert.throws(() => Geometry.point(layout, 0.5, 0), /board_point_invalid/);
});
