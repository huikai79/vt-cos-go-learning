(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedDecisionReviewTools = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const BLACK = 1;
  const WHITE = 2;
  const PERSPECTIVES = Object.freeze(["neutral", "black", "white"]);

  function normalizePerspective(value) {
    return PERSPECTIVES.includes(value) ? value : "neutral";
  }

  function perspectiveColor(value) {
    const perspective = normalizePerspective(value);
    if (perspective === "black") return BLACK;
    if (perspective === "white") return WHITE;
    return null;
  }

  function movesForPerspective(game, value) {
    if (!game || !Array.isArray(game.moves)) throw new Error("review_game_invalid");
    const color = perspectiveColor(value);
    return color ? game.moves.filter((move) => move.color === color) : game.moves.slice();
  }

  function goCoordinate(point, size = 19) {
    if (!Array.isArray(point) || point.length !== 2 || point.some((value) => !Number.isInteger(value))) return "";
    const [x, y] = point;
    const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
    if (x < 0 || y < 0 || x >= size || y >= size || x >= letters.length) return "";
    return letters[x] + String(size - y);
  }

  function actorLabel(color, value) {
    const perspective = normalizePerspective(value);
    if (perspective === "black") return color === BLACK ? "你的黑棋" : "對手白棋";
    if (perspective === "white") return color === WHITE ? "你的白棋" : "對手黑棋";
    return color === BLACK ? "黑棋" : "白棋";
  }

  function buildFactualEvents(game) {
    if (!game || !Array.isArray(game.moves)) throw new Error("review_game_invalid");
    const events = [];
    const occupiedHistory = new Map();

    for (const move of game.moves) {
      if (!move || !Array.isArray(move.point) || !move.result) throw new Error("review_move_invalid");
      const capturedCount = Array.isArray(move.result.captured) ? move.result.captured.length : 0;
      if (capturedCount > 0) {
        events.push(Object.freeze({
          id: `capture-${move.number}`,
          type: "capture",
          claimScope: "board_event_only",
          moveNumber: move.number,
          nodeIndex: move.nodeIndex,
          color: move.color,
          point: move.point.slice(),
          capturedCount
        }));
      }

      const key = move.point.join(",");
      const previous = occupiedHistory.get(key);
      const occurrence = previous ? previous.occurrence + 1 : 1;
      if (previous) {
        events.push(Object.freeze({
          id: `reoccupied-${move.number}-${key}`,
          type: "point_reoccupied",
          claimScope: "board_event_only",
          moveNumber: move.number,
          nodeIndex: move.nodeIndex,
          color: move.color,
          point: move.point.slice(),
          priorMoveNumber: previous.moveNumber,
          occurrence
        }));
      }
      occupiedHistory.set(key, { moveNumber: move.number, occurrence });
    }
    return events;
  }

  function selectNavigationEvents(events, limit = 8) {
    if (!Array.isArray(events)) return [];
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 8;
    const captures = events
      .filter((event) => event.type === "capture")
      .slice()
      .sort((a, b) => b.capturedCount - a.capturedCount || a.moveNumber - b.moveNumber);

    const latestRepeatedByPoint = new Map();
    for (const event of events.filter((item) => item.type === "point_reoccupied")) {
      latestRepeatedByPoint.set(event.point.join(","), event);
    }
    const repeated = [...latestRepeatedByPoint.values()]
      .sort((a, b) => b.occurrence - a.occurrence || a.moveNumber - b.moveNumber);

    return [...captures, ...repeated].slice(0, safeLimit);
  }

  function describeEvent(event, value, boardSize = 19) {
    if (!event) return "";
    if (event.type === "capture") {
      return `第 ${event.moveNumber} 手 · ${actorLabel(event.color, value)}落子後提掉 ${event.capturedCount} 子`;
    }
    if (event.type === "point_reoccupied") {
      const coordinate = goCoordinate(event.point, boardSize);
      return `第 ${event.moveNumber} 手 · ${coordinate || "同一交叉點"}再次被佔據（本局第 ${event.occurrence} 次）`;
    }
    return `第 ${event.moveNumber} 手 · 棋盤事件`;
  }

  function findReviewTarget(game, eventMoveNumber, lookbackMoves, value) {
    if (!game || !Array.isArray(game.moves)) throw new Error("review_game_invalid");
    if (!Number.isInteger(eventMoveNumber) || !Number.isInteger(lookbackMoves) || lookbackMoves < 1) return null;
    const threshold = eventMoveNumber - lookbackMoves;
    if (threshold < 1) return null;
    const color = perspectiveColor(value);
    const eligible = game.moves.filter((move) => move.number <= threshold && (!color || move.color === color));
    return eligible.length ? eligible[eligible.length - 1] : null;
  }

  return Object.freeze({
    BLACK,
    WHITE,
    PERSPECTIVES,
    normalizePerspective,
    perspectiveColor,
    movesForPerspective,
    goCoordinate,
    actorLabel,
    buildFactualEvents,
    selectNavigationEvents,
    describeEvent,
    findReviewTarget
  });
});
