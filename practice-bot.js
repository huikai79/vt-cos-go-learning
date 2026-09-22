(function (root) {
  "use strict";

  const Go = typeof require === "function" && typeof module !== "undefined" ? require("./go.js") : root.GoCore;
  const Live = typeof require === "function" && typeof module !== "undefined" ? require("./live-game.js") : root.GoLiveGame;
  const { EMPTY, BLACK, WHITE, groupAt } = Go;
  const BOT_VERSION = "local-practice-bot-v1";

  function opponent(color) { return color === BLACK ? WHITE : BLACK; }
  function neighbors(size, x, y) {
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([nx, ny]) => nx >= 0 && nx < size && ny >= 0 && ny < size);
  }
  function deterministicTie(game, x, y) {
    let hash = 2166136261;
    const seed = `${game.boardSize}|${game.moves.length}|${game.toPlay}|${x},${y}`;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967296;
  }
  function candidate(game, x, y) {
    if (!game || game.status !== "playing" || game.board[y][x] !== EMPTY) return null;
    const result = Live.play(game, x, y);
    if (!result.ok) return null;
    const size = game.boardSize;
    const color = game.toPlay;
    const other = opponent(color);
    const adjacent = neighbors(size, x, y);
    let ownAdjacent = 0, opponentAdjacent = 0;
    for (const [nx, ny] of adjacent) {
      if (game.board[ny][nx] === color) ownAdjacent += 1;
      else if (game.board[ny][nx] === other) opponentAdjacent += 1;
    }
    const group = groupAt(result.game.board, x, y);
    const liberties = group ? group.liberties.length : 0;
    const center = (size - 1) / 2;
    const centerDistance = Math.abs(x - center) + Math.abs(y - center);
    const fillsOwnPocket = adjacent.length > 0 && adjacent.every(([nx, ny]) => game.board[ny][nx] === color) && result.captured.length === 0;

    let score = result.captured.length * 120;
    score += opponentAdjacent * 8;
    score += ownAdjacent * 3;
    score += Math.min(liberties, 4) * 5;
    score += Math.max(0, size - centerDistance) * 1.5;
    if (liberties === 1 && result.captured.length === 0) score -= 45;
    if (fillsOwnPocket) score -= 90;
    score += deterministicTie(game, x, y) * 0.01;
    return { type: "play", point: [x, y], score, captured: result.captured.length, liberties };
  }
  function legalCandidates(game) {
    if (!game || game.status !== "playing") return [];
    const choices = [];
    for (let y = 0; y < game.boardSize; y += 1) {
      for (let x = 0; x < game.boardSize; x += 1) {
        const item = candidate(game, x, y);
        if (item) choices.push(item);
      }
    }
    return choices.sort((a, b) => b.score - a.score || a.point[1] - b.point[1] || a.point[0] - b.point[0]);
  }
  function chooseAction(game) {
    if (!game || game.status !== "playing") return { type: "none", reason: "not_playing", botVersion: BOT_VERSION };
    const choices = legalCandidates(game);
    if (!choices.length) return { type: "pass", reason: "no_legal_play", botVersion: BOT_VERSION };
    const best = choices[0];
    if (game.consecutivePasses >= 1 && best.captured === 0 && best.score < 18) {
      return { type: "pass", reason: "accept_pass_without_urgent_play", botVersion: BOT_VERSION };
    }
    if (best.score < -20) return { type: "pass", reason: "avoid_low_value_self_fill", botVersion: BOT_VERSION };
    return { type: "play", point: best.point.slice(), reason: "heuristic_legal_choice", score: best.score, botVersion: BOT_VERSION };
  }

  const api = { BOT_VERSION, legalCandidates, chooseAction };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoPracticeBot = api;
})(typeof window !== "undefined" ? window : globalThis);
