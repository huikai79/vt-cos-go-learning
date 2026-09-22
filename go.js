(function (root) {
  "use strict";

  const SIZE = 9;
  const MIN_SIZE = 2;
  const MAX_SIZE = 19;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;

  function normalizeSize(value = SIZE) {
    const size = Number(value);
    if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) throw new Error("Invalid board size");
    return size;
  }

  function boardSize(board) {
    if (!Array.isArray(board) || !board.length) return null;
    const size = board.length;
    if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) return null;
    if (!board.every((row) => Array.isArray(row) && row.length === size && row.every((v) => [EMPTY, BLACK, WHITE].includes(v)))) return null;
    return size;
  }

  function emptyBoard(size = SIZE) {
    const normalized = normalizeSize(size);
    return Array.from({ length: normalized }, () => Array(normalized).fill(EMPTY));
  }

  function boardFromStones(stones, size = SIZE) {
    const normalized = normalizeSize(size);
    const board = emptyBoard(normalized);
    for (const [x, y, color] of stones) {
      if (!inside(x, y, normalized) || board[y][x] !== EMPTY || ![BLACK, WHITE].includes(color)) {
        throw new Error("Invalid setup stone");
      }
      board[y][x] = color;
    }
    return board;
  }

  function inside(x, y, size = SIZE) {
    const normalized = Number(size);
    return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(normalized) && x >= 0 && x < normalized && y >= 0 && y < normalized;
  }

  function neighbors(x, y, size = SIZE) {
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => inside(a, b, size));
  }

  function groupAt(board, x, y) {
    const size = boardSize(board);
    if (!size || !inside(x, y, size) || board[y][x] === EMPTY) return null;
    const color = board[y][x];
    const queue = [[x, y]];
    const seen = new Set([`${x},${y}`]);
    const liberties = new Set();
    for (let index = 0; index < queue.length; index += 1) {
      const [cx, cy] = queue[index];
      for (const [nx, ny] of neighbors(cx, cy, size)) {
        if (board[ny][nx] === EMPTY) liberties.add(`${nx},${ny}`);
        else if (board[ny][nx] === color && !seen.has(`${nx},${ny}`)) {
          seen.add(`${nx},${ny}`);
          queue.push([nx, ny]);
        }
      }
    }
    return { color, stones: queue, liberties: [...liberties].map((point) => point.split(",").map(Number)) };
  }

  function sameBoard(first, second) {
    const firstSize = boardSize(first);
    const secondSize = boardSize(second);
    return Boolean(firstSize && firstSize === secondSize && first.every((row, y) => row.every((value, x) => value === second[y][x])));
  }

  function playMove(board, x, y, color, options = {}) {
    const size = boardSize(board);
    if (!size || !inside(x, y, size) || ![BLACK, WHITE].includes(color) || board[y][x] !== EMPTY) {
      return { legal: false, reason: "只能下在空的交叉點。", board };
    }
    const next = board.map((row) => row.slice());
    next[y][x] = color;
    const opponent = color === BLACK ? WHITE : BLACK;
    const captured = [];
    const processed = new Set();
    for (const [nx, ny] of neighbors(x, y, size)) {
      if (next[ny][nx] !== opponent || processed.has(`${nx},${ny}`)) continue;
      const group = groupAt(next, nx, ny);
      for (const [gx, gy] of group.stones) processed.add(`${gx},${gy}`);
      if (group.liberties.length === 0) {
        for (const [gx, gy] of group.stones) {
          next[gy][gx] = EMPTY;
          captured.push([gx, gy]);
        }
      }
    }
    if (groupAt(next, x, y).liberties.length === 0) {
      return { legal: false, reason: "這手沒有氣，也沒有提掉對方的棋。", board };
    }
    if (options.previousBoard && sameBoard(next, options.previousBoard)) {
      return { legal: false, reason: "這手會立刻回到上一個棋形；依簡單劫規則，必須先在別處下一手。", board };
    }
    return { legal: true, board: next, captured };
  }

  const api = { SIZE, MIN_SIZE, MAX_SIZE, EMPTY, BLACK, WHITE, normalizeSize, boardSize, emptyBoard, boardFromStones, groupAt, sameBoard, playMove };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoCore = api;
})(typeof window !== "undefined" ? window : globalThis);
