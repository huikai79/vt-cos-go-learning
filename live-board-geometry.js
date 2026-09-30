(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoLiveBoardGeometry = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VIEWBOX_SIZE = 520;
  const COMPACT_GRID_OFFSET = 60;
  const COMPACT_GRID_END = 460;
  const LARGE_BOARD_MIN_SIZE = 13;
  const LARGE_BOARD_EDGE_UNITS = 1.7;
  const STONE_DIAMETER_SCALE = 0.95;
  const MAX_STONE_RADIUS = 25;
  const HIT_RADIUS_MARGIN = 7;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function layoutForSize(boardSize) {
    const size = Number(boardSize);
    if (!Number.isInteger(size) || size < 2) throw new Error("board_size_invalid");

    let pitch;
    let offset;
    let end;

    if (size >= LARGE_BOARD_MIN_SIZE) {
      pitch = VIEWBOX_SIZE / ((size - 1) + (2 * LARGE_BOARD_EDGE_UNITS));
      offset = pitch * LARGE_BOARD_EDGE_UNITS;
      end = VIEWBOX_SIZE - offset;
    } else {
      offset = COMPACT_GRID_OFFSET;
      end = COMPACT_GRID_END;
      pitch = (end - offset) / (size - 1);
    }

    const stoneRadius = Math.min(MAX_STONE_RADIUS, pitch * STONE_DIAMETER_SCALE / 2);
    const hitRadius = Math.min(pitch / 2, stoneRadius + HIT_RADIUS_MARGIN);
    const focusRadius = Math.max(stoneRadius, hitRadius - 1);

    return Object.freeze({
      boardSize: size,
      viewBoxSize: VIEWBOX_SIZE,
      offset,
      end,
      pitch,
      edgeUnits: offset / pitch,
      stoneRadius,
      stoneDiameter: stoneRadius * 2,
      stoneToPitchRatio: (stoneRadius * 2) / pitch,
      hitRadius,
      focusRadius,
      starRadius: clamp(pitch * 0.11, 2.5, 4),
      lastMoveRadius: stoneRadius * 0.42,
      lastMoveStroke: clamp(pitch * 0.08, 1.5, 3),
      focusStroke: clamp(pitch * 0.12, 2, 4),
      deadCrossStroke: clamp(pitch * 0.12, 2, 5)
    });
  }

  function point(layout, x, y) {
    if (!layout || !Number.isFinite(layout.pitch) || !Number.isFinite(layout.offset)) {
      throw new Error("board_layout_invalid");
    }
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error("board_point_invalid");
    if (x < 0 || y < 0 || x >= layout.boardSize || y >= layout.boardSize) {
      throw new Error("board_point_out_of_range");
    }
    return Object.freeze({
      x: layout.offset + (x * layout.pitch),
      y: layout.offset + (y * layout.pitch)
    });
  }

  return Object.freeze({
    VIEWBOX_SIZE,
    COMPACT_GRID_OFFSET,
    COMPACT_GRID_END,
    LARGE_BOARD_MIN_SIZE,
    LARGE_BOARD_EDGE_UNITS,
    STONE_DIAMETER_SCALE,
    MAX_STONE_RADIUS,
    layoutForSize,
    point
  });
});
